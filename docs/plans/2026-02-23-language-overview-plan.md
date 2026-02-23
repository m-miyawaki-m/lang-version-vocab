# 言語特性・概念・文法の階層構造追加 実装計画

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 各言語の JSON に `overview` セクション（言語特性・概念）を追加し、タブ切替 UI で概要とバージョン履歴を表示、概念からバージョン用語へのジャンプ機能を実装する。

**Architecture:** 既存の scraper に `scrapeOverview()` メソッドを追加し、公式ドキュメントから特性・概念を収集。フロントエンドにタブ切替 UI を追加し、概念カードの文法リンクからバージョン履歴タブの該当カードへスクロールジャンプ。

**Tech Stack:** Vue 3 + Vite（フロントエンド）、Node.js + cheerio（スクレイパー）

**設計書:** `docs/plans/2026-02-23-language-overview-design.md`

---

### Task 1: BaseScraper に overview 対応を追加

**Files:**
- Modify: `scraper/src/scrapers/base.js`

**Step 1: scrapeOverview() メソッドとsave() の変更を実装**

`scraper/src/scrapers/base.js` を以下に変更:

```javascript
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
    // サブクラスでオーバーライド。未実装の場合は null を返す
    return null
  }

  async save(versions, overview = null) {
    const data = {
      language: this.language,
      displayName: this.displayName,
      source: this.sourceUrl,
      ...(overview ? { overview } : {}),
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
    const versions = await this.scrape()
    const totalTerms = versions.reduce((sum, v) => sum + v.terms.length, 0)
    console.log(`Found ${totalTerms} terms across ${versions.length} versions`)
    await this.save(versions, overview)
    return versions
  }
}
```

**Step 2: 動作確認**

Run: `cd /home/miyaw/dev/lang-version-vocab/scraper && node -e "import('./src/scrapers/base.js').then(m => console.log('OK'))"`
Expected: `OK`（import エラーなし）

**Step 3: コミット**

```bash
cd /home/miyaw/dev/lang-version-vocab
git add scraper/src/scrapers/base.js
git commit -m "feat: BaseScraper に scrapeOverview() と overview 対応 save() を追加"
```

---

### Task 2: JavaScript スクレイパーに overview 収集を追加

**Files:**
- Modify: `scraper/src/scrapers/javascript.js`

**Step 1: overview データ定義と scrapeOverview() を実装**

`scraper/src/scrapers/javascript.js` の `JavaScriptScraper` クラスに `scrapeOverview()` メソッドを追加。既存の `ES_FEATURES` 定義と `scrape()` メソッドはそのまま維持。

クラス定義の `constructor()` の後、`scrape()` の前に以下を追加:

