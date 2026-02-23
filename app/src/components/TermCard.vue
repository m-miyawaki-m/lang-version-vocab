<script setup>
const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})
</script>

<template>
  <div class="card">
    <div class="card-header">
      <span class="term">{{ item.term }}</span>
      <div class="badges">
        <span class="badge" :class="item.type">{{ item.type }}</span>
        <span v-if="item.category" class="badge category">{{ item.category }}</span>
      </div>
    </div>
    <p v-if="item.termJa" class="term-sub">{{ item.termJa }}</p>
    <p class="meaning">{{ item.meaning }}</p>
    <pre v-if="item.example" class="example"><code>{{ item.example }}</code></pre>
    <div v-if="item.tags && item.tags.length" class="tags">
      <span v-for="tag in item.tags" :key="tag" class="tag">{{ tag }}</span>
    </div>
    <div v-if="item.sourceUrl" class="card-footer">
      <a :href="item.sourceUrl" target="_blank" rel="noopener" class="source-link">Docs</a>
    </div>
  </div>
</template>

<style scoped>
.card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 8px;
  background: #fff;
  margin-left: 24px;
  border-left: 3px solid #ddd;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  gap: 8px;
}

.term {
  font-size: 1.05rem;
  font-weight: 700;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.badges {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.badge {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.badge.syntax {
  background: #e3f2fd;
  color: #1565c0;
}

.badge.api {
  background: #f3e5f5;
  color: #7b1fa2;
}

.badge.concept {
  background: #e8f5e9;
  color: #2e7d32;
}

.badge.deprecation {
  background: #fbe9e7;
  color: #bf360c;
}

.badge.category {
  background: #fff3e0;
  color: #e65100;
}

.term-sub {
  color: #666;
  font-size: 0.9rem;
  margin: 0 0 4px;
}

.meaning {
  color: #333;
  margin: 4px 0;
}

.example {
  background: #f8f8f8;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 8px 12px;
  margin: 8px 0;
  overflow-x: auto;
}

.example code {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.85rem;
  color: #333;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.tag {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 4px;
  background: #f0f0f0;
  color: #555;
}

.card-footer {
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
