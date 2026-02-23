# 言語仕様（specification）セクション追加 実装計画

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 各言語のJSONデータに `specification` セクションを追加し、バージョン非依存の基本構文・組み込み型・標準APIをカテゴリ別に格納。サイドバーとNodeDetailPanelでも表示可能にする。

**Architecture:** BaseScraper に `scrapeSpecification()` を追加し、各言語スクレイパーで手動定義データを返す。フロントエンドは LearningPathSidebar に仕様カテゴリのツリーを追加し、NodeDetailPanel に `spec-category` / `spec-item` レベルの詳細表示を追加する。

**Tech Stack:** Node.js + cheerio（スクレイパー）、Vue 3 + Vite（フロントエンド）

**設計書:** `docs/plans/2026-02-23-specification-section-design.md`

---

### Task 1: BaseScraper に scrapeSpecification() 対応を追加

**Files:**
- Modify: `scraper/src/scrapers/base.js`

**Step 1: scrapeSpecification() メソッドと save() の specification 引数を追加**

`scraper/src/scrapers/base.js` を以下に置き換え:

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
```

**Step 2: 動作確認**

Run: `cd /home/m-miyawaki/dev/lang-version-vocab/scraper && node -e "import('./src/scrapers/base.js').then(m => console.log('OK'))"`
Expected: `OK`

**Step 3: コミット**

```bash
cd /home/m-miyawaki/dev/lang-version-vocab
git add scraper/src/scrapers/base.js
git commit -m "feat: BaseScraper に scrapeSpecification() と specification 対応 save() を追加"
```

---

### Task 2: JavaScript スクレイパーに specification を追加

**Files:**
- Modify: `scraper/src/scrapers/javascript.js`

**Step 1: scrapeSpecification() を実装**

`scraper/src/scrapers/javascript.js` の `JavaScriptScraper` クラスに、`scrapeOverview()` の後に以下を追加:

```javascript
  async scrapeSpecification() {
    console.log('Building JavaScript specification...')

    return {
      categories: [
        {
          id: 'js-spec-data-types',
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
```

**Step 2: スクレイパー実行**

Run: `cd /home/m-miyawaki/dev/lang-version-vocab/scraper && node src/index.js --lang javascript`
Expected: `Found N spec items across 6 categories` のログが表示される

**Step 3: コミット**

```bash
cd /home/m-miyawaki/dev/lang-version-vocab
git add scraper/src/scrapers/javascript.js data/javascript.json
git commit -m "feat: JavaScript スクレイパーに specification データを追加"
```

---

### Task 3: Java スクレイパーに specification を追加

**Files:**
- Modify: `scraper/src/scrapers/java.js`

**Step 1: scrapeSpecification() を実装**

`scraper/src/scrapers/java.js` の `JavaScraper` クラスに `scrapeSpecification()` メソッドを追加。手動定義データとして Primitive Types、Control Flow、OOP Basics、Access Modifiers、Exception Handling、Collections、I/O の7カテゴリを返す。

※コード量が多いため、JavaScript と同構造で Java 固有の内容を定義。

**Step 2: スクレイパー実行・コミット**

---

### Task 4: jQuery スクレイパーに specification を追加

**Files:**
- Modify: `scraper/src/scrapers/jquery.js`

**Step 1: scrapeSpecification() を実装**

jQuery 固有のカテゴリ: Selectors、DOM Manipulation、Traversal、Events、Effects、AJAX、Utilities の7カテゴリ。

**Step 2: スクレイパー実行・コミット**

---

### Task 5: LearningPathSidebar に specification ツリーを追加

**Files:**
- Modify: `app/src/components/LearningPathSidebar.vue`

**Step 1: props に specification を追加**

props に `specification` を追加:

```javascript
const props = defineProps({
  overview: { type: Object, default: null },
  specification: { type: Object, default: null },
  allTerms: { type: Array, default: () => [] },
  selectedLang: { type: String, default: 'javascript' },
  languages: { type: Array, default: () => [] },
  selectedNodeId: { type: String, default: null }
})
```

**Step 2: 折りたたみ状態を追加**

```javascript
const collapsedSpecs = ref(new Set())

function toggleSpecCollapse(catId) {
  const next = new Set(collapsedSpecs.value)
  if (next.has(catId)) next.delete(catId)
  else next.add(catId)
  collapsedSpecs.value = next
}

function isSpecCollapsed(catId) {
  return collapsedSpecs.value.has(catId)
}
```

**Step 3: テンプレートの `</ul>` の後（`.tree-root` 閉じタグの後）に仕様セクションを追加**

```html
      <!-- 言語仕様 -->
      <template v-if="specification?.categories?.length">
        <div class="spec-divider">
          <span class="spec-divider-label">言語仕様</span>
        </div>
        <ul class="tree-root">
          <li v-for="cat in specification.categories" :key="cat.id" class="tree-branch">
            <div
              class="tree-item spec-cat-item"
              :class="{ active: selectedNodeId === cat.id }"
            >
              <button
                class="collapse-toggle"
                @click.stop="toggleSpecCollapse(cat.id)"
              >
                <span class="collapse-icon">{{ isSpecCollapsed(cat.id) ? '▶' : '▼' }}</span>
              </button>
              <span class="dot dot-spec-cat"></span>
              <button
                class="tree-label spec-cat-label"
                @click="selectNode(cat, 'spec-category')"
              >
                {{ cat.nameJa || cat.name }}
              </button>
            </div>
            <ul
              v-if="!isSpecCollapsed(cat.id) && cat.items.length"
              class="tree-children"
            >
              <li v-for="item in cat.items" :key="item.id">
                <div
                  class="tree-item spec-item"
                  :class="{ active: selectedNodeId === item.id }"
                >
                  <span class="dot dot-spec"></span>
                  <button
                    class="tree-label spec-label"
                    @click="selectNode(item, 'spec-item')"
                  >
                    {{ item.termJa || item.term }}
                  </button>
                </div>
              </li>
            </ul>
          </li>
        </ul>
      </template>
```

**Step 4: スタイルを追加**

```css
.spec-divider {
  margin: 16px 12px 8px;
  border-top: 1px solid #ddd;
  padding-top: 8px;
}

.spec-divider-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.dot-spec-cat {
  background: #7b1fa2;
}

.dot-spec {
  background: #9c27b0;
  width: 5px;
  height: 5px;
}

.spec-cat-label {
  font-weight: 700;
  font-size: 0.85rem;
  color: #1a1a1a;
}

.spec-label {
  font-weight: 400;
  font-size: 0.78rem;
  color: #666;
}
```

**Step 5: コミット**

```bash
cd /home/m-miyawaki/dev/lang-version-vocab
git add app/src/components/LearningPathSidebar.vue
git commit -m "feat: サイドバーに specification カテゴリのツリーを追加"
```

---

### Task 6: NodeDetailPanel に spec-category / spec-item 表示を追加

**Files:**
- Modify: `app/src/components/NodeDetailPanel.vue`

**Step 1: levelConfig に新レベルを追加**

```javascript
const levelConfig = {
  characteristic: { icon: '📘', label: '基礎', color: '#1976d2', bg: '#e3f2fd' },
  concept: { icon: '📗', label: '中級', color: '#2e7d32', bg: '#e8f5e9' },
  term: { icon: '📙', label: '実践', color: '#e65100', bg: '#fff3e0' },
  'spec-category': { icon: '📂', label: '仕様', color: '#7b1fa2', bg: '#f3e5f5' },
  'spec-item': { icon: '📄', label: '仕様', color: '#9c27b0', bg: '#f3e5f5' }
}
```

**Step 2: props に specification を追加**

```javascript
const props = defineProps({
  node: { type: Object, required: true },
  overview: { type: Object, default: null },
  allTerms: { type: Array, default: () => [] },
  versions: { type: Array, default: () => [] },
  specification: { type: Object, default: null }
})
```

**Step 3: ヘルパー関数を追加**

```javascript
function getSpecCategoryItems() {
  if (props.node.level !== 'spec-category') return []
  return props.node.items || []
}

function getParentCategory() {
  if (props.node.level !== 'spec-item') return null
  if (!props.specification?.categories) return null
  return props.specification.categories.find(c =>
    c.items.some(item => item.id === props.node.id)
  )
}
```

**Step 4: テンプレートに spec-category / spec-item セクションを追加**

`<!-- 用語の詳細 -->` の `</template>` の後に追加:

```html
    <!-- 仕様カテゴリの詳細 -->
    <template v-if="node.level === 'spec-category'">
      <div v-if="getSpecCategoryItems().length" class="detail-section">
        <h3 class="section-label">含まれる項目（{{ getSpecCategoryItems().length }}件）</h3>
        <div class="related-list">
          <button
            v-for="item in getSpecCategoryItems()"
            :key="item.id"
            class="related-item"
            @click="navigateTo(item, 'spec-item')"
          >
            <span class="related-icon">📄</span>
            <div class="related-info">
              <span class="related-name">{{ item.termJa || item.term }}</span>
              <span v-if="item.termJa" class="related-sub">{{ item.term }}</span>
            </div>
          </button>
        </div>
      </div>
    </template>

    <!-- 仕様アイテムの詳細 -->
    <template v-if="node.level === 'spec-item'">
      <div v-if="getParentCategory()" class="detail-section">
        <span class="parent-label">カテゴリ:</span>
        <button class="parent-link" @click="navigateTo(getParentCategory(), 'spec-category')">
          📂 {{ getParentCategory().nameJa || getParentCategory().name }}
        </button>
      </div>
      <div class="detail-section">
        <p class="detail-meaning">{{ node.meaning }}</p>
      </div>
      <div v-if="node.example" class="detail-section">
        <h3 class="section-label">コード例</h3>
        <pre class="code-example"><code>{{ node.example }}</code></pre>
      </div>
      <div v-if="node.sourceUrl" class="detail-section">
        <a :href="node.sourceUrl" target="_blank" rel="noopener" class="docs-link">ドキュメントを見る</a>
      </div>
    </template>
```

**Step 5: コミット**

```bash
cd /home/m-miyawaki/dev/lang-version-vocab
git add app/src/components/NodeDetailPanel.vue
git commit -m "feat: NodeDetailPanel に spec-category / spec-item 表示を追加"
```

---

### Task 7: App.vue に specification データの受け渡しを追加

**Files:**
- Modify: `app/src/App.vue`

**Step 1: LearningPathSidebar に :specification を追加**

```html
      <LearningPathSidebar
        :overview="langData.overview"
        :specification="langData.specification"
        :allTerms="allTerms"
        :selectedLang="selectedLang"
        :languages="languages"
        :selectedNodeId="selectedNode?.id || null"
        @update:selectedLang="selectedLang = $event"
        @select-node="handleSelectNode"
      />
```

**Step 2: NodeDetailPanel に :specification を追加**

```html
          <NodeDetailPanel
            :node="selectedNode"
            :overview="langData.overview"
            :allTerms="allTerms"
            :versions="langData.versions || []"
            :specification="langData.specification"
            @close="closeDetail"
            @select-node="handleSelectNode"
          />
```

**Step 3: ビルド確認**

Run: `cd /home/m-miyawaki/dev/lang-version-vocab/app && npx vite build 2>&1 | tail -5`
Expected: ビルド成功

**Step 4: コミット**

```bash
cd /home/m-miyawaki/dev/lang-version-vocab
git add app/src/App.vue
git commit -m "feat: App.vue に specification データの受け渡しを追加"
```

---

### Task 8: 全スクレイパー実行・ビルド・動作確認

**Files:**
- Update: `data/javascript.json`, `data/java.json`, `data/jquery.json`

**Step 1: 全言語スクレイパー実行**

Run: `cd /home/m-miyawaki/dev/lang-version-vocab/scraper && node src/index.js`
Expected: 各言語で `Found N spec items across M categories` ログが出力

**Step 2: ビルド**

Run: `cd /home/m-miyawaki/dev/lang-version-vocab/app && npm run build`
Expected: ビルド成功

**Step 3: 動作確認**

Run: `cd /home/m-miyawaki/dev/lang-version-vocab/app && npx vite --open`

確認項目:
1. サイドバーに「言語仕様」区切り線が表示される
2. 区切り線の下にカテゴリ（データ型、演算子等）がツリー表示される
3. カテゴリの折りたたみ/展開が動作する
4. カテゴリクリックで右側に含まれるアイテム一覧が表示される
5. アイテムクリックで詳細（meaning, コード例, sourceUrl）が表示される
6. 詳細パネルの「カテゴリ:」リンクで親カテゴリに戻れる
7. 各言語切替で仕様カテゴリが更新される

**Step 4: データファイルをコミット**

```bash
cd /home/m-miyawaki/dev/lang-version-vocab
git add data/
git commit -m "feat: 全言語の specification データを更新"
```
