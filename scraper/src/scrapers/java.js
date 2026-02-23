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

  async scrapeOverview() {
    console.log('Scraping Java overview...')

    const characteristics = [
      { id: 'java-char-static-typing', term: 'Static Typing', termJa: '静的型付け', meaning: 'コンパイル時に型チェックが行われる。変数宣言時に型指定が必要（var による型推論も可能）', relatedConceptIds: ['java-concept-generics', 'java-concept-type-erasure'], sourceUrl: '' },
      { id: 'java-char-oop', term: 'Object-oriented Programming', termJa: 'オブジェクト指向', meaning: 'クラスベースのオブジェクト指向言語。カプセル化、継承、ポリモーフィズムを完全サポート', relatedConceptIds: ['java-concept-inheritance', 'java-concept-polymorphism', 'java-concept-encapsulation', 'java-concept-interface'], sourceUrl: '' },
      { id: 'java-char-platform-independent', term: 'Platform Independence', termJa: 'プラットフォーム非依存', meaning: 'JVM（Java Virtual Machine）上で動作し、Write Once, Run Anywhere を実現', relatedConceptIds: ['java-concept-jvm', 'java-concept-bytecode'], sourceUrl: '' },
      { id: 'java-char-garbage-collection', term: 'Garbage Collection', termJa: 'ガベージコレクション', meaning: '不要になったオブジェクトのメモリを自動的に解放。手動メモリ管理が不要', relatedConceptIds: ['java-concept-jvm'], sourceUrl: '' },
      { id: 'java-char-multithreading', term: 'Built-in Multithreading', termJa: 'マルチスレッド組み込み', meaning: '言語レベルでスレッドをサポート。synchronized, volatile, java.util.concurrent パッケージ', relatedConceptIds: ['java-concept-thread-safety', 'java-concept-synchronization'], sourceUrl: '' }
    ]

    const concepts = [
      { id: 'java-concept-inheritance', term: 'Inheritance', termJa: '継承', characteristicId: 'java-char-oop', meaning: 'クラスが他のクラスの属性と振る舞いを引き継ぐ仕組み。extends キーワードで単一継承', relatedTermIds: ['java-17-sealed-classes', 'java-17-records'], sourceUrl: '' },
      { id: 'java-concept-polymorphism', term: 'Polymorphism', termJa: 'ポリモーフィズム（多態性）', characteristicId: 'java-char-oop', meaning: '同一のインターフェースで異なる実装を扱える仕組み。オーバーライドとオーバーロード', relatedTermIds: ['java-17-pattern-matching-for-instanceo', 'java-21-pattern-matching-for-switch'], sourceUrl: '' },
      { id: 'java-concept-encapsulation', term: 'Encapsulation', termJa: 'カプセル化', characteristicId: 'java-char-oop', meaning: 'データとメソッドをクラスにまとめ、アクセス修飾子で公開範囲を制御する仕組み', relatedTermIds: ['java-17-records', 'java-17-sealed-classes'], sourceUrl: '' },
      { id: 'java-concept-interface', term: 'Interface', termJa: 'インターフェース', characteristicId: 'java-char-oop', meaning: 'メソッドのシグネチャのみを定義する型。多重実装が可能。Java 8 以降は default メソッドも可', relatedTermIds: ['java-8-default-methods', 'java-9-private-interface-methods'], sourceUrl: '' },
      { id: 'java-concept-generics', term: 'Generics', termJa: 'ジェネリクス', characteristicId: 'java-char-static-typing', meaning: '型をパラメータ化して汎用的なクラスやメソッドを定義する仕組み。コンパイル時型安全性を提供', relatedTermIds: ['java-8-stream-api', 'java-8-optional'], sourceUrl: '' },
      { id: 'java-concept-type-erasure', term: 'Type Erasure', termJa: '型消去', characteristicId: 'java-char-static-typing', meaning: 'ジェネリクスの型情報がコンパイル後に消去される仕組み。後方互換性のため', relatedTermIds: [], sourceUrl: '' },
      { id: 'java-concept-jvm', term: 'JVM (Java Virtual Machine)', termJa: 'Java仮想マシン', characteristicId: 'java-char-platform-independent', meaning: 'バイトコードを実行する仮想マシン。JIT コンパイラ、ガベージコレクタを内蔵', relatedTermIds: ['java-21-virtual-threads'], sourceUrl: '' },
      { id: 'java-concept-bytecode', term: 'Bytecode', termJa: 'バイトコード', characteristicId: 'java-char-platform-independent', meaning: 'Java ソースコードをコンパイルした中間コード。JVM が解釈実行する', relatedTermIds: [], sourceUrl: '' },
      { id: 'java-concept-thread-safety', term: 'Thread Safety', termJa: 'スレッド安全性', characteristicId: 'java-char-multithreading', meaning: '複数スレッドから同時にアクセスされても正しく動作する性質', relatedTermIds: ['java-21-virtual-threads', 'java-8-completablefuture'], sourceUrl: '' },
      { id: 'java-concept-synchronization', term: 'Synchronization', termJa: '同期化', characteristicId: 'java-char-multithreading', meaning: '複数スレッド間の排他制御。synchronized ブロック/メソッド、Lock インターフェース', relatedTermIds: ['java-21-virtual-threads'], sourceUrl: '' }
    ]

    return {
      description: 'クラスベースの静的型付けオブジェクト指向言語。JVM 上で動作し、プラットフォーム非依存。ガベージコレクションとマルチスレッドを言語レベルでサポート',
      characteristics,
      concepts
    }
  }

  async scrapeSpecification() {
    console.log('Building Java specification...')

    return {
      categories: [
        {
          id: 'java-spec-primitive-types',
          group: 'syntax',
          name: 'Primitive Types',
          nameJa: '基本型',
          items: [
            { id: 'java-spec-int', term: 'int', termJa: '整数型', meaning: '32ビット符号付き整数。-2,147,483,648 から 2,147,483,647', example: 'int count = 42;', sourceUrl: 'https://docs.oracle.com/javase/tutorial/java/nutsandbolts/datatypes.html' },
            { id: 'java-spec-long', term: 'long', termJa: '長整数型', meaning: '64ビット符号付き整数。大きな整数値に使用', example: 'long bigNum = 9876543210L;', sourceUrl: 'https://docs.oracle.com/javase/tutorial/java/nutsandbolts/datatypes.html' },
            { id: 'java-spec-double', term: 'double', termJa: '倍精度浮動小数点型', meaning: '64ビット IEEE 754 浮動小数点数。デフォルトの小数型', example: 'double pi = 3.14159;', sourceUrl: 'https://docs.oracle.com/javase/tutorial/java/nutsandbolts/datatypes.html' },
            { id: 'java-spec-boolean', term: 'boolean', termJa: '真偽値型', meaning: 'true または false の2値のみ', example: 'boolean isReady = true;', sourceUrl: 'https://docs.oracle.com/javase/tutorial/java/nutsandbolts/datatypes.html' },
            { id: 'java-spec-char', term: 'char', termJa: '文字型', meaning: '16ビット Unicode 文字。シングルクォートで囲む', example: "char letter = 'A';", sourceUrl: 'https://docs.oracle.com/javase/tutorial/java/nutsandbolts/datatypes.html' }
          ]
        },
        {
          id: 'java-spec-control-flow',
          group: 'syntax',
          name: 'Control Flow',
          nameJa: '制御構文',
          items: [
            { id: 'java-spec-if-else', term: 'if...else', termJa: 'if...else 文', meaning: '条件分岐の基本構文。boolean 式で制御', example: 'if (score >= 60) {\n  System.out.println("Pass");\n} else {\n  System.out.println("Fail");\n}', sourceUrl: 'https://docs.oracle.com/javase/tutorial/java/nutsandbolts/if.html' },
            { id: 'java-spec-switch', term: 'switch', termJa: 'switch 文', meaning: '式の値に基づく複数分岐。int, String, enum 等に対応', example: 'switch (day) {\n  case "MON": /* ... */ break;\n  case "FRI": /* ... */ break;\n  default: /* ... */\n}', sourceUrl: 'https://docs.oracle.com/javase/tutorial/java/nutsandbolts/switch.html' },
            { id: 'java-spec-for', term: 'for', termJa: 'for ループ', meaning: '初期化・条件・更新の3式で制御するループ', example: 'for (int i = 0; i < 10; i++) {\n  System.out.println(i);\n}', sourceUrl: 'https://docs.oracle.com/javase/tutorial/java/nutsandbolts/for.html' },
            { id: 'java-spec-while', term: 'while / do...while', termJa: 'while ループ', meaning: 'while は条件が真の間ループ。do...while は最低1回実行', example: 'int i = 0;\nwhile (i < 5) {\n  i++;\n}', sourceUrl: 'https://docs.oracle.com/javase/tutorial/java/nutsandbolts/while.html' },
            { id: 'java-spec-for-each', term: 'Enhanced for (for-each)', termJa: '拡張for文', meaning: '配列やコレクションの要素を順に処理する簡略構文', example: 'int[] nums = {1, 2, 3};\nfor (int n : nums) {\n  System.out.println(n);\n}', sourceUrl: 'https://docs.oracle.com/javase/tutorial/java/nutsandbolts/for.html' }
          ]
        },
        {
          id: 'java-spec-oop-basics',
          group: 'syntax',
          name: 'OOP Basics',
          nameJa: 'OOP基礎',
          items: [
            { id: 'java-spec-class', term: 'class', termJa: 'クラス', meaning: 'オブジェクトの設計図。フィールドとメソッドを定義', example: 'public class Person {\n  String name;\n  int age;\n}', sourceUrl: 'https://docs.oracle.com/javase/tutorial/java/javaOO/classes.html' },
            { id: 'java-spec-interface', term: 'interface', termJa: 'インターフェース', meaning: 'メソッドのシグネチャを定義する型。多重実装が可能', example: 'public interface Drawable {\n  void draw();\n}', sourceUrl: 'https://docs.oracle.com/javase/tutorial/java/IandI/createinterface.html' },
            { id: 'java-spec-abstract', term: 'abstract', termJa: '抽象クラス/メソッド', meaning: 'インスタンス化不可のクラス、または実装を持たないメソッド', example: 'public abstract class Shape {\n  abstract double area();\n}', sourceUrl: 'https://docs.oracle.com/javase/tutorial/java/IandI/abstract.html' },
            { id: 'java-spec-extends', term: 'extends', termJa: 'クラス継承', meaning: '他のクラスを継承する。単一継承のみ', example: 'public class Dog extends Animal {\n  // ...\n}', sourceUrl: 'https://docs.oracle.com/javase/tutorial/java/IandI/subclasses.html' },
            { id: 'java-spec-implements', term: 'implements', termJa: 'インターフェース実装', meaning: 'インターフェースを実装する。複数実装可能', example: 'public class Circle implements Drawable {\n  public void draw() { /* ... */ }\n}', sourceUrl: 'https://docs.oracle.com/javase/tutorial/java/IandI/usinginterface.html' }
          ]
        },
        {
          id: 'java-spec-access-modifiers',
          group: 'syntax',
          name: 'Access Modifiers',
          nameJa: 'アクセス修飾子',
          items: [
            { id: 'java-spec-public', term: 'public', termJa: 'public', meaning: 'すべてのクラスからアクセス可能', example: 'public class MyClass {\n  public void method() {}\n}', sourceUrl: 'https://docs.oracle.com/javase/tutorial/java/javaOO/accesscontrol.html' },
            { id: 'java-spec-private', term: 'private', termJa: 'private', meaning: '同一クラス内からのみアクセス可能', example: 'public class MyClass {\n  private int secret = 42;\n}', sourceUrl: 'https://docs.oracle.com/javase/tutorial/java/javaOO/accesscontrol.html' },
            { id: 'java-spec-protected', term: 'protected', termJa: 'protected', meaning: '同一パッケージおよびサブクラスからアクセス可能', example: 'protected void helper() {\n  // ...\n}', sourceUrl: 'https://docs.oracle.com/javase/tutorial/java/javaOO/accesscontrol.html' },
            { id: 'java-spec-default-access', term: 'default (package-private)', termJa: 'パッケージプライベート', meaning: '修飾子なし。同一パッケージ内からのみアクセス可能', example: 'class PackageClass {\n  void packageMethod() {}\n}', sourceUrl: 'https://docs.oracle.com/javase/tutorial/java/javaOO/accesscontrol.html' }
          ]
        },
        {
          id: 'java-spec-exception-handling',
          group: 'syntax',
          name: 'Exception Handling',
          nameJa: '例外処理',
          items: [
            { id: 'java-spec-try-catch', term: 'try...catch...finally', termJa: 'try...catch...finally 文', meaning: '例外処理。try で例外を捕捉、catch で処理、finally で後始末', example: 'try {\n  int result = 10 / 0;\n} catch (ArithmeticException e) {\n  System.err.println(e.getMessage());\n} finally {\n  System.out.println("done");\n}', sourceUrl: 'https://docs.oracle.com/javase/tutorial/essential/exceptions/try.html' },
            { id: 'java-spec-throws', term: 'throws', termJa: 'throws 宣言', meaning: 'メソッドが投げる可能性のある検査例外を宣言', example: 'public void readFile() throws IOException {\n  // ...\n}', sourceUrl: 'https://docs.oracle.com/javase/tutorial/essential/exceptions/declaring.html' },
            { id: 'java-spec-throw', term: 'throw', termJa: 'throw 文', meaning: '例外を明示的にスローする', example: 'throw new IllegalArgumentException("Invalid input");', sourceUrl: 'https://docs.oracle.com/javase/tutorial/essential/exceptions/throwing.html' }
          ]
        },
        {
          id: 'java-spec-collections',
          group: 'api',
          name: 'Collections',
          nameJa: 'コレクション',
          items: [
            { id: 'java-spec-list', term: 'List', termJa: 'リスト', meaning: '順序付きコレクション。インデックスでアクセス可能。ArrayList, LinkedList 等', example: 'List<String> list = new ArrayList<>();\nlist.add("hello");\nlist.get(0);', sourceUrl: 'https://docs.oracle.com/javase/tutorial/collections/interfaces/list.html' },
            { id: 'java-spec-set', term: 'Set', termJa: 'セット', meaning: '重複を許さないコレクション。HashSet, TreeSet 等', example: 'Set<Integer> set = new HashSet<>();\nset.add(1);\nset.add(1); // 重複は無視', sourceUrl: 'https://docs.oracle.com/javase/tutorial/collections/interfaces/set.html' },
            { id: 'java-spec-map', term: 'Map', termJa: 'マップ', meaning: 'キーと値のペアのコレクション。HashMap, TreeMap 等', example: 'Map<String, Integer> map = new HashMap<>();\nmap.put("age", 30);\nmap.get("age");', sourceUrl: 'https://docs.oracle.com/javase/tutorial/collections/interfaces/map.html' },
            { id: 'java-spec-iterator', term: 'Iterator', termJa: 'イテレータ', meaning: 'コレクションの要素を順に走査するインターフェース', example: 'Iterator<String> it = list.iterator();\nwhile (it.hasNext()) {\n  System.out.println(it.next());\n}', sourceUrl: 'https://docs.oracle.com/javase/tutorial/collections/interfaces/collection.html' }
          ]
        },
        {
          id: 'java-spec-io',
          group: 'api',
          name: 'I/O & Streams',
          nameJa: '入出力',
          items: [
            { id: 'java-spec-inputstream', term: 'InputStream / OutputStream', termJa: 'バイトストリーム', meaning: 'バイト単位の入出力。ファイル、ネットワーク等のバイナリデータ処理', example: 'try (InputStream is = new FileInputStream("file.bin")) {\n  int data = is.read();\n}', sourceUrl: 'https://docs.oracle.com/javase/tutorial/essential/io/bytestreams.html' },
            { id: 'java-spec-reader-writer', term: 'Reader / Writer', termJa: '文字ストリーム', meaning: '文字単位の入出力。テキストデータの処理に使用', example: 'try (BufferedReader br = new BufferedReader(new FileReader("file.txt"))) {\n  String line = br.readLine();\n}', sourceUrl: 'https://docs.oracle.com/javase/tutorial/essential/io/charstreams.html' },
            { id: 'java-spec-files', term: 'Files (NIO.2)', termJa: 'Files ユーティリティ', meaning: 'java.nio.file.Files クラス。ファイル操作の静的メソッドを提供', example: 'String content = Files.readString(Path.of("file.txt"));\nFiles.write(Path.of("out.txt"), bytes);', sourceUrl: 'https://docs.oracle.com/javase/tutorial/essential/io/fileio.html' }
          ]
        }
      ]
    }
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
