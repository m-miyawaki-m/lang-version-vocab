# 学習パス（ロードマップ）機能 実装計画

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 既存の overview データから学習順序を自動導出し、ロードマップ形式のツリー表示を「学習パス」タブとして追加する。初心者・経験者の2ルート切替付き。

**Architecture:** フロントエンドのみの変更。既存の overview データ（characteristics → concepts → relatedTermIds）の関係性から3層ツリーを computed で自動生成。新タブ「学習パス」を TabNav に追加し、LearningPathTab / RoadmapBranch / RoadmapNode の3コンポーネントで表示。

**Tech Stack:** Vue 3 + Vite（フロントエンドのみ、スクレイパー変更なし）

**設計書:** `docs/plans/2026-02-23-learning-path-design.md`

---

### Task 1: TabNav に「学習パス」タブを追加

**Files:**
- Modify: `app/src/components/TabNav.vue:8-11`

**Step 1: タブ定義を変更**

`app/src/components/TabNav.vue` の tabs 配列に学習パスタブを追加:

変更前:
```javascript
const tabs = [
  { value: 'overview', label: '言語概要' },
  { value: 'timeline', label: 'バージョン履歴' }
]
```

変更後:
```javascript
const tabs = [
  { value: 'overview', label: '言語概要' },
  { value: 'learning-path', label: '学習パス' },
  { value: 'timeline', label: 'バージョン履歴' }
]
```

**Step 2: ビルド確認**

Run: `cd /home/miyaw/dev/lang-version-vocab/app && npx vite build 2>&1 | tail -5`
Expected: ビルド成功（LearningPathTab はまだ無いが、TabNav の変更だけならビルドは通る）

**Step 3: コミット**

```bash
cd /home/miyaw/dev/lang-version-vocab
git add app/src/components/TabNav.vue
git commit -m "feat: TabNav に学習パスタブを追加"
```

---

### Task 2: RoadmapNode コンポーネントを作成

**Files:**
- Create: `app/src/components/RoadmapNode.vue`

**Step 1: RoadmapNode を実装**

個別ノード。レベルに応じた色分け、クリックでジャンプイベント発火。

`app/src/components/RoadmapNode.vue` を作成:

```vue
<script setup>
defineProps({
  node: { type: Object, required: true },
  experienceMode: { type: Boolean, default: false }
})

const emit = defineEmits(['navigate'])

const levelConfig = {
  characteristic: { icon: '📘', label: '基礎', color: '#1976d2', bg: '#e3f2fd' },
  concept: { icon: '📗', label: '中級', color: '#2e7d32', bg: '#e8f5e9' },
  term: { icon: '📙', label: '実践', color: '#e65100', bg: '#fff3e0' }
}
</script>

<template>
  <div
    class="roadmap-node"
    :class="[node.level, { collapsed: experienceMode && node.level === 'characteristic' }]"
    @click="emit('navigate', node)"
  >
    <span class="node-icon">{{ levelConfig[node.level]?.icon }}</span>
    <div class="node-content">
      <span class="node-term">{{ node.termJa || node.term }}</span>
      <span class="node-term-en" v-if="node.termJa">{{ node.term }}</span>
    </div>
    <span
      class="node-level-badge"
      :style="{ background: levelConfig[node.level]?.bg, color: levelConfig[node.level]?.color }"
    >
      {{ levelConfig[node.level]?.label }}
    </span>
  </div>
</template>

<style scoped>
.roadmap-node {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
  background: #fff;
  border: 1px solid #e0e0e0;
}

.roadmap-node:hover {
  background: #f5f5f5;
  transform: translateX(2px);
}

.roadmap-node.characteristic {
  border-left: 3px solid #1976d2;
}

.roadmap-node.concept {
  border-left: 3px solid #2e7d32;
}

.roadmap-node.term {
  border-left: 3px solid #e65100;
}

.roadmap-node.collapsed {
  opacity: 0.6;
  padding: 6px 14px;
}

.roadmap-node.collapsed .node-term-en,
.roadmap-node.collapsed .node-level-badge {
  display: none;
}

.node-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}

.node-content {
  flex: 1;
  min-width: 0;
}

.node-term {
  font-weight: 600;
  font-size: 0.95rem;
  display: block;
}

.node-term-en {
  font-size: 0.8rem;
  color: #888;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.node-level-badge {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}
</style>
```

**Step 2: コミット**

```bash
cd /home/miyaw/dev/lang-version-vocab
git add app/src/components/RoadmapNode.vue
git commit -m "feat: RoadmapNode コンポーネントを作成"
```

---

### Task 3: RoadmapBranch コンポーネントを作成

