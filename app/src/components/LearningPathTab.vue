<script setup>
import { ref, computed } from 'vue'
import RoadmapBranch from './RoadmapBranch.vue'

const props = defineProps({
  overview: { type: Object, default: null },
  allTerms: { type: Array, default: () => [] }
})

const emit = defineEmits(['jump-to-term', 'jump-to-concept', 'jump-to-characteristic'])

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
