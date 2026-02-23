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

    // api.jquery.com のエントリリストを取得
    const entries = []
    $('#content .entry-title').each((_, el) => {
      const $el = $(el)
      const link = $el.find('a')
      const name = extractText(link)
      const href = link.attr('href')
      if (name && href) {
        entries.push({ name, url: href.startsWith('http') ? href : `https://api.jquery.com${href}` })
      }
    })

    console.log(`Found ${entries.length} API entries to process`)

    // 各 API ページを取得して詳細を抽出
    const termsByVersion = new Map()

    for (const entry of entries) {
      try {
        await sleep(500)
        const pageHtml = await fetchWithRetry(entry.url)
        const page$ = parseHTML(pageHtml)

        const added = page$('.entry-meta .version-added').first().text().replace('version added:', '').trim()
        if (!added) continue

        const description = extractText(page$('.entry-excerpt, .desc').first())
        const category = page$('.entry-meta .category').first().text().trim()

        const version = added
        if (!termsByVersion.has(version)) {
          termsByVersion.set(version, [])
        }

        termsByVersion.get(version).push({
          id: generateId('jquery', version, entry.name),
          term: entry.name,
          termJa: '',
          type: 'api',
          category: category || 'general',
          meaning: description,
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
        releaseDate: '',
        terms
      }))

    return versions
  }
}
