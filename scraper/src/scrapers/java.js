import { BaseScraper } from './base.js'
import { fetchWithRetry, sleep } from '../utils/fetcher.js'
import { parseHTML, extractText, generateId } from '../utils/parser.js'

const ORACLE_BASE = 'https://docs.oracle.com/en/java/javase'

// 主要な LTS + 最新バージョン
const JAVA_VERSIONS = [
  { version: '23', releaseDate: '2024-09' },
  { version: '22', releaseDate: '2024-03' },
  { version: '21', releaseDate: '2023-09' },
  { version: '17', releaseDate: '2021-09' },
  { version: '11', releaseDate: '2018-09' },
  { version: '9', releaseDate: '2017-09' },
  { version: '8', releaseDate: '2014-03' }
]

export class JavaScraper extends BaseScraper {
  constructor() {
    super('java', 'Java', 'https://docs.oracle.com/en/java/')
  }

  async scrape() {
    const versions = []

    for (const javaVersion of JAVA_VERSIONS) {
      console.log(`Scraping Java ${javaVersion.version}...`)
      try {
        const terms = await this.scrapeVersion(javaVersion.version)
        if (terms.length > 0) {
          versions.push({
            version: javaVersion.version,
            releaseDate: javaVersion.releaseDate,
            terms
          })
        }
      } catch (error) {
        console.warn(`Failed to scrape Java ${javaVersion.version}: ${error.message}`)
      }
      await sleep(1000)
    }

    return versions
  }

  async scrapeVersion(version) {
    // JDK リリースノートの「What's New」ページを取得
    const urls = [
      `${ORACLE_BASE}/${version}/migrate/new-features.html`,
      `${ORACLE_BASE}/${version}/language/index.html`
    ]

    const terms = []

    for (const url of urls) {
      try {
        const html = await fetchWithRetry(url)
        const $ = parseHTML(html)

        // 見出し + 説明のパターンを抽出
        $('h2, h3').each((_, heading) => {
          const $heading = $(heading)
          const title = extractText($heading)
          if (!title || title.length > 100) return

          // 次の要素から説明を取得
          const $desc = $heading.next('p')
          const description = $desc.length ? extractText($desc) : ''

          if (title && description) {
            terms.push({
              id: generateId('java', version, title),
              term: title,
              termJa: '',
              type: this.inferType(title),
              category: this.inferCategory(title, description),
              meaning: description.substring(0, 300),
              example: '',
              tags: [],
              sourceUrl: url
            })
          }
        })
      } catch (error) {
        // URL が存在しない場合はスキップ
      }
    }

    return terms
  }

  inferType(title) {
    const lower = title.toLowerCase()
    if (lower.includes('deprecated') || lower.includes('removed')) return 'deprecation'
    if (lower.includes('api') || lower.includes('method') || lower.includes('class')) return 'api'
    if (lower.includes('syntax') || lower.includes('statement') || lower.includes('expression')) return 'syntax'
    return 'concept'
  }

  inferCategory(title, description) {
    const text = `${title} ${description}`.toLowerCase()
    if (text.includes('thread') || text.includes('concurr')) return 'concurrency'
    if (text.includes('class') || text.includes('interface') || text.includes('record')) return 'class'
    if (text.includes('switch') || text.includes('pattern') || text.includes('if')) return 'control-flow'
    if (text.includes('module')) return 'module'
    if (text.includes('gc') || text.includes('garbage') || text.includes('memory')) return 'runtime'
    return 'general'
  }
}
