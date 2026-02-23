<script setup>
defineProps({
  searchQuery: { type: String, default: '' },
  selectedLang: { type: String, default: 'javascript' },
  selectedType: { type: String, default: 'all' },
  languages: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:searchQuery', 'update:selectedLang', 'update:selectedType'])

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
    <select
      class="filter-select lang-select"
      :value="selectedLang"
      @change="emit('update:selectedLang', $event.target.value)"
    >
      <option v-for="lang in languages" :key="lang.value" :value="lang.value">
        {{ lang.label }}
      </option>
    </select>
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

.lang-select {
  font-weight: 600;
}
</style>
