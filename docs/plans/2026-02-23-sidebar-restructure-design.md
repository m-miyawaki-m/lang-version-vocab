# サイドバー3大分類リストラクチャ 設計書

**作成日:** 2026-02-23
**目的:** サイドバーの「特性→概念→用語」という抽象的な3階層構造を、「言語の特徴」「基本構文」「標準API」の直感的な3大分類に再構成する。

---

## 1. 現状の問題

1. **言語仕様との区別が不明確** — 特性/概念と specification が別セクションだが、どちらも「言語の知識」で区別しにくい
2. **用語との紐付けが不自然** — 概念の下にバージョン固有用語がぶら下がる構造が不自然
3. **ラベルが抽象的** — 「特性」「概念」という分類名が直感的でない

---

## 2. 新しいサイドバー構造

```
[JavaScript ▼]

───── 言語の特徴 ─────
  動的型付け
  プロトタイプベースOOP
  第一級関数
  イベント駆動
  クロージャ
  スコープ
  ...

───── 基本構文 ─────
  データ型
  演算子
  制御構文
  関数
  エラー処理

───── 標準API ─────
  Math
  Date
  RegExp
  JSON
```

### セクション定義

| セクション | ラベル | 内容 | データソース |
|---|---|---|---|
| 言語の特徴 | `言語の特徴` | 特性 + 概念をフラットに並べる | `overview.characteristics` + `overview.concepts` |
| 基本構文 | `基本構文` | 構文系 specification カテゴリ | `specification.categories` のうち `group: 'syntax'` |
| 標準API | `標準API` | API系 specification カテゴリ | `specification.categories` のうち `group: 'api'` |

### 各項目の表示

- 全セクション同じスタイル（フラットなリスト、ドットインジケータ）
- 折りたたみ不要（各セクション内はフラットリスト）
- 基本構文/標準APIはカテゴリ名を表示。クリックで詳細パネルに項目一覧を表示

---

## 3. 削除する機能

1. **バージョン用語のツリー表示** — 概念の下にぶら下がる用語を削除。タイムラインタブで閲覧
2. **初心者/経験者モード** — 用語削除により不要。モード切替UIを削除
3. **折りたたみ** — フラットリストになるため、特性の折りたたみ機能を削除

---

## 4. specification カテゴリの分類

各カテゴリに `group` フィールドを追加:

### JavaScript

| カテゴリ | group |
|---|---|
| Data Types | syntax |
| Operators | syntax |
| Control Flow | syntax |
| Functions | syntax |
| Error Handling | syntax |
| Built-in Objects | api |

### Java

| カテゴリ | group |
|---|---|
| Primitive Types | syntax |
| Control Flow | syntax |
| OOP Basics | syntax |
| Access Modifiers | syntax |
| Exception Handling | syntax |
| Collections | api |
| I/O & Streams | api |

### jQuery

| カテゴリ | group |
|---|---|
| Selectors | syntax |
| DOM Manipulation | syntax |
| Traversal | syntax |
| Events | syntax |
| Effects | api |
| AJAX | api |
| Utilities | api |

---

## 5. 詳細パネル

クリック動作は現状維持:

- **言語の特徴（旧 特性）クリック** — meaning + 関連する概念リスト（概念のみ、用語リンクは削除）
- **言語の特徴（旧 概念）クリック** — meaning + 親特性リンク
- **基本構文カテゴリクリック** — カテゴリ名 + 含まれる項目一覧
- **標準APIカテゴリクリック** — 同上
- **基本構文/標準APIアイテムクリック** — meaning + コード例 + ドキュメントリンク

---

## 6. コンポーネント変更一覧

| コンポーネント | 変更内容 |
|---|---|
| `scraper/src/scrapers/javascript.js` | specification カテゴリに `group` フィールド追加 |
| `scraper/src/scrapers/java.js` | 同上 |
| `scraper/src/scrapers/jquery.js` | 同上 |
| `app/src/components/LearningPathSidebar.vue` | 3大分類構造に書き換え、モード切替・折りたたみ・用語表示を削除 |
| `app/src/components/NodeDetailPanel.vue` | 用語リンク（概念→用語）を削除 |
