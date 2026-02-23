<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  overview: { type: Object, default: null },
  allTerms: { type: Array, default: () => [] },
  selectedLang: { type: String, default: 'javascript' },
  languages: { type: Array, default: () => [] },
  selectedNodeId: { type: String, default: null }
})

const emit = defineEmits(['update:selectedLang', 'select-node'])

const experienceMode = ref(false)
const collapsedChars = ref(new Set())

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

        return { ...concept, terms: relatedTerms }
      })

    return { characteristic: char, concepts: relatedConcepts }
  })
})

function toggleCollapse(charId) {
  const next = new Set(collapsedChars.value)
  if (next.has(charId)) {
    next.delete(charId)
  } else {
    next.add(charId)
  }
  collapsedChars.value = next
}

function isCollapsed(charId) {
  return collapsedChars.value.has(charId)
}

function selectNode(item, level) {
  emit('select-node', { ...item, level })
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

    <nav class="sidebar-tree">
      <ul class="tree-root">
        <li v-for="branch in roadmap" :key="branch.characteristic.id" class="tree-branch">
          <!-- 特性 -->
          <div
            class="tree-item char-item"
            :class="{ active: selectedNodeId === branch.characteristic.id }"
          >
            <button
              class="collapse-toggle"
              @click.stop="toggleCollapse(branch.characteristic.id)"
              :aria-expanded="!isCollapsed(branch.characteristic.id)"
            >
              <span class="collapse-icon">{{ isCollapsed(branch.characteristic.id) ? '▶' : '▼' }}</span>
            </button>
            <span
              class="dot dot-char"
            ></span>
            <button
              class="tree-label char-label"
              @click="selectNode(branch.characteristic, 'characteristic')"
            >
              {{ branch.characteristic.termJa || branch.characteristic.term }}
            </button>
          </div>

          <!-- 概念 + 用語 -->
          <ul
            v-if="!isCollapsed(branch.characteristic.id) && branch.concepts.length"
            class="tree-children"
          >
            <li v-for="concept in branch.concepts" :key="concept.id" class="tree-child">
              <div
                class="tree-item concept-item"
                :class="{ active: selectedNodeId === concept.id }"
              >
                <span class="dot dot-concept"></span>
                <button
                  class="tree-label concept-label"
                  @click="selectNode(concept, 'concept')"
                >
                  {{ concept.termJa || concept.term }}
                </button>
              </div>

              <ul
                v-if="!experienceMode && concept.terms && concept.terms.length"
                class="tree-children"
              >
                <li v-for="term in concept.terms" :key="term.id">
                  <div
                    class="tree-item term-item"
                    :class="{ active: selectedNodeId === term.id }"
                  >
                    <span class="dot dot-term"></span>
                    <button
                      class="tree-label term-label"
                      @click="selectNode(term, 'term')"
                    >
                      {{ term.termJa || term.term }}
                    </button>
                  </div>
                </li>
              </ul>
            </li>
          </ul>
        </li>
      </ul>
      <p v-if="roadmap.length === 0" class="empty">データなし</p>
    </nav>
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

/* ツリー構造 */
.sidebar-tree {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.tree-root {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tree-branch {
  margin-bottom: 2px;
}

.tree-children {
  list-style: none;
  padding: 0 0 0 12px;
  margin: 0;
  border-left: 1px solid #ddd;
  margin-left: 19px;
}

.tree-child {
  margin: 0;
}

/* ツリーアイテム共通 */
.tree-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 4px;
  margin: 1px 8px 1px 0;
  transition: background 0.15s;
}

.tree-item:hover {
  background: #eeeeee;
}

.tree-item.active {
  background: #e3f2fd;
}

/* ドットインジケータ */
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-char {
  background: #1976d2;
}

.dot-concept {
  background: #2e7d32;
  width: 6px;
  height: 6px;
}

.dot-term {
  background: #e65100;
  width: 5px;
  height: 5px;
}

/* 折りたたみトグル */
.collapse-toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  color: #999;
  font-size: 0.6rem;
  width: 12px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.collapse-toggle:hover {
  color: #555;
}

/* ラベル */
.tree-label {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  text-align: left;
  font-size: 0.85rem;
  color: #333;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.tree-label:hover {
  color: #1976d2;
}

.char-label {
  font-weight: 700;
  font-size: 0.85rem;
  color: #1a1a1a;
}

.concept-label {
  font-weight: 500;
  font-size: 0.82rem;
  color: #444;
}

.term-label {
  font-weight: 400;
  font-size: 0.78rem;
  color: #666;
}

.empty {
  text-align: center;
  color: #999;
  padding: 20px 0;
  font-size: 0.85rem;
}
</style>
