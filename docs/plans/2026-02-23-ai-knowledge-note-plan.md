# AI Knowledge Note 実装計画

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** AI用語・概念を体系的に整理し、学習パス形式で閲覧できるVue 3 SPAを新規プロジェクトとして構築する。

**Architecture:** `lang-version-vocab` プロジェクトのクローン型。`data/*.json`（手動編集）→ Vite import → Vue 3 SPA。GitHub Actions で GitHub Pages にデプロイ。

**Tech Stack:** Vue 3, Vite 7, Node.js 20, GitHub Actions, GitHub Pages

**設計書:** `docs/plans/2026-02-23-ai-knowledge-note-design.md`

---

### Task 1: プロジェクト初期化

**Files:**
- Create: `~/dev/ai-knowledge-note/`（ディレクトリ）
- Create: `~/dev/ai-knowledge-note/.gitignore`
- Create: `~/dev/ai-knowledge-note/CLAUDE.md`

**Step 1: ディレクトリ作成と git init**

```bash
mkdir -p ~/dev/ai-knowledge-note
cd ~/dev/ai-knowledge-note
git init
```

**Step 2: .gitignore を作成**

```
node_modules/
dist/
.DS_Store
*.log
```

**Step 3: CLAUDE.md を作成**

```markdown
# Project: ai-knowledge-note

## Overview
AI関連の用語・概念を体系的に整理し、学習パス形式で閲覧できるツール。

## Directory Structure
- `app/` - ビューア（Vue 3 + Vite）
- `collector/` - データ収集（Node.js、将来用）
- `data/` - AI用語データ（カテゴリ別JSON）
- `docs/plans/` - 設計書

## Tech Stack
- Vue 3 + Vite（ビューア）
- Node.js（データ収集、将来用）
- GitHub Actions（CI/CD）
- GitHub Pages（ホスティング）

## Workflow
1. Read existing docs before making changes
2. Use Conventional Commits format
3. ドキュメントは日本語で記述
```

**Step 4: 初回コミット**

```bash
git add .gitignore CLAUDE.md
git commit -m "chore: プロジェクト初期化"
```

---

### Task 2: サンプルデータ作成（architectures.json）

**Files:**
- Create: `~/dev/ai-knowledge-note/data/architectures.json`

**Step 1: architectures.json を作成**

Transformer関連を中心に Topic 2個、Concept 3個、Term 5個のサンプルデータ。

