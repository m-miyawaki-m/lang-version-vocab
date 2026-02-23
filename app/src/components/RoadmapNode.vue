<script setup>
defineProps({
  node: { type: Object, required: true },
  experienceMode: { type: Boolean, default: false }
})

const emit = defineEmits(['navigate'])

const levelConfig = {
  characteristic: { icon: '📘', label: '基礎', color: '#1976d2', bg: '#e3f2fd' },
  concept: { icon: '📗', label: '中級', color: '#2e7d32', bg: '#e8f5e9' },
  term: { icon: '📙', label: '実践', color: '#e65100', bg: '#fff3e0' }
}
</script>

<template>
  <div
    class="roadmap-node"
    :class="[node.level, { collapsed: experienceMode && node.level === 'characteristic' }]"
    @click="emit('navigate', node)"
  >
    <span class="node-icon">{{ levelConfig[node.level]?.icon }}</span>
    <div class="node-content">
      <span class="node-term">{{ node.termJa || node.term }}</span>
      <span class="node-term-en" v-if="node.termJa">{{ node.term }}</span>
    </div>
    <span
      class="node-level-badge"
      :style="{ background: levelConfig[node.level]?.bg, color: levelConfig[node.level]?.color }"
    >
      {{ levelConfig[node.level]?.label }}
    </span>
  </div>
</template>

<style scoped>
.roadmap-node {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
  background: #fff;
  border: 1px solid #e0e0e0;
}

.roadmap-node:hover {
  background: #f5f5f5;
  transform: translateX(2px);
}

.roadmap-node.characteristic {
  border-left: 3px solid #1976d2;
}

.roadmap-node.concept {
  border-left: 3px solid #2e7d32;
}

.roadmap-node.term {
  border-left: 3px solid #e65100;
}

.roadmap-node.collapsed {
  opacity: 0.6;
  padding: 6px 14px;
}

.roadmap-node.collapsed .node-term-en,
.roadmap-node.collapsed .node-level-badge {
  display: none;
}

.node-icon {
  font-size: 1.1rem;
  flex-shrink: 0;
}

.node-content {
  flex: 1;
  min-width: 0;
}

.node-term {
  font-weight: 600;
  font-size: 0.95rem;
  display: block;
}

.node-term-en {
  font-size: 0.8rem;
  color: #888;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.node-level-badge {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}
</style>
