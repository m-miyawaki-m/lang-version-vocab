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
    const container = document.querySelector('.main-content')
    if (container) {
      const elRect = el.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()
      container.scrollTo({
        top: container.scrollTop + elRect.top - containerRect.top - containerRect.height / 2,
        behavior: 'smooth'
      })
    }
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
    const container = document.querySelector('.main-content')
    if (container) {
      const elRect = el.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()
      container.scrollTo({
        top: container.scrollTop + elRect.top - containerRect.top - containerRect.height / 2,
        behavior: 'smooth'
      })
    }
    el.classList.add('highlight')
    setTimeout(() => el.classList.remove('highlight'), 2000)
  }
}
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>Lang Version Vocab <span class="breadcrumb-sep">&gt;</span> <span class="breadcrumb-lang">{{ langData.displayName }}</span></h1>
    </header>
    <div class="app-layout">
      <LearningPathSidebar
        :overview="langData.overview"
        :specification="langData.specification"
        :selectedLang="selectedLang"
        :languages="languages"
        :selectedNodeId="selectedNode?.id || null"
        @update:selectedLang="selectedLang = $event"
        @select-node="handleSelectNode"
      />
      <main class="main-content" :class="{ 'with-detail': selectedNode }">
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
      </main>
      <NodeDetailPanel
        v-if="selectedNode"
        :node="selectedNode"
        :overview="langData.overview"
        :specification="langData.specification"
        @close="closeDetail"
        @select-node="handleSelectNode"
      />
    </div>
  </div>
</template>

<style scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 48px;
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  padding: 0 24px;
  display: flex;
  align-items: center;
  z-index: 100;
}

.app-header h1 {
  font-size: 1.2rem;
  color: #1a1a1a;
  font-weight: 600;
}

.breadcrumb-sep {
  color: #bbb;
  margin: 0 6px;
  font-weight: 400;
}

.breadcrumb-lang {
  color: #555;
  font-weight: 500;
}

.app-layout {
  padding-top: 48px;
}

.main-content {
  margin-left: 280px;
  padding: 24px;
  min-height: calc(100vh - 48px);
  overflow-y: auto;
  transition: margin-right 0.2s ease;
}

.main-content.with-detail {
  margin-right: 360px;
}
</style>