```json
{
  "category": "architectures",
  "displayName": "モデルアーキテクチャ",
  "description": "AIモデルの構造設計に関する用語。Transformer以降の主要アーキテクチャを体系的に整理する。",
  "topics": [
    {
      "id": "arch-topic-transformer",
      "term": "Transformer",
      "termJa": "トランスフォーマー",
      "meaning": "2017年にGoogle Brainが発表した「Attention Is All You Need」で提案されたニューラルネットワークアーキテクチャ。RNNやCNNを使わず、Self-Attention機構のみで系列データを処理する。並列計算が可能で学習効率が高く、GPTやBERTなど現代の大規模言語モデルの基盤となっている。",
      "relatedConceptIds": ["arch-concept-self-attention", "arch-concept-positional-encoding"],
      "sourceUrl": "https://arxiv.org/abs/1706.03762"
    },
    {
      "id": "arch-topic-diffusion",
      "term": "Diffusion Model",
      "termJa": "拡散モデル",
      "meaning": "データにノイズを段階的に加え、そのノイズ除去過程を学習することで新しいデータを生成するモデル。画像生成（Stable Diffusion, DALL-E）で大きな成功を収め、GANに代わる主流の生成モデルとなった。",
      "relatedConceptIds": ["arch-concept-denoising"],
      "sourceUrl": "https://arxiv.org/abs/2006.11239"
    }
  ],
  "concepts": [
    {
      "id": "arch-concept-self-attention",
      "term": "Self-Attention",
      "termJa": "自己注意機構",
      "topicId": "arch-topic-transformer",
      "meaning": "入力系列内の各要素が、他のすべての要素との関連度（Attention Weight）を計算する機構。Query, Key, Valueの3つの行列を用いて、文脈に応じた重み付き表現を生成する。長距離依存関係の捕捉に優れる。",
      "relatedTermIds": ["arch-term-multi-head-attention", "arch-term-scaled-dot-product"],
      "sourceUrl": "https://arxiv.org/abs/1706.03762"
    },
    {
      "id": "arch-concept-positional-encoding",
      "term": "Positional Encoding",
      "termJa": "位置エンコーディング",
      "topicId": "arch-topic-transformer",
      "meaning": "Transformerは系列の順序情報を持たないため、入力埋め込みに位置情報を付加する手法。元論文ではsin/cos関数を使用。後にRoPE（Rotary Position Embedding）やALiBi等の改良手法が登場した。",
      "relatedTermIds": ["arch-term-rope"],
      "sourceUrl": "https://arxiv.org/abs/1706.03762"
    },
    {
      "id": "arch-concept-denoising",
      "term": "Denoising Process",
      "termJa": "ノイズ除去プロセス",
      "topicId": "arch-topic-diffusion",
      "meaning": "拡散モデルの核心的な概念。Forward process（ノイズ追加）の逆過程をニューラルネットワークで学習し、ランダムノイズから段階的にデータを復元する。各ステップでU-Netなどのモデルがノイズを予測・除去する。",
      "relatedTermIds": ["arch-term-ddpm", "arch-term-classifier-free-guidance"],
      "sourceUrl": "https://arxiv.org/abs/2006.11239"
    }
  ],
  "terms": [
    {
      "id": "arch-term-multi-head-attention",
      "term": "Multi-Head Attention",
      "termJa": "マルチヘッドアテンション",
      "meaning": "Self-Attentionを複数のヘッド（部分空間）で並列に実行し、異なる観点からの注意パターンを捕捉する手法。各ヘッドの出力を結合・線形変換して最終的な表現を得る。",
      "type": "technique",
      "tags": ["transformer", "attention"],
      "sourceUrl": "https://arxiv.org/abs/1706.03762"
    },
    {
      "id": "arch-term-scaled-dot-product",
      "term": "Scaled Dot-Product Attention",
      "termJa": "スケール化ドット積アテンション",
      "meaning": "QueryとKeyの内積をKeyの次元数の平方根で割ることで、勾配消失を防ぎつつAttention Weightを計算する手法。Softmaxで正規化後、Valueとの積でコンテキスト表現を得る。",
      "type": "technique",
      "tags": ["transformer", "attention"],
      "sourceUrl": "https://arxiv.org/abs/1706.03762"
    },
    {
      "id": "arch-term-rope",
      "term": "RoPE (Rotary Position Embedding)",
      "termJa": "回転位置埋め込み",
      "meaning": "相対位置情報を回転行列として埋め込みベクトルに適用する手法。絶対位置と相対位置の両方の情報を自然に表現でき、系列長の外挿性能にも優れる。LLaMA, Qwen等の多くのLLMが採用。",
      "type": "technique",
      "tags": ["transformer", "positional-encoding"],
      "sourceUrl": "https://arxiv.org/abs/2104.09864"
    },
    {
      "id": "arch-term-ddpm",
      "term": "DDPM (Denoising Diffusion Probabilistic Models)",
      "termJa": "ノイズ除去拡散確率モデル",
      "meaning": "拡散モデルの代表的実装。マルコフ連鎖に基づくForward/Reverse processを定式化し、変分下界を最適化する。Stable Diffusionの理論的基盤。",
      "type": "model",
      "tags": ["diffusion", "generative"],
      "sourceUrl": "https://arxiv.org/abs/2006.11239"
    },
    {
      "id": "arch-term-classifier-free-guidance",
      "term": "Classifier-Free Guidance",
      "termJa": "分類器不要ガイダンス",
      "meaning": "条件付き生成と無条件生成の出力を線形補間することで、外部分類器なしに生成品質を制御する手法。ガイダンススケールを調整することで忠実度と多様性のバランスを取れる。",
      "type": "technique",
      "tags": ["diffusion", "generative"],
      "sourceUrl": "https://arxiv.org/abs/2207.12598"
    }
  ]
}
```

**Step 2: コミット**

```bash
git add data/architectures.json
git commit -m "feat: architectures カテゴリのサンプルデータを作成"
```

---

### Task 3: 残りカテゴリの空データ作成

**Files:**
- Create: `~/dev/ai-knowledge-note/data/foundations.json`
- Create: `~/dev/ai-knowledge-note/data/training.json`
- Create: `~/dev/ai-knowledge-note/data/applications.json`
- Create: `~/dev/ai-knowledge-note/data/tools.json`

**Step 1: 各カテゴリの最小限JSONを作成**

foundations.json:
```json
{
  "category": "foundations",
  "displayName": "基礎理論",
  "description": "AI・機械学習の基礎となる数学・統計・情報理論の用語。",
  "topics": [],
  "concepts": [],
  "terms": []
}
```

training.json:
```json
{
  "category": "training",
  "displayName": "学習手法",
  "description": "モデルの学習・最適化・ファインチューニングに関する手法と用語。",
  "topics": [],
  "concepts": [],
  "terms": []
}
```