```javascript
  async scrapeOverview() {
    console.log('Scraping JavaScript overview...')

    // 言語特性の定義（MDN ガイドページから説明を取得）
    const characteristicsDef = [
      {
        id: 'js-char-dynamic-typing',
        term: 'Dynamic Typing',
        termJa: '動的型付け',
        meaningFallback: '変数の型が実行時に決定される。宣言時に型指定が不要',
        mdnPath: '/ja/docs/Web/JavaScript/Data_structures',
        relatedConceptIds: ['js-concept-type-coercion', 'js-concept-typeof']
      },
      {
        id: 'js-char-prototype-based',
        term: 'Prototype-based OOP',
        termJa: 'プロトタイプベースOOP',
        meaningFallback: 'クラスではなくプロトタイプチェーンによるオブジェクト指向。オブジェクトが他のオブジェクトを直接継承',
        mdnPath: '/ja/docs/Web/JavaScript/Inheritance_and_the_prototype_chain',
        relatedConceptIds: ['js-concept-prototype-chain', 'js-concept-this']
      },
      {
        id: 'js-char-first-class-functions',
        term: 'First-class Functions',
        termJa: '第一級関数',
        meaningFallback: '関数を変数に代入、引数として渡す、戻り値として返すことが可能',
        mdnPath: '/ja/docs/Glossary/First-class_Function',
        relatedConceptIds: ['js-concept-closure', 'js-concept-callback', 'js-concept-higher-order-function']
      },
      {
        id: 'js-char-event-driven',
        term: 'Event-driven',
        termJa: 'イベント駆動',
        meaningFallback: 'イベントループによる非同期処理モデル。シングルスレッドでノンブロッキングI/Oを実現',
        mdnPath: '/ja/docs/Web/JavaScript/Event_loop',
        relatedConceptIds: ['js-concept-event-loop', 'js-concept-callback']
      },
      {
        id: 'js-char-multi-paradigm',
        term: 'Multi-paradigm',
        termJa: 'マルチパラダイム',
        meaningFallback: '手続き型、オブジェクト指向、関数型プログラミングの複数パラダイムをサポート',
        mdnPath: null,
        relatedConceptIds: ['js-concept-closure', 'js-concept-prototype-chain']
      }
    ]

    // 概念の定義（MDN ガイドページから説明を取得）
    const conceptsDef = [
      {
        id: 'js-concept-closure',
        term: 'Closure',
        termJa: 'クロージャ',
        characteristicId: 'js-char-first-class-functions',
        meaningFallback: '関数とその関数が作成された時点のレキシカル環境の組み合わせ。外部スコープの変数を参照し続ける',
        mdnPath: '/ja/docs/Web/JavaScript/Closures',
        relatedTermIds: ['js-es2015-arrow-functions']
      },
      {
        id: 'js-concept-prototype-chain',
        term: 'Prototype Chain',
        termJa: 'プロトタイプチェーン',
        characteristicId: 'js-char-prototype-based',
        meaningFallback: 'オブジェクトのプロパティ検索時にプロトタイプを辿る仕組み。継承の基盤',
        mdnPath: '/ja/docs/Web/JavaScript/Inheritance_and_the_prototype_chain',
        relatedTermIds: ['js-es2015-class']
      },
      {
        id: 'js-concept-this',
        term: 'this Binding',
        termJa: 'this の束縛',
        characteristicId: 'js-char-prototype-based',
        meaningFallback: '関数の呼び出し方によって this の参照先が変わる。call, apply, bind で明示的に指定可能',
        mdnPath: '/ja/docs/Web/JavaScript/Reference/Operators/this',
        relatedTermIds: ['js-es2015-arrow-functions']
      },
      {
        id: 'js-concept-event-loop',
        term: 'Event Loop',
        termJa: 'イベントループ',
        characteristicId: 'js-char-event-driven',
        meaningFallback: 'コールスタック、タスクキュー、マイクロタスクキューを管理し非同期処理を制御する仕組み',
        mdnPath: '/ja/docs/Web/JavaScript/Event_loop',
        relatedTermIds: ['js-es2015-promise']
      },
      {
        id: 'js-concept-callback',
        term: 'Callback',
        termJa: 'コールバック',
        characteristicId: 'js-char-first-class-functions',
        meaningFallback: '他の関数に引数として渡される関数。非同期処理やイベントハンドリングの基本パターン',
        mdnPath: '/ja/docs/Glossary/Callback_function',
        relatedTermIds: ['js-es2015-promise']
      },
      {
        id: 'js-concept-hoisting',
        term: 'Hoisting',
        termJa: 'ホイスティング（巻き上げ）',
        characteristicId: 'js-char-dynamic-typing',
        meaningFallback: '変数や関数の宣言がスコープの先頭に巻き上げられる挙動。var と let/const で動作が異なる',
        mdnPath: '/ja/docs/Glossary/Hoisting',
        relatedTermIds: ['js-es2015-let', 'js-es2015-const']
      },
      {
        id: 'js-concept-scope',
        term: 'Scope',
        termJa: 'スコープ',
        characteristicId: 'js-char-dynamic-typing',
        meaningFallback: '変数や関数が参照可能な範囲。グローバル、関数、ブロックスコープがある',
        mdnPath: '/ja/docs/Glossary/Scope',
        relatedTermIds: ['js-es2015-let', 'js-es2015-const']
      },
      {
        id: 'js-concept-type-coercion',
        term: 'Type Coercion',
        termJa: '型変換（型強制）',
        characteristicId: 'js-char-dynamic-typing',
        meaningFallback: '演算時に値が自動的に別の型に変換される仕組み。暗黙的変換と明示的変換がある',
        mdnPath: '/ja/docs/Glossary/Type_coercion',
        relatedTermIds: []
      },
      {
        id: 'js-concept-typeof',
        term: 'typeof Operator',
        termJa: 'typeof 演算子',
        characteristicId: 'js-char-dynamic-typing',
        meaningFallback: '値の型を文字列として返す演算子。動的型付け言語での型チェックに使用',
        mdnPath: '/ja/docs/Web/JavaScript/Reference/Operators/typeof',
        relatedTermIds: []
      },
      {
        id: 'js-concept-higher-order-function',
        term: 'Higher-order Function',
        termJa: '高階関数',
        characteristicId: 'js-char-first-class-functions',
        meaningFallback: '関数を引数に取る、または関数を返す関数。map, filter, reduce が代表例',
        mdnPath: null,
        relatedTermIds: ['js-es2015-arrow-functions']
      }
    ]

    // MDN JSON API から説明を取得
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
          if (data.doc?.summary) {
            meaning = data.doc.summary
          }
          sourceUrl = `${MDN_BASE}${charDef.mdnPath}`
        } catch (error) {
          console.warn(`  Failed to fetch characteristic: ${charDef.mdnPath}: ${error.message}`)
          sourceUrl = charDef.mdnPath ? `${MDN_BASE}${charDef.mdnPath}` : ''
        }
      }

      characteristics.push({
        id: charDef.id,
        term: charDef.term,
        termJa: charDef.termJa,
        meaning,
        relatedConceptIds: charDef.relatedConceptIds,
        sourceUrl
      })
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
          if (data.doc?.summary) {
            meaning = data.doc.summary
          }
          sourceUrl = `${MDN_BASE}${conceptDef.mdnPath}`
        } catch (error) {
          console.warn(`  Failed to fetch concept: ${conceptDef.mdnPath}: ${error.message}`)
          sourceUrl = conceptDef.mdnPath ? `${MDN_BASE}${conceptDef.mdnPath}` : ''
        }
      }

      concepts.push({
        id: conceptDef.id,
        term: conceptDef.term,
        termJa: conceptDef.termJa,
        characteristicId: conceptDef.characteristicId,
        meaning,
        relatedTermIds: conceptDef.relatedTermIds,
        sourceUrl
      })
    }

    return {
      description: 'プロトタイプベースのマルチパラダイムスクリプト言語。動的型付け、第一級関数、イベント駆動モデルを特徴とする',
      characteristics,
      concepts
    }
  }
```

