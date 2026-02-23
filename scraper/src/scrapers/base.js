import { writeFile, mkdir } from 'fs/promises'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = resolve(__dirname, '../../../data')

export class BaseScraper {
  constructor(language, displayName, sourceUrl) {
    this.language = language
    this.displayName = displayName
    this.sourceUrl = sourceUrl
  }

  async scrape() {
    throw new Error('scrape() must be implemented by subclass')
  }

  async scrapeOverview() {
    return null
  }

  async scrapeSpecification() {
    return null
  }

  async save(versions, overview = null, specification = null) {
    const data = {
      language: this.language,
      displayName: this.displayName,
      source: this.sourceUrl,
      ...(overview ? { overview } : {}),
      ...(specification ? { specification } : {}),
      versions
    }

    await mkdir(DATA_DIR, { recursive: true })
    const filePath = resolve(DATA_DIR, `${this.language}.json`)
    await writeFile(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8')
    console.log(`Saved ${filePath}`)
    return data
  }

  async run() {
    console.log(`Scraping ${this.displayName}...`)
    const overview = await this.scrapeOverview()
    if (overview) {
      const charCount = overview.characteristics?.length || 0
      const conceptCount = overview.concepts?.length || 0
      console.log(`Found ${charCount} characteristics, ${conceptCount} concepts`)
    }
    const specification = await this.scrapeSpecification()
    if (specification) {
      const catCount = specification.categories?.length || 0
      const itemCount = specification.categories?.reduce((sum, c) => sum + c.items.length, 0) || 0
      console.log(`Found ${itemCount} spec items across ${catCount} categories`)
    }
    const versions = await this.scrape()
    const totalTerms = versions.reduce((sum, v) => sum + v.terms.length, 0)
    console.log(`Found ${totalTerms} terms across ${versions.length} versions`)
    await this.save(versions, overview, specification)
    return versions
  }
}