applications.json:
```json
{
  "category": "applications",
  "displayName": "アプリケーション",
  "description": "AI技術の応用手法。RAG、Agent、プロンプトエンジニアリング等。",
  "topics": [],
  "concepts": [],
  "terms": []
}
```

tools.json:
```json
{
  "category": "tools",
  "displayName": "インフラ・ツール",
  "description": "AI開発に使用されるフレームワーク、ライブラリ、プラットフォーム。",
  "topics": [],
  "concepts": [],
  "terms": []
}
```

**Step 2: コミット**

```bash
git add data/
git commit -m "feat: 全カテゴリの空データファイルを作成"
```

---

### Task 4: Vue 3 + Vite アプリの初期化

**Files:**
- Create: `~/dev/ai-knowledge-note/app/package.json`
- Create: `~/dev/ai-knowledge-note/app/vite.config.js`
- Create: `~/dev/ai-knowledge-note/app/index.html`
- Create: `~/dev/ai-knowledge-note/app/src/main.js`
- Create: `~/dev/ai-knowledge-note/app/src/assets/style.css`

**Step 1: app/package.json を作成**

```json
{
  "name": "ai-knowledge-note-app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.5.25"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^6.0.2",
    "vite": "^7.3.1"
  }
}
```

**Step 2: app/vite.config.js を作成**

```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  base: '/ai-knowledge-note/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@data': resolve(__dirname, '../data')
    }
  }
})
```

**Step 3: app/index.html を作成**

```html
<!doctype html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI Knowledge Note</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

**Step 4: app/src/main.js を作成**

```javascript
import { createApp } from 'vue'
import './assets/style.css'
import App from './App.vue'

createApp(App).mount('#app')
```

**Step 5: app/src/assets/style.css を作成**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f5f5;
  color: #333;
}

.card.highlight {
  background: #fff9c4 !important;
  border-color: #fdd835 !important;
  transition: background 0.3s;
}

.concept-wrapper.highlight {
  background: #fff9c4;
}
```

**Step 6: npm install**

```bash
cd ~/dev/ai-knowledge-note/app
npm install
```

**Step 7: コミット**

```bash
cd ~/dev/ai-knowledge-note
git add app/package.json app/package-lock.json app/vite.config.js app/index.html app/src/main.js app/src/assets/style.css
git commit -m "feat: Vue 3 + Vite アプリの初期セットアップ"
```

---

### Task 5: SearchFilter コンポーネント

**Files:**
- Create: `~/dev/ai-knowledge-note/app/src/components/SearchFilter.vue`

**Step 1: SearchFilter.vue を作成**

カテゴリ切替（タブ形式）、テキスト検索、タイプフィルタを1コンポーネントに。

参考: `lang-version-vocab/app/src/components/SearchFilter.vue` の構造を踏襲。

```vue
<script setup>
defineProps({
  searchQuery: { type: String, default: '' },
  selectedType: { type: String, default: 'all' },
  categories: { type: Array, default: () => [] },
  selectedCategory: { type: String, default: '' }
})

defineEmits([
  'update:searchQuery',
  'update:selectedType',
  'update:selectedCategory'
])

const types = [
  { value: 'all', label: 'すべて' },
  { value: 'theory', label: '理論' },
  { value: 'technique', label: '手法' },
  { value: 'model', label: 'モデル' },
  { value: 'metric', label: '評価指標' },
  { value: 'tool', label: 'ツール' }
]
</script>

<template>
  <div class="search-filter">
    <div class="category-tabs">
      <button
        v-for="cat in categories"
        :key="cat.value"
        class="category-tab"
        :class="{ active: selectedCategory === cat.value }"
        @click="$emit('update:selectedCategory', cat.value)"
      >
        {{ cat.label }}
      </button>
    </div>
    <div class="filter-row">
      <input
        type="text"
        class="search-input"
        placeholder="用語を検索..."
        :value="searchQuery"
        @input="$emit('update:searchQuery', $event.target.value)"
      />
      <select
        class="type-select"
        :value="selectedType"
        @change="$emit('update:selectedType', $event.target.value)"
      >
        <option v-for="t in types" :key="t.value" :value="t.value">{{ t.label }}</option>
      </select>
    </div>
  </div>
</template>

<style scoped>
.search-filter {
  margin-bottom: 16px;
}

.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.category-tab {
  padding: 6px 14px;
  border: 1px solid #ddd;
  border-radius: 20px;
  background: #fff;
  color: #555;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.category-tab:hover {
  border-color: #6a1b9a;
  color: #6a1b9a;
}

.category-tab.active {
  background: #6a1b9a;
  border-color: #6a1b9a;
  color: #fff;
}

.filter-row {
  display: flex;
  gap: 8px;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
}

.search-input:focus {
  outline: none;
  border-color: #6a1b9a;
}

.type-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  background: #fff;
}
</style>
```

