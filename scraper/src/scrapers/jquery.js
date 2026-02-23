import { BaseScraper } from './base.js'
import { fetchWithRetry, sleep } from '../utils/fetcher.js'
import { parseHTML, extractText, generateId } from '../utils/parser.js'

export class JqueryScraper extends BaseScraper {
  constructor() {
    super('jquery', 'jQuery', 'https://api.jquery.com/')
  }

  async scrapeOverview() {
    console.log('Scraping jQuery overview...')

    const characteristics = [
      { id: 'jquery-char-dom-abstraction', term: 'DOM Abstraction', termJa: 'DOM 抽象化', meaning: 'ブラウザ間の DOM API の差異を吸収し、統一的なインターフェースでDOM操作を提供', relatedConceptIds: ['jquery-concept-dom-traversal', 'jquery-concept-dom-manipulation'], sourceUrl: 'https://api.jquery.com/' },
      { id: 'jquery-char-css-selectors', term: 'CSS Selector Engine', termJa: 'CSSセレクタエンジン', meaning: 'CSSセレクタ構文で要素を選択。Sizzle エンジンによる高速マッチング', relatedConceptIds: ['jquery-concept-selector', 'jquery-concept-filtering'], sourceUrl: 'https://api.jquery.com/category/selectors/' },
      { id: 'jquery-char-chaining', term: 'Method Chaining', termJa: 'メソッドチェーン', meaning: 'メソッドが jQuery オブジェクトを返すことで、連続したメソッド呼び出しが可能', relatedConceptIds: ['jquery-concept-dom-manipulation', 'jquery-concept-animation'], sourceUrl: '' },
      { id: 'jquery-char-cross-browser', term: 'Cross-browser Compatibility', termJa: 'クロスブラウザ互換性', meaning: '主要ブラウザ間の動作差異を吸収し、統一的に動作するコードを記述可能', relatedConceptIds: ['jquery-concept-ajax', 'jquery-concept-event-handling'], sourceUrl: '' },
      { id: 'jquery-char-plugin-system', term: 'Plugin Architecture', termJa: 'プラグインアーキテクチャ', meaning: '$.fn を拡張してカスタムメソッドを追加できるプラグインシステム', relatedConceptIds: ['jquery-concept-plugin'], sourceUrl: '' }
    ]

    const concepts = [
      { id: 'jquery-concept-selector', term: 'Selector', termJa: 'セレクタ', characteristicId: 'jquery-char-css-selectors', meaning: 'CSS セレクタやカスタムセレクタで DOM 要素を選択する機能。$("selector") 構文', relatedTermIds: [], sourceUrl: 'https://api.jquery.com/category/selectors/' },
      { id: 'jquery-concept-dom-traversal', term: 'DOM Traversal', termJa: 'DOM 走査', characteristicId: 'jquery-char-dom-abstraction', meaning: 'DOM ツリーを上下左右に移動して要素を取得。parent, children, find, siblings 等', relatedTermIds: [], sourceUrl: 'https://api.jquery.com/category/traversing/' },
      { id: 'jquery-concept-dom-manipulation', term: 'DOM Manipulation', termJa: 'DOM 操作', characteristicId: 'jquery-char-dom-abstraction', meaning: '要素の追加、削除、変更、複製などの DOM 操作。append, remove, html, text 等', relatedTermIds: [], sourceUrl: 'https://api.jquery.com/category/manipulation/' },
      { id: 'jquery-concept-event-handling', term: 'Event Handling', termJa: 'イベント処理', characteristicId: 'jquery-char-cross-browser', meaning: 'クロスブラウザ対応のイベント処理。on, off, trigger によるイベント管理', relatedTermIds: [], sourceUrl: 'https://api.jquery.com/category/events/' },
      { id: 'jquery-concept-event-delegation', term: 'Event Delegation', termJa: 'イベントデリゲーション', characteristicId: 'jquery-char-cross-browser', meaning: '親要素でイベントを監視し、子要素のイベントを効率的に処理する手法', relatedTermIds: [], sourceUrl: 'https://api.jquery.com/on/' },
      { id: 'jquery-concept-ajax', term: 'AJAX', termJa: '非同期通信', characteristicId: 'jquery-char-cross-browser', meaning: '非同期 HTTP リクエストの簡易API。$.ajax, $.get, $.post による通信', relatedTermIds: [], sourceUrl: 'https://api.jquery.com/category/ajax/' },
      { id: 'jquery-concept-animation', term: 'Animation', termJa: 'アニメーション', characteristicId: 'jquery-char-chaining', meaning: 'CSS プロパティのアニメーション。fadeIn, slideUp, animate 等', relatedTermIds: [], sourceUrl: 'https://api.jquery.com/category/effects/' },
      { id: 'jquery-concept-filtering', term: 'Filtering', termJa: 'フィルタリング', characteristicId: 'jquery-char-css-selectors', meaning: '選択した要素セットの絞り込み。filter, not, has, eq, first, last 等', relatedTermIds: [], sourceUrl: 'https://api.jquery.com/category/traversing/filtering/' },
      { id: 'jquery-concept-deferred', term: 'Deferred / Promise', termJa: '遅延オブジェクト', characteristicId: 'jquery-char-cross-browser', meaning: '非同期処理のための Promise パターン実装。$.Deferred() と done/fail/always チェーン', relatedTermIds: [], sourceUrl: 'https://api.jquery.com/category/deferred-object/' },
      { id: 'jquery-concept-plugin', term: 'Plugin Development', termJa: 'プラグイン開発', characteristicId: 'jquery-char-plugin-system', meaning: '$.fn.extend() でカスタムメソッドを追加するプラグイン開発パターン', relatedTermIds: [], sourceUrl: '' }
    ]

    return {
      description: 'DOM 操作、イベント処理、AJAX 通信を簡潔に記述するための JavaScript ライブラリ。CSSセレクタベースの要素選択とメソッドチェーンが特徴',
      characteristics,
      concepts
    }
  }

