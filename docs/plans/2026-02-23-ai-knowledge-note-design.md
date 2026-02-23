# 設計書: ai-knowledge-note

**作成日:** 2026-02-23
**ステータス:** 承認済み
**プロジェクト:** AI関連情報に特化したナレッジノート

---

## 1. 概要

### 1.1 目的

AI関連の用語・概念を体系的に整理し、学習パス形式で閲覧できるWebアプリケーション。

### 1.2 フェーズ計画

| Phase | 内容 |
|---|---|
| Phase 1（本設計） | AI用語・概念の辞書（手動JSON + ビューア） |
| Phase 2 | AIモデル/サービスの変遷タイムライン |
| Phase 3 | AI論文・ニュースの自動収集 |
| Phase 4 | AIツール・ライブラリのカタログ |

### 1.3 技術スタック

- Vue 3 + Vite（ビューア）
- Node.js（データ収集、将来用）
- GitHub Actions（CI/CD）
- GitHub Pages（ホスティング）

### 1.4 アプローチ

`lang-version-vocab` プロジェクトの完全クローン型。構造・パターンを再利用し、データモデルをAI用語向けに再設計。

---

## 2. プロジェクト構造

```
ai-knowledge-note/
├── app/                    # ビューア（Vue 3 + Vite）
│   ├── src/
│   │   ├── components/     # UI コンポーネント
│   │   ├── assets/
│   │   ├── App.vue
│   │   └── main.js
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── collector/              # データ収集（手動JSON + 将来のスクレイパー）
│   ├── src/
│   │   ├── scrapers/       # 自動収集（将来拡張用）
│   │   ├── utils/
│   │   └── index.js
│   └── package.json
├── data/                   # AI用語データ（カテゴリ別JSON）
│   ├── foundations.json    # 基礎理論
│   ├── architectures.json  # モデルアーキテクチャ
│   ├── training.json       # 学習手法
│   ├── applications.json   # アプリケーション
│   └── tools.json          # インフラ・ツール
├── docs/plans/             # 設計書
├── .github/workflows/
│   ├── deploy.yml          # GitHub Pages デプロイ
│   └── collect.yml         # データ収集（将来用、手動トリガーのみ）
├── CLAUDE.md
└── .gitignore
```

---

## 3. データモデル

### 3.1 カテゴリ（JSONファイル単位）

| ファイル | カテゴリ | 内容例 |
|---|---|---|
| `foundations.json` | 基礎理論 | 確率・統計、線形代数、最適化理論 |
| `architectures.json` | モデルアーキテクチャ | Transformer, CNN, RNN, Diffusion |
| `training.json` | 学習手法 | SGD, LoRA, RLHF, 蒸留 |
| `applications.json` | アプリケーション | RAG, Agent, CoT, Embedding |
| `tools.json` | インフラ・ツール | PyTorch, HuggingFace, LangChain |

### 3.2 JSON構造

```json
{
  "category": "architectures",
  "displayName": "モデルアーキテクチャ",
  "description": "AIモデルの構造設計に関する用語",
  "topics": [
    {
      "id": "arch-topic-transformer",
      "term": "Transformer",
      "termJa": "トランスフォーマー",
      "meaning": "Self-Attentionを用いた系列変換モデル...",
      "relatedConceptIds": ["arch-concept-self-attention"],
      "sourceUrl": "https://..."
    }
  ],
  "concepts": [
    {
      "id": "arch-concept-self-attention",
      "term": "Self-Attention",
      "termJa": "自己注意機構",
      "topicId": "arch-topic-transformer",
      "meaning": "入力系列内の各要素が他の要素との関連度を計算する機構...",
      "relatedTermIds": ["arch-term-multi-head-attention"],
      "sourceUrl": "https://..."
    }
  ],
  "terms": [
    {
      "id": "arch-term-multi-head-attention",
      "term": "Multi-Head Attention",
      "termJa": "マルチヘッドアテンション",
      "meaning": "複数のAttentionヘッドを並列実行し...",
      "type": "technique",
      "tags": ["transformer", "attention"],
      "sourceUrl": "https://..."
    }
  ]
}
```

### 3.3 3層構造

```
Topic（トピック）— 大きなテーマ（例: Transformer）
  │ relatedConceptIds ↔ concepts[].id
  ↓
Concept（概念）— トピック配下の核となる概念（例: Self-Attention）
  │ topicId → topics[].id
  │ relatedTermIds → terms[].id
  ↓
Term（用語）— 具体的な手法・技術（例: Multi-Head Attention）
```

