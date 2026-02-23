# サイドバー3大分類リストラクチャ 実装計画

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** サイドバーを「言語の特徴」「基本構文」「標準API」の3大分類フラットリストに再構成し、バージョン用語・モード切替・折りたたみを削除する。

**Architecture:** スクレイパーの specification カテゴリに `group` フィールドを追加して syntax/api を区別。LearningPathSidebar を全面書き換えて3セクション構造にする。NodeDetailPanel から概念→用語のリンクを削除。App.vue から不要になった `allTerms` props を削除。

**Tech Stack:** Vue 3 + Vite（フロントエンド）、Node.js（スクレイパー）

**設計書:** `docs/plans/2026-02-23-sidebar-restructure-design.md`

---

### Task 1: specification カテゴリに group フィールドを追加

**Files:**
- Modify: `scraper/src/scrapers/javascript.js`
- Modify: `scraper/src/scrapers/java.js`
- Modify: `scraper/src/scrapers/jquery.js`

**Step 1: 各スクレイパーの scrapeSpecification() 内のカテゴリに group フィールドを追加**

`scraper/src/scrapers/javascript.js` — 各カテゴリオブジェクトに `group` を追加:

```
js-spec-data-types     → group: 'syntax'
js-spec-operators      → group: 'syntax'
js-spec-control-flow   → group: 'syntax'
js-spec-functions      → group: 'syntax'
js-spec-error-handling → group: 'syntax'
js-spec-built-in-objects → group: 'api'
```

`scraper/src/scrapers/java.js`:

```
java-spec-primitive-types    → group: 'syntax'
java-spec-control-flow       → group: 'syntax'
java-spec-oop-basics         → group: 'syntax'
java-spec-access-modifiers   → group: 'syntax'
java-spec-exception-handling → group: 'syntax'
java-spec-collections        → group: 'api'
java-spec-io                 → group: 'api'
```

`scraper/src/scrapers/jquery.js`:

```
jquery-spec-selectors        → group: 'syntax'
jquery-spec-dom-manipulation → group: 'syntax'
jquery-spec-traversal        → group: 'syntax'
jquery-spec-events           → group: 'syntax'
jquery-spec-effects          → group: 'api'
jquery-spec-ajax             → group: 'api'
jquery-spec-utilities        → group: 'api'
```

具体的には各カテゴリの `id` の直後に `group: 'syntax'` または `group: 'api'` を追加する。例:

```javascript
{
  id: 'js-spec-data-types',
  group: 'syntax',  // ← 追加
  name: 'Data Types',
  ...
}
```

**Step 2: スクレイパー実行してデータ更新**

Run: `cd /home/m-miyawaki/dev/lang-version-vocab/scraper && node src/index.js`

**Step 3: コミット**

```bash
cd /home/m-miyawaki/dev/lang-version-vocab
git add scraper/src/scrapers/javascript.js scraper/src/scrapers/java.js scraper/src/scrapers/jquery.js data/
git commit -m "feat: specification カテゴリに group フィールド（syntax/api）を追加"
```

---

### Task 2: LearningPathSidebar を3大分類構造に書き換え

**Files:**
- Modify: `app/src/components/LearningPathSidebar.vue`

**Step 1: script を全面書き換え**

```vue
<script setup>
import { computed } from 'vue'

const props = defineProps({
  overview: { type: Object, default: null },
  specification: { type: Object, default: null },
  selectedLang: { type: String, default: 'javascript' },
  languages: { type: Array, default: () => [] },
  selectedNodeId: { type: String, default: null }
})

const emit = defineEmits(['update:selectedLang', 'select-node'])

const features = computed(() => {
  if (!props.overview) return []
  const chars = (props.overview.characteristics || []).map(c => ({ ...c, level: 'characteristic' }))
  const concepts = (props.overview.concepts || []).map(c => ({ ...c, level: 'concept' }))
  return [...chars, ...concepts]
})

const syntaxCategories = computed(() => {
  if (!props.specification?.categories) return []
  return props.specification.categories.filter(c => c.group === 'syntax')
})

const apiCategories = computed(() => {
  if (!props.specification?.categories) return []
  return props.specification.categories.filter(c => c.group === 'api')
})

function selectNode(item, level) {
  emit('select-node', { ...item, level })
}
</script>
```

