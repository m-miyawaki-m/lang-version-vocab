# サイドバーレイアウト 実装計画

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 学習パスを常時表示サイドバーに配置し、ノードクリックで右側に専用の詳細パネルを表示するアプリ全体のレイアウト変更を実装する。

**Architecture:** App.vue を2カラムの flex レイアウトに変更。左サイドバーに LearningPathSidebar（新規）、右メインに既存タブ or NodeDetailPanel（新規）を表示。既存の LearningPathTab はサイドバーに置き換え削除。タブは「学習パス」を除いた2タブに戻す。

**Tech Stack:** Vue 3 + Vite（フロントエンドのみ、スクレイパー変更なし）

**設計書:** `docs/plans/2026-02-23-sidebar-layout-design.md`

---

### Task 1: TabNav から「学習パス」タブを削除

**Files:**
- Modify: `app/src/components/TabNav.vue:8-12`

**Step 1: タブ定義を変更**

`app/src/components/TabNav.vue` の tabs 配列から `learning-path` を削除:

変更前:
```javascript
const tabs = [
  { value: 'overview', label: '言語概要' },
  { value: 'learning-path', label: '学習パス' },
  { value: 'timeline', label: 'バージョン履歴' }
]
```

変更後:
```javascript
const tabs = [
  { value: 'overview', label: '言語概要' },
  { value: 'timeline', label: 'バージョン履歴' }
]
```

**Step 2: ビルド確認**

Run: `cd /home/m-miyawaki/dev/lang-version-vocab/app && npx vite build 2>&1 | tail -5`
Expected: ビルド成功

**Step 3: コミット**

```bash
cd /home/m-miyawaki/dev/lang-version-vocab
git add app/src/components/TabNav.vue
git commit -m "refactor: TabNav から学習パスタブを削除"
```

---

### Task 2: SearchFilter から言語選択を分離

**Files:**
- Modify: `app/src/components/SearchFilter.vue`

**Step 1: 言語選択の props と emit を削除し、検索+タイプフィルタのみにする**

`app/src/components/SearchFilter.vue` を以下に置き換え:

```vue
<script setup>
defineProps({
  searchQuery: { type: String, default: '' },
  selectedType: { type: String, default: 'all' }
})

const emit = defineEmits(['update:searchQuery', 'update:selectedType'])

const types = [
  { value: 'all', label: 'すべて' },
  { value: 'syntax', label: '構文' },
  { value: 'api', label: 'API' },
  { value: 'concept', label: '概念' },
  { value: 'deprecation', label: '廃止' }
]
</script>

<template>
  <div class="filter-bar">
    <input
      type="text"
      class="search-input"
      placeholder="用語を検索..."
      :value="searchQuery"
      @input="emit('update:searchQuery', $event.target.value)"
    />
    <select
      class="filter-select"
      :value="selectedType"
      @change="emit('update:selectedType', $event.target.value)"
    >
      <option v-for="t in types" :key="t.value" :value="t.value">
        {{ t.label }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
  background: #fff;
}
</style>
```

**Step 2: コミット**

```bash
cd /home/m-miyawaki/dev/lang-version-vocab
git add app/src/components/SearchFilter.vue
git commit -m "refactor: SearchFilter から言語選択を削除（サイドバーに移動予定）"
```

---

### Task 3: RoadmapNode に active スタイルを追加

**Files:**
- Modify: `app/src/components/RoadmapNode.vue`

**Step 1: props に `isActive` を追加**

`app/src/components/RoadmapNode.vue` の defineProps を変更:

変更前:
```javascript
defineProps({
  node: { type: Object, required: true },
  experienceMode: { type: Boolean, default: false }
})
```

変更後:
```javascript
defineProps({
  node: { type: Object, required: true },
  experienceMode: { type: Boolean, default: false },
  isActive: { type: Boolean, default: false }
})
```

**Step 2: テンプレートに active クラスを追加**

変更前:
```html
    :class="[node.level, { collapsed: experienceMode && node.level === 'characteristic' }]"
```

