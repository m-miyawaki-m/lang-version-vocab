# 言語仕様（specification）セクション追加 設計書

**作成日:** 2026-02-23
**目的:** バージョン固有の新機能だけでなく、言語の基本構文・組み込み型・標準APIなどバージョンに依存しない言語仕様を `specification` セクションとしてデータモデルに追加する。

---

## 1. データモデル

### JSON 構造

既存の `overview` / `versions` と並列に `specification` セクションを追加:

```json
{
  "language": "javascript",
  "displayName": "JavaScript",
  "source": "...",
  "overview": { ... },
  "specification": {
    "categories": [
      {
        "id": "js-spec-data-types",
        "name": "Data Types",
        "nameJa": "データ型",
        "items": [
          {
            "id": "js-spec-number",
            "term": "Number",
            "termJa": "数値型",
            "meaning": "IEEE 754 倍精度浮動小数点数。整数と小数の区別なし",
            "example": "const n = 42;\nconst pi = 3.14;",
            "sourceUrl": "https://developer.mozilla.org/ja/docs/Web/JavaScript/Data_structures#number_%E5%9E%8B"
          }
        ]
      }
    ]
  },
  "versions": [ ... ]
}
```

### ID 命名規則

- カテゴリ: `{lang}-spec-{slug}`（例: `js-spec-data-types`）
- アイテム: `{lang}-spec-{slug}`（例: `js-spec-number`）

### フィールド定義

**カテゴリ:**

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `id` | string | Yes | 一意識別子 |
| `name` | string | Yes | 英語名 |
| `nameJa` | string | Yes | 日本語名 |
| `items` | array | Yes | カテゴリ内アイテム |

**アイテム:**

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `id` | string | Yes | 一意識別子 |
| `term` | string | Yes | 英語名 |
| `termJa` | string | No | 日本語名 |
| `meaning` | string | Yes | 説明文 |
| `example` | string | No | コード例 |
| `sourceUrl` | string | No | ドキュメントURL |

---

## 2. 想定カテゴリ

### JavaScript

| カテゴリ | アイテム例 |
|---|---|
| Data Types（データ型） | Number, String, Boolean, null, undefined, Symbol, BigInt, Object, Array |
| Operators（演算子） | 算術, 比較, 論理, ビット, 代入, 三項, typeof, instanceof |
| Control Flow（制御構文） | if/else, switch, for, while, do-while, for...in, for...of, break, continue |
| Functions（関数） | function宣言, function式, デフォルト引数, rest引数, arguments |
| Objects & Prototypes（オブジェクト） | Object, Property, Getter/Setter, Prototype |
| Error Handling（エラー処理） | try/catch/finally, throw, Error型 |
| Built-in Objects（組み込みオブジェクト） | Array, String, Math, Date, RegExp, JSON, Map, Set |

### Java

| カテゴリ | アイテム例 |
|---|---|
| Primitive Types（基本型） | int, long, double, float, boolean, char, byte, short |
| Control Flow（制御構文） | if/else, switch, for, while, do-while, for-each, break, continue |
| OOP Basics（OOP基礎） | class, interface, abstract, extends, implements |
| Access Modifiers（アクセス修飾子） | public, private, protected, default |
| Exception Handling（例外処理） | try/catch/finally, throws, throw |
| Collections（コレクション） | List, Set, Map, Queue, Iterator |
| I/O & Streams（入出力） | InputStream, OutputStream, Reader, Writer |

### jQuery

| カテゴリ | アイテム例 |
|---|---|
| Selectors（セレクタ） | ID, Class, Element, Attribute, :first, :last, :eq() |
| DOM Manipulation（DOM操作） | .html(), .text(), .val(), .append(), .prepend(), .remove() |
| Traversal（走査） | .find(), .children(), .parent(), .siblings(), .closest() |
| Events（イベント） | .on(), .off(), .trigger(), .click(), .ready() |
| Effects（エフェクト） | .show(), .hide(), .fadeIn(), .slideUp(), .animate() |
| AJAX（通信） | $.ajax(), $.get(), $.post(), $.getJSON() |
| Utilities（ユーティリティ） | $.each(), $.extend(), $.isArray(), $.trim() |

---

## 3. スクレイパー変更

### BaseScraper

`scrapeSpecification()` メソッドを追加。`save()` で specification を JSON に含める。

```
BaseScraper.run()
  ├── scrapeOverview()
  ├── scrapeSpecification()  ← 新規
  ├── scrape()
  └── save(versions, overview, specification)
```

### 各言語スクレイパー

MDN / Oracle Docs / jQuery API から基本仕様を収集。フォールバック用に手動定義のデータも用意。

---

## 4. サイドバー変更

ツリーに specification カテゴリを追加:

```
▼ ● 動的型付け          ← overview: 特性
  │ ○ 型変換            ← overview: 概念
  │   · let / const     ← versions: 用語
▼ ● 第一級関数
  │ ○ クロージャ
───── 言語仕様 ─────     ← 区切り
▼ ■ データ型            ← specification: カテゴリ
  │ Number              ← specification: アイテム
  │ String
▼ ■ 制御構文
  │ if/else
  │ for
```

- 特性ツリーと仕様カテゴリは区切り線で分離
- カテゴリは `■`（四角ドット）で視覚的に区別
- 折りたたみ/展開可能
- クリックで右側に詳細パネル表示（既存と同じ動作）

---

## 5. NodeDetailPanel 変更

新しい level `spec-category` と `spec-item` を追加:

**カテゴリ選択時:**
- カテゴリ名（英語 + 日本語）
- 含まれるアイテムの一覧

**アイテム選択時:**
- アイテム名（英語 + 日本語）
- 所属カテゴリ
- meaning（説明文）
- コード例（あれば）
- ソースURL

---

## 6. コンポーネント変更一覧

| コンポーネント | 変更内容 |
|---|---|
| `scraper/src/scrapers/base.js` | `scrapeSpecification()` 追加、`save()` に specification 引数追加 |
| `scraper/src/scrapers/javascript.js` | `scrapeSpecification()` 実装 |
| `scraper/src/scrapers/java.js` | `scrapeSpecification()` 実装 |
| `scraper/src/scrapers/jquery.js` | `scrapeSpecification()` 実装 |
| `app/src/components/LearningPathSidebar.vue` | specification カテゴリのツリー表示追加 |
| `app/src/components/NodeDetailPanel.vue` | spec-category / spec-item の詳細表示追加 |
| `app/src/App.vue` | specification データの受け渡し追加 |
