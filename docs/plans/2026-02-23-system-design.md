# 全体設計書: lang-version-vocab

**作成日:** 2026-02-23
**ステータス:** 実装済み（レトロスペクティブ文書）
**要件定義書:** `docs/plans/2026-02-23-requirements.md`

---

## 1. システムアーキテクチャ

### 1.1 全体構成

```
┌─────────────────────────────────────────────────────────┐
│                    GitHub Actions                        │
│                                                         │
│  scrape.yml (毎週月曜)     deploy.yml (push to main)    │
│  ┌───────────────────┐     ┌───────────────────────┐    │
│  │ Scraper 実行       │     │ Vite Build            │    │
│  │ → data/*.json 更新 │     │ → GitHub Pages Deploy │    │
│  │ → auto commit/push │     │                       │    │
│  └───────────────────┘     └───────────────────────┘    │
└─────────────────────────────────────────────────────────┘

┌──────────────┐   JSON    ┌──────────────┐   Static   ┌──────────────┐
│   Scraper    │ ────────→ │  data/*.json │ ────────→ │   Vue App    │
│  (Node.js)   │           │              │  (import)  │  (Vite SPA)  │
│              │           │ javascript   │           │              │
│ - cheerio    │           │ java         │           │ - 3タブUI     │
│ - fetch API  │           │ jquery       │           │ - 検索/フィルタ│
│              │           │              │           │ - ナビゲーション│
└──────────────┘           └──────────────┘           └──────────────┘
  ↑                                                      ↓
  │                                                      │
公式ドキュメント                                     GitHub Pages
(MDN, Oracle, jQuery)                         (/lang-version-vocab/)
```

### 1.2 データフロー

```
1. スクレイパー実行
   公式ドキュメント → HTTP fetch → HTML解析 → JSON生成 → data/*.json

2. ビューア表示
   data/*.json → Vite import → Vue リアクティブ → ブラウザ描画

3. CI/CD
   scrape.yml: cron → scraper → git commit → push (データ更新時のみ)
   deploy.yml: push → vite build → GitHub Pages (mainへのpush時)
```

---

## 2. データモデル

### 2.1 JSON構造

各言語につき1つのJSONファイル（`data/{language}.json`）:

```json
{
  "language": "javascript",
  "displayName": "JavaScript",
  "source": "https://developer.mozilla.org/ja/docs/Web/JavaScript",
  "overview": {
    "description": "言語の概要説明",
    "characteristics": [
      {
        "id": "js-char-dynamic-typing",
        "term": "Dynamic Typing",
        "termJa": "動的型付け",
        "meaning": "説明文",
        "relatedConceptIds": ["js-concept-type-coercion"],
        "sourceUrl": "https://..."
      }
    ],
    "concepts": [
      {
        "id": "js-concept-closure",
        "term": "Closure",
        "termJa": "クロージャ",
        "characteristicId": "js-char-first-class-functions",
        "meaning": "説明文",
        "relatedTermIds": ["js-es2015-arrow-functions"],
        "sourceUrl": "https://..."
      }
    ]
  },
  "versions": [
    {
      "version": "ES2024",
      "releaseDate": "2024-06",
      "terms": [
        {
          "id": "js-es2024-object-group-by",
          "term": "Object.groupBy",
          "termJa": "",
          "type": "api",
          "category": "object",
          "meaning": "説明文",
          "example": "コード例",
          "tags": [],
          "sourceUrl": "https://..."
        }
      ]
    }
  ]
}
```

### 2.2 3層階層

```
Characteristic (特性)
  │ relatedConceptIds ↔ concepts[].id
  ↓
Concept (概念)
  │ characteristicId → characteristics[].id
  │ relatedTermIds → versions[].terms[].id
  ↓
Term (用語)
```

**リンク方向:**
- `characteristics[].relatedConceptIds` → concepts の id（1:N）
- `concepts[].characteristicId` → characteristics の id（N:1）
- `concepts[].relatedTermIds` → versions[].terms の id（N:M）

### 2.3 ID命名規則

| レイヤー | パターン | 例 |
|---|---|---|
| 特性 | `{lang}-char-{slug}` | `js-char-dynamic-typing` |
| 概念 | `{lang}-concept-{slug}` | `js-concept-closure` |
| 用語 | `{lang}-{version}-{slug}` | `js-es2015-arrow-functions` |

### 2.4 用語タイプ

