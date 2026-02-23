import { JavaScriptScraper } from './scrapers/javascript.js'
import { JavaScraper } from './scrapers/java.js'
import { JqueryScraper } from './scrapers/jquery.js'

const scrapers = {
  javascript: JavaScriptScraper,
  java: JavaScraper,
  jquery: JqueryScraper
}

async function main() {
  const args = process.argv.slice(2)
  const langIndex = args.indexOf('--lang')
  const lang = langIndex !== -1 ? args[langIndex + 1] : null

  if (lang && !scrapers[lang]) {
    console.error(`Unknown language: ${lang}`)
    console.error(`Available: ${Object.keys(scrapers).join(', ')}`)
    process.exit(1)
  }

  const targets = lang ? [lang] : Object.keys(scrapers)

  for (const target of targets) {
    try {
      const ScraperClass = scrapers[target]
      const scraper = new ScraperClass()
      await scraper.run()
    } catch (error) {
      console.error(`Failed to scrape ${target}: ${error.message}`)
      process.exitCode = 1
    }
  }
}

main()