**Step 2: コミット**

```bash
git add app/src/components/SearchFilter.vue
git commit -m "feat: SearchFilter コンポーネントを作成"
```

---

### Task 6: TabNav コンポーネント

**Files:**
- Create: `~/dev/ai-knowledge-note/app/src/components/TabNav.vue`

**Step 1: TabNav.vue を作成**

2タブ（用語辞書 / 学習パス）。

```vue
<script setup>
defineProps({
  activeTab: { type: String, default: 'glossary' }
})
defineEmits(['update:activeTab'])

const tabs = [
  { value: 'glossary', label: '用語辞書' },
  { value: 'learning-path', label: '学習パス' }
]
</script>

<template>
  <div class="tab-nav">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      class="tab-btn"
      :class="{ active: activeTab === tab.value }"
      @click="$emit('update:activeTab', tab.value)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<style scoped>
.tab-nav {
  display: flex;
  border-bottom: 2px solid #eee;
  margin-bottom: 16px;
}

.tab-btn {
  padding: 10px 20px;
  border: none;
  background: none;
  font-size: 0.95rem;
  color: #888;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #6a1b9a;
}

.tab-btn.active {
  color: #6a1b9a;
  border-bottom-color: #6a1b9a;
  font-weight: 600;
}
</style>
```

**Step 2: コミット**

```bash
git add app/src/components/TabNav.vue
git commit -m "feat: TabNav コンポーネントを作成"
```

---

### Task 7: TopicCard コンポーネント

**Files:**
- Create: `~/dev/ai-knowledge-note/app/src/components/TopicCard.vue`

**Step 1: TopicCard.vue を作成**

参考: `lang-version-vocab` の `CharacteristicCard.vue` を基にAI用語向けに調整。

```vue
<script setup>
defineProps({
  item: { type: Object, required: true },
  concepts: { type: Array, default: () => [] }
})

const emit = defineEmits(['scroll-to-concept'])

const relatedConcepts = (item, concepts) => {
  if (!item.relatedConceptIds?.length) return []
  return concepts.filter(c => item.relatedConceptIds.includes(c.id))
}
</script>

<template>
  <div class="topic-card">
    <div class="topic-header">
      <span class="topic-term">{{ item.term }}</span>
    </div>
    <p v-if="item.termJa" class="topic-term-ja">{{ item.termJa }}</p>
    <p class="topic-meaning">{{ item.meaning }}</p>
    <div v-if="relatedConcepts(item, concepts).length" class="related-concepts">
      <span class="related-label">関連概念:</span>
      <button
        v-for="concept in relatedConcepts(item, concepts)"
        :key="concept.id"
        class="concept-link"
        @click="emit('scroll-to-concept', concept.id)"
      >
        {{ concept.termJa || concept.term }}
      </button>
    </div>
    <div v-if="item.sourceUrl" class="topic-footer">
      <a :href="item.sourceUrl" target="_blank" rel="noopener" class="source-link">Paper</a>
    </div>
  </div>
</template>

<style scoped>
.topic-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 8px;
  background: #fff;
  border-left: 3px solid #6a1b9a;
}

.topic-header {
  margin-bottom: 4px;
}

.topic-term {
  font-size: 1.1rem;
  font-weight: 700;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.topic-term-ja {
  color: #666;
  font-size: 0.9rem;
  margin: 0 0 4px;
}

.topic-meaning {
  color: #333;
  margin: 4px 0;
  line-height: 1.6;
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

.concept-link {
  font-size: 0.75rem;
  padding: 3px 10px;
  border-radius: 12px;
  background: #e0f2f1;
  color: #00695c;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.concept-link:hover {
  background: #b2dfdb;
}

.topic-footer {
  margin-top: 8px;
}

.source-link {
  font-size: 0.8rem;
  color: #6a1b9a;
  text-decoration: none;
}

.source-link:hover {
  text-decoration: underline;
}
</style>
```

**Step 2: コミット**

```bash
git add app/src/components/TopicCard.vue
git commit -m "feat: TopicCard コンポーネントを作成"
```

---

### Task 8: ConceptCard コンポーネント

**Files:**
- Create: `~/dev/ai-knowledge-note/app/src/components/ConceptCard.vue`

**Step 1: ConceptCard.vue を作成**

参考: `lang-version-vocab/app/src/components/ConceptCard.vue` を基に調整。

