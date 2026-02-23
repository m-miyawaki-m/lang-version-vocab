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