**注意:** `sleep` と `fetchWithRetry` は既にファイル先頭で import 済み。`MDN_BASE` も定義済み。

**Step 2: スクレイパー実行で確認**

Run: `cd /home/miyaw/dev/lang-version-vocab/scraper && node src/index.js --lang javascript`
Expected: `Found 5 characteristics, 10 concepts` のようなログが表示され、`data/javascript.json` に `overview` セクションが含まれる。

**Step 3: コミット**

```bash
cd /home/miyaw/dev/lang-version-vocab
git add scraper/src/scrapers/javascript.js
git commit -m "feat: JavaScript スクレイパーに overview 収集を追加"
```

---

### Task 3: Java スクレイパーに overview 収集を追加

**Files:**
- Modify: `scraper/src/scrapers/java.js`

**Step 1: scrapeOverview() を実装**

`scraper/src/scrapers/java.js` の `JavaScraper` クラスに、`constructor()` の後、`scrape()` の前に以下を追加:

```javascript
  async scrapeOverview() {
    console.log('Scraping Java overview...')

    const characteristics = [
      {
        id: 'java-char-static-typing',
        term: 'Static Typing',
        termJa: '静的型付け',
        meaning: 'コンパイル時に型チェックが行われる。変数宣言時に型指定が必要（var による型推論も可能）',
        relatedConceptIds: ['java-concept-generics', 'java-concept-type-erasure'],
        sourceUrl: ''
      },
      {
        id: 'java-char-oop',
        term: 'Object-oriented Programming',
        termJa: 'オブジェクト指向',
        meaning: 'クラスベースのオブジェクト指向言語。カプセル化、継承、ポリモーフィズムを完全サポート',
        relatedConceptIds: ['java-concept-inheritance', 'java-concept-polymorphism', 'java-concept-encapsulation', 'java-concept-interface'],
        sourceUrl: ''
      },
      {
        id: 'java-char-platform-independent',
        term: 'Platform Independence',
        termJa: 'プラットフォーム非依存',
        meaning: 'JVM（Java Virtual Machine）上で動作し、Write Once, Run Anywhere を実現',
        relatedConceptIds: ['java-concept-jvm', 'java-concept-bytecode'],
        sourceUrl: ''
      },
      {
        id: 'java-char-garbage-collection',
        term: 'Garbage Collection',
        termJa: 'ガベージコレクション',
        meaning: '不要になったオブジェクトのメモリを自動的に解放。手動メモリ管理が不要',
        relatedConceptIds: ['java-concept-jvm'],
        sourceUrl: ''
      },
      {
        id: 'java-char-multithreading',
        term: 'Built-in Multithreading',
        termJa: 'マルチスレッド組み込み',
        meaning: '言語レベルでスレッドをサポート。synchronized, volatile, java.util.concurrent パッケージ',
        relatedConceptIds: ['java-concept-thread-safety', 'java-concept-synchronization'],
        sourceUrl: ''
      }
    ]

    const concepts = [
      {
        id: 'java-concept-inheritance',
        term: 'Inheritance',
        termJa: '継承',
        characteristicId: 'java-char-oop',
        meaning: 'クラスが他のクラスの属性と振る舞いを引き継ぐ仕組み。extends キーワードで単一継承',
        relatedTermIds: ['java-17-sealed-classes', 'java-17-records'],
        sourceUrl: ''
      },
      {
        id: 'java-concept-polymorphism',
        term: 'Polymorphism',
        termJa: 'ポリモーフィズム（多態性）',
        characteristicId: 'java-char-oop',
        meaning: '同一のインターフェースで異なる実装を扱える仕組み。オーバーライドとオーバーロード',
        relatedTermIds: ['java-17-pattern-matching-for-instanceo', 'java-21-pattern-matching-for-switch'],
        sourceUrl: ''
      },
      {
        id: 'java-concept-encapsulation',
        term: 'Encapsulation',
        termJa: 'カプセル化',
        characteristicId: 'java-char-oop',
        meaning: 'データとメソッドをクラスにまとめ、アクセス修飾子で公開範囲を制御する仕組み',
        relatedTermIds: ['java-17-records', 'java-17-sealed-classes'],
        sourceUrl: ''
      },
      {
        id: 'java-concept-interface',
        term: 'Interface',
        termJa: 'インターフェース',
        characteristicId: 'java-char-oop',
        meaning: 'メソッドのシグネチャのみを定義する型。多重実装が可能。Java 8 以降は default メソッドも可',
        relatedTermIds: ['java-8-default-methods', 'java-9-private-interface-methods'],
        sourceUrl: ''
      },
      {
        id: 'java-concept-generics',
        term: 'Generics',
        termJa: 'ジェネリクス',
        characteristicId: 'java-char-static-typing',
        meaning: '型をパラメータ化して汎用的なクラスやメソッドを定義する仕組み。コンパイル時型安全性を提供',
        relatedTermIds: ['java-8-stream-api', 'java-8-optional'],
        sourceUrl: ''
      },
      {
        id: 'java-concept-type-erasure',
        term: 'Type Erasure',
        termJa: '型消去',
        characteristicId: 'java-char-static-typing',
        meaning: 'ジェネリクスの型情報がコンパイル後に消去される仕組み。後方互換性のため',
        relatedTermIds: [],
        sourceUrl: ''
      },
      {
        id: 'java-concept-jvm',
        term: 'JVM (Java Virtual Machine)',
        termJa: 'Java仮想マシン',
        characteristicId: 'java-char-platform-independent',
        meaning: 'バイトコードを実行する仮想マシン。JIT コンパイラ、ガベージコレクタを内蔵',
        relatedTermIds: ['java-21-virtual-threads'],
        sourceUrl: ''
      },
      {
        id: 'java-concept-bytecode',
        term: 'Bytecode',
        termJa: 'バイトコード',
        characteristicId: 'java-char-platform-independent',
        meaning: 'Java ソースコードをコンパイルした中間コード。JVM が解釈実行する',
        relatedTermIds: [],
        sourceUrl: ''
      },
      {
        id: 'java-concept-thread-safety',
        term: 'Thread Safety',
        termJa: 'スレッド安全性',
        characteristicId: 'java-char-multithreading',
        meaning: '複数スレッドから同時にアクセスされても正しく動作する性質',
        relatedTermIds: ['java-21-virtual-threads', 'java-8-completablefuture'],
        sourceUrl: ''
      },
      {
        id: 'java-concept-synchronization',
        term: 'Synchronization',
        termJa: '同期化',
        characteristicId: 'java-char-multithreading',
        meaning: '複数スレッド間の排他制御。synchronized ブロック/メソッド、Lock インターフェース',
        relatedTermIds: ['java-21-virtual-threads'],
        sourceUrl: ''
      }
    ]

    return {
      description: 'クラスベースの静的型付けオブジェクト指向言語。JVM 上で動作し、プラットフォーム非依存。ガベージコレクションとマルチスレッドを言語レベルでサポート',
      characteristics,
      concepts
    }
  }
```