  async scrape() {
    const html = await fetchWithRetry('https://api.jquery.com/')
    const $ = parseHTML(html)

    // インデックスページの article から情報を取得
    const entries = []
    $('article').each((_, el) => {
      const $article = $(el)
      const $title = $article.find('h1.entry-title a')
      const name = extractText($title)
      const href = $title.attr('href')
      const category = extractText($article.find('.entry-meta .category a').first())
      const description = extractText($article.find('.entry-summary p').first())

      if (name && href) {
        entries.push({
          name,
          url: href.startsWith('http') ? href : `https://api.jquery.com${href}`,
          category,
          description
        })
      }
    })

    console.log(`Found ${entries.length} API entries to process`)

    // 各 API ページからバージョン情報を取得
    const termsByVersion = new Map()

    for (const entry of entries) {
      try {
        await sleep(300)
        const pageHtml = await fetchWithRetry(entry.url)
        const page$ = parseHTML(pageHtml)

        // version-details からバージョンを取得
        const versionText = page$('.version-details').first().text()
        const versionMatch = versionText.match(/version added:\s*([\d.]+)/i)
        if (!versionMatch) continue

        const version = versionMatch[1]
        if (!termsByVersion.has(version)) {
          termsByVersion.set(version, [])
        }

        termsByVersion.get(version).push({
          id: generateId('jquery', version, entry.name),
          term: entry.name,
          termJa: '',
          type: 'api',
          category: entry.category || 'general',
          meaning: entry.description,
          example: '',
          tags: [],
          sourceUrl: entry.url
        })
      } catch (error) {
        console.warn(`Failed to scrape ${entry.url}: ${error.message}`)
      }
    }

    // バージョンをソート（新しい順）
    const versions = Array.from(termsByVersion.entries())
      .sort((a, b) => {
        const va = a[0].split('.').map(Number)
        const vb = b[0].split('.').map(Number)
        for (let i = 0; i < Math.max(va.length, vb.length); i++) {
          const diff = (vb[i] || 0) - (va[i] || 0)
          if (diff !== 0) return diff
        }
        return 0
      })
      .map(([version, terms]) => ({
        version,
        releaseDate: this.getReleaseDateForVersion(version),
        terms
      }))

    return versions
  }

  getReleaseDateForVersion(version) {
    const dates = {
      '3.7': '2024-05', '3.6': '2023-01', '3.5': '2020-04',
      '3.4': '2019-04', '3.3': '2018-01', '3.2': '2017-03',
      '3.1': '2016-07', '3.0': '2016-06', '1.12': '2016-01',
      '1.11': '2014-01', '1.10': '2013-05', '1.9': '2013-01',
      '1.8': '2012-08', '1.7': '2011-11', '1.6': '2011-05',
      '1.5': '2011-01', '1.4': '2010-01', '1.3': '2009-01',
      '1.2': '2007-09', '1.1': '2007-01', '1.0': '2006-08'
    }
    return dates[version] || ''
  }
}