**Files:**
- Create: `app/src/components/RoadmapBranch.vue`

**Step 1: RoadmapBranch を実装**

1つの特性ブランチ。特性→概念→文法のツリーを描画。

`app/src/components/RoadmapBranch.vue` を作成:

```vue
<script setup>
import RoadmapNode from './RoadmapNode.vue'

defineProps({
  characteristic: { type: Object, required: true },
  concepts: { type: Array, default: () => [] },
  experienceMode: { type: Boolean, default: false }
})

const emit = defineEmits(['navigate'])
</script>

<template>
  <div class="branch">
    <RoadmapNode
      :node="{ ...characteristic, level: 'characteristic' }"
      :experienceMode="experienceMode"
      @navigate="emit('navigate', $event)"
    />
    <div v-if="concepts.length" class="branch-children">
      <div v-for="concept in concepts" :key="concept.id" class="concept-branch">
        <div class="branch-line"></div>
        <div class="concept-group">
          <RoadmapNode
            :node="{ ...concept, level: 'concept' }"
            :experienceMode="experienceMode"
            @navigate="emit('navigate', $event)"
          />
          <div v-if="concept.terms && concept.terms.length" class="term-children">
            <div v-for="term in concept.terms" :key="term.id" class="term-branch">
              <div class="branch-line branch-line-small"></div>
              <RoadmapNode
                :node="{ ...term, level: 'term' }"
                :experienceMode="experienceMode"
                @navigate="emit('navigate', $event)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.branch {
  margin-bottom: 24px;
}

.branch-children {
  padding-left: 20px;
  position: relative;
}

.concept-branch {
  display: flex;
  gap: 0;
  margin-top: 6px;
}

.branch-line {
  width: 20px;
  min-height: 100%;
  position: relative;
  flex-shrink: 0;
}

.branch-line::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 50%;
  width: 2px;
  background: #ccc;
}

.branch-line::after {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 16px;
  height: 2px;
  background: #ccc;
}

.concept-group {
  flex: 1;
  min-width: 0;
}

.term-children {
  padding-left: 20px;
}

.term-branch {
  display: flex;
  gap: 0;
  margin-top: 4px;
}

.branch-line-small::before {
  background: #ddd;
}

.branch-line-small::after {
  background: #ddd;
  width: 12px;
}
</style>
```

**Step 2: コミット**

```bash
cd /home/miyaw/dev/lang-version-vocab
git add app/src/components/RoadmapBranch.vue
git commit -m "feat: RoadmapBranch コンポーネントを作成"
```

---

### Task 4: LearningPathTab コンポーネントを作成

**Files:**
- Create: `app/src/components/LearningPathTab.vue`

**Step 1: LearningPathTab を実装**

ロードマップ生成ロジック（computed）とルート切替を含むタブ本体。

`app/src/components/LearningPathTab.vue` を作成:

```vue
<script setup>
import { ref, computed } from 'vue'
import RoadmapBranch from './RoadmapBranch.vue'

const props = defineProps({
  overview: { type: Object, default: null },
  allTerms: { type: Array, default: () => [] }
})

const emit = defineEmits(['jump-to-term', 'jump-to-concept', 'jump-to-characteristic'])

const experienceMode = ref(false)

// 既存データから学習パスのツリー構造を自動生成
const roadmap = computed(() => {
  if (!props.overview) return []

  const characteristics = props.overview.characteristics || []
  const concepts = props.overview.concepts || []
  const terms = props.allTerms || []

  // 文法が既に配置済みか追跡（重複防止）
  const placedTermIds = new Set()

  return characteristics.map(char => {
    // この特性に紐づく概念を取得
    const relatedConcepts = concepts
      .filter(c => c.characteristicId === char.id)
      .map(concept => {
        // この概念に紐づく文法を取得（未配置のもののみ）
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
  if (node.level === 'characteristic') {
    emit('jump-to-characteristic', node.id)
  } else if (node.level === 'concept') {
    emit('jump-to-concept', node.id)
  } else if (node.level === 'term') {
    emit('jump-to-term', node.id)
  }
}
</script>

<template>
  <div v-if="overview" class="learning-path-tab">
    <div class="path-header">
      <p class="path-desc">
        既存の言語データから自動生成した学習ロードマップです。
        特性（基礎）→ 概念（中級）→ 文法（実践）の順に学べます。
      </p>
      <div class="mode-toggle">
        <button
          class="mode-btn"
          :class="{ active: !experienceMode }"
          @click="experienceMode = false"
        >
          👤 初心者
        </button>
        <button
          class="mode-btn"
          :class="{ active: experienceMode }"
          @click="experienceMode = true"
        >
          🚀 経験者
        </button>
      </div>
    </div>

    <div class="roadmap">
      <RoadmapBranch
        v-for="branch in roadmap"
        :key="branch.characteristic.id"
        :characteristic="branch.characteristic"
        :concepts="branch.concepts"
        :experienceMode="experienceMode"
        @navigate="handleNavigate"
      />
    </div>

    <p v-if="roadmap.length === 0" class="empty">学習パスデータがありません</p>
  </div>
  <div v-else class="empty">
    <p>この言語の学習パスはまだありません</p>
  </div>
</template>

<style scoped>
.learning-path-tab {
  padding-top: 8px;
}

.path-header {
  margin-bottom: 20px;
}

.path-desc {
  color: #555;
  line-height: 1.6;
  margin-bottom: 12px;
}

.mode-toggle {
  display: flex;
  gap: 8px;
}

.mode-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 20px;
  background: #fff;
  font-size: 0.85rem;
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

.roadmap {
  padding-top: 8px;
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
git add app/src/components/LearningPathTab.vue
git commit -m "feat: LearningPathTab コンポーネントを作成（ロードマップ自動生成ロジック含む）"
```