変更後:
```html
    :class="[node.level, { collapsed: experienceMode && node.level === 'characteristic', active: isActive }]"
```

**Step 3: スタイルに active 状態を追加**

`<style scoped>` の末尾（`</style>` の直前）に追加:

```css
.roadmap-node.active {
  background: #e3f2fd;
  border-color: #1976d2;
  box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
}
```

**Step 4: コミット**

```bash
cd /home/m-miyawaki/dev/lang-version-vocab
git add app/src/components/RoadmapNode.vue
git commit -m "feat: RoadmapNode に active 選択状態スタイルを追加"
```

---

### Task 4: RoadmapBranch に selectedNodeId を伝播

**Files:**
- Modify: `app/src/components/RoadmapBranch.vue`

**Step 1: props に `selectedNodeId` を追加**

`app/src/components/RoadmapBranch.vue` の defineProps を変更:

変更前:
```javascript
defineProps({
  characteristic: { type: Object, required: true },
  concepts: { type: Array, default: () => [] },
  experienceMode: { type: Boolean, default: false }
})
```

変更後:
```javascript
defineProps({
  characteristic: { type: Object, required: true },
  concepts: { type: Array, default: () => [] },
  experienceMode: { type: Boolean, default: false },
  selectedNodeId: { type: String, default: null }
})
```

**Step 2: テンプレートの各 RoadmapNode に isActive を渡す**

特性ノード（1つ目の RoadmapNode）を変更:

変更前:
```html
    <RoadmapNode
      :node="{ ...characteristic, level: 'characteristic' }"
      :experienceMode="experienceMode"
      @navigate="emit('navigate', $event)"
    />
```

変更後:
```html
    <RoadmapNode
      :node="{ ...characteristic, level: 'characteristic' }"
      :experienceMode="experienceMode"
      :isActive="selectedNodeId === characteristic.id"
      @navigate="emit('navigate', $event)"
    />
```

概念ノード（2つ目の RoadmapNode）を変更:

変更前:
```html
          <RoadmapNode
            :node="{ ...concept, level: 'concept' }"
            :experienceMode="experienceMode"
            @navigate="emit('navigate', $event)"
          />
```

変更後:
```html
          <RoadmapNode
            :node="{ ...concept, level: 'concept' }"
            :experienceMode="experienceMode"
            :isActive="selectedNodeId === concept.id"
            @navigate="emit('navigate', $event)"
          />
```

用語ノード（3つ目の RoadmapNode）を変更:

変更前:
```html
              <RoadmapNode
                :node="{ ...term, level: 'term' }"
                :experienceMode="experienceMode"
                @navigate="emit('navigate', $event)"
              />
```

変更後:
```html
              <RoadmapNode
                :node="{ ...term, level: 'term' }"
                :experienceMode="experienceMode"
                :isActive="selectedNodeId === term.id"
                @navigate="emit('navigate', $event)"
              />
```

**Step 3: コミット**

```bash
cd /home/m-miyawaki/dev/lang-version-vocab
git add app/src/components/RoadmapBranch.vue
git commit -m "feat: RoadmapBranch に selectedNodeId を伝播"
```

---

### Task 5: LearningPathSidebar コンポーネントを作成

**Files:**
- Create: `app/src/components/LearningPathSidebar.vue`

**Step 1: LearningPathSidebar を実装**

`app/src/components/LearningPathSidebar.vue` を作成:

```vue
<script setup>
import { ref, computed } from 'vue'
import RoadmapBranch from './RoadmapBranch.vue'

const props = defineProps({
  overview: { type: Object, default: null },
  allTerms: { type: Array, default: () => [] },
  selectedLang: { type: String, default: 'javascript' },
  languages: { type: Array, default: () => [] },
  selectedNodeId: { type: String, default: null }
})

const emit = defineEmits(['update:selectedLang', 'select-node'])

const experienceMode = ref(false)

const roadmap = computed(() => {
  if (!props.overview) return []

  const characteristics = props.overview.characteristics || []
  const concepts = props.overview.concepts || []
  const terms = props.allTerms || []

  const placedTermIds = new Set()

  return characteristics.map(char => {
    const relatedConcepts = concepts
      .filter(c => c.characteristicId === char.id)
      .map(concept => {
        const relatedTerms = (concept.relatedTermIds || [])
          .map(termId => terms.find(t => t.id === termId))
          .filter(t => t && !placedTermIds.has(t.id))

        relatedTerms.forEach(t => placedTermIds.add(t.id))

        return {
          ...concept,
          terms: relatedTerms
        }
      })

    return {
      characteristic: char,
      concepts: relatedConcepts
    }
  })
})

function handleNavigate(node) {
  emit('select-node', node)
}
</script>

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
      <div class="mode-toggle">
        <button
          class="mode-btn"
          :class="{ active: !experienceMode }"
          @click="experienceMode = false"
        >
          初心者
        </button>
        <button
          class="mode-btn"
          :class="{ active: experienceMode }"
          @click="experienceMode = true"
        >
          経験者
        </button>
      </div>
    </div>

    <div class="sidebar-tree">
      <RoadmapBranch
        v-for="branch in roadmap"
        :key="branch.characteristic.id"
        :characteristic="branch.characteristic"
        :concepts="branch.concepts"
        :experienceMode="experienceMode"
        :selectedNodeId="selectedNodeId"
        @navigate="handleNavigate"
      />
      <p v-if="roadmap.length === 0" class="empty">データなし</p>
    </div>
  </aside>
</template>

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
  margin-bottom: 12px;
}

.mode-toggle {
  display: flex;
  gap: 6px;
}

.mode-btn {
  flex: 1;
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 16px;
  background: #fff;
  font-size: 0.8rem;
  font-weight: 600;
  color: #888;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-btn:hover {
  border-color: #bbb;
  color: #555;
}

.mode-btn.active {
  background: #1976d2;
  border-color: #1976d2;
  color: #fff;
}

.sidebar-tree {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.empty {
  text-align: center;
  color: #999;
  padding: 20px 0;
  font-size: 0.85rem;
}
</style>
```

**Step 2: コミット**

```bash
cd /home/m-miyawaki/dev/lang-version-vocab
git add app/src/components/LearningPathSidebar.vue
git commit -m "feat: LearningPathSidebar コンポーネントを作成"
```

---

### Task 6: NodeDetailPanel コンポーネントを作成

**Files:**
- Create: `app/src/components/NodeDetailPanel.vue`

**Step 1: NodeDetailPanel を実装**

`app/src/components/NodeDetailPanel.vue` を作成:

```vue
<script setup>
const props = defineProps({
  node: { type: Object, required: true },
  overview: { type: Object, default: null },
  allTerms: { type: Array, default: () => [] },
  versions: { type: Array, default: () => [] }
})

const emit = defineEmits(['close', 'select-node'])

const levelConfig = {
  characteristic: { icon: '📘', label: '基礎', color: '#1976d2', bg: '#e3f2fd' },
  concept: { icon: '📗', label: '中級', color: '#2e7d32', bg: '#e8f5e9' },
  term: { icon: '📙', label: '実践', color: '#e65100', bg: '#fff3e0' }
}

function getRelatedConcepts() {
  if (props.node.level !== 'characteristic') return []
  if (!props.node.relatedConceptIds || !props.overview?.concepts) return []
  return props.overview.concepts.filter(c =>
    props.node.relatedConceptIds.includes(c.id)
  )
}

function getParentCharacteristic() {
  if (props.node.level !== 'concept') return null
  if (!props.node.characteristicId || !props.overview?.characteristics) return null
  return props.overview.characteristics.find(c => c.id === props.node.characteristicId)
}

function getRelatedTerms() {
  if (props.node.level !== 'concept') return []
  if (!props.node.relatedTermIds) return []
  return props.allTerms.filter(t => props.node.relatedTermIds.includes(t.id))
}

function getTermVersion() {
  if (props.node.level !== 'term') return null
  for (const v of props.versions) {
    if (v.terms.some(t => t.id === props.node.id)) {
      return v
    }
  }
  return null
}

function navigateTo(item, level) {
  emit('select-node', { ...item, level })
}
</script>

<template>
  <div class="detail-panel">
    <div class="detail-header">
      <div class="detail-title-row">
        <span
          class="level-badge"
          :style="{ background: levelConfig[node.level]?.bg, color: levelConfig[node.level]?.color }"
        >
          {{ levelConfig[node.level]?.icon }} {{ levelConfig[node.level]?.label }}
        </span>
        <button class="close-btn" @click="emit('close')" aria-label="閉じる">&times;</button>
      </div>
      <h2 class="detail-term">{{ node.term }}</h2>
      <p v-if="node.termJa" class="detail-term-ja">{{ node.termJa }}</p>
    </div>

    <!-- 特性の詳細 -->
    <template v-if="node.level === 'characteristic'">
      <div class="detail-section">
        <p class="detail-meaning">{{ node.meaning }}</p>
      </div>
      <div v-if="getRelatedConcepts().length" class="detail-section">
        <h3 class="section-label">関連する概念</h3>
        <div class="related-list">
          <button
            v-for="concept in getRelatedConcepts()"
            :key="concept.id"
            class="related-item concept-item"
            @click="navigateTo(concept, 'concept')"
          >
            <span class="related-icon">📗</span>
            <span class="related-name">{{ concept.termJa || concept.term }}</span>
          </button>
        </div>
      </div>
      <div v-if="node.sourceUrl" class="detail-section">
        <a :href="node.sourceUrl" target="_blank" rel="noopener" class="docs-link">ドキュメントを見る</a>
      </div>
    </template>

    <!-- 概念の詳細 -->
    <template v-if="node.level === 'concept'">
      <div v-if="getParentCharacteristic()" class="detail-section">
        <span class="parent-label">特性:</span>
        <button class="parent-link" @click="navigateTo(getParentCharacteristic(), 'characteristic')">
          📘 {{ getParentCharacteristic().termJa || getParentCharacteristic().term }}
        </button>
      </div>
      <div class="detail-section">
        <p class="detail-meaning">{{ node.meaning }}</p>
      </div>
      <div v-if="getRelatedTerms().length" class="detail-section">
        <h3 class="section-label">関連する用語</h3>
        <div class="related-list">
          <button
            v-for="term in getRelatedTerms()"
            :key="term.id"
            class="related-item term-item"
            @click="navigateTo(term, 'term')"
          >
            <span class="related-icon">📙</span>
            <div class="related-info">
              <span class="related-name">{{ term.termJa || term.term }}</span>
              <span class="related-sub">{{ term.term }}</span>
            </div>
          </button>
        </div>
      </div>
      <div v-if="node.sourceUrl" class="detail-section">
        <a :href="node.sourceUrl" target="_blank" rel="noopener" class="docs-link">ドキュメントを見る</a>
      </div>
    </template>

    <!-- 用語の詳細 -->
    <template v-if="node.level === 'term'">
      <div class="detail-section">
        <div class="term-badges">
          <span v-if="node.type" class="badge" :class="node.type">{{ node.type }}</span>
          <span v-if="node.category" class="badge category">{{ node.category }}</span>
        </div>
      </div>
      <div v-if="getTermVersion()" class="detail-section">
        <span class="version-info">{{ getTermVersion().version }} ({{ getTermVersion().releaseDate }})</span>
      </div>
      <div class="detail-section">
        <p class="detail-meaning">{{ node.meaning }}</p>
      </div>
      <div v-if="node.example" class="detail-section">
        <h3 class="section-label">コード例</h3>
        <pre class="code-example"><code>{{ node.example }}</code></pre>
      </div>
      <div v-if="node.tags && node.tags.length" class="detail-section">
        <div class="tags">
          <span v-for="tag in node.tags" :key="tag" class="tag">{{ tag }}</span>
        </div>
      </div>
      <div v-if="node.sourceUrl" class="detail-section">
        <a :href="node.sourceUrl" target="_blank" rel="noopener" class="docs-link">ドキュメントを見る</a>
      </div>
    </template>
  </div>
</template>

<style scoped>
.detail-panel {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  overflow: hidden;
}

.detail-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.detail-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.level-badge {
  font-size: 0.8rem;
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #999;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}

.close-btn:hover {
  color: #333;
}

.detail-term {
  font-size: 1.3rem;
  font-weight: 700;
  font-family: 'SF Mono', 'Fira Code', monospace;
  color: #1a1a1a;
}

.detail-term-ja {
  font-size: 1rem;
  color: #666;
  margin-top: 4px;
}

.detail-section {
  padding: 16px 24px;
  border-bottom: 1px solid #f5f5f5;
}

.detail-section:last-child {
  border-bottom: none;
}

.detail-meaning {
  color: #333;
  line-height: 1.7;
  font-size: 0.95rem;
}

.section-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #888;
  margin-bottom: 10px;
}

.related-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.related-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  background: #fff;
  cursor: pointer;
  transition: background 0.2s;
  text-align: left;
  width: 100%;
}

.related-item:hover {
  background: #f5f5f5;
}

.related-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.related-info {
  display: flex;
  flex-direction: column;
}

.related-name {
  font-weight: 600;
  font-size: 0.9rem;
}

.related-sub {
  font-size: 0.75rem;
  color: #888;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.parent-label {
  font-size: 0.85rem;
  color: #888;
  margin-right: 8px;
}

.parent-link {
  font-size: 0.9rem;
  color: #1976d2;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 600;
  padding: 0;
}

.parent-link:hover {
  text-decoration: underline;
}

.term-badges {
  display: flex;
  gap: 6px;
}

.badge {
  font-size: 0.75rem;
  padding: 3px 10px;
  border-radius: 12px;
  font-weight: 600;
}

.badge.syntax { background: #e3f2fd; color: #1565c0; }
.badge.api { background: #f3e5f5; color: #7b1fa2; }
.badge.concept { background: #e8f5e9; color: #2e7d32; }
.badge.deprecation { background: #fbe9e7; color: #bf360c; }
.badge.category { background: #fff3e0; color: #e65100; }

.version-info {
  font-size: 0.85rem;
  color: #1976d2;
  font-weight: 600;
}

.code-example {
  background: #f8f8f8;
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 12px 16px;
  overflow-x: auto;
}

.code-example code {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.85rem;
  color: #333;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  font-size: 0.75rem;
  padding: 3px 10px;
  border-radius: 4px;
  background: #f0f0f0;
  color: #555;
}

.docs-link {
  font-size: 0.85rem;
  color: #1976d2;
  text-decoration: none;
  font-weight: 500;
}

.docs-link:hover {
  text-decoration: underline;
}
</style>
```