### 3.4 ID命名規則

| レイヤー | パターン | 例 |
|---|---|---|
| トピック | `{cat}-topic-{slug}` | `arch-topic-transformer` |
| 概念 | `{cat}-concept-{slug}` | `arch-concept-self-attention` |
| 用語 | `{cat}-term-{slug}` | `arch-term-multi-head-attention` |

### 3.5 用語タイプ

| type | 意味 |
|---|---|
| `theory` | 理論・定理 |
| `technique` | 手法・アルゴリズム |
| `model` | 具体的なモデル |
| `metric` | 評価指標 |
| `tool` | ツール・ライブラリ |

---

## 4. フロントエンド設計

### 4.1 コンポーネントツリー

```
App.vue ─────────────────── ルート: 状態管理・カテゴリ切替・ジャンプ制御
├── SearchFilter.vue ────── カテゴリ選択・テキスト検索・タイプフィルタ
├── TabNav.vue ──────────── 2タブ切替（用語辞書 / 学習パス）
├── GlossaryTab.vue ─────── 用語辞書（メインビュー）
│   ├── TopicCard.vue ────── トピックカード（折りたたみ可能）
│   ├── ConceptCard.vue ──── 概念カード（トピック配下）
│   └── TermCard.vue ─────── 用語カード（詳細表示）
└── LearningPathTab.vue ─── 学習パス（Topic→Concept→Term のツリー表示）
    └── RoadmapBranch.vue ── ツリーブランチ
        └── RoadmapNode.vue  個別ノード
```

### 4.2 状態管理（App.vue）

Vue 3 の `ref` / `computed` によるローカル状態管理。外部ライブラリ不使用。

| 状態 | 型 | 用途 |
|---|---|---|
| `selectedCategory` | `ref('architectures')` | 選択中のカテゴリ |
| `searchQuery` | `ref('')` | 検索文字列 |
| `selectedType` | `ref('all')` | タイプフィルタ |
| `activeTab` | `ref('glossary')` | アクティブタブ |
| `highlightId` | `ref(null)` | ハイライト対象のID |

### 4.3 タブ間ナビゲーション

```
jumpToTerm(termId)
  → activeTab = 'glossary'
  → nextTick()
  → document.getElementById('term-{id}')
  → scrollIntoView + highlight animation (2秒)

jumpToConcept(conceptId)
  → activeTab = 'glossary'
  → nextTick()
  → document.getElementById('concept-{id}')
  → scrollIntoView + highlight animation (2秒)
```

### 4.4 データ読み込み

ビルド時にJSONをインポート:

```javascript
// vite.config.js
resolve: {
  alias: { '@data': resolve(__dirname, '../data') }
}

// App.vue
import architecturesData from '@data/architectures.json'
import foundationsData from '@data/foundations.json'
// ...
```

### 4.5 スタイリング

- CSSフレームワーク不使用。`<style scoped>` でスコープ限定
- グローバルスタイル: `style.css`
- カラーパレット:
  - トピック: `#6a1b9a`（紫）
  - 概念: `#00838f`（ティール）
  - 用語: `#e65100`（オレンジ）
  - アクセント: `#fdd835`（ハイライト黄）
- レイアウト: `max-width: 720px` のシングルカラム

---

## 5. CI/CD設計

### 5.1 deploy.yml

```yaml
トリガー: push to main
ジョブ:
  build:
    1. actions/checkout@v4
    2. actions/setup-node@v4 (Node.js 20)
    3. npm ci (app/)
    4. npm run build (app/)
    5. actions/upload-pages-artifact (app/dist)
  deploy:
    1. actions/deploy-pages
```

### 5.2 collect.yml（将来用）

```yaml
トリガー: workflow_dispatch（手動のみ）
ジョブ:
  1. checkout → setup-node → npm ci (collector/)
  2. node src/index.js
  3. git diff --quiet || (git add + git commit + git push)
```

---

## 6. 初期データ

Phase 1 では `architectures.json` にサンプルデータを5-10個手動で作成。

サンプル:
- Topic: Transformer, CNN
- Concept: Self-Attention, Convolution
- Term: Multi-Head Attention, Positional Encoding, Pooling