```vue
<script setup>
defineProps({
  item: { type: Object, required: true },
  topics: { type: Array, default: () => [] },
  allTerms: { type: Array, default: () => [] }
})

const emit = defineEmits(['jump-to-term'])

const parentTopic = (item, topics) => {
  return topics.find(t => t.id === item.topicId)
}

const relatedTerms = (item, allTerms) => {
  if (!item.relatedTermIds?.length) return []
  return allTerms.filter(t => item.relatedTermIds.includes(t.id))
}
</script>

<template>
  <div class="concept-card">
    <div class="concept-header">
      <span class="concept-term">{{ item.term }}</span>
    </div>
    <p v-if="item.termJa" class="concept-term-ja">{{ item.termJa }}</p>
    <p v-if="parentTopic(item, topics)" class="concept-parent">
      Topic: {{ parentTopic(item, topics).termJa || parentTopic(item, topics).term }}
    </p>
    <p class="concept-meaning">{{ item.meaning }}</p>
    <div v-if="relatedTerms(item, allTerms).length" class="related-terms">
      <span class="related-label">関連用語:</span>
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
      <a :href="item.sourceUrl" target="_blank" rel="noopener" class="source-link">Paper</a>
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
  border-left: 3px solid #00838f;
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
  color: #6a1b9a;
  margin: 0 0 4px;
}

.concept-meaning {
  color: #333;
  margin: 4px 0;
  line-height: 1.6;
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
  background: #fff3e0;
  color: #e65100;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.term-link:hover {
  background: #ffe0b2;
}

.concept-footer {
  margin-top: 8px;
}

.source-link {
  font-size: 0.8rem;
  color: #00838f;
  text-decoration: none;
}

.source-link:hover {
  text-decoration: underline;
}
</style>
```

**Step 2: コミット**

```bash
git add app/src/components/ConceptCard.vue
git commit -m "feat: ConceptCard コンポーネントを作成"
```

---

### Task 9: TermCard コンポーネント

**Files:**
- Create: `~/dev/ai-knowledge-note/app/src/components/TermCard.vue`

**Step 1: TermCard.vue を作成**

参考: `lang-version-vocab/app/src/components/TermCard.vue` を基に調整。

```vue
<script setup>
defineProps({
  item: { type: Object, required: true }
})
</script>

<template>
  <div class="card" :id="`term-${item.id}`">
    <div class="card-header">
      <span class="term">{{ item.term }}</span>
      <div class="badges">
        <span class="badge" :class="item.type">{{ item.type }}</span>
      </div>
    </div>
    <p v-if="item.termJa" class="term-sub">{{ item.termJa }}</p>
    <p class="meaning">{{ item.meaning }}</p>
    <div v-if="item.tags?.length" class="tags">
      <span v-for="tag in item.tags" :key="tag" class="tag">{{ tag }}</span>
    </div>
    <div v-if="item.sourceUrl" class="card-footer">
      <a :href="item.sourceUrl" target="_blank" rel="noopener" class="source-link">Paper</a>
    </div>
  </div>
</template>

<style scoped>
.card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 8px;
  background: #fff;
  border-left: 3px solid #e65100;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  gap: 8px;
}

.term {
  font-size: 1.05rem;
  font-weight: 700;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.badges {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.badge {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.badge.theory {
  background: #e3f2fd;
  color: #1565c0;
}

.badge.technique {
  background: #f3e5f5;
  color: #7b1fa2;
}

.badge.model {
  background: #e8f5e9;
  color: #2e7d32;
}

.badge.metric {
  background: #fff3e0;
  color: #e65100;
}

.badge.tool {
  background: #fbe9e7;
  color: #bf360c;
}

.term-sub {
  color: #666;
  font-size: 0.9rem;
  margin: 0 0 4px;
}

.meaning {
  color: #333;
  margin: 4px 0;
  line-height: 1.6;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.tag {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 4px;
  background: #f0f0f0;
  color: #555;
}

.card-footer {
  margin-top: 8px;
}

.source-link {
  font-size: 0.8rem;
  color: #e65100;
  text-decoration: none;
}

.source-link:hover {
  text-decoration: underline;
}
</style>
```

**Step 2: コミット**

```bash
git add app/src/components/TermCard.vue
git commit -m "feat: TermCard コンポーネントを作成"
```

---

### Task 10: GlossaryTab コンポーネント

**Files:**
- Create: `~/dev/ai-knowledge-note/app/src/components/GlossaryTab.vue`

**Step 1: GlossaryTab.vue を作成**

