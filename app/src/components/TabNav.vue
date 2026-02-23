<script setup>
defineProps({
  activeTab: { type: String, required: true }
})

const emit = defineEmits(['update:activeTab'])

const tabs = [
  { value: 'overview', label: '言語概要' },
  { value: 'learning-path', label: '学習パス' },
  { value: 'timeline', label: 'バージョン履歴' }
]
</script>

<template>
  <div class="tab-nav">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      class="tab-btn"
      :class="{ active: activeTab === tab.value }"
      @click="emit('update:activeTab', tab.value)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<style scoped>
.tab-nav {
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 0;
}

.tab-btn {
  padding: 10px 20px;
  border: none;
  background: none;
  font-size: 0.95rem;
  font-weight: 600;
  color: #888;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: color 0.2s, border-color 0.2s;
}

.tab-btn:hover {
  color: #555;
}

.tab-btn.active {
  color: #1976d2;
  border-bottom-color: #1976d2;
}
</style>