**Step 2: スクレイパー実行で確認**

Run: `cd /home/miyaw/dev/lang-version-vocab/scraper && node src/index.js --lang java`
Expected: `Found 5 characteristics, 10 concepts` のログが表示され、`data/java.json` に `overview` セクションが含まれる。

**Step 3: コミット**

```bash
cd /home/miyaw/dev/lang-version-vocab
git add scraper/src/scrapers/java.js
git commit -m "feat: Java スクレイパーに overview 収集を追加"
```

---

### Task 4: jQuery スクレイパーに overview 収集を追加

**Files:**
- Modify: `scraper/src/scrapers/jquery.js`

**Step 1: scrapeOverview() を実装**

`scraper/src/scrapers/jquery.js` の `JqueryScraper` クラスに、`constructor()` の後、`scrape()` の前に以下を追加:

```javascript
  async scrapeOverview() {
    console.log('Scraping jQuery overview...')

    const characteristics = [
      {
        id: 'jquery-char-dom-abstraction',
        term: 'DOM Abstraction',
        termJa: 'DOM 抽象化',
        meaning: 'ブラウザ間の DOM API の差異を吸収し、統一的なインターフェースでDOM操作を提供',
        relatedConceptIds: ['jquery-concept-dom-traversal', 'jquery-concept-dom-manipulation'],
        sourceUrl: 'https://api.jquery.com/'
      },
      {
        id: 'jquery-char-css-selectors',
        term: 'CSS Selector Engine',
        termJa: 'CSSセレクタエンジン',
        meaning: 'CSSセレクタ構文で要素を選択。Sizzle エンジンによる高速マッチング',
        relatedConceptIds: ['jquery-concept-selector', 'jquery-concept-filtering'],
        sourceUrl: 'https://api.jquery.com/category/selectors/'
      },
      {
        id: 'jquery-char-chaining',
        term: 'Method Chaining',
        termJa: 'メソッドチェーン',
        meaning: 'メソッドが jQuery オブジェクトを返すことで、連続したメソッド呼び出しが可能',
        relatedConceptIds: ['jquery-concept-dom-manipulation', 'jquery-concept-animation'],
        sourceUrl: ''
      },
      {
        id: 'jquery-char-cross-browser',
        term: 'Cross-browser Compatibility',
        termJa: 'クロスブラウザ互換性',
        meaning: '主要ブラウザ間の動作差異を吸収し、統一的に動作するコードを記述可能',
        relatedConceptIds: ['jquery-concept-ajax', 'jquery-concept-event-handling'],
        sourceUrl: ''
      },
      {
        id: 'jquery-char-plugin-system',
        term: 'Plugin Architecture',
        termJa: 'プラグインアーキテクチャ',
        meaning: '$.fn を拡張してカスタムメソッドを追加できるプラグインシステム',
        relatedConceptIds: ['jquery-concept-plugin'],
        sourceUrl: ''
      }
    ]

    const concepts = [
      {
        id: 'jquery-concept-selector',
        term: 'Selector',
        termJa: 'セレクタ',
        characteristicId: 'jquery-char-css-selectors',
        meaning: 'CSS セレクタやカスタムセレクタで DOM 要素を選択する機能。$("selector") 構文',
        relatedTermIds: [],
        sourceUrl: 'https://api.jquery.com/category/selectors/'
      },
      {
        id: 'jquery-concept-dom-traversal',
        term: 'DOM Traversal',
        termJa: 'DOM 走査',
        characteristicId: 'jquery-char-dom-abstraction',
        meaning: 'DOM ツリーを上下左右に移動して要素を取得。parent, children, find, siblings 等',
        relatedTermIds: [],
        sourceUrl: 'https://api.jquery.com/category/traversing/'
      },
      {
        id: 'jquery-concept-dom-manipulation',
        term: 'DOM Manipulation',
        termJa: 'DOM 操作',
        characteristicId: 'jquery-char-dom-abstraction',
        meaning: '要素の追加、削除、変更、複製などの DOM 操作。append, remove, html, text 等',
        relatedTermIds: [],
        sourceUrl: 'https://api.jquery.com/category/manipulation/'
      },
      {
        id: 'jquery-concept-event-handling',
        term: 'Event Handling',
        termJa: 'イベント処理',
        characteristicId: 'jquery-char-cross-browser',
        meaning: 'クロスブラウザ対応のイベント処理。on, off, trigger によるイベント管理',
        relatedTermIds: [],
        sourceUrl: 'https://api.jquery.com/category/events/'
      },
      {
        id: 'jquery-concept-event-delegation',
        term: 'Event Delegation',
        termJa: 'イベントデリゲーション',
        characteristicId: 'jquery-char-cross-browser',
        meaning: '親要素でイベントを監視し、子要素のイベントを効率的に処理する手法',
        relatedTermIds: [],
        sourceUrl: 'https://api.jquery.com/on/'
      },
      {
        id: 'jquery-concept-ajax',
        term: 'AJAX',
        termJa: '非同期通信',
        characteristicId: 'jquery-char-cross-browser',
        meaning: '非同期 HTTP リクエストの簡易API。$.ajax, $.get, $.post による通信',
        relatedTermIds: [],
        sourceUrl: 'https://api.jquery.com/category/ajax/'
      },
      {
        id: 'jquery-concept-animation',
        term: 'Animation',
        termJa: 'アニメーション',
        characteristicId: 'jquery-char-chaining',
        meaning: 'CSS プロパティのアニメーション。fadeIn, slideUp, animate 等',
        relatedTermIds: [],
        sourceUrl: 'https://api.jquery.com/category/effects/'
      },
      {
        id: 'jquery-concept-filtering',
        term: 'Filtering',
        termJa: 'フィルタリング',
        characteristicId: 'jquery-char-css-selectors',
        meaning: '選択した要素セットの絞り込み。filter, not, has, eq, first, last 等',
        relatedTermIds: [],
        sourceUrl: 'https://api.jquery.com/category/traversing/filtering/'
      },
      {
        id: 'jquery-concept-deferred',
        term: 'Deferred / Promise',
        termJa: '遅延オブジェクト',
        characteristicId: 'jquery-char-cross-browser',
        meaning: '非同期処理のための Promise パターン実装。$.Deferred() と done/fail/always チェーン',
        relatedTermIds: [],
        sourceUrl: 'https://api.jquery.com/category/deferred-object/'
      },
      {
        id: 'jquery-concept-plugin',
        term: 'Plugin Development',
        termJa: 'プラグイン開発',
        characteristicId: 'jquery-char-plugin-system',
        meaning: '$.fn.extend() でカスタムメソッドを追加するプラグイン開発パターン',
        relatedTermIds: [],
        sourceUrl: ''
      }
    ]

    // jQuery の場合、relatedTermIds は既存バージョン用語との自動マッチングが困難
    // （バージョン用語は個別 API メソッド名で、概念とは粒度が異なる）
    // カテゴリ名でのマッチングを試みる
    return {
      description: 'DOM 操作、イベント処理、AJAX 通信を簡潔に記述するための JavaScript ライブラリ。CSSセレクタベースの要素選択とメソッドチェーンが特徴',
      characteristics,
      concepts
    }
  }
```

