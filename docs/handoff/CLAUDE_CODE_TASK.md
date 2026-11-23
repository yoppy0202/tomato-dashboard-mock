# CLAUDE_CODE_TASK: 管理画面モックのリポジトリ反映

## 目的
作成済みの管理画面モック2ファイルを、既存のモック公開リポジトリ
`yoppy0202/tomato-dashboard-mock` に追加し、GitHub Pagesで閲覧できるようにする。
あわせて `index.html`(ダッシュボードモック)からリンクで辿れるようにする。

## 対象ファイル(このタスクと一緒に渡す)
- `admin.html` … 管理画面:数量・単価マトリクス入力フォームのモック
- `list.html` … データ一覧ページ(フィルタ+CSV出力)のモック

## 作業手順

### 1. リポジトリへ追加
- `tomato-dashboard-mock` リポジトリのルートに `admin.html` と `list.html` をそのまま配置
- 既存の `index.html` は削除・改名しない(公開URLを変えない)

### 2. index.html にリンクを追加
`index.html` の `<body>` 直後にある赤い注意バナー
(`⚠ これは検討用のモック画面です…` のインラインstyleのdiv)の**直後**に、
以下のリンク行を挿入する:

```html
<div style="display:flex;gap:8px;justify-content:center;align-items:center;
  background:#f6efd9;border-bottom:1px solid #e3d9b8;
  font-size:11px;color:#8a6d1f;padding:6px 10px;">
  <span style="font-weight:700;">🔑 管理画面モック:</span>
  <a href="admin.html" style="color:#8a6d1f;font-weight:700;">数量・単価入力</a>
  <span style="color:#c9bd93;">|</span>
  <a href="list.html" style="color:#8a6d1f;font-weight:700;">データ一覧</a>
</div>
```

- 既存のCSS・レイアウトには手を入れない(インラインstyleのみで完結させる)
- `admin.html` / `list.html` 側には `index.html` への戻りリンクが実装済みなので追加不要

### 3. コミット・プッシュ
- コミットメッセージ例:
  `Add admin mock screens (matrix input & data list) with unit/kg conversion`
- mainブランチへプッシュ(GitHub Pagesはmain直下を公開中の想定。異なる場合は現行設定に合わせる)

### 4. 動作確認
以下3点を確認して結果を報告する:
1. https://yoppy0202.github.io/tomato-dashboard-mock/admin.html が表示される
   - PC幅でマトリクス表、幅700px以下で市場別アコーディオンに切り替わる
   - 単価欄にkg表記がない(1パック/1ケースあたりの入力)
   - 数量を入力するとセル下に「≒ ○kg」の換算が出る(200gパック=÷5、3kgバラ=×3)
   - 「確定して閲覧画面に反映」を押すと確認ダイアログが表示される
2. https://yoppy0202.github.io/tomato-dashboard-mock/list.html が表示される
   - 単価は個口単価(円/ﾊﾟｯｸ・円/ｹｰｽ)がメインで、その右に円/kg換算列がある
   - 「CSVダウンロード」でUTF-8 BOM付きCSVが落ち、Excelで文字化けしない
   - CSV列: 日付,選果方法,荷姿,市場,サイズ,単価(1パック・1ケースあたり),単価(円/kg),数量,数量単位,kg換算
3. https://yoppy0202.github.io/tomato-dashboard-mock/ のバナー下に管理画面リンクが表示され、遷移できる

### 5. 完了後
- `PROJECT_KNOWLEDGE.md`(プロジェクト側で管理)の §0 成果物にある
  「※admin/listのリポジトリ反映はClaude Codeに依頼」の注記を削除してよい旨をYoppyさんに報告

## 注意事項
- 本タスクは**モックの公開のみ**。本番実装・VPS操作は含まない
- ファイル内容の改変はしない(リンク挿入は index.html のみ)
- モックには「検討用・ダミーデータ」のバナーが実装済み。削除しない
