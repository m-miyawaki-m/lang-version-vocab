import { BaseScraper } from './base.js'
import { fetchWithRetry, sleep } from '../utils/fetcher.js'
import { parseHTML, extractText, generateId } from '../utils/parser.js'

const ORACLE_BASE = 'https://docs.oracle.com/en/java/javase'

// Java バージョンごとの主要機能と Oracle Docs パス
const JAVA_FEATURES = {
  '23': {
    releaseDate: '2024-09',
    features: [
      { path: `${ORACLE_BASE}/23/language/implicitly-declared-classes-and-instance-main-methods.html`, term: 'Implicitly Declared Classes', termJa: '暗黙的クラス宣言', type: 'syntax', category: 'class' },
      { path: `${ORACLE_BASE}/23/language/unnamed-variables-and-patterns.html`, term: 'Unnamed Variables and Patterns', termJa: '無名変数とパターン', type: 'syntax', category: 'variable' },
      { path: `${ORACLE_BASE}/23/language/string-templates.html`, term: 'String Templates (Preview)', termJa: '文字列テンプレート', type: 'syntax', category: 'string' }
    ]
  },
  '21': {
    releaseDate: '2023-09',
    features: [
      { path: `${ORACLE_BASE}/21/language/pattern-matching-switch.html`, term: 'Pattern Matching for switch', termJa: 'switch のパターンマッチング', type: 'syntax', category: 'control-flow' },
      { path: `${ORACLE_BASE}/21/language/record-patterns.html`, term: 'Record Patterns', termJa: 'レコードパターン', type: 'syntax', category: 'class' },
      { path: `${ORACLE_BASE}/21/language/sealed-classes-and-interfaces.html`, term: 'Sealed Classes and Interfaces', termJa: 'シールクラス・インターフェース', type: 'syntax', category: 'class' },
      { term: 'Virtual Threads', termJa: '仮想スレッド', type: 'concept', category: 'concurrency', meaning: '軽量なスレッド実装。OSスレッドではなくJVMが管理する。Project Loomの成果' },
      { term: 'Sequenced Collections', termJa: 'シーケンスコレクション', type: 'api', category: 'collection', meaning: '要素の順序を持つコレクションの統一インターフェース。SequencedCollection, SequencedSet, SequencedMap' }
    ]
  },
  '17': {
    releaseDate: '2021-09',
    features: [
      { path: `${ORACLE_BASE}/17/language/sealed-classes-and-interfaces.html`, term: 'Sealed Classes', termJa: 'シールクラス', type: 'syntax', category: 'class' },
      { path: `${ORACLE_BASE}/17/language/pattern-matching-instanceof.html`, term: 'Pattern Matching for instanceof', termJa: 'instanceof のパターンマッチング', type: 'syntax', category: 'control-flow' },
      { path: `${ORACLE_BASE}/17/language/switch-expressions-and-statements.html`, term: 'Switch Expressions', termJa: 'switch 式', type: 'syntax', category: 'control-flow' },
      { path: `${ORACLE_BASE}/17/language/records.html`, term: 'Records', termJa: 'レコード', type: 'syntax', category: 'class' },
      { path: `${ORACLE_BASE}/17/language/text-blocks.html`, term: 'Text Blocks', termJa: 'テキストブロック', type: 'syntax', category: 'string' },
      { path: `${ORACLE_BASE}/17/language/local-variable-type-inference.html`, term: 'Local Variable Type Inference (var)', termJa: 'ローカル変数の型推論', type: 'syntax', category: 'variable' }
    ]
  },
  '11': {
    releaseDate: '2018-09',
    features: [
      { term: 'HTTP Client API', termJa: 'HTTP クライアント API', type: 'api', category: 'network', meaning: '新しい標準HTTPクライアント。HTTP/2とWebSocketをサポート。java.net.http パッケージ' },
      { term: 'String::lines, strip, isBlank', termJa: 'String メソッド追加', type: 'api', category: 'string', meaning: 'String クラスに lines(), strip(), stripLeading(), stripTrailing(), isBlank(), repeat() メソッドを追加' },
      { term: 'var in Lambda Parameters', termJa: 'ラムダ引数での var', type: 'syntax', category: 'function', meaning: 'ラムダ式のパラメータに var を使用可能に。アノテーション付与に有用' },
      { term: 'Collection.toArray(IntFunction)', termJa: 'コレクション配列変換', type: 'api', category: 'collection', meaning: 'コレクションから型付き配列への変換を簡潔に記述。list.toArray(String[]::new)' }
    ]
  },
  '9': {
    releaseDate: '2017-09',
    features: [
      { term: 'Java Platform Module System', termJa: 'モジュールシステム', type: 'concept', category: 'module', meaning: 'Project Jigsawによるモジュールシステム。module-info.javaでモジュール定義' },
      { term: 'JShell', termJa: 'Java REPL', type: 'concept', category: 'tooling', meaning: 'Javaの対話型実行環境(REPL)。コードスニペットを即座に実行可能' },
      { term: 'Private Interface Methods', termJa: 'インターフェースのプライベートメソッド', type: 'syntax', category: 'class', meaning: 'インターフェースにprivateメソッドを定義可能に。defaultメソッドの共通処理を抽出' },
      { term: 'Stream API Enhancements', termJa: 'Stream API 拡張', type: 'api', category: 'collection', meaning: 'takeWhile, dropWhile, ofNullable, iterate(seed, predicate, operator) メソッドを追加' },
      { term: 'Optional Enhancements', termJa: 'Optional 拡張', type: 'api', category: 'collection', meaning: 'ifPresentOrElse, or, stream メソッドを追加' }
    ]
  },
  '8': {
    releaseDate: '2014-03',
    features: [
      { term: 'Lambda Expressions', termJa: 'ラムダ式', type: 'syntax', category: 'function', meaning: '匿名関数を簡潔に記述する構文。(a, b) -> a + b' },
      { term: 'Stream API', termJa: 'ストリーム API', type: 'api', category: 'collection', meaning: 'コレクションの要素を関数型スタイルで処理するAPI。filter, map, reduce 等' },
      { term: 'Optional', termJa: 'Optional クラス', type: 'api', category: 'collection', meaning: 'null参照を安全に扱うためのコンテナクラス。NullPointerException防止' },
      { term: 'Default Methods', termJa: 'デフォルトメソッド', type: 'syntax', category: 'class', meaning: 'インターフェースにデフォルト実装を持つメソッドを定義可能に' },
      { term: 'Method References', termJa: 'メソッド参照', type: 'syntax', category: 'function', meaning: '既存メソッドをラムダ式の代わりに参照する構文。String::toLowerCase' },
      { term: 'java.time API', termJa: '日時 API', type: 'api', category: 'datetime', meaning: '新しい日時API。LocalDate, LocalTime, LocalDateTime, ZonedDateTime 等' },
      { term: 'CompletableFuture', termJa: '非同期処理', type: 'api', category: 'concurrency', meaning: '非同期プログラミングのためのFuture実装。コールバックチェーンやエラーハンドリング' }
    ]
  }
}