**Step 2: スクレイパー実行で確認**

Run: `cd /home/miyaw/dev/lang-version-vocab/scraper && node src/index.js --lang jquery`
Expected: `Found 5 characteristics, 10 concepts` のログが表示。
**注意:** jQuery のスクレイパーは全 API ページをスクレイピングするため時間がかかる（数分）。

**Step 3: コミット**

```bash
cd /home/miyaw/dev/lang-version-vocab
git add scraper/src/scrapers/jquery.js
git commit -m "feat: jQuery スクレイパーに overview 収集を追加"
```

---

### Task 5: 全スクレイパー実行して JSON データを更新

**Files:**
- Update: `data/javascript.json`
- Update: `data/java.json`
- Update: `data/jquery.json`

**Step 1: 全言語のスクレイパーを実行**

Run: `cd /home/miyaw/dev/lang-version-vocab/scraper && node src/index.js`

Expected: 各言語で `Found N characteristics, M concepts` と `Found X terms across Y versions` が表示される。

**Step 2: 生成された JSON を確認**

Run: `cd /home/miyaw/dev/lang-version-vocab && node -e "const d = require('./data/javascript.json'); console.log('JS overview:', !!d.overview, 'chars:', d.overview?.characteristics?.length, 'concepts:', d.overview?.concepts?.length)"`

注意: ESM の場合は `node --input-type=module` を使うか、`cat data/javascript.json | node -e "..."` で確認。
簡易確認: `head -20 data/javascript.json` で `overview` セクションが見えることを確認。

**Step 3: コミット**

```bash
cd /home/miyaw/dev/lang-version-vocab
git add data/javascript.json data/java.json data/jquery.json
git commit -m "feat: 言語概要データ（特性・概念）を追加"
```

---

### Task 6: TabNav コンポーネントを作成