| type | 意味 | カラーコード |
|---|---|---|
| `syntax` | 構文（let, const, async/await） | - |
| `api` | API（Array.from, Promise.allSettled） | - |
| `concept` | 概念的変更（モジュールシステム） | - |
| `deprecation` | 非推奨化 | - |

---

## 3. スクレイパー設計

### 3.1 クラス階層

```
BaseScraper (base.js)
  │ - constructor(language, displayName, sourceUrl)
  │ - scrape(): abstract → versions[]
  │ - scrapeOverview(): optional → overview
  │ - save(versions, overview): JSON書き出し
  │ - run(): scrapeOverview → scrape → save
  │
  ├── JavaScriptScraper (javascript.js)
  │     - scrapeOverview(): MDN JSON APIから特性・概念を取得
  │     - scrape(): MDN リファレンスページからバージョン用語を収集
  │     - データソース: developer.mozilla.org
  │
  ├── JavaScraper (java.js)
  │     - scrapeOverview(): 手動定義の特性・概念を返す
  │     - scrape(): Oracle Docsから機能一覧を収集（フォールバック付き）
  │     - データソース: docs.oracle.com
  │
  └── JqueryScraper (jquery.js)
        - scrapeOverview(): 手動定義の特性・概念を返す
        - scrape(): api.jquery.comからAPIメソッドを収集
        - データソース: api.jquery.com
```

### 3.2 処理フロー

```
BaseScraper.run()
  ├── scrapeOverview()
  │   ├── 特性定義（手動 or API取得）
  │   ├── 概念定義（手動 or API取得）
  │   └── relatedTermIds の設定
  ├── scrape()
  │   ├── バージョン一覧の取得
  │   ├── 各バージョンの用語収集
  │   │   ├── fetchWithRetry(url) ← 最大3回リトライ
  │   │   ├── sleep(200ms) ← レート制限
  │   │   └── parseHTML(html) ← cheerio解析
  │   └── versions[] の構築
  └── save(versions, overview)
      └── data/{language}.json に書き出し
```

### 3.3 ユーティリティ

| ファイル | 関数 | 役割 |
|---|---|---|
| `fetcher.js` | `fetchWithRetry(url, retries, delay)` | リトライ付きHTTP取得（指数バックオフ） |
| `fetcher.js` | `sleep(ms)` | 遅延 |
| `fetcher.js` | `fetchWithDelay(urls, delay)` | バッチ取得 |
| `parser.js` | `parseHTML(html)` | cheerio でHTML解析 |
| `parser.js` | `extractText(el)` | テキスト抽出 |
| `parser.js` | `slugify(text)` | URL安全なスラッグ生成 |
| `parser.js` | `generateId(lang, version, slug)` | 一意ID生成 |

### 3.4 CLIインターフェース

```bash
# 全言語スクレイピング
node src/index.js

# 特定言語のみ
node src/index.js --lang javascript
node src/index.js --lang java
node src/index.js --lang jquery
```

---

## 4. フロントエンド設計

### 4.1 コンポーネントツリー

```
App.vue ─────────────────────── ルート: 状態管理・データ配信・ジャンプ制御
├── SearchFilter.vue ────────── 言語選択・テキスト検索・タイプフィルタ
├── TabNav.vue ──────────────── 3タブ切替（言語概要 / 学習パス / バージョン履歴）
├── OverviewTab.vue ─────────── 言語概要表示
│   ├── CharacteristicCard.vue  特性カード（関連概念バッジ付き）
│   └── ConceptCard.vue ─────── 概念カード（親特性表示 + 用語リンク）
├── LearningPathTab.vue ─────── 学習パス表示（ロードマップ自動生成）
│   └── RoadmapBranch.vue ───── 特性ブランチ（ツリー構造）
│       └── RoadmapNode.vue ─── 個別ノード（レベル色分け）
└── TermList.vue ────────────── バージョン履歴表示
    └── VersionGroup.vue ────── バージョンセクション（タイムラインマーカー）
        └── TermCard.vue ────── 用語カード（詳細情報表示）
```

### 4.2 状態管理（App.vue）

Vue 3 の `ref` / `computed` によるローカル状態管理。外部状態管理ライブラリは不使用。

| 状態 | 型 | 用途 |
|---|---|---|
| `selectedLang` | `ref('javascript')` | 選択中の言語 |
| `searchQuery` | `ref('')` | 検索文字列 |
| `selectedType` | `ref('all')` | タイプフィルタ |
| `activeTab` | `ref('overview')` | アクティブタブ |
| `highlightTermId` | `ref(null)` | ハイライト対象のID |
| `langData` | `ref(dataMap[lang])` | 選択言語のデータ |
| `allTerms` | `computed` | 全バージョン用語のフラットリスト |

