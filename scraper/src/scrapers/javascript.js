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

  async scrapeOverview() {
    console.log('Scraping JavaScript overview...')

    const characteristicsDef = [
      { id: 'js-char-dynamic-typing', term: 'Dynamic Typing', termJa: '動的型付け', meaningFallback: '変数の型が実行時に決定される。宣言時に型指定が不要', mdnPath: '/ja/docs/Web/JavaScript/Data_structures', relatedConceptIds: ['js-concept-type-coercion', 'js-concept-typeof'] },
      { id: 'js-char-prototype-based', term: 'Prototype-based OOP', termJa: 'プロトタイプベースOOP', meaningFallback: 'クラスではなくプロトタイプチェーンによるオブジェクト指向。オブジェクトが他のオブジェクトを直接継承', mdnPath: '/ja/docs/Web/JavaScript/Inheritance_and_the_prototype_chain', relatedConceptIds: ['js-concept-prototype-chain', 'js-concept-this'] },
      { id: 'js-char-first-class-functions', term: 'First-class Functions', termJa: '第一級関数', meaningFallback: '関数を変数に代入、引数として渡す、戻り値として返すことが可能', mdnPath: '/ja/docs/Glossary/First-class_Function', relatedConceptIds: ['js-concept-closure', 'js-concept-callback', 'js-concept-higher-order-function'] },
      { id: 'js-char-event-driven', term: 'Event-driven', termJa: 'イベント駆動', meaningFallback: 'イベントループによる非同期処理モデル。シングルスレッドでノンブロッキングI/Oを実現', mdnPath: '/ja/docs/Web/JavaScript/Event_loop', relatedConceptIds: ['js-concept-event-loop', 'js-concept-callback'] },
      { id: 'js-char-multi-paradigm', term: 'Multi-paradigm', termJa: 'マルチパラダイム', meaningFallback: '手続き型、オブジェクト指向、関数型プログラミングの複数パラダイムをサポート', mdnPath: null, relatedConceptIds: ['js-concept-closure', 'js-concept-prototype-chain'] }
    ]

    const conceptsDef = [
      { id: 'js-concept-closure', term: 'Closure', termJa: 'クロージャ', characteristicId: 'js-char-first-class-functions', meaningFallback: '関数とその関数が作成された時点のレキシカル環境の組み合わせ。外部スコープの変数を参照し続ける', mdnPath: '/ja/docs/Web/JavaScript/Closures', relatedTermIds: ['js-es2015-arrow-functions'] },
      { id: 'js-concept-prototype-chain', term: 'Prototype Chain', termJa: 'プロトタイプチェーン', characteristicId: 'js-char-prototype-based', meaningFallback: 'オブジェクトのプロパティ検索時にプロトタイプを辿る仕組み。継承の基盤', mdnPath: '/ja/docs/Web/JavaScript/Inheritance_and_the_prototype_chain', relatedTermIds: ['js-es2015-class'] },
      { id: 'js-concept-this', term: 'this Binding', termJa: 'this の束縛', characteristicId: 'js-char-prototype-based', meaningFallback: '関数の呼び出し方によって this の参照先が変わる。call, apply, bind で明示的に指定可能', mdnPath: '/ja/docs/Web/JavaScript/Reference/Operators/this', relatedTermIds: ['js-es2015-arrow-functions'] },
      { id: 'js-concept-event-loop', term: 'Event Loop', termJa: 'イベントループ', characteristicId: 'js-char-event-driven', meaningFallback: 'コールスタック、タスクキュー、マイクロタスクキューを管理し非同期処理を制御する仕組み', mdnPath: '/ja/docs/Web/JavaScript/Event_loop', relatedTermIds: ['js-es2015-promise'] },
      { id: 'js-concept-callback', term: 'Callback', termJa: 'コールバック', characteristicId: 'js-char-first-class-functions', meaningFallback: '他の関数に引数として渡される関数。非同期処理やイベントハンドリングの基本パターン', mdnPath: '/ja/docs/Glossary/Callback_function', relatedTermIds: ['js-es2015-promise'] },
      { id: 'js-concept-hoisting', term: 'Hoisting', termJa: 'ホイスティング（巻き上げ）', characteristicId: 'js-char-dynamic-typing', meaningFallback: '変数や関数の宣言がスコープの先頭に巻き上げられる挙動。var と let/const で動作が異なる', mdnPath: '/ja/docs/Glossary/Hoisting', relatedTermIds: ['js-es2015-let', 'js-es2015-const'] },
      { id: 'js-concept-scope', term: 'Scope', termJa: 'スコープ', characteristicId: 'js-char-dynamic-typing', meaningFallback: '変数や関数が参照可能な範囲。グローバル、関数、ブロックスコープがある', mdnPath: '/ja/docs/Glossary/Scope', relatedTermIds: ['js-es2015-let', 'js-es2015-const'] },
      { id: 'js-concept-type-coercion', term: 'Type Coercion', termJa: '型変換（型強制）', characteristicId: 'js-char-dynamic-typing', meaningFallback: '演算時に値が自動的に別の型に変換される仕組み。暗黙的変換と明示的変換がある', mdnPath: '/ja/docs/Glossary/Type_coercion', relatedTermIds: [] },
      { id: 'js-concept-typeof', term: 'typeof Operator', termJa: 'typeof 演算子', characteristicId: 'js-char-dynamic-typing', meaningFallback: '値の型を文字列として返す演算子。動的型付け言語での型チェックに使用', mdnPath: '/ja/docs/Web/JavaScript/Reference/Operators/typeof', relatedTermIds: [] },
      { id: 'js-concept-higher-order-function', term: 'Higher-order Function', termJa: '高階関数', characteristicId: 'js-char-first-class-functions', meaningFallback: '関数を引数に取る、または関数を返す関数。map, filter, reduce が代表例', mdnPath: null, relatedTermIds: ['js-es2015-arrow-functions'] }
    ]

    const characteristics = []
    for (const charDef of characteristicsDef) {
      let meaning = charDef.meaningFallback
      let sourceUrl = ''
      if (charDef.mdnPath) {
        try {
          await sleep(200)
          const url = `${MDN_BASE}${charDef.mdnPath}/index.json`
          const json = await fetchWithRetry(url)
          const data = JSON.parse(json)
          if (data.doc?.summary) meaning = data.doc.summary
          sourceUrl = `${MDN_BASE}${charDef.mdnPath}`
        } catch (error) {
          console.warn(`  Failed to fetch characteristic: ${charDef.mdnPath}: ${error.message}`)
          sourceUrl = charDef.mdnPath ? `${MDN_BASE}${charDef.mdnPath}` : ''
        }
      }
      characteristics.push({ id: charDef.id, term: charDef.term, termJa: charDef.termJa, meaning, relatedConceptIds: charDef.relatedConceptIds, sourceUrl })
    }

    const concepts = []
    for (const conceptDef of conceptsDef) {
      let meaning = conceptDef.meaningFallback
      let sourceUrl = ''
      if (conceptDef.mdnPath) {
        try {
          await sleep(200)
          const url = `${MDN_BASE}${conceptDef.mdnPath}/index.json`
          const json = await fetchWithRetry(url)
          const data = JSON.parse(json)
          if (data.doc?.summary) meaning = data.doc.summary
          sourceUrl = `${MDN_BASE}${conceptDef.mdnPath}`
        } catch (error) {
          console.warn(`  Failed to fetch concept: ${conceptDef.mdnPath}: ${error.message}`)
          sourceUrl = conceptDef.mdnPath ? `${MDN_BASE}${conceptDef.mdnPath}` : ''
        }
      }
      concepts.push({ id: conceptDef.id, term: conceptDef.term, termJa: conceptDef.termJa, characteristicId: conceptDef.characteristicId, meaning, relatedTermIds: conceptDef.relatedTermIds, sourceUrl })
    }

    return {
      description: 'プロトタイプベースのマルチパラダイムスクリプト言語。動的型付け、第一級関数、イベント駆動モデルを特徴とする',
      characteristics,
      concepts
    }
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