**Step 2: template を全面書き換え**

```vue
<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <select
        class="lang-select"
        :value="selectedLang"
        @change="emit('update:selectedLang', $event.target.value)"
      >
        <option v-for="lang in languages" :key="lang.value" :value="lang.value">
          {{ lang.label }}
        </option>
      </select>
    </div>

    <nav class="sidebar-tree">
      <!-- 言語の特徴 -->
      <template v-if="features.length">
        <div class="section-divider">
          <span class="section-label">言語の特徴</span>
        </div>
        <ul class="section-list">
          <li v-for="item in features" :key="item.id">
            <button
              class="list-item"
              :class="{ active: selectedNodeId === item.id }"
              @click="selectNode(item, item.level)"
            >
              <span class="dot" :class="item.level === 'characteristic' ? 'dot-feature' : 'dot-concept'"></span>
              <span class="item-label">{{ item.termJa || item.term }}</span>
            </button>
          </li>
        </ul>
      </template>

      <!-- 基本構文 -->
      <template v-if="syntaxCategories.length">
        <div class="section-divider">
          <span class="section-label">基本構文</span>
        </div>
        <ul class="section-list">
          <li v-for="cat in syntaxCategories" :key="cat.id">
            <button
              class="list-item"
              :class="{ active: selectedNodeId === cat.id }"
              @click="selectNode(cat, 'spec-category')"
            >
              <span class="dot dot-syntax"></span>
              <span class="item-label">{{ cat.nameJa || cat.name }}</span>
            </button>
          </li>
        </ul>
      </template>

      <!-- 標準API -->
      <template v-if="apiCategories.length">
        <div class="section-divider">
          <span class="section-label">標準API</span>
        </div>
        <ul class="section-list">
          <li v-for="cat in apiCategories" :key="cat.id">
            <button
              class="list-item"
              :class="{ active: selectedNodeId === cat.id }"
              @click="selectNode(cat, 'spec-category')"
            >
              <span class="dot dot-api"></span>
              <span class="item-label">{{ cat.nameJa || cat.name }}</span>
            </button>
          </li>
        </ul>
      </template>

      <p v-if="features.length === 0 && syntaxCategories.length === 0 && apiCategories.length === 0" class="empty">データなし</p>
    </nav>
  </aside>
</template>
```

**Step 3: style を全面書き換え**

```vue
<style scoped>
.sidebar {
  width: 280px;
  flex-shrink: 0;
  border-right: 1px solid #e0e0e0;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px);
  position: sticky;
  top: 64px;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.lang-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  background: #fff;
}

.sidebar-tree {
  flex: 1;
  overflow-y: auto;
  padding: 0 0 16px;
}

.section-divider {
  margin: 16px 16px 6px;
  padding-top: 8px;
  border-top: 1px solid #e0e0e0;
}

.section-divider:first-child {
  border-top: none;
  margin-top: 8px;
}

.section-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.section-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.list-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 16px;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  font-size: 0.84rem;
  color: #333;
  line-height: 1.4;
  transition: background 0.15s;
}

.list-item:hover {
  background: #eeeeee;
}

.list-item.active {
  background: #e3f2fd;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-feature {
  background: #1976d2;
}

.dot-concept {
  background: #2e7d32;
}

.dot-syntax {
  background: #e65100;
}

.dot-api {
  background: #7b1fa2;
}

.item-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.empty {
  text-align: center;
  color: #999;
  padding: 20px 0;
  font-size: 0.85rem;
}
</style>
```

**Step 4: ビルド確認**

