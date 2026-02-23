import { BaseScraper } from './base.js'
import { fetchWithRetry, sleep } from '../utils/fetcher.js'
import { generateId } from '../utils/parser.js'

const MDN_BASE = 'https://developer.mozilla.org'

// ECMAScript バージョンごとの主要機能とMDNパス
const ES_FEATURES = {
  'ES2024': {
    releaseDate: '2024-06',
    features: [
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/Object/groupBy', type: 'api', category: 'object' },
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/Map/groupBy', type: 'api', category: 'object' },
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/Promise/withResolvers', type: 'api', category: 'async' },
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/Atomics/waitAsync', type: 'api', category: 'concurrency' },
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/String/isWellFormed', type: 'api', category: 'string' },
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/String/toWellFormed', type: 'api', category: 'string' }
    ]
  },
  'ES2023': {
    releaseDate: '2023-06',
    features: [
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/Array/findLast', type: 'api', category: 'array' },
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/Array/findLastIndex', type: 'api', category: 'array' },
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/Array/toReversed', type: 'api', category: 'array' },
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted', type: 'api', category: 'array' },
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/Array/toSpliced', type: 'api', category: 'array' },
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/Array/with', type: 'api', category: 'array' },
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/Symbol/hasInstance', type: 'api', category: 'symbol' }
    ]
  },
  'ES2022': {
    releaseDate: '2022-06',
    features: [
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/Array/at', type: 'api', category: 'array' },
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/Object/hasOwn', type: 'api', category: 'object' },
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/Error/cause', type: 'api', category: 'error' },
      { path: '/ja/docs/Web/JavaScript/Reference/Statements/class', type: 'syntax', category: 'class' },
      { path: '/ja/docs/Web/JavaScript/Reference/Operators/await', type: 'syntax', category: 'async' },
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/RegExp/hasIndices', type: 'api', category: 'regexp' }
    ]
  },
  'ES2021': {
    releaseDate: '2021-06',
    features: [
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/String/replaceAll', type: 'api', category: 'string' },
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/Promise/any', type: 'api', category: 'async' },
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/WeakRef', type: 'api', category: 'memory' },
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/FinalizationRegistry', type: 'api', category: 'memory' },
      { path: '/ja/docs/Web/JavaScript/Reference/Operators/Logical_AND_assignment', type: 'syntax', category: 'operator' },
      { path: '/ja/docs/Web/JavaScript/Reference/Operators/Logical_OR_assignment', type: 'syntax', category: 'operator' },
      { path: '/ja/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing_assignment', type: 'syntax', category: 'operator' },
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/Number', type: 'api', category: 'number' }
    ]
  },
  'ES2020': {
    releaseDate: '2020-06',
    features: [
      { path: '/ja/docs/Web/JavaScript/Reference/Operators/Optional_chaining', type: 'syntax', category: 'operator' },
      { path: '/ja/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing', type: 'syntax', category: 'operator' },
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/BigInt', type: 'api', category: 'number' },
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled', type: 'api', category: 'async' },
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/globalThis', type: 'api', category: 'global' },
      { path: '/ja/docs/Web/JavaScript/Reference/Statements/import', type: 'syntax', category: 'module' },
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/String/matchAll', type: 'api', category: 'string' }
    ]
  },
  'ES2019': {
    releaseDate: '2019-06',
    features: [
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/Array/flat', type: 'api', category: 'array' },
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/Array/flatMap', type: 'api', category: 'array' },
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/Object/fromEntries', type: 'api', category: 'object' },
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/String/trimStart', type: 'api', category: 'string' },
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/String/trimEnd', type: 'api', category: 'string' },
      { path: '/ja/docs/Web/JavaScript/Reference/Statements/try...catch', type: 'syntax', category: 'error' },
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/Symbol/description', type: 'api', category: 'symbol' }
    ]
  },
  'ES2018': {
    releaseDate: '2018-06',
    features: [
      { path: '/ja/docs/Web/JavaScript/Reference/Statements/for-await...of', type: 'syntax', category: 'async' },
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/Promise/finally', type: 'api', category: 'async' },
      { path: '/ja/docs/Web/JavaScript/Reference/Operators/Spread_syntax', type: 'syntax', category: 'operator' },
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/RegExp', type: 'api', category: 'regexp' }
    ]
  },
  'ES2017': {
    releaseDate: '2017-06',
    features: [
      { path: '/ja/docs/Web/JavaScript/Reference/Statements/async_function', type: 'syntax', category: 'async' },
      { path: '/ja/docs/Web/JavaScript/Reference/Operators/await', type: 'syntax', category: 'async' },
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/Object/values', type: 'api', category: 'object' },
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/Object/entries', type: 'api', category: 'object' },
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/String/padStart', type: 'api', category: 'string' },
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/String/padEnd', type: 'api', category: 'string' },
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/Object/getOwnPropertyDescriptors', type: 'api', category: 'object' },
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer', type: 'api', category: 'concurrency' }
    ]
  },
  'ES2016': {
    releaseDate: '2016-06',
    features: [
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/Array/includes', type: 'api', category: 'array' },
      { path: '/ja/docs/Web/JavaScript/Reference/Operators/Exponentiation', type: 'syntax', category: 'operator' }
    ]
  },
  'ES2015': {
    releaseDate: '2015-06',
    features: [
      { path: '/ja/docs/Web/JavaScript/Reference/Functions/Arrow_functions', type: 'syntax', category: 'function' },
      { path: '/ja/docs/Web/JavaScript/Reference/Statements/let', type: 'syntax', category: 'variable' },
      { path: '/ja/docs/Web/JavaScript/Reference/Statements/const', type: 'syntax', category: 'variable' },
      { path: '/ja/docs/Web/JavaScript/Reference/Statements/class', type: 'syntax', category: 'class' },
      { path: '/ja/docs/Web/JavaScript/Reference/Template_literals', type: 'syntax', category: 'string' },
      { path: '/ja/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment', type: 'syntax', category: 'operator' },
      { path: '/ja/docs/Web/JavaScript/Reference/Functions/Default_parameters', type: 'syntax', category: 'function' },
      { path: '/ja/docs/Web/JavaScript/Reference/Functions/rest_parameters', type: 'syntax', category: 'function' },
      { path: '/ja/docs/Web/JavaScript/Reference/Operators/Spread_syntax', type: 'syntax', category: 'operator' },
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/Promise', type: 'concept', category: 'async' },
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/Map', type: 'api', category: 'collection' },
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/Set', type: 'api', category: 'collection' },
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/WeakMap', type: 'api', category: 'collection' },
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/Symbol', type: 'concept', category: 'primitive' },
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/Proxy', type: 'api', category: 'metaprogramming' },
      { path: '/ja/docs/Web/JavaScript/Reference/Statements/for...of', type: 'syntax', category: 'iteration' },
      { path: '/ja/docs/Web/JavaScript/Reference/Statements/import', type: 'syntax', category: 'module' },
      { path: '/ja/docs/Web/JavaScript/Reference/Statements/export', type: 'syntax', category: 'module' },
      { path: '/ja/docs/Web/JavaScript/Reference/Global_Objects/Generator', type: 'concept', category: 'iteration' }
    ]
  }
}

export class JavaScriptScraper extends BaseScraper {
  constructor() {
    super('javascript', 'JavaScript', 'https://developer.mozilla.org/ja/docs/Web/JavaScript')
  }

  async scrape() {
    const versions = []

    for (const [version, config] of Object.entries(ES_FEATURES)) {
      console.log(`Scraping ${version} (${config.features.length} features)...`)
      const terms = []

      for (const feature of config.features) {
        try {
          await sleep(200)
          const url = `${MDN_BASE}${feature.path}/index.json`
          const json = await fetchWithRetry(url)
          const data = JSON.parse(json)
          const doc = data.doc

          if (!doc) continue

          terms.push({
            id: generateId('javascript', version, doc.title),
            term: doc.short_title || doc.title,
            termJa: doc.title !== doc.short_title ? doc.title : '',
            type: feature.type,
            category: feature.category,
            meaning: doc.summary || '',
            example: '',
            tags: [],
            sourceUrl: `${MDN_BASE}${feature.path}`
          })
        } catch (error) {
          console.warn(`  Failed: ${feature.path}: ${error.message}`)
        }
      }

      if (terms.length > 0) {
        versions.push({
          version,
          releaseDate: config.releaseDate,
          terms
        })
      }
    }

    return versions
  }
}
