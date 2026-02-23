<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import SearchFilter from './components/SearchFilter.vue'
import TabNav from './components/TabNav.vue'
import OverviewTab from './components/OverviewTab.vue'
import TermList from './components/TermList.vue'
import LearningPathSidebar from './components/LearningPathSidebar.vue'
import NodeDetailPanel from './components/NodeDetailPanel.vue'

import javascriptData from '@data/javascript.json'
import javaData from '@data/java.json'
import jqueryData from '@data/jquery.json'

const dataMap = {
  javascript: javascriptData,
  java: javaData,
  jquery: jqueryData
}

const languages = Object.entries(dataMap).map(([key, data]) => ({
  value: key,
  label: data.displayName
}))

const searchQuery = ref('')
const selectedType = ref('all')
const selectedLang = ref('javascript')
const langData = ref(dataMap['javascript'])
const activeTab = ref('overview')
const highlightTermId = ref(null)
const selectedNode = ref(null)

watch(selectedLang, (newLang) => {
  langData.value = dataMap[newLang]
  searchQuery.value = ''
  selectedType.value = 'all'
  activeTab.value = 'overview'
  highlightTermId.value = null
  selectedNode.value = null
})

const allTerms = computed(() => {
  if (!langData.value?.versions) return []
  return langData.value.versions.flatMap(v => v.terms)
})

function handleSelectNode(node) {
  if (selectedNode.value && selectedNode.value.id === node.id) {
    selectedNode.value = null
  } else {
    selectedNode.value = node
  }
}

function closeDetail() {
  selectedNode.value = null
}

async function jumpToTerm(termId) {
  selectedNode.value = null
  activeTab.value = 'timeline'
  highlightTermId.value = termId
  await nextTick()
  const el = document.getElementById(`term-${termId}`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('highlight')
    setTimeout(() => {
      el.classList.remove('highlight')
      highlightTermId.value = null
    }, 2000)
  }
}

async function jumpToConcept(conceptId) {
  selectedNode.value = null
  activeTab.value = 'overview'
  await nextTick()
  const el = document.getElementById(`concept-${conceptId}`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('highlight')
    setTimeout(() => el.classList.remove('highlight'), 2000)
  }
}
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>Lang Version Vocab</h1>
    </header>
    <div class="app-body">
      <LearningPathSidebar
        :overview="langData.overview"
        :specification="langData.specification"
        :selectedLang="selectedLang"
        :languages="languages"
        :selectedNodeId="selectedNode?.id || null"
        @update:selectedLang="selectedLang = $event"
        @select-node="handleSelectNode"
      />
      <main class="main-content">
        <template v-if="selectedNode">
          <NodeDetailPanel
            :node="selectedNode"
            :overview="langData.overview"
            :specification="langData.specification"
            @close="closeDetail"
            @select-node="handleSelectNode"
          />
        </template>
        <template v-else>
          <SearchFilter
            v-model:searchQuery="searchQuery"
            v-model:selectedType="selectedType"
          />
          <TabNav v-model:activeTab="activeTab" />
          <OverviewTab
            v-if="activeTab === 'overview'"
            :overview="langData.overview"
            :allTerms="allTerms"
            @jump-to-term="jumpToTerm"
          />
          <TermList
            v-if="activeTab === 'timeline'"
            :langData="langData"
            :searchQuery="searchQuery"
            :selectedType="selectedType"
          />
        </template>
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-header {
  padding: 16px 24px;
  max-width: 1200px;
  margin: 0 auto;
  height: 64px;
  display: flex;
  align-items: center;
}

.app-header h1 {
  font-size: 1.5rem;
  color: #1a1a1a;
}

.app-body {
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
}

.main-content {
  flex: 1;
  min-width: 0;
  padding: 16px 24px 32px;
}
</style>