参考: `lang-version-vocab/app/src/components/OverviewTab.vue` を基にAI用語向けに調整。Topic→Concept→Term の3層を1タブに表示。

```vue
<script setup>
import { computed } from 'vue'
import TopicCard from './TopicCard.vue'
import ConceptCard from './ConceptCard.vue'
import TermCard from './TermCard.vue'

const props = defineProps({
  categoryData: { type: Object, default: null },
  searchQuery: { type: String, default: '' },
  selectedType: { type: String, default: 'all' }
})

const emit = defineEmits(['jump-to-term'])

const filteredTerms = computed(() => {
  if (!props.categoryData?.terms) return []
  const query = props.searchQuery.toLowerCase()
  return props.categoryData.terms.filter(term => {
    const matchesSearch = !props.searchQuery ||
      term.term.toLowerCase().includes(query) ||
      (term.termJa && term.termJa.includes(props.searchQuery)) ||
      term.meaning.includes(props.searchQuery)
    const matchesType = props.selectedType === 'all' || term.type === props.selectedType
    return matchesSearch && matchesType
  })
})

const allTerms = computed(() => props.categoryData?.terms || [])

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
  <div v-if="categoryData" class="glossary-tab">
    <p v-if="categoryData.description" class="description">{{ categoryData.description }}</p>

    <section v-if="categoryData.topics?.length" class="section">
      <h3 class="section-title">トピック</h3>
      <TopicCard
        v-for="topic in categoryData.topics"
        :key="topic.id"
        :item="topic"
        :concepts="categoryData.concepts || []"
        @scroll-to-concept="scrollToConcept"
      />
    </section>

    <section v-if="categoryData.concepts?.length" class="section">
      <h3 class="section-title">概念</h3>
      <div
        v-for="concept in categoryData.concepts"
        :key="concept.id"
        :id="`concept-${concept.id}`"
        class="concept-wrapper"
      >
        <ConceptCard
          :item="concept"
          :topics="categoryData.topics || []"
          :allTerms="allTerms"
          @jump-to-term="emit('jump-to-term', $event)"
        />
      </div>
    </section>

    <section v-if="filteredTerms.length" class="section">
      <h3 class="section-title">用語</h3>
      <TermCard
        v-for="term in filteredTerms"
        :key="term.id"
        :item="term"
      />
    </section>

    <p v-if="!categoryData.topics?.length && !categoryData.concepts?.length && !filteredTerms.length" class="empty">
      このカテゴリにはまだデータがありません
    </p>

    <div v-if="filteredTerms.length" class="stats">
      全 {{ filteredTerms.length }}件
    </div>
  </div>
  <div v-else class="empty">
    <p>カテゴリデータがありません</p>
  </div>
</template>

<style scoped>
.glossary-tab {
  padding-top: 8px;
}

.description {
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

.stats {
  text-align: center;
  color: #888;
  font-size: 0.85rem;
  padding: 12px 0;
  border-top: 1px solid #eee;
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
git add app/src/components/GlossaryTab.vue
git commit -m "feat: GlossaryTab コンポーネントを作成"
```

---

### Task 11: LearningPathTab コンポーネント

**Files:**
- Create: `~/dev/ai-knowledge-note/app/src/components/RoadmapNode.vue`
- Create: `~/dev/ai-knowledge-note/app/src/components/RoadmapBranch.vue`
- Create: `~/dev/ai-knowledge-note/app/src/components/LearningPathTab.vue`

**Step 1: RoadmapNode.vue を作成**

```vue
<script setup>
defineProps({
  node: { type: Object, required: true }
})

const levelColors = {
  topic: '#6a1b9a',
  concept: '#00838f',
  term: '#e65100'
}
</script>

<template>
  <div class="roadmap-node" :style="{ borderLeftColor: levelColors[node.level] || '#999' }">
    <span class="node-term">{{ node.term }}</span>
    <span v-if="node.termJa" class="node-term-ja">{{ node.termJa }}</span>
    <span v-if="node.type" class="node-type">{{ node.type }}</span>
  </div>
</template>

<style scoped>
.roadmap-node {
  padding: 8px 12px;
  margin: 4px 0;
  background: #fff;
  border-radius: 6px;
  border-left: 3px solid #999;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.node-term {
  font-weight: 600;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.node-term-ja {
  color: #666;
  font-size: 0.8rem;
}

.node-type {
  font-size: 0.7rem;
  padding: 1px 6px;
  border-radius: 8px;
  background: #f0f0f0;
  color: #777;
  margin-left: auto;
}
</style>
```

**Step 2: RoadmapBranch.vue を作成**