**Files:**
- Create: `app/src/components/TabNav.vue`

**Step 1: TabNav を実装**

`app/src/components/TabNav.vue` を作成:

```vue
<script setup>
defineProps({
  activeTab: { type: String, required: true }
})

const emit = defineEmits(['update:activeTab'])

const tabs = [
  { value: 'overview', label: '言語概要' },
  { value: 'timeline', label: 'バージョン履歴' }
]
</script>

<template>
  <div class="tab-nav">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      class="tab-btn"
      :class="{ active: activeTab === tab.value }"
      @click="emit('update:activeTab', tab.value)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<style scoped>
.tab-nav {
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 0;
}

.tab-btn {
  padding: 10px 20px;
  border: none;
  background: none;
  font-size: 0.95rem;
  font-weight: 600;
  color: #888;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: color 0.2s, border-color 0.2s;
}

.tab-btn:hover {
  color: #555;
}

.tab-btn.active {
  color: #1976d2;
  border-bottom-color: #1976d2;
}
</style>
```

**Step 2: ブラウザで確認**

Run: `cd /home/miyaw/dev/lang-version-vocab/app && npx vite --open`
（この時点ではまだ App.vue に組み込んでいないので、Task 10 で統合時に確認）

**Step 3: コミット**

```bash
cd /home/miyaw/dev/lang-version-vocab
git add app/src/components/TabNav.vue
git commit -m "feat: TabNav コンポーネントを作成"
```

---

### Task 7: CharacteristicCard コンポーネントを作成

**Files:**
- Create: `app/src/components/CharacteristicCard.vue`

**Step 1: CharacteristicCard を実装**

`app/src/components/CharacteristicCard.vue` を作成:

```vue
<script setup>
defineProps({
  item: { type: Object, required: true },
  concepts: { type: Array, default: () => [] }
})

const emit = defineEmits(['scroll-to-concept'])

const relatedConcepts = (item, concepts) => {
  if (!item.relatedConceptIds) return []
  return concepts.filter(c => item.relatedConceptIds.includes(c.id))
}
</script>

<template>
  <div class="char-card">
    <div class="char-header">
      <span class="char-term">{{ item.term }}</span>
    </div>
    <p v-if="item.termJa" class="char-term-ja">{{ item.termJa }}</p>
    <p class="char-meaning">{{ item.meaning }}</p>
    <div v-if="relatedConcepts(item, concepts).length" class="related-concepts">
      <span class="related-label">関連概念:</span>
      <button
        v-for="concept in relatedConcepts(item, concepts)"
        :key="concept.id"
        class="concept-badge"
        @click="emit('scroll-to-concept', concept.id)"
      >
        {{ concept.termJa || concept.term }}
      </button>
    </div>
    <div v-if="item.sourceUrl" class="char-footer">
      <a :href="item.sourceUrl" target="_blank" rel="noopener" class="source-link">Docs</a>
    </div>
  </div>
</template>

<style scoped>
.char-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 8px;
  background: #fff;
  border-left: 3px solid #1976d2;
}

.char-header {
  margin-bottom: 4px;
}

.char-term {
  font-size: 1.05rem;
  font-weight: 700;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.char-term-ja {
  color: #666;
  font-size: 0.9rem;
  margin: 0 0 4px;
}

.char-meaning {
  color: #333;
  margin: 4px 0;
}

.related-concepts {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
}

.related-label {
  font-size: 0.8rem;
  color: #888;
}

.concept-badge {
  font-size: 0.75rem;
  padding: 3px 10px;
  border-radius: 12px;
  background: #e8f5e9;
  color: #2e7d32;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.concept-badge:hover {
  background: #c8e6c9;
}

.char-footer {
  margin-top: 8px;
}

.source-link {
  font-size: 0.8rem;
  color: #1976d2;
  text-decoration: none;
}

.source-link:hover {
  text-decoration: underline;
}
</style>
```

**Step 2: コミット**

```bash
cd /home/miyaw/dev/lang-version-vocab
git add app/src/components/CharacteristicCard.vue
git commit -m "feat: CharacteristicCard コンポーネントを作成"
```

---

### Task 8: ConceptCard コンポーネントを作成

**Files:**
- Create: `app/src/components/ConceptCard.vue`

**Step 1: ConceptCard を実装**

`app/src/components/ConceptCard.vue` を作成:

```vue
<script setup>
defineProps({
  item: { type: Object, required: true },
  characteristics: { type: Array, default: () => [] },
  allTerms: { type: Array, default: () => [] }
})

const emit = defineEmits(['jump-to-term'])

const parentCharacteristic = (item, characteristics) => {
  return characteristics.find(c => c.id === item.characteristicId)
}

const relatedTerms = (item, allTerms) => {
  if (!item.relatedTermIds || !item.relatedTermIds.length) return []
  return allTerms.filter(t => item.relatedTermIds.includes(t.id))
}
</script>

<template>
  <div class="concept-card">
    <div class="concept-header">
      <span class="concept-term">{{ item.term }}</span>
    </div>
    <p v-if="item.termJa" class="concept-term-ja">{{ item.termJa }}</p>
    <p v-if="parentCharacteristic(item, characteristics)" class="concept-parent">
      特性: {{ parentCharacteristic(item, characteristics).termJa || parentCharacteristic(item, characteristics).term }}
    </p>
    <p class="concept-meaning">{{ item.meaning }}</p>
    <div v-if="relatedTerms(item, allTerms).length" class="related-terms">
      <span class="related-label">代表的な文法:</span>
      <button
        v-for="term in relatedTerms(item, allTerms)"
        :key="term.id"
        class="term-link"
        @click="emit('jump-to-term', term.id)"
      >
        {{ term.termJa || term.term }} →
      </button>
    </div>
    <div v-if="item.sourceUrl" class="concept-footer">
      <a :href="item.sourceUrl" target="_blank" rel="noopener" class="source-link">Docs</a>
    </div>
  </div>
</template>

<style scoped>
.concept-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 8px;
  background: #fff;
  border-left: 3px solid #2e7d32;
}

.concept-header {
  margin-bottom: 4px;
}

.concept-term {
  font-size: 1.05rem;
  font-weight: 700;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.concept-term-ja {
  color: #666;
  font-size: 0.9rem;
  margin: 0 0 4px;
}

.concept-parent {
  font-size: 0.8rem;
  color: #1976d2;
  margin: 0 0 4px;
}

.concept-meaning {
  color: #333;
  margin: 4px 0;
}

.related-terms {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
}

.related-label {
  font-size: 0.8rem;
  color: #888;
}

.term-link {
  font-size: 0.75rem;
  padding: 3px 10px;
  border-radius: 12px;
  background: #e3f2fd;
  color: #1565c0;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.term-link:hover {
  background: #bbdefb;
}

.concept-footer {
  margin-top: 8px;
}

.source-link {
  font-size: 0.8rem;
  color: #1976d2;
  text-decoration: none;
}

.source-link:hover {
  text-decoration: underline;
}
</style>
```

**Step 2: コミット**

```bash
cd /home/miyaw/dev/lang-version-vocab
git add app/src/components/ConceptCard.vue
git commit -m "feat: ConceptCard コンポーネントを作成"
```

---

### Task 9: OverviewTab コンポーネントを作成

**Files:**
- Create: `app/src/components/OverviewTab.vue`

**Step 1: OverviewTab を実装**

`app/src/components/OverviewTab.vue` を作成:

```vue
<script setup>
import { ref } from 'vue'
import CharacteristicCard from './CharacteristicCard.vue'
import ConceptCard from './ConceptCard.vue'

const props = defineProps({
  overview: { type: Object, default: null },
  allTerms: { type: Array, default: () => [] }
})

const emit = defineEmits(['jump-to-term'])

const conceptRefs = ref({})

function scrollToConcept(conceptId) {
  const el = document.getElementById(`concept-${conceptId}`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('highlight')
    setTimeout(() => el.classList.remove('highlight'), 2000)
  }
}
</script>

<template>
  <div v-if="overview" class="overview-tab">
    <p v-if="overview.description" class="overview-desc">{{ overview.description }}</p>

    <section v-if="overview.characteristics?.length" class="section">
      <h3 class="section-title">言語特性</h3>
      <CharacteristicCard
        v-for="char in overview.characteristics"
        :key="char.id"
        :item="char"
        :concepts="overview.concepts || []"
        @scroll-to-concept="scrollToConcept"
      />
    </section>

    <section v-if="overview.concepts?.length" class="section">
      <h3 class="section-title">概念</h3>
      <div
        v-for="concept in overview.concepts"
        :key="concept.id"
        :id="`concept-${concept.id}`"
        class="concept-wrapper"
      >
        <ConceptCard
          :item="concept"
          :characteristics="overview.characteristics || []"
          :allTerms="allTerms"
          @jump-to-term="emit('jump-to-term', $event)"
        />
      </div>
    </section>

    <p v-if="!overview.characteristics?.length && !overview.concepts?.length" class="empty">
      概要データがありません
    </p>
  </div>
  <div v-else class="empty">
    <p>この言語の概要データはまだありません</p>
  </div>
</template>

<style scoped>
.overview-tab {
  padding-top: 8px;
}

.overview-desc {
  color: #555;
  margin-bottom: 20px;
  line-height: 1.6;
}

.section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 1rem;
  font-weight: 700;
  color: #555;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.concept-wrapper {
  transition: background 0.3s;
  border-radius: 8px;
}

.concept-wrapper.highlight {
  background: #fff9c4;
}

.empty {
  text-align: center;
  color: #999;
  padding: 40px 0;
}
</style>
```

**Step 2: コミット**

```bash
cd /home/miyaw/dev/lang-version-vocab
git add app/src/components/OverviewTab.vue
git commit -m "feat: OverviewTab コンポーネントを作成"
```

---

### Task 10: App.vue にタブ切替とジャンプ機能を統合

**Files:**
- Modify: `app/src/App.vue`

**Step 1: App.vue を更新**

`app/src/App.vue` を以下の内容に置き換え:

```vue
<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import SearchFilter from './components/SearchFilter.vue'
import TabNav from './components/TabNav.vue'
import OverviewTab from './components/OverviewTab.vue'
import TermList from './components/TermList.vue'

import javascriptData from '@data/javascript.json'
import javaData from '@data/java.json'
import jqueryData from '@data/jquery.json'

const dataMap = {
  javascript: javascriptData,
  java: javaData,
  jquery: jqueryData
}

const languages = Object.entries(dataMap).map(([key, data]) => ({
  value: key,
  label: data.displayName
}))

const searchQuery = ref('')
const selectedType = ref('all')
const selectedLang = ref('javascript')
const langData = ref(dataMap['javascript'])
const activeTab = ref('overview')
const highlightTermId = ref(null)

watch(selectedLang, (newLang) => {
  langData.value = dataMap[newLang]
  searchQuery.value = ''
  selectedType.value = 'all'
  activeTab.value = langData.value.overview ? 'overview' : 'timeline'
  highlightTermId.value = null
})

// overview が無い言語の場合は timeline をデフォルトに
if (!langData.value.overview) {
  activeTab.value = 'timeline'
}

// 全バージョンの用語をフラットリストにする（ConceptCard の relatedTermIds 参照用）
const allTerms = computed(() => {
  if (!langData.value?.versions) return []
  return langData.value.versions.flatMap(v => v.terms)
})

async function jumpToTerm(termId) {
  activeTab.value = 'timeline'
  highlightTermId.value = termId
  await nextTick()
  // TermList の中の該当 TermCard にスクロール
  const el = document.getElementById(`term-${termId}`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('highlight')
    setTimeout(() => {
      el.classList.remove('highlight')
      highlightTermId.value = null
    }, 2000)
  }
}
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>Lang Version Vocab</h1>
    </header>
    <main class="main-content">
      <SearchFilter
        v-model:searchQuery="searchQuery"
        v-model:selectedLang="selectedLang"
        v-model:selectedType="selectedType"
        :languages="languages"
      />
      <TabNav v-model:activeTab="activeTab" />
      <OverviewTab
        v-if="activeTab === 'overview'"
        :overview="langData.overview"
        :allTerms="allTerms"
        @jump-to-term="jumpToTerm"
      />
      <TermList
        v-if="activeTab === 'timeline'"
        :langData="langData"
        :searchQuery="searchQuery"
        :selectedType="selectedType"
      />
    </main>
  </div>
</template>

<style scoped>
.app-header {
  padding: 24px 16px;
  max-width: 720px;
  margin: 0 auto;
}

.app-header h1 {
  font-size: 1.5rem;
  color: #1a1a1a;
}

.main-content {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 16px 32px;
}
</style>
```

**Step 2: ブラウザで確認**

Run: `cd /home/miyaw/dev/lang-version-vocab/app && npx vite --open`
Expected:
- タブが表示される（「言語概要」「バージョン履歴」）
- 「言語概要」タブで特性と概念が表示される
- 概念カードの「文法リンク」クリックでバージョン履歴タブに切替＋スクロール

**Step 3: コミット**

```bash
cd /home/miyaw/dev/lang-version-vocab
git add app/src/App.vue
git commit -m "feat: App.vue にタブ切替とジャンプ機能を統合"
```

---

### Task 11: TermCard に id 属性とハイライトスタイルを追加

**Files:**
- Modify: `app/src/components/TermCard.vue`

**Step 1: TermCard に id 属性を追加**

`app/src/components/TermCard.vue` のテンプレートの `<div class="card">` を変更:

変更前:
```html
<div class="card">
```

変更後:
```html
<div class="card" :id="`term-${item.id}`">
```

**Step 2: ハイライト用スタイルを追加**

`app/src/components/TermCard.vue` の `<style scoped>` 内の末尾に追加:

```css
.card.highlight {
  background: #fff9c4;
  border-color: #fdd835;
  transition: background 0.3s;
}
```

**注意:** `highlight` クラスは `App.vue` の `jumpToTerm` 関数から DOM API で直接追加されるため、Vue の scoped style では `:deep()` が必要な場合がある。代わりに、style を `scoped` から外すか、グローバルスタイルで定義する方法もある。

最もシンプルな方法: `app/src/assets/style.css` の末尾に追加:

```css
.card.highlight {
  background: #fff9c4 !important;
  border-color: #fdd835 !important;
  transition: background 0.3s;
}
```

**Step 3: コミット**

```bash
cd /home/miyaw/dev/lang-version-vocab
git add app/src/components/TermCard.vue app/src/assets/style.css
git commit -m "feat: TermCard にジャンプ用 id とハイライトスタイルを追加"
```

---

### Task 12: ビルドして動作確認

**Files:**
- 変更なし（確認のみ）

**Step 1: アプリをビルド**

Run: `cd /home/miyaw/dev/lang-version-vocab/app && npm run build`
Expected: エラーなくビルド完了

**Step 2: プレビューで動作確認**

Run: `cd /home/miyaw/dev/lang-version-vocab/app && npx vite preview`
Expected:
- タブ切替が動作する
- 各言語の概要が表示される
- 概念の「文法リンク」クリックでバージョン履歴にジャンプする
- 検索・フィルタ機能が引き続き動作する

**Step 3: ビルド成果物をコミット（不要 - dist は .gitignore に含まれるか確認）**

Run: `cat /home/miyaw/dev/lang-version-vocab/.gitignore`
dist が含まれていれば何もしない。含まれていなければ `.gitignore` に追加。

---

### Task 13: リモートにプッシュ

**Step 1: 全変更をプッシュ**

```bash
cd /home/miyaw/dev/lang-version-vocab
git push origin main
```

Expected: GitHub Actions の deploy.yml がトリガーされ、GitHub Pages が更新される。

**Step 2: GitHub Pages で確認**

URL: https://m-miyawaki-m.github.io/lang-version-vocab/
Expected: タブ切替 UI が表示され、全機能が動作する。
