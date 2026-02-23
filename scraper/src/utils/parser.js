import * as cheerio from 'cheerio'

export function parseHTML(html) {
  return cheerio.load(html)
}

export function extractText($el) {
  return $el.text().trim()
}

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function generateId(language, version, term) {
  const langPrefix = language.substring(0, language === 'javascript' ? 2 : language.length)
  const versionSlug = version.toLowerCase().replace(/[^a-z0-9]/g, '')
  const termSlug = slugify(term).substring(0, 30)
  return `${langPrefix}-${versionSlug}-${termSlug}`
}
