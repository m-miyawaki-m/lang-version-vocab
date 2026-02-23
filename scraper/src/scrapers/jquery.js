import { BaseScraper } from './base.js'
import { fetchWithRetry, sleep } from '../utils/fetcher.js'
import { parseHTML, extractText, generateId } from '../utils/parser.js'

export class JqueryScraper extends BaseScraper {
  constructor() {
    super('jquery', 'jQuery', 'https://api.jquery.com/')
  }

  async scrape() {
    const html = await fetchWithRetry('https://api.jquery.com/')
    const $ = parseHTML(html)

    // インデックスページの article から情報を取得
    const entries = []
    $('article').each((_, el) => {
      const $article = $(el)
      const $title = $article.find('h1.entry-title a')
      const name = extractText($title)
      const href = $title.attr('href')
      const category = extractText($article.find('.entry-meta .category a').first())
      const description = extractText($article.find('.entry-summary p').first())

      if (name && href) {
        entries.push({
          name,
          url: href.startsWith('http') ? href : `https://api.jquery.com${href}`,
          category,
          description
        })
      }
    })

    console.log(`Found ${entries.length} API entries to process`)

    // 各 API ページからバージョン情報を取得
    const termsByVersion = new Map()

    for (const entry of entries) {
      try {
        await sleep(300)
        const pageHtml = await fetchWithRetry(entry.url)
        const page$ = parseHTML(pageHtml)

        // version-details からバージョンを取得
        const versionText = page$('.version-details').first().text()
        const versionMatch = versionText.match(/version added:\s*([\d.]+)/i)
        if (!versionMatch) continue

        const version = versionMatch[1]
        if (!termsByVersion.has(version)) {
          termsByVersion.set(version, [])
        }

        termsByVersion.get(version).push({
          id: generateId('jquery', version, entry.name),
          term: entry.name,
          termJa: '',
          type: 'api',
          category: entry.category || 'general',
          meaning: entry.description,
          example: '',
          tags: [],
          sourceUrl: entry.url
        })
      } catch (error) {
        console.warn(`Failed to scrape ${entry.url}: ${error.message}`)
      }
    }

    // バージョンをソート（新しい順）
    const versions = Array.from(termsByVersion.entries())
      .sort((a, b) => {
        const va = a[0].split('.').map(Number)
        const vb = b[0].split('.').map(Number)
        for (let i = 0; i < Math.max(va.length, vb.length); i++) {
          const diff = (vb[i] || 0) - (va[i] || 0)
          if (diff !== 0) return diff
        }
        return 0
      })
      .map(([version, terms]) => ({
        version,
        releaseDate: this.getReleaseDateForVersion(version),
        terms
      }))

    return versions
  }

  getReleaseDateForVersion(version) {
    const dates = {
      '3.7': '2024-05', '3.6': '2023-01', '3.5': '2020-04',
      '3.4': '2019-04', '3.3': '2018-01', '3.2': '2017-03',
      '3.1': '2016-07', '3.0': '2016-06', '1.12': '2016-01',
      '1.11': '2014-01', '1.10': '2013-05', '1.9': '2013-01',
      '1.8': '2012-08', '1.7': '2011-11', '1.6': '2011-05',
      '1.5': '2011-01', '1.4': '2010-01', '1.3': '2009-01',
      '1.2': '2007-09', '1.1': '2007-01', '1.0': '2006-08'
    }
    return dates[version] || ''
  }
}