---

### Task 5: App.vue に LearningPathTab を統合

**Files:**
- Modify: `app/src/App.vue`

**Step 1: import を追加**

`app/src/App.vue` の import セクション（4行目付近）に追加:

変更前:
```javascript
import OverviewTab from './components/OverviewTab.vue'
import TermList from './components/TermList.vue'
```

変更後:
```javascript
import OverviewTab from './components/OverviewTab.vue'
import LearningPathTab from './components/LearningPathTab.vue'
import TermList from './components/TermList.vue'
```

**Step 2: ジャンプ関数を追加**

`app/src/App.vue` の `jumpToTerm` 関数の後に2つの関数を追加:

```javascript
async function jumpToCharacteristic(charId) {
  activeTab.value = 'overview'
  await nextTick()
  // overview タブ内の CharacteristicCard は直接 id を持たないが、
  // 特性セクションの先頭にスクロール
  const el = document.querySelector('.overview-tab .section:first-child')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

async function jumpToConcept(conceptId) {
  activeTab.value = 'overview'
  await nextTick()
  const el = document.getElementById(`concept-${conceptId}`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('highlight')
    setTimeout(() => el.classList.remove('highlight'), 2000)
  }
}
```

**Step 3: テンプレートに LearningPathTab を追加**

`app/src/App.vue` のテンプレート内、`<OverviewTab>` と `<TermList>` の間に追加:

変更前:
```html
      <OverviewTab
        v-if="activeTab === 'overview'"
        :overview="langData.overview"
        :allTerms="allTerms"
        @jump-to-term="jumpToTerm"
      />
      <TermList
```

変更後:
```html
      <OverviewTab
        v-if="activeTab === 'overview'"
        :overview="langData.overview"
        :allTerms="allTerms"
        @jump-to-term="jumpToTerm"
      />
      <LearningPathTab
        v-if="activeTab === 'learning-path'"
        :overview="langData.overview"
        :allTerms="allTerms"
        @jump-to-term="jumpToTerm"
        @jump-to-concept="jumpToConcept"
        @jump-to-characteristic="jumpToCharacteristic"
      />
      <TermList
```

**Step 4: ビルド確認**

Run: `cd /home/miyaw/dev/lang-version-vocab/app && npm run build 2>&1 | tail -5`
Expected: ビルド成功

**Step 5: コミット**

```bash
cd /home/miyaw/dev/lang-version-vocab
git add app/src/App.vue
git commit -m "feat: App.vue に LearningPathTab を統合（ジャンプ機能含む）"
```

---

### Task 6: ビルド・動作確認・プッシュ

**Files:**
- 変更なし（確認とデプロイのみ）

**Step 1: ビルド**

Run: `cd /home/miyaw/dev/lang-version-vocab/app && npm run build`
Expected: エラーなくビルド完了

**Step 2: 動作確認項目**

ブラウザで以下を確認:
- 3タブ（言語概要 / 学習パス / バージョン履歴）が表示される
- 「学習パス」タブでロードマップが表示される
- 各言語を切り替えるとロードマップが更新される
- 「👤 初心者」「🚀 経験者」切替で表示が変わる
- ノードクリックで該当タブにジャンプする

**Step 3: プッシュ**

```bash
cd /home/miyaw/dev/lang-version-vocab
git push origin main
```

Expected: GitHub Actions で GitHub Pages が更新される。
URL: https://m-miyawaki-m.github.io/lang-version-vocab/
