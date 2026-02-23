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

  async scrapeSpecification() {
    console.log('Building JavaScript specification...')

    return {
      categories: [
        {
          id: 'js-spec-data-types',
          group: 'syntax',
          name: 'Data Types',
          nameJa: 'データ型',
          items: [
            { id: 'js-spec-number', term: 'Number', termJa: '数値型', meaning: 'IEEE 754 倍精度64ビット浮動小数点数。整数と小数の区別なし。NaN, Infinity を含む', example: 'const n = 42;\nconst pi = 3.14;\nconst hex = 0xff;', sourceUrl: 'https://developer.mozilla.org/ja/docs/Web/JavaScript/Data_structures#number_%E5%9E%8B' },
            { id: 'js-spec-string', term: 'String', termJa: '文字列型', meaning: 'UTF-16 エンコードのテキストデータ。シングルクォート、ダブルクォート、テンプレートリテラルで生成', example: "const s = 'hello';\nconst t = `${s} world`;", sourceUrl: 'https://developer.mozilla.org/ja/docs/Web/JavaScript/Data_structures#string_%E5%9E%8B' },
            { id: 'js-spec-boolean', term: 'Boolean', termJa: '真偽値型', meaning: 'true または false の2値。条件分岐やループの制御に使用', example: 'const flag = true;\nif (flag) { /* ... */ }', sourceUrl: 'https://developer.mozilla.org/ja/docs/Web/JavaScript/Data_structures#boolean_%E5%9E%8B' },
            { id: 'js-spec-null', term: 'null', termJa: 'null', meaning: '意図的な「値がない」ことを示すプリミティブ値', example: 'const value = null;', sourceUrl: 'https://developer.mozilla.org/ja/docs/Web/JavaScript/Data_structures#null_%E5%9E%8B' },
            { id: 'js-spec-undefined', term: 'undefined', termJa: 'undefined', meaning: '値が未割当であることを示すプリミティブ値。宣言のみの変数のデフォルト値', example: 'let x;\nconsole.log(x); // undefined', sourceUrl: 'https://developer.mozilla.org/ja/docs/Web/JavaScript/Data_structures#undefined_%E5%9E%8B' },
            { id: 'js-spec-object', term: 'Object', termJa: 'オブジェクト型', meaning: 'キーと値のペアのコレクション。JavaScriptにおける最も基本的なデータ構造', example: 'const obj = { name: "Alice", age: 30 };\nobj.name; // "Alice"', sourceUrl: 'https://developer.mozilla.org/ja/docs/Web/JavaScript/Data_structures#%E3%82%AA%E3%83%96%E3%82%B8%E3%82%A7%E3%82%AF%E3%83%88' },
            { id: 'js-spec-array', term: 'Array', termJa: '配列', meaning: '順序付きの値のコレクション。インデックスでアクセス。長さは動的に変更可能', example: 'const arr = [1, 2, 3];\narr.push(4);\narr[0]; // 1', sourceUrl: 'https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Array' }
          ]
        },
        {
          id: 'js-spec-operators',
          group: 'syntax',
          name: 'Operators',
          nameJa: '演算子',
          items: [
            { id: 'js-spec-arithmetic', term: 'Arithmetic Operators', termJa: '算術演算子', meaning: '加算(+)、減算(-)、乗算(*)、除算(/)、剰余(%)、べき乗(**)', example: '10 + 3  // 13\n10 % 3  // 1\n2 ** 3  // 8', sourceUrl: 'https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Operators#%E7%AE%97%E8%A1%93%E6%BC%94%E7%AE%97%E5%AD%90' },
            { id: 'js-spec-comparison', term: 'Comparison Operators', termJa: '比較演算子', meaning: '等価(==)、厳密等価(===)、不等価(!=)、大小比較(<, >, <=, >=)', example: '1 === 1   // true\n1 == "1"  // true\n1 === "1" // false', sourceUrl: 'https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Operators#%E6%AF%94%E8%BC%83%E6%BC%94%E7%AE%97%E5%AD%90' },
            { id: 'js-spec-logical', term: 'Logical Operators', termJa: '論理演算子', meaning: '論理AND(&&)、論理OR(||)、論理NOT(!)。短絡評価を行う', example: 'true && false  // false\ntrue || false  // true\n!true          // false', sourceUrl: 'https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Operators#%E8%AB%96%E7%90%86%E6%BC%94%E7%AE%97%E5%AD%90' },
            { id: 'js-spec-ternary', term: 'Conditional (Ternary) Operator', termJa: '条件（三項）演算子', meaning: '条件 ? 真の場合 : 偽の場合。唯一の三項演算子', example: "const age = 20;\nconst status = age >= 18 ? 'adult' : 'minor';", sourceUrl: 'https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Operators/Conditional_operator' },
            { id: 'js-spec-typeof', term: 'typeof Operator', termJa: 'typeof 演算子', meaning: 'オペランドの型を文字列で返す単項演算子', example: "typeof 42       // 'number'\ntypeof 'hello'  // 'string'\ntypeof null     // 'object'", sourceUrl: 'https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Operators/typeof' }
          ]
        },
        {
          id: 'js-spec-control-flow',
          group: 'syntax',
          name: 'Control Flow',
          nameJa: '制御構文',
          items: [
            { id: 'js-spec-if-else', term: 'if...else', termJa: 'if...else 文', meaning: '条件に基づいて処理を分岐する基本制御構文', example: 'if (x > 0) {\n  console.log("positive");\n} else {\n  console.log("non-positive");\n}', sourceUrl: 'https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Statements/if...else' },
            { id: 'js-spec-switch', term: 'switch', termJa: 'switch 文', meaning: '式の値に基づく複数分岐。case 節で一致を判定。break で脱出', example: 'switch (color) {\n  case "red": /* ... */ break;\n  case "blue": /* ... */ break;\n  default: /* ... */\n}', sourceUrl: 'https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Statements/switch' },
            { id: 'js-spec-for', term: 'for', termJa: 'for ループ', meaning: '初期化・条件・更新の3式で制御するループ', example: 'for (let i = 0; i < 5; i++) {\n  console.log(i);\n}', sourceUrl: 'https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Statements/for' },
            { id: 'js-spec-while', term: 'while / do...while', termJa: 'while ループ', meaning: 'while は条件が真の間ループ。do...while は少なくとも1回実行', example: 'let i = 0;\nwhile (i < 5) {\n  i++;\n}', sourceUrl: 'https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Statements/while' },
            { id: 'js-spec-for-in', term: 'for...in', termJa: 'for...in 文', meaning: 'オブジェクトの列挙可能プロパティを反復処理', example: 'const obj = {a: 1, b: 2};\nfor (const key in obj) {\n  console.log(key);\n}', sourceUrl: 'https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Statements/for...in' }
          ]
        },
        {
          id: 'js-spec-functions',
          group: 'syntax',
          name: 'Functions',
          nameJa: '関数',
          items: [
            { id: 'js-spec-function-declaration', term: 'Function Declaration', termJa: '関数宣言', meaning: 'function キーワードによる名前付き関数の定義。巻き上げ（hoisting）される', example: 'function greet(name) {\n  return `Hello, ${name}`;\n}', sourceUrl: 'https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Statements/function' },
            { id: 'js-spec-function-expression', term: 'Function Expression', termJa: '関数式', meaning: '変数に関数を代入する形式。無名関数も可。巻き上げされない', example: 'const greet = function(name) {\n  return `Hello, ${name}`;\n};', sourceUrl: 'https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Operators/function' },
            { id: 'js-spec-arguments', term: 'arguments', termJa: 'arguments オブジェクト', meaning: '関数に渡されたすべての引数を含む配列風オブジェクト。アロー関数では使用不可', example: 'function sum() {\n  let total = 0;\n  for (const v of arguments) total += v;\n  return total;\n}', sourceUrl: 'https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Functions/arguments' },
            { id: 'js-spec-return', term: 'return', termJa: 'return 文', meaning: '関数の実行を終了し、値を返す。省略時は undefined を返す', example: 'function add(a, b) {\n  return a + b;\n}', sourceUrl: 'https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Statements/return' }
          ]
        },
        {
          id: 'js-spec-error-handling',
          group: 'syntax',
          name: 'Error Handling',
          nameJa: 'エラー処理',
          items: [
            { id: 'js-spec-try-catch', term: 'try...catch...finally', termJa: 'try...catch...finally 文', meaning: '例外処理。try ブロックでエラーを捕捉し、catch で処理、finally で後始末', example: 'try {\n  JSON.parse(invalid);\n} catch (e) {\n  console.error(e.message);\n} finally {\n  console.log("done");\n}', sourceUrl: 'https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Statements/try...catch' },
            { id: 'js-spec-throw', term: 'throw', termJa: 'throw 文', meaning: 'ユーザー定義の例外をスローする。任意の式をスロー可能', example: 'throw new Error("Something went wrong");', sourceUrl: 'https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Statements/throw' },
            { id: 'js-spec-error-types', term: 'Error Types', termJa: 'エラー型', meaning: 'Error, TypeError, RangeError, ReferenceError, SyntaxError 等の組み込みエラー型', example: 'new TypeError("Expected a string");\nnew RangeError("Index out of bounds");', sourceUrl: 'https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Error' }
          ]
        },
        {
          id: 'js-spec-built-in-objects',
          group: 'api',
          name: 'Built-in Objects',
          nameJa: '組み込みオブジェクト',
          items: [
            { id: 'js-spec-math', term: 'Math', termJa: 'Math オブジェクト', meaning: '数学的な定数と関数を提供する組み込みオブジェクト。コンストラクタなし', example: 'Math.PI;          // 3.14159...\nMath.max(1, 2, 3); // 3\nMath.floor(4.7);   // 4', sourceUrl: 'https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Math' },
            { id: 'js-spec-date', term: 'Date', termJa: 'Date オブジェクト', meaning: '日時を扱う組み込みオブジェクト。1970年1月1日からのミリ秒で管理', example: 'const now = new Date();\nnow.getFullYear(); // 2026\nnow.toISOString();', sourceUrl: 'https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Date' },
            { id: 'js-spec-regexp', term: 'RegExp', termJa: '正規表現', meaning: '正規表現によるパターンマッチング。リテラル記法とコンストラクタで生成', example: 'const re = /^hello/i;\nre.test("Hello world"); // true\n"abc123".match(/\\d+/); // ["123"]', sourceUrl: 'https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/RegExp' },
            { id: 'js-spec-json', term: 'JSON', termJa: 'JSON オブジェクト', meaning: 'JSON 形式のデータをパース・文字列化するメソッドを持つ組み込みオブジェクト', example: 'const obj = JSON.parse(\'{"a":1}\');\nJSON.stringify(obj); // \'{"a":1}\'', sourceUrl: 'https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/JSON' }
          ]
        }
      ]
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
