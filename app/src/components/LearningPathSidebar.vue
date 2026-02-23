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
