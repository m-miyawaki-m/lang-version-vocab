import { BaseScraper } from './base.js'
import { fetchWithRetry, sleep } from '../utils/fetcher.js'
import { parseHTML, extractText, generateId } from '../utils/parser.js'

const MDN_BASE = 'https://developer.mozilla.org'

// MDN で取得するカテゴリとパス
const REFERENCE_PATHS = [
  { path: '/ja/docs/Web/JavaScript/Reference/Statements', category: 'statement' },
  { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects', category: 'object' },
  { path: '/ja/docs/Web/JavaScript/Reference/Operators', category: 'operator' },
  { path: '/ja/docs/Web/JavaScript/Reference/Functions', category: 'function' }
]

export class JavaScriptScraper extends BaseScraper {
  constructor() {
    super('javascript', 'JavaScript', 'https://developer.mozilla.org/ja/docs/Web/JavaScript')
  }

  async scrape() {
    const termsByVersion = new Map()

    for (const ref of REFERENCE_PATHS) {
      console.log(`Scraping ${ref.path}...`)
      try {
        const listHtml = await fetchWithRetry(`${MDN_BASE}${ref.path}`)
        const $ = parseHTML(listHtml)

        // サブページのリンクを取得
        const links = []
        $('ol a, .sidebar a, section a').each((_, el) => {
          const href = $(el).attr('href')
          if (href && href.startsWith('/ja/docs/Web/JavaScript/Reference/')) {
            const fullUrl = `${MDN_BASE}${href}`
            if (!links.includes(fullUrl)) {
              links.push(fullUrl)
            }
          }
        })

        console.log(`  Found ${links.length} pages in ${ref.category}`)

        // 各ページから詳細を取得
        for (const url of links.slice(0, 50)) {
          try {
            await sleep(300)
            const pageHtml = await fetchWithRetry(url)
            const page$ = parseHTML(pageHtml)

            const title = extractText(page$('h1').first())
            if (!title) continue

            const description = extractText(page$('.section-content p').first())

            // ECMAScript 仕様セクションからバージョンを取得
            let esVersion = ''
            page$('table').each((_, table) => {
              const tableText = page$(table).text()
              if (tableText.includes('ECMAScript')) {
                const match = tableText.match(/ECMAScript\s+(\d{4}|\d+(?:th|st|nd|rd)?\s*Edition)/i)
                if (match) {
                  esVersion = this.normalizeVersion(match[1])
                }
              }
            })

            if (!esVersion) continue

            if (!termsByVersion.has(esVersion)) {
              termsByVersion.set(esVersion, [])
            }

            const example = extractText(page$('pre code').first())

            termsByVersion.get(esVersion).push({
              id: generateId('javascript', esVersion, title),
              term: title,
              termJa: '',
              type: this.inferType(title, ref.category),
              category: ref.category,
              meaning: description,
              example: example.substring(0, 200),
              tags: [],
              sourceUrl: url
            })
          } catch (error) {
            console.warn(`  Failed: ${url}: ${error.message}`)
          }
        }
      } catch (error) {
        console.warn(`Failed to scrape ${ref.path}: ${error.message}`)
      }
    }

    return this.sortVersions(termsByVersion)
  }

  normalizeVersion(raw) {
    const yearMatch = raw.match(/(\d{4})/)
    if (yearMatch) return `ES${yearMatch[1]}`

    const editionMatch = raw.match(/(\d+)/)
    if (editionMatch) {
      const edition = parseInt(editionMatch[1])
      if (edition >= 2015) return `ES${edition}`
      const yearMap = { 1: 'ES1', 2: 'ES2', 3: 'ES3', 5: 'ES5', 6: 'ES2015' }
      return yearMap[edition] || `ES${edition}`
    }

    return raw
  }

  inferType(title, category) {
    if (title.includes('()') || title.includes('.prototype.')) return 'api'
    if (category === 'statement' || category === 'operator') return 'syntax'
    return 'concept'
  }

  sortVersions(termsByVersion) {
    return Array.from(termsByVersion.entries())
      .sort((a, b) => {
        const ya = parseInt(a[0].replace('ES', '')) || 0
        const yb = parseInt(b[0].replace('ES', '')) || 0
        return yb - ya
      })
      .map(([version, terms]) => ({
        version,
        releaseDate: this.getReleaseDateForVersion(version),
        terms
      }))
  }

  getReleaseDateForVersion(version) {
    const dates = {
      'ES2024': '2024-06', 'ES2023': '2023-06', 'ES2022': '2022-06',
      'ES2021': '2021-06', 'ES2020': '2020-06', 'ES2019': '2019-06',
      'ES2018': '2018-06', 'ES2017': '2017-06', 'ES2016': '2016-06',
      'ES2015': '2015-06', 'ES5': '2009-12', 'ES3': '1999-12'
    }
    return dates[version] || ''
  }
}