**Step 2: コミット**

```bash
cd /home/m-miyawaki/dev/lang-version-vocab
git add app/src/components/NodeDetailPanel.vue
git commit -m "feat: NodeDetailPanel コンポーネントを作成"
```

---

### Task 7: App.vue を2カラムレイアウトに変更

**Files:**
- Modify: `app/src/App.vue`

**Step 1: App.vue を以下の内容に置き換え**

`app/src/App.vue` を以下に置き換え:

```vue
<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import SearchFilter from './components/SearchFilter.vue'
import TabNav from './components/TabNav.vue'
import OverviewTab from './components/OverviewTab.vue'
import TermList from './components/TermList.vue'
import LearningPathSidebar from './components/LearningPathSidebar.vue'
import NodeDetailPanel from './components/NodeDetailPanel.vue'

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
const selectedNode = ref(null)

watch(selectedLang, (newLang) => {
  langData.value = dataMap[newLang]
  searchQuery.value = ''
  selectedType.value = 'all'
  activeTab.value = 'overview'
  highlightTermId.value = null
  selectedNode.value = null
})

const allTerms = computed(() => {
  if (!langData.value?.versions) return []
  return langData.value.versions.flatMap(v => v.terms)
})

function handleSelectNode(node) {
  if (selectedNode.value && selectedNode.value.id === node.id) {
    selectedNode.value = null
  } else {
    selectedNode.value = node
  }
}

function closeDetail() {
  selectedNode.value = null
}

async function jumpToTerm(termId) {
  selectedNode.value = null
  activeTab.value = 'timeline'
  highlightTermId.value = termId
  await nextTick()
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

async function jumpToConcept(conceptId) {
  selectedNode.value = null
  activeTab.value = 'overview'
  await nextTick()
  const el = document.getElementById(`concept-${conceptId}`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('highlight')
    setTimeout(() => el.classList.remove('highlight'), 2000)
  }
}
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>Lang Version Vocab</h1>
    </header>
    <div class="app-body">
      <LearningPathSidebar
        :overview="langData.overview"
        :allTerms="allTerms"
        :selectedLang="selectedLang"
        :languages="languages"
        :selectedNodeId="selectedNode?.id || null"
        @update:selectedLang="selectedLang = $event"
        @select-node="handleSelectNode"
      />
      <main class="main-content">
        <template v-if="selectedNode">
          <NodeDetailPanel
            :node="selectedNode"
            :overview="langData.overview"
            :allTerms="allTerms"
            :versions="langData.versions || []"
            @close="closeDetail"
            @select-node="handleSelectNode"
          />
        </template>
        <template v-else>
          <SearchFilter
            v-model:searchQuery="searchQuery"
            v-model:selectedType="selectedType"
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
        </template>
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-header {
  padding: 16px 24px;
  max-width: 1200px;
  margin: 0 auto;
  height: 64px;
  display: flex;
  align-items: center;
}

.app-header h1 {
  font-size: 1.5rem;
  color: #1a1a1a;
}

.app-body {
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
}

.main-content {
  flex: 1;
  min-width: 0;
  padding: 16px 24px 32px;
}
</style>
```