```vue
<script setup>
import RoadmapNode from './RoadmapNode.vue'

defineProps({
  branch: { type: Object, required: true }
})
</script>

<template>
  <div class="roadmap-branch">
    <RoadmapNode :node="{ ...branch.topic, level: 'topic' }" />
    <div class="branch-children">
      <div v-for="concept in branch.concepts" :key="concept.id" class="concept-group">
        <RoadmapNode :node="{ ...concept, level: 'concept' }" />
        <div class="term-children">
          <RoadmapNode
            v-for="term in concept.terms"
            :key="term.id"
            :node="{ ...term, level: 'term' }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.roadmap-branch {
  margin-bottom: 16px;
}

.branch-children {
  margin-left: 20px;
  border-left: 2px solid #e0e0e0;
  padding-left: 12px;
}

.concept-group {
  margin-bottom: 4px;
}

.term-children {
  margin-left: 20px;
  border-left: 2px solid #f0f0f0;
  padding-left: 12px;
}
</style>
```

**Step 3: LearningPathTab.vue を作成**

```vue
<script setup>
import { computed } from 'vue'
import RoadmapBranch from './RoadmapBranch.vue'

const props = defineProps({
  categoryData: { type: Object, default: null }
})

const learningTree = computed(() => {
  if (!props.categoryData) return []
  const { topics = [], concepts = [], terms = [] } = props.categoryData
  const placedTermIds = new Set()

  return topics.map(topic => {
    const topicConcepts = concepts
      .filter(c => c.topicId === topic.id)
      .map(concept => {
        const conceptTerms = (concept.relatedTermIds || [])
          .map(tid => terms.find(t => t.id === tid))
          .filter(t => t && !placedTermIds.has(t.id))
        conceptTerms.forEach(t => placedTermIds.add(t.id))
        return { ...concept, terms: conceptTerms }
      })
    return { topic, concepts: topicConcepts }
  })
})
</script>

<template>
  <div class="learning-path-tab">
    <p class="path-description">トピック → 概念 → 用語 の関係をツリー表示します。</p>
    <RoadmapBranch
      v-for="branch in learningTree"
      :key="branch.topic.id"
      :branch="branch"
    />
    <p v-if="!learningTree.length" class="empty">学習パスデータがありません</p>
  </div>
</template>

<style scoped>
.learning-path-tab {
  padding-top: 8px;
}

.path-description {
  color: #888;
  font-size: 0.85rem;
  margin-bottom: 16px;
}

.empty {
  text-align: center;
  color: #999;
  padding: 40px 0;
}
</style>
```

**Step 4: コミット**

```bash
git add app/src/components/RoadmapNode.vue app/src/components/RoadmapBranch.vue app/src/components/LearningPathTab.vue
git commit -m "feat: 学習パス用コンポーネント群を作成"
```

---

### Task 12: App.vue（ルートコンポーネント）

**Files:**
- Create: `~/dev/ai-knowledge-note/app/src/App.vue`

**Step 1: App.vue を作成**

参考: `lang-version-vocab/app/src/App.vue` を基に、カテゴリ切替・ジャンプ機能を実装。

```vue
<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import SearchFilter from './components/SearchFilter.vue'
import TabNav from './components/TabNav.vue'
import GlossaryTab from './components/GlossaryTab.vue'
import LearningPathTab from './components/LearningPathTab.vue'

import architecturesData from '@data/architectures.json'
import foundationsData from '@data/foundations.json'
import trainingData from '@data/training.json'
import applicationsData from '@data/applications.json'
import toolsData from '@data/tools.json'

const dataMap = {
  architectures: architecturesData,
  foundations: foundationsData,
  training: trainingData,
  applications: applicationsData,
  tools: toolsData
}

const categories = Object.entries(dataMap).map(([key, data]) => ({
  value: key,
  label: data.displayName
}))

const searchQuery = ref('')
const selectedType = ref('all')
const selectedCategory = ref('architectures')
const activeTab = ref('glossary')
const highlightId = ref(null)

const categoryData = computed(() => dataMap[selectedCategory.value])

watch(selectedCategory, () => {
  searchQuery.value = ''
  selectedType.value = 'all'
  activeTab.value = 'glossary'
  highlightId.value = null
})

async function jumpToTerm(termId) {
  activeTab.value = 'glossary'
  highlightId.value = termId
  await nextTick()
  const el = document.getElementById(`term-${termId}`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('highlight')
    setTimeout(() => {
      el.classList.remove('highlight')
      highlightId.value = null
    }, 2000)
  }
}
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>AI Knowledge Note</h1>
    </header>
    <main class="main-content">
      <SearchFilter
        v-model:searchQuery="searchQuery"
        v-model:selectedType="selectedType"
        v-model:selectedCategory="selectedCategory"
        :categories="categories"
      />
      <TabNav v-model:activeTab="activeTab" />
      <GlossaryTab
        v-if="activeTab === 'glossary'"
        :categoryData="categoryData"
        :searchQuery="searchQuery"
        :selectedType="selectedType"
        @jump-to-term="jumpToTerm"
      />
      <LearningPathTab
        v-if="activeTab === 'learning-path'"
        :categoryData="categoryData"
      />
    </main>
  </div>
</template>

<style scoped>
.app-header {
  padding: 16px 24px;
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
  padding: 0 24px 32px;
}
</style>
```

