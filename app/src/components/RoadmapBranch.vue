<script setup>
import RoadmapNode from './RoadmapNode.vue'

defineProps({
  characteristic: { type: Object, required: true },
  concepts: { type: Array, default: () => [] },
  experienceMode: { type: Boolean, default: false },
  selectedNodeId: { type: String, default: null }
})

const emit = defineEmits(['navigate'])
</script>

<template>
  <div class="branch">
    <RoadmapNode
      :node="{ ...characteristic, level: 'characteristic' }"
      :experienceMode="experienceMode"
      :isActive="selectedNodeId === characteristic.id"
      @navigate="emit('navigate', $event)"
    />
    <div v-if="concepts.length" class="branch-children">
      <div v-for="concept in concepts" :key="concept.id" class="concept-branch">
        <div class="branch-line"></div>
        <div class="concept-group">
          <RoadmapNode
            :node="{ ...concept, level: 'concept' }"
            :experienceMode="experienceMode"
            :isActive="selectedNodeId === concept.id"
            @navigate="emit('navigate', $event)"
          />
          <div v-if="concept.terms && concept.terms.length" class="term-children">
            <div v-for="term in concept.terms" :key="term.id" class="term-branch">
              <div class="branch-line branch-line-small"></div>
              <RoadmapNode
                :node="{ ...term, level: 'term' }"
                :experienceMode="experienceMode"
                :isActive="selectedNodeId === term.id"
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