**Step 2: ビルド確認**

Run: `cd /home/m-miyawaki/dev/lang-version-vocab/app && npx vite build 2>&1 | tail -10`
Expected: ビルド成功

**Step 3: コミット**

```bash
cd /home/m-miyawaki/dev/lang-version-vocab
git add app/src/App.vue
git commit -m "feat: App.vue を2カラムレイアウトに変更（サイドバー + メイン）"
```

---

### Task 8: LearningPathTab を削除

**Files:**
- Delete: `app/src/components/LearningPathTab.vue`

**Step 1: ファイルを削除**

Run: `rm /home/m-miyawaki/dev/lang-version-vocab/app/src/components/LearningPathTab.vue`

**Step 2: ビルド確認（import が残っていないことを確認）**

Run: `cd /home/m-miyawaki/dev/lang-version-vocab/app && npx vite build 2>&1 | tail -10`
Expected: ビルド成功（App.vue から import を既に除去済み）

**Step 3: コミット**

```bash
cd /home/m-miyawaki/dev/lang-version-vocab
git add -A
git commit -m "refactor: LearningPathTab を削除（サイドバーに置き換え済み）"
```

---

### Task 9: ブラウザで動作確認

**Files:**
- 変更なし（確認のみ）

**Step 1: 開発サーバーで確認**

Run: `cd /home/m-miyawaki/dev/lang-version-vocab/app && npx vite --open`

確認項目:
1. 左サイドバーに学習パスツリーが表示される
2. サイドバーの言語選択で言語を切り替えられる
3. 初心者/経験者モードが動作する
4. ツリーのノードをクリックすると右側に詳細パネルが表示される
5. 詳細パネルの × ボタンで閉じて通常のタブコンテンツに戻る
6. 詳細パネル内の関連ノードクリックで詳細が切り替わる
7. 同じノード再クリックで詳細パネルが閉じる
8. タブ（言語概要 / バージョン履歴）が正常に動作する
9. 検索・フィルタが正常に動作する

**Step 2: プロダクションビルド確認**

Run: `cd /home/m-miyawaki/dev/lang-version-vocab/app && npm run build && npx vite preview`
Expected: ビルド成功、プレビューで全機能動作
