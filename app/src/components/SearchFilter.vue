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
