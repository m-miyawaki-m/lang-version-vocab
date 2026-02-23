<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import SearchFilter from './components/SearchFilter.vue'
import TabNav from './components/TabNav.vue'
import OverviewTab from './components/OverviewTab.vue'
import TermList from './components/TermList.vue'

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
const activeTab = ref(langData.value.overview ? 'overview' : 'timeline')
const highlightTermId = ref(null)

watch(selectedLang, (newLang) => {
  langData.value = dataMap[newLang]
  searchQuery.value = ''
  selectedType.value = 'all'
  activeTab.value = langData.value.overview ? 'overview' : 'timeline'
  highlightTermId.value = null
})

const allTerms = computed(() => {
  if (!langData.value?.versions) return []
  return langData.value.versions.flatMap(v => v.terms)
})

async function jumpToTerm(termId) {
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
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>Lang Version Vocab</h1>
    </header>
    <main class="main-content">
      <SearchFilter
        v-model:searchQuery="searchQuery"
        v-model:selectedLang="selectedLang"
        v-model:selectedType="selectedType"
        :languages="languages"
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
  </div>
</template>

<style scoped>
.app-header {
  padding: 24px 16px;
  max-width: 720px;
  margin: 0 auto;
}

.app-header h1 {
  font-size: 1.5rem;
  color: #1a1a1a;
}

.main-content {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 16px 32px;
}
</style>
