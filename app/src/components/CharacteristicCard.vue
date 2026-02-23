<script setup>
defineProps({
  item: { type: Object, required: true },
  concepts: { type: Array, default: () => [] }
})

const emit = defineEmits(['scroll-to-concept'])

const relatedConcepts = (item, concepts) => {
  if (!item.relatedConceptIds) return []
  return concepts.filter(c => item.relatedConceptIds.includes(c.id))
}
</script>

<template>
  <div class="char-card">
    <div class="char-header">
      <span class="char-term">{{ item.term }}</span>
    </div>
    <p v-if="item.termJa" class="char-term-ja">{{ item.termJa }}</p>
    <p class="char-meaning">{{ item.meaning }}</p>
    <div v-if="relatedConcepts(item, concepts).length" class="related-concepts">
      <span class="related-label">関連概念:</span>
      <button
        v-for="concept in relatedConcepts(item, concepts)"
        :key="concept.id"
        class="concept-badge"
        @click="emit('scroll-to-concept', concept.id)"
      >
        {{ concept.termJa || concept.term }}
      </button>
    </div>
    <div v-if="item.sourceUrl" class="char-footer">
      <a :href="item.sourceUrl" target="_blank" rel="noopener" class="source-link">Docs</a>
    </div>
  </div>
</template>

<style scoped>
.char-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 8px;
  background: #fff;
  border-left: 3px solid #1976d2;
}

.char-header {
  margin-bottom: 4px;
}

.char-term {
  font-size: 1.05rem;
  font-weight: 700;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.char-term-ja {
  color: #666;
  font-size: 0.9rem;
  margin: 0 0 4px;
}

.char-meaning {
  color: #333;
  margin: 4px 0;
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

.concept-badge {
  font-size: 0.75rem;
  padding: 3px 10px;
  border-radius: 12px;
  background: #e8f5e9;
  color: #2e7d32;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.concept-badge:hover {
  background: #c8e6c9;
}

.char-footer {
  margin-top: 8px;
}

.source-link {
  font-size: 0.8rem;
  color: #1976d2;
  text-decoration: none;
}

.source-link:hover {
  text-decoration: underline;
}
</style>
