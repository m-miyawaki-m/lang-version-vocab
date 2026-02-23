<script setup>
const props = defineProps({
  node: { type: Object, required: true },
  overview: { type: Object, default: null },
  allTerms: { type: Array, default: () => [] },
  versions: { type: Array, default: () => [] },
  specification: { type: Object, default: null }
})

const emit = defineEmits(['close', 'select-node'])

const levelConfig = {
  characteristic: { icon: '📘', label: '基礎', color: '#1976d2', bg: '#e3f2fd' },
  concept: { icon: '📗', label: '中級', color: '#2e7d32', bg: '#e8f5e9' },
  term: { icon: '📙', label: '実践', color: '#e65100', bg: '#fff3e0' },
  'spec-category': { icon: '📂', label: '仕様', color: '#7b1fa2', bg: '#f3e5f5' },
  'spec-item': { icon: '📄', label: '仕様', color: '#9c27b0', bg: '#f3e5f5' }
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