**Step 2: 開発サーバーで動作確認**

```bash
cd ~/dev/ai-knowledge-note/app
npm run dev
```

Expected: ブラウザで `http://localhost:5173/ai-knowledge-note/` を開き、以下を確認:
- ヘッダー「AI Knowledge Note」が表示
- カテゴリタブ（5つ）が表示、「モデルアーキテクチャ」がアクティブ
- 「用語辞書」タブにTransformer関連のTopic/Concept/Termが表示
- 「学習パス」タブにツリー表示
- 検索・フィルタが動作
- カテゴリ切替で空カテゴリは「データがありません」

**Step 3: コミット**

```bash
cd ~/dev/ai-knowledge-note
git add app/src/App.vue
git commit -m "feat: App.vue ルートコンポーネントを作成し全体を統合"
```

---

### Task 13: GitHub Actions — deploy.yml

**Files:**
- Create: `~/dev/ai-knowledge-note/.github/workflows/deploy.yml`

**Step 1: deploy.yml を作成**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        working-directory: app
        run: npm ci

      - name: Build
        working-directory: app
        run: npm run build

      - uses: actions/upload-pages-artifact@v3
        with:
          path: app/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

**Step 2: コミット**

```bash
mkdir -p ~/dev/ai-knowledge-note/.github/workflows
git add .github/workflows/deploy.yml
git commit -m "ci: GitHub Pages デプロイワークフローを作成"
```

---

### Task 14: GitHub Actions — collect.yml（将来用）

**Files:**
- Create: `~/dev/ai-knowledge-note/.github/workflows/collect.yml`

**Step 1: collect.yml を作成**

```yaml
name: Collect AI Data

on:
  workflow_dispatch:

permissions:
  contents: write

jobs:
  collect:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        working-directory: collector
        run: npm ci

      - name: Run collector
        working-directory: collector
        run: npm run collect

      - name: Commit updated data
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add data/
          git diff --cached --quiet || git commit -m "chore: update AI data [automated]"
          git push
```

**Step 2: コミット**

```bash
git add .github/workflows/collect.yml
git commit -m "ci: データ収集ワークフローを作成（手動トリガーのみ）"
```

---

### Task 15: collector の最小セットアップ

**Files:**
- Create: `~/dev/ai-knowledge-note/collector/package.json`
- Create: `~/dev/ai-knowledge-note/collector/src/index.js`

**Step 1: collector/package.json を作成**

```json
{
  "name": "ai-knowledge-note-collector",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "collect": "node src/index.js"
  },
  "dependencies": {}
}
```

**Step 2: collector/src/index.js を作成**

```javascript
// AI Knowledge Note - Data Collector
// Phase 1: placeholder (data is manually edited)
// Phase 2+: automated collection from various sources

console.log('AI Knowledge Note Collector')
console.log('Phase 1: Data is manually managed in data/*.json')
console.log('No automated collection configured yet.')
```

**Step 3: コミット**

```bash
git add collector/package.json collector/src/index.js
git commit -m "feat: collector の最小セットアップ（プレースホルダー）"
```

---

### Task 16: 最終動作確認

**Step 1: ビルド確認**

```bash
cd ~/dev/ai-knowledge-note/app
npm run build
```

Expected: `app/dist/` にビルド成果物が生成される。エラーなし。

**Step 2: プレビュー確認**

```bash
npm run preview
```

Expected: `http://localhost:4173/ai-knowledge-note/` でビルド版が正常に表示。

**Step 3: 設計書をコピー**

```bash
mkdir -p ~/dev/ai-knowledge-note/docs/plans
cp ~/dev/ai-knowledge-note/../lang-version-vocab/docs/plans/2026-02-23-ai-knowledge-note-design.md ~/dev/ai-knowledge-note/docs/plans/
```

**Step 4: 最終コミット**

```bash
cd ~/dev/ai-knowledge-note
git add docs/
git commit -m "docs: 設計書を追加"
```
