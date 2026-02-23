# 言語特性・概念・文法 階層構造追加 設計書

**目的:** 言語のバージョン別文法一覧に加え、言語特性 → 概念 → 代表的文法の3層階層を追加し、言語の全体像を把握できるようにする。

**対象言語:** JavaScript, Java, jQuery

---

## 1. データモデル

各言語の JSON に `overview` セクションを追加。既存の `versions` はそのまま維持。

```json
{
  "language": "javascript",
  "displayName": "JavaScript",
  "source": "https://developer.mozilla.org/ja/docs/Web/JavaScript",
  "overview": {
    "description": "プロトタイプベースのマルチパラダイム言語...",
    "characteristics": [
      {
        "id": "js-char-dynamic-typing",
        "term": "Dynamic Typing",
        "termJa": "動的型付け",
        "meaning": "実行時に型が決定される。変数宣言時に型指定不要",
        "relatedConceptIds": ["js-concept-type-coercion"]
      }
    ],
    "concepts": [
      {
        "id": "js-concept-closure",
        "term": "Closure",
        "termJa": "クロージャ",
        "characteristicId": "js-char-first-class-functions",
        "meaning": "外部スコープの変数を参照し続ける関数...",
        "relatedTermIds": ["js-es2015-arrow-function"],
        "sourceUrl": "https://developer.mozilla.org/ja/docs/Web/JavaScript/Closures"
      }
    ]
  },
  "versions": [
    { "version": "ES2024", "releaseDate": "2024-06", "terms": [...] }
  ]
}
```

### ID 命名規則
- 特性: `{lang}-char-{slug}`
- 概念: `{lang}-concept-{slug}`
- バージョン用語: `{lang}-{version}-{slug}`（既存）

### リンク構造
- `characteristics[].relatedConceptIds` → concepts の id
- `concepts[].characteristicId` → characteristics の id
- `concepts[].relatedTermIds` → versions[].terms の id

---

## 2. UI コンポーネント設計

### タブ構成

```
┌──────────────┐ ┌──────────────┐
│ 🔵 言語概要  │ │ ⏳ バージョン履歴│
└──────────────┘ └──────────────┘
```

### 新規・変更コンポーネント

| コンポーネント | 状態 | 役割 |
|---|---|---|
| `App.vue` | 変更 | タブ state 管理、`scrollToTerm` ハンドラ追加 |
| `TabNav.vue` | 新規 | 「言語概要」「バージョン履歴」タブ切替 |
| `OverviewTab.vue` | 新規 | 特性一覧 + 概念一覧を表示 |
| `CharacteristicCard.vue` | 新規 | 特性カード（関連概念バッジ付き） |
| `ConceptCard.vue` | 新規 | 概念カード（特性表示 + 文法リンク付き） |
| `TermList.vue` | 変更 | ref 付与で外部からスクロール先指定可能に |

### ジャンプ機能

```
ConceptCard「Arrow Functions →」クリック
  → emit('jump-to-term', termId)
  → App.vue: activeTab = 'timeline'
  → nextTick → scrollToTerm(termId)
  → TermCard: scrollIntoView + ハイライトアニメーション
```

---

## 3. スクレイパー変更

### 概要データの収集ソース

| 言語 | ソース | 取得方法 |
|---|---|---|
| JavaScript | MDN「JavaScript とは」ページ | `/ja/docs/Web/JavaScript/index.json` + MDN ガイドページ群 |
| Java | Oracle Java 言語仕様ページ | 言語仕様ページから特性取得 |
| jQuery | api.jquery.com | カテゴリ一覧から概念分類 |

### スクレイパー変更ファイル

```
scraper/src/scrapers/
  base.js       ← overview セクション対応の save()
  javascript.js ← scrapeOverview() メソッド追加
  java.js       ← scrapeOverview() メソッド追加
  jquery.js     ← scrapeOverview() メソッド追加
```

### 処理フロー

```
BaseScraper.run()
  ├── scrapeOverview()   ← 新規: 特性・概念を収集
  │   ├── 公式ドキュメントから特性一覧を取得
  │   ├── 各概念ページから説明を取得
  │   └── relatedTermIds は既存 versions データの id と照合
  ├── scrape()           ← 既存: バージョン別用語収集（変更なし）
  └── save()             ← overview + versions を統合して保存
```

### relatedTermIds の自動マッピング

概念と既存バージョン用語の紐付け：キーワードマッチ + category 照合。マッチしない場合は空配列。
