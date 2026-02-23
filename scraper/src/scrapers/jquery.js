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

  async scrapeSpecification() {
    console.log('Building jQuery specification...')

    return {
      categories: [
        {
          id: 'jquery-spec-selectors',
          name: 'Selectors',
          nameJa: 'セレクタ',
          items: [
            { id: 'jquery-spec-id-selector', term: 'ID Selector (#id)', termJa: 'IDセレクタ', meaning: 'id 属性で要素を選択。ページ内で一意', example: '$("#myId")', sourceUrl: 'https://api.jquery.com/id-selector/' },
            { id: 'jquery-spec-class-selector', term: 'Class Selector (.class)', termJa: 'クラスセレクタ', meaning: 'class 属性で要素を選択。複数要素にマッチ', example: '$(".myClass")', sourceUrl: 'https://api.jquery.com/class-selector/' },
            { id: 'jquery-spec-element-selector', term: 'Element Selector (element)', termJa: '要素セレクタ', meaning: 'タグ名で要素を選択', example: '$("div")', sourceUrl: 'https://api.jquery.com/element-selector/' },
            { id: 'jquery-spec-attribute-selector', term: 'Attribute Selector ([attr])', termJa: '属性セレクタ', meaning: '属性の有無や値で要素を選択', example: '$("input[type=text]")', sourceUrl: 'https://api.jquery.com/attribute-equals-selector/' },
            { id: 'jquery-spec-pseudo-selectors', term: ':first, :last, :eq()', termJa: '疑似セレクタ', meaning: 'jQuery 独自の位置ベース疑似セレクタ', example: '$("li:first")\n$("li:eq(2)")', sourceUrl: 'https://api.jquery.com/first-selector/' }
          ]
        },
        {
          id: 'jquery-spec-dom-manipulation',
          name: 'DOM Manipulation',
          nameJa: 'DOM操作',
          items: [
            { id: 'jquery-spec-html', term: '.html()', termJa: '.html()', meaning: '要素の HTML コンテンツを取得・設定', example: '$("#el").html();\n$("#el").html("<b>new</b>");', sourceUrl: 'https://api.jquery.com/html/' },
            { id: 'jquery-spec-text', term: '.text()', termJa: '.text()', meaning: '要素のテキストコンテンツを取得・設定', example: '$("#el").text();\n$("#el").text("new text");', sourceUrl: 'https://api.jquery.com/text/' },
            { id: 'jquery-spec-val', term: '.val()', termJa: '.val()', meaning: 'フォーム要素の値を取得・設定', example: '$("input").val();\n$("input").val("new value");', sourceUrl: 'https://api.jquery.com/val/' },
            { id: 'jquery-spec-append', term: '.append() / .prepend()', termJa: '.append() / .prepend()', meaning: '要素の末尾/先頭にコンテンツを追加', example: '$("#list").append("<li>new</li>");', sourceUrl: 'https://api.jquery.com/append/' },
            { id: 'jquery-spec-remove', term: '.remove()', termJa: '.remove()', meaning: '要素をDOMから削除', example: '$(".item").remove();', sourceUrl: 'https://api.jquery.com/remove/' }
          ]
        },
        {
          id: 'jquery-spec-traversal',
          name: 'Traversal',
          nameJa: '走査',
          items: [
            { id: 'jquery-spec-find', term: '.find()', termJa: '.find()', meaning: '子孫要素からセレクタに一致する要素を検索', example: '$("#container").find(".item")', sourceUrl: 'https://api.jquery.com/find/' },
            { id: 'jquery-spec-children', term: '.children()', termJa: '.children()', meaning: '直接の子要素を取得', example: '$("#list").children("li")', sourceUrl: 'https://api.jquery.com/children/' },
            { id: 'jquery-spec-parent', term: '.parent() / .parents()', termJa: '.parent() / .parents()', meaning: '直接の親要素 / すべての祖先要素を取得', example: '$(".item").parent();\n$(".item").parents("div");', sourceUrl: 'https://api.jquery.com/parent/' },
            { id: 'jquery-spec-siblings', term: '.siblings()', termJa: '.siblings()', meaning: '兄弟要素を取得', example: '$(".active").siblings()', sourceUrl: 'https://api.jquery.com/siblings/' },
            { id: 'jquery-spec-closest', term: '.closest()', termJa: '.closest()', meaning: '自身から祖先方向に最も近い一致要素を取得', example: '$("td").closest("table")', sourceUrl: 'https://api.jquery.com/closest/' }
          ]
        },
        {
          id: 'jquery-spec-events',
          name: 'Events',
          nameJa: 'イベント',
          items: [
            { id: 'jquery-spec-on', term: '.on()', termJa: '.on()', meaning: 'イベントハンドラを登録。イベントデリゲーションにも対応', example: '$("#btn").on("click", function() {\n  alert("clicked");\n});', sourceUrl: 'https://api.jquery.com/on/' },
            { id: 'jquery-spec-off', term: '.off()', termJa: '.off()', meaning: 'イベントハンドラを解除', example: '$("#btn").off("click");', sourceUrl: 'https://api.jquery.com/off/' },
            { id: 'jquery-spec-trigger', term: '.trigger()', termJa: '.trigger()', meaning: 'イベントをプログラム的に発火', example: '$("#form").trigger("submit");', sourceUrl: 'https://api.jquery.com/trigger/' },
            { id: 'jquery-spec-ready', term: '$(document).ready()', termJa: 'DOM Ready', meaning: 'DOM の読み込み完了後に処理を実行', example: '$(document).ready(function() {\n  // DOM ready\n});\n// 省略形: $(function() { });', sourceUrl: 'https://api.jquery.com/ready/' }
          ]
        },
        {
          id: 'jquery-spec-effects',
          name: 'Effects',
          nameJa: 'エフェクト',
          items: [
            { id: 'jquery-spec-show-hide', term: '.show() / .hide()', termJa: '.show() / .hide()', meaning: '要素の表示/非表示を切り替え', example: '$("#el").show();\n$("#el").hide();', sourceUrl: 'https://api.jquery.com/show/' },
            { id: 'jquery-spec-fade', term: '.fadeIn() / .fadeOut()', termJa: '.fadeIn() / .fadeOut()', meaning: 'フェードイン/フェードアウトで表示/非表示', example: '$("#el").fadeIn(400);\n$("#el").fadeOut(400);', sourceUrl: 'https://api.jquery.com/fadeIn/' },
            { id: 'jquery-spec-slide', term: '.slideUp() / .slideDown()', termJa: '.slideUp() / .slideDown()', meaning: 'スライドアニメーションで表示/非表示', example: '$("#el").slideDown();\n$("#el").slideUp();', sourceUrl: 'https://api.jquery.com/slideDown/' },
            { id: 'jquery-spec-animate', term: '.animate()', termJa: '.animate()', meaning: 'CSSプロパティのカスタムアニメーション', example: '$("#el").animate({\n  opacity: 0.5,\n  left: "200px"\n}, 1000);', sourceUrl: 'https://api.jquery.com/animate/' }
          ]
        },
        {
          id: 'jquery-spec-ajax',
          name: 'AJAX',
          nameJa: '通信',
          items: [
            { id: 'jquery-spec-ajax', term: '$.ajax()', termJa: '$.ajax()', meaning: '非同期HTTPリクエストの汎用メソッド。最も柔軟', example: '$.ajax({\n  url: "/api/data",\n  method: "GET",\n  success: function(data) { /* ... */ }\n});', sourceUrl: 'https://api.jquery.com/jQuery.ajax/' },
            { id: 'jquery-spec-get', term: '$.get()', termJa: '$.get()', meaning: 'GET リクエストの簡略メソッド', example: '$.get("/api/data", function(data) {\n  console.log(data);\n});', sourceUrl: 'https://api.jquery.com/jQuery.get/' },
            { id: 'jquery-spec-post', term: '$.post()', termJa: '$.post()', meaning: 'POST リクエストの簡略メソッド', example: '$.post("/api/data", { name: "test" }, function(res) {\n  console.log(res);\n});', sourceUrl: 'https://api.jquery.com/jQuery.post/' },
            { id: 'jquery-spec-getjson', term: '$.getJSON()', termJa: '$.getJSON()', meaning: 'JSON データを GET で取得する簡略メソッド', example: '$.getJSON("/api/data.json", function(data) {\n  console.log(data);\n});', sourceUrl: 'https://api.jquery.com/jQuery.getJSON/' }
          ]
        },
        {
          id: 'jquery-spec-utilities',
          name: 'Utilities',
          nameJa: 'ユーティリティ',
          items: [
            { id: 'jquery-spec-each', term: '$.each()', termJa: '$.each()', meaning: '配列やオブジェクトの各要素に対して関数を実行', example: '$.each([1, 2, 3], function(i, val) {\n  console.log(i, val);\n});', sourceUrl: 'https://api.jquery.com/jQuery.each/' },
            { id: 'jquery-spec-extend', term: '$.extend()', termJa: '$.extend()', meaning: '複数のオブジェクトをマージ', example: 'var merged = $.extend({}, defaults, options);', sourceUrl: 'https://api.jquery.com/jQuery.extend/' },
            { id: 'jquery-spec-isarray', term: '$.isArray()', termJa: '$.isArray()', meaning: '値が配列かどうかを判定', example: '$.isArray([1, 2]); // true\n$.isArray("str"); // false', sourceUrl: 'https://api.jquery.com/jQuery.isArray/' },
            { id: 'jquery-spec-trim', term: '$.trim()', termJa: '$.trim()', meaning: '文字列の前後の空白を除去', example: '$.trim("  hello  "); // "hello"', sourceUrl: 'https://api.jquery.com/jQuery.trim/' }
          ]
        }
      ]
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
