/*
 * 資料用スクリーンショットの自動取得(Playwright / Chromium)
 *
 * 撮影対象は GitHub Pages 上の公開URL。デプロイ完了後に実行すること。
 * 役割(一般/管理者)は localStorage で保持しているため、ブラウザコンテキストごとに
 * 新規の(=まっさらな localStorage を持つ)コンテキストを作り、ページ読み込み前に
 * addInitScript で役割をセットしてからナビゲートする。
 *
 * 実行:
 *   node scripts/capture.js
 *   BASE_URL=http://localhost:8080/ node scripts/capture.js   # ローカル確認用
 */
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const BASE_URL = process.env.BASE_URL || "https://yoppy0202.github.io/tomato-dashboard-mock/";
const OUT_DIR = path.join(__dirname, "..", "docs", "screenshots");
const VIEWPORT = { width: 390, height: 844 };
const DEVICE_SCALE_FACTOR = 2;

async function settle(page) {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(600);
}

const SHOTS = [
  {
    file: "01_dashboard_full.png",
    url: "index.html",
    role: "general",
    type: "full",
    desc: "ダッシュボード ページ全体(フルページ)",
  },
  {
    file: "02_dashboard_matrix.png",
    url: "index.html",
    role: "general",
    type: "element",
    selector: "#marketCards",
    desc: "ダッシュボード 単価マトリクス部分",
  },
  {
    file: "03_dashboard_weekday.png",
    url: "index.html",
    role: "general",
    type: "element",
    selector: ".weekcard",
    desc: "ダッシュボード 曜日別出荷量グラフ部分",
  },
  {
    file: "04_dashboard_announce.png",
    url: "index.html",
    role: "general",
    type: "element",
    selector: ".announce",
    desc: "ダッシュボード お知らせ欄",
  },
  {
    file: "05_list_full.png",
    url: "list.html",
    role: "general",
    type: "full",
    desc: "データ一覧 ページ全体",
  },
  {
    file: "06_list_filter.png",
    url: "list.html",
    role: "general",
    type: "element",
    selector: "details.filters",
    desc: "データ一覧 絞り込みフィルタ部分(開いた状態)",
    pre: async (page) => {
      await page.click("details.filters summary");
      await page.waitForTimeout(200);
    },
  },
  {
    file: "07_list_csv.png",
    url: "list.html",
    role: "general",
    type: "element",
    selector: ".csvarea",
    desc: "データ一覧 CSV出力ボタン＋案内文",
  },
  {
    file: "08_minutes_general.png",
    url: "minutes.html",
    role: "general",
    type: "viewport",
    desc: "議事録一覧(一般:役員協議会タブなし)",
  },
  {
    file: "09_minutes_admin.png",
    url: "minutes.html",
    role: "admin",
    type: "viewport",
    desc: "議事録一覧(管理者:役員協議会タブあり)",
  },
  {
    file: "10_minutes_detail.png",
    url: "minutes-detail.html?id=1",
    role: "general",
    type: "full",
    desc: "議事録詳細・添付ファイル",
  },
  {
    file: "11_nav_admin.png",
    url: "index.html",
    role: "admin",
    type: "element",
    selector: "#adminBand",
    desc: "管理者用ナビ帯",
  },
  {
    file: "12_admin_input.png",
    url: "admin.html",
    role: "admin",
    type: "element",
    selector: "#accwrap",
    desc: "マトリクス入力(スマホのアコーディオン表示)",
  },
  {
    file: "13_announce_post.png",
    url: "announce.html",
    role: "admin",
    type: "element",
    selector: "#formCard",
    desc: "お知らせ投稿フォーム＋LINE配信プレビュー",
  },
  {
    file: "14_announce_read.png",
    url: "announce.html",
    role: "admin",
    type: "element",
    selector: ".aitem:has(.readpanel.show)",
    desc: "お知らせ 既読/未読の内訳(進捗バー・タブ)",
    pre: async (page) => {
      await page.click("[data-readtoggle]");
      await page.waitForTimeout(200);
    },
  },
  {
    file: "15_markets.png",
    url: "markets.html",
    role: "admin",
    type: "element",
    selector: "#mktList",
    desc: "市場の管理 一覧",
  },
  {
    file: "16_members.png",
    url: "members.html",
    role: "admin",
    type: "element",
    selector: "#memList",
    desc: "部会員名簿 一覧",
  },
];

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const results = [];

  for (const shot of SHOTS) {
    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: DEVICE_SCALE_FACTOR,
    });
    // 新規コンテキスト = まっさらな localStorage。撮影前にダミーデータ以外の
    // 溜まった状態(下書き・自動生成お知らせ等)が残らないようにする。
    await context.addInitScript((role) => {
      try {
        window.localStorage.clear();
        window.localStorage.setItem("tomato_mock_role", role);
      } catch (e) {}
    }, shot.role);

    const page = await context.newPage();
    const target = new URL(shot.url, BASE_URL).toString();
    let ok = true;
    let note = "";
    try {
      await page.goto(target, { waitUntil: "load" });
      await settle(page);
      if (typeof shot.pre === "function") {
        await shot.pre(page);
      }

      const outPath = path.join(OUT_DIR, shot.file);
      if (shot.type === "full") {
        await page.screenshot({ path: outPath, fullPage: true });
      } else if (shot.type === "viewport") {
        await page.screenshot({ path: outPath, fullPage: false });
      } else if (shot.type === "element") {
        const loc = page.locator(shot.selector).first();
        const count = await loc.count();
        if (count === 0) {
          ok = false;
          note = `要素が見つからず(${shot.selector})、ビューポート撮影に切り替え`;
          await page.screenshot({ path: outPath, fullPage: false });
        } else {
          await loc.scrollIntoViewIfNeeded();
          await loc.screenshot({ path: outPath });
        }
      }
    } catch (err) {
      ok = false;
      note = `エラー: ${err.message}`;
      try {
        await page.screenshot({ path: path.join(OUT_DIR, shot.file), fullPage: false });
      } catch (e2) {}
    }

    results.push({ file: shot.file, desc: shot.desc, ok, note });
    console.log(`${ok ? "✅" : "⚠️"} ${shot.file} — ${shot.desc}${note ? " (" + note + ")" : ""}`);
    await context.close();
  }

  await browser.close();

  console.log("\n==== 撮影結果サマリ ====");
  for (const r of results) {
    console.log(`${r.ok ? "OK  " : "WARN"} ${r.file}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
