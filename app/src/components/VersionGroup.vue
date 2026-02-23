<script setup>
import TermCard from './TermCard.vue'

defineProps({
  version: { type: String, required: true },
  releaseDate: { type: String, default: '' },
  terms: { type: Array, required: true }
})
</script>

<template>
  <div class="version-group">
    <div class="version-header">
      <div class="version-marker"></div>
      <h2 class="version-title">{{ version }}</h2>
      <span v-if="releaseDate" class="release-date">{{ releaseDate }}</span>
      <span class="term-count">{{ terms.length }}件</span>
    </div>
    <div class="version-terms">
      <TermCard v-for="term in terms" :key="term.id" :item="term" />
    </div>
  </div>
</template>

<style scoped>
.version-group {
  margin-bottom: 24px;
  position: relative;
}

.version-group::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 32px;
  bottom: 0;
  width: 2px;
  background: #e0e0e0;
}

.version-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  position: relative;
}

.version-marker {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #1976d2;
  flex-shrink: 0;
}

.version-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #1a1a1a;
}

.release-date {
  font-size: 0.85rem;
  color: #888;
}

.term-count {
  font-size: 0.8rem;
  color: #999;
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 10px;
}

.version-terms {
  padding-left: 18px;
  padding-top: 8px;
}
</style>