Run: `cd /home/m-miyawaki/dev/lang-version-vocab/app && npx vite build 2>&1 | tail -5`
Expected: ビルド成功

**Step 5: コミット**

```bash
cd /home/m-miyawaki/dev/lang-version-vocab
git add app/src/components/LearningPathSidebar.vue
git commit -m "feat: サイドバーを3大分類フラットリスト構造に書き換え"
```

---

### Task 3: NodeDetailPanel から概念→用語リンクを削除

**Files:**
- Modify: `app/src/components/NodeDetailPanel.vue`

**Step 1: getRelatedTerms 関数と getTermVersion 関数を削除**

`getRelatedTerms()` 関数（現在34-38行目）と `getTermVersion()` 関数（現在40-48行目）を削除する。

**Step 2: 概念テンプレートから「関連する用語」セクションを削除**

概念テンプレート内の以下を削除（現在119-135行目付近）:

```html
      <div v-if="getRelatedTerms().length" class="detail-section">
        <h3 class="section-label">関連する用語</h3>
        ...
      </div>
```

**Step 3: 用語テンプレートを削除**

`<!-- 用語の詳細 -->` テンプレート全体（現在142-167行目）を削除。サイドバーから用語を選択する経路がなくなるため不要。

**Step 4: levelConfig から term を削除**

```javascript
const levelConfig = {
  characteristic: { icon: '📘', label: '特徴', color: '#1976d2', bg: '#e3f2fd' },
  concept: { icon: '📗', label: '特徴', color: '#2e7d32', bg: '#e8f5e9' },
  'spec-category': { icon: '📂', label: '仕様', color: '#7b1fa2', bg: '#f3e5f5' },
  'spec-item': { icon: '📄', label: '仕様', color: '#9c27b0', bg: '#f3e5f5' }
}
```

Note: characteristic と concept を同じ「特徴」ラベルに統一。

**Step 5: props から allTerms と versions を削除**

```javascript
const props = defineProps({
  node: { type: Object, required: true },
  overview: { type: Object, default: null },
  specification: { type: Object, default: null }
})
```

**Step 6: コミット**

```bash
cd /home/m-miyawaki/dev/lang-version-vocab
git add app/src/components/NodeDetailPanel.vue
git commit -m "feat: NodeDetailPanel から用語関連の表示と props を削除"
```

---

### Task 4: App.vue の props 整理

**Files:**
- Modify: `app/src/App.vue`

**Step 1: LearningPathSidebar から :allTerms を削除**

```html
      <LearningPathSidebar
        :overview="langData.overview"
        :specification="langData.specification"
        :selectedLang="selectedLang"
        :languages="languages"
        :selectedNodeId="selectedNode?.id || null"
        @update:selectedLang="selectedLang = $event"
        @select-node="handleSelectNode"
      />
```

**Step 2: NodeDetailPanel から :allTerms と :versions を削除**

```html
          <NodeDetailPanel
            :node="selectedNode"
            :overview="langData.overview"
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
git commit -m "feat: App.vue から不要な allTerms / versions の受け渡しを削除"
```

---

### Task 5: ビルド・動作確認

**Step 1: ビルド**

Run: `cd /home/m-miyawaki/dev/lang-version-vocab/app && npm run build`
Expected: ビルド成功

**Step 2: 動作確認**

Run: `cd /home/m-miyawaki/dev/lang-version-vocab/app && npx vite --open`

確認項目:
1. サイドバーに3つのセクション（言語の特徴 / 基本構文 / 標準API）が区切り線付きで表示
2. モード切替ボタンが消えている
3. 折りたたみ矢印が消えている（フラットリスト）
4. バージョン用語がツリーに表示されない
5. 「言語の特徴」内の項目クリックで詳細パネル表示
6. 「基本構文」カテゴリクリックで含まれる項目一覧表示
7. 「標準API」カテゴリクリックで含まれる項目一覧表示
8. 各言語切替でセクション内容が更新される