### 4.3 タブ間ナビゲーション

3種類のジャンプ関数で、タブをまたいだナビゲーションを実現:

```
jumpToTerm(termId)
  → activeTab = 'timeline'
  → nextTick()
  → document.getElementById('term-{id}')
  → scrollIntoView + highlight animation (2秒)

jumpToConcept(conceptId)
  → activeTab = 'overview'
  → nextTick()
  → document.getElementById('concept-{id}')
  → scrollIntoView + highlight animation (2秒)

jumpToCharacteristic(charId)
  → activeTab = 'overview'
  → nextTick()
  → 特性セクション先頭にスクロール
```

### 4.4 データ読み込み

ビルド時にJSONをインポートし、バンドルに含める:

```javascript
// vite.config.js
resolve: {
  alias: { '@data': resolve(__dirname, '../data') }
}

// App.vue
import javascriptData from '@data/javascript.json'
import javaData from '@data/java.json'
import jqueryData from '@data/jquery.json'
```

### 4.5 学習パス自動生成ロジック

`LearningPathTab.vue` の `computed` で overview データからツリーを構築:

```
入力: overview.characteristics + overview.concepts + allTerms

処理:
1. characteristics をルートノードとして配置
2. concepts を characteristicId で各特性の下に配置
3. terms を relatedTermIds で各概念の下に配置
4. 重複防止: 各用語は最初にマッチした概念にのみ配置（placedTermIds で追跡）

出力:
[
  {
    characteristic: { ...char, level: 'characteristic' },
    concepts: [
      {
        ...concept, level: 'concept',
        terms: [ { ...term, level: 'term' }, ... ]
      },
      ...
    ]
  },
  ...
]
```

### 4.6 スタイリング方針

- CSSフレームワーク不使用。Vue の `<style scoped>` で各コンポーネントにスコープ限定
- グローバルスタイル: `style.css`（リセット、フォント、ハイライトアニメーション）
- カラーパレット:
  - 特性: `#1976d2`（青）
  - 概念: `#2e7d32`（緑）
  - 用語: `#e65100`（オレンジ）
  - アクセント: `#fdd835`（ハイライト黄）
- レイアウト: `max-width: 720px` のシングルカラム

---

## 5. CI/CD設計

### 5.1 スクレイピングワークフロー（scrape.yml）

```yaml
トリガー:
  - cron: '0 3 * * 1'  # 毎週月曜 3:00 UTC
  - workflow_dispatch     # 手動（言語選択可）

ステップ:
  1. actions/checkout@v4
  2. actions/setup-node@v4 (Node.js 20)
  3. npm ci (scraper/)
  4. node src/index.js [--lang {language}]
  5. git diff --quiet || (git add + git commit + git push)

特記:
  - データ変更がない場合はコミットしない（git diff --quiet）
  - GitHub Actions bot アカウントでコミット
```

### 5.2 デプロイワークフロー（deploy.yml）

```yaml
トリガー:
  - push to main

ジョブ1 (build):
  1. actions/checkout@v4
  2. actions/setup-node@v4 (Node.js 20)
  3. npm ci (app/)
  4. npm run build (app/)
  5. actions/upload-pages-artifact (app/dist)

ジョブ2 (deploy):
  1. actions/deploy-pages

環境:
  - github-pages (URL自動設定)
  - permissions: pages write, id-token write
```

### 5.3 ビルド設定

```javascript
// vite.config.js
export default defineConfig({
  base: '/lang-version-vocab/',  // GitHub Pages サブディレクトリ
  plugins: [vue()],
  resolve: {
    alias: { '@data': resolve(__dirname, '../data') }
  }
})
```

---

## 6. 関連設計書

| 文書 | パス | 内容 |
|---|---|---|
| 言語概要機能 設計書 | `docs/plans/2026-02-23-language-overview-design.md` | 特性・概念の3層構造、OverviewTab の設計 |
| 言語概要機能 実装計画 | `docs/plans/2026-02-23-language-overview-plan.md` | スクレイパー変更〜UI統合の13タスク |
| 学習パス機能 設計書 | `docs/plans/2026-02-23-learning-path-design.md` | ロードマップ自動生成、RoadmapNode/Branch の設計 |
| 学習パス機能 実装計画 | `docs/plans/2026-02-23-learning-path-plan.md` | TabNav変更〜LearningPathTab統合の6タスク |