export class JavaScraper extends BaseScraper {
  constructor() {
    super('java', 'Java', 'https://docs.oracle.com/en/java/')
  }

  async scrape() {
    const versions = []

    for (const [version, config] of Object.entries(JAVA_FEATURES)) {
      console.log(`Processing Java ${version} (${config.features.length} features)...`)
      const terms = []

      for (const feature of config.features) {
        if (feature.path) {
          // Oracle Docs からページ内容を取得
          try {
            await sleep(500)
            const html = await fetchWithRetry(feature.path)
            const $ = parseHTML(html)

            // ページの最初の説明段落を取得
            const firstP = extractText($('p').first())
            const meaning = feature.meaning || firstP.substring(0, 300)

            terms.push({
              id: generateId('java', version, feature.term),
              term: feature.term,
              termJa: feature.termJa || '',
              type: feature.type,
              category: feature.category,
              meaning,
              example: '',
              tags: [],
              sourceUrl: feature.path
            })
          } catch (error) {
            // ページ取得失敗時はスキップせず基本情報で追加
            terms.push({
              id: generateId('java', version, feature.term),
              term: feature.term,
              termJa: feature.termJa || '',
              type: feature.type,
              category: feature.category,
              meaning: feature.meaning || '',
              example: '',
              tags: [],
              sourceUrl: feature.path || ''
            })
          }
        } else {
          // パスなし（手動定義のみ）
          terms.push({
            id: generateId('java', version, feature.term),
            term: feature.term,
            termJa: feature.termJa || '',
            type: feature.type,
            category: feature.category,
            meaning: feature.meaning || '',
            example: '',
            tags: [],
            sourceUrl: ''
          })
        }
      }

      if (terms.length > 0) {
        versions.push({
          version,
          releaseDate: config.releaseDate,
          terms
        })
      }
    }

    return versions
  }
}
