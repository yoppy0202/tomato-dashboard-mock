/*
 * 議事録データ + 議事録→お知らせ自動連携(モック用共有ストア)
 * minutes.html / minutes-detail.html / minutes-edit.html / announce.html が読み込む。
 *
 * モックのため正本データは localStorage に保持する(本番はサーバー側DB)。
 * - tomato_minutes_extra   : 新規投稿・編集で上書きされた議事録(id をキーに既存データへ上書き可)
 * - tomato_minutes_deleted : 論理削除された議事録IDの一覧
 * - tomato_minutes_anns    : 議事録から自動生成されたお知らせ一覧(論理削除フラグ付き)
 */
(function(){
  "use strict";

  var HOLD_SEC = 10 * 60; // 配信までの保留時間(10分)。announce.html の手動投稿と同じ長さ

  var LS_EXTRA = "tomato_minutes_extra";
  var LS_DELETED = "tomato_minutes_deleted";
  var LS_ANNS = "tomato_minutes_anns";

  var SEED_MINUTES = [
    { id:1, cat:"zentai", date:"2026-08-10", title:"8月度 定例会議事録", author:"山田", updated:"2026-08-11 10:00",
      body:"## 議題1: 8月の出荷状況について\n7月後半から出荷量が回復し、東京・神奈川向けを中心に単価も安定してきている。2S・S規格の引き合いが強く、選別への協力を継続してお願いする。\n\n## 議題2: 集出荷場メンテナンスについて\n8/24(月)に空調設備の点検を実施するため、当日は搬入受付を1時間繰り上げて7:00からとする。詳細は掲示物およびお知らせを参照。\n\n## 議題3: 部会総会の日程確認\n8/28(金)19時より公民館にて開催。議案は追って配布する。",
      attachments:[{name:"集出荷場メンテナンス案内.pdf",type:"pdf"},{name:"8月度議案資料.docx",type:"doc"}] },
    { id:2, cat:"yakuin", date:"2026-08-05", title:"役員協議会(8月)議事録", author:"佐藤", updated:"2026-08-05 19:10",
      body:"## 議題1: 単価交渉の進捗\n主要3市場との単価交渉について、現行水準からの改定案を協議した。詳細は非公開資料を参照。\n\n## 議題2: 部会費の見直し\n次年度の部会費について、運営コストの増加を踏まえた見直し案を検討した。継続協議とする。",
      attachments:[{name:"単価交渉方針(非公開).pdf",type:"pdf"}] },
    { id:3, cat:"zentai", date:"2026-07-13", title:"7月度 定例会議事録", author:"山田", updated:"2026-07-14 09:30",
      body:"## 議題1: 7月の出荷実績\n梅雨明け後の高温により、上位規格の比率がやや低下した。来月に向けて選別方法の再確認を行う。\n\n## 議題2: 新規市場開拓について\n北九州市場からの追加引き合いがあり、試験的な出荷を検討する。",
      attachments:[] },
    { id:4, cat:"yakuin", date:"2026-07-01", title:"役員協議会(7月)議事録 ─ 単価交渉方針", author:"佐藤", updated:"2026-07-02 08:00",
      body:"## 議題1: 単価交渉方針\n来期の単価交渉にあたり、各市場の取引実績データをもとに交渉方針を策定した。\n\n## 議題2: 役員体制について\n次期役員候補について意見交換を行った。",
      attachments:[{name:"交渉方針メモ.docx",type:"doc"}] },
    { id:5, cat:"zentai", date:"2026-06-08", title:"6月度 定例会議事録", author:"田中", updated:"2026-06-09 11:00",
      body:"## 議題1: 6月の出荷状況\n梅雨時期の天候不順により出荷量にばらつきが見られた。曜日別の平準化について再度周知する。\n\n## 議題2: 資材の共同購入\n出荷用資材の共同購入について、業者見積りを比較検討した。",
      attachments:[{name:"資材見積り比較.pdf",type:"pdf"},{name:"6月度議事メモ.docx",type:"doc"}] },
    { id:6, cat:"zentai", date:"2026-05-11", title:"総会議事録(2026年度)", author:"山田", updated:"2026-05-12 14:20",
      body:"## 議題1: 前年度事業報告\n前年度の出荷実績・単価動向について報告があった。\n\n## 議題2: 今年度事業計画\n今年度の目標出荷量および品質向上の取り組みについて審議し、承認された。\n\n## 議題3: 役員選任\n新役員を選任した。詳細は別紙名簿を参照。",
      attachments:[{name:"前年度事業報告書.pdf",type:"pdf"},{name:"今年度事業計画書.pdf",type:"pdf"},{name:"新役員名簿.docx",type:"doc"}] },
    { id:7, cat:"yakuin", date:"2026-04-03", title:"役員協議会(4月)議事録", author:"佐藤", updated:"2026-04-03 20:00",
      body:"## 議題1: 部会費の見直し(続き)\n前回に続き、部会費の見直しについて協議した。次回総会にて提案する方向で合意。\n\n## 議題2: 資材共同購入の契約\n資材の共同購入契約について、業者選定を行った。",
      attachments:[] },
    { id:8, cat:"zentai", date:"2026-03-09", title:"3月度 定例会議事録", author:"田中", updated:"2026-03-10 09:00",
      body:"## 議題1: 3月の出荷実績\n年度末に向けて出荷量が増加傾向。市場別の単価動向を共有した。\n\n## 議題2: 次年度の体制について\n次年度の選果体制について意見交換を行った。",
      attachments:[{name:"3月度出荷実績表.pdf",type:"pdf"}] }
  ];

  var CATS = {
    zentai: { label:"全体協議会", cls:"zentai", lineTarget:"部会員のLINEグループ" },
    yakuin: { label:"役員協議会", cls:"yakuin", lineTarget:"管理者用LINEグループチャット" }
  };

  function readJSON(key, fallback){
    try{
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    }catch(e){ return fallback; }
  }
  function writeJSON(key, val){
    try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){}
  }

  function nowStr(){
    var d = new Date();
    function p(n){ return String(n).padStart(2,"0"); }
    return d.getFullYear() + "-" + p(d.getMonth()+1) + "-" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes());
  }

  // ---- 議事録本体 ----
  function extraMap(){
    var m = new Map();
    readJSON(LS_EXTRA, []).forEach(function(rec){ m.set(rec.id, rec); });
    return m;
  }
  function deletedSet(){
    return new Set(readJSON(LS_DELETED, []));
  }
  function all(){
    var extra = extraMap();
    var del = deletedSet();
    var merged = SEED_MINUTES.map(function(s){ return extra.has(s.id) ? extra.get(s.id) : s; });
    extra.forEach(function(v, k){
      if(!SEED_MINUTES.some(function(s){ return s.id === k; })) merged.push(v);
    });
    return merged.filter(function(m){ return !del.has(m.id); });
  }
  function byId(id){
    var m = all().find(function(x){ return x.id === id; });
    return m || null;
  }
  function nextMinuteId(){
    var ids = SEED_MINUTES.map(function(m){ return m.id; })
      .concat(readJSON(LS_EXTRA, []).map(function(m){ return m.id; }));
    return Math.max.apply(null, [0].concat(ids)) + 1;
  }
  // 新規投稿:id を新規発行して保存し、お知らせを自動生成する
  function createMinute(data){
    var id = nextMinuteId();
    var rec = Object.assign({ id: id, author: data.author || "管理者", updated: nowStr() }, data, { id: id });
    var list = readJSON(LS_EXTRA, []);
    list.push(rec);
    writeJSON(LS_EXTRA, list);
    createAnnouncementForMinute(rec);
    return rec;
  }
  // 編集:既存id(シード/追加分どちらも可)を上書き保存。連携済みお知らせがあれば内容を追従・保留リセット
  function updateMinute(id, data){
    var list = readJSON(LS_EXTRA, []);
    var idx = list.findIndex(function(x){ return x.id === id; });
    var base = byId(id) || {};
    var rec = Object.assign({}, base, data, { id: id, author: base.author || data.author || "管理者", updated: nowStr() });
    if(idx >= 0) list[idx] = rec; else list.push(rec);
    writeJSON(LS_EXTRA, list);
    refreshAnnouncementForMinute(rec);
    return rec;
  }
  // 削除(論理削除)。連携するお知らせがあれば連動して取り下げる
  function deleteMinute(id){
    var del = readJSON(LS_DELETED, []);
    if(del.indexOf(id) < 0) del.push(id);
    writeJSON(LS_DELETED, del);
    var anns = readJSON(LS_ANNS, []);
    var changed = false;
    anns.forEach(function(a){
      if(a.minutesId === id && !a.deleted){ a.deleted = true; changed = true; }
    });
    if(changed) writeJSON(LS_ANNS, anns);
  }

  // ---- 議事録由来のお知らせ ----
  function nextAnnId(){
    var ids = readJSON(LS_ANNS, []).map(function(a){ return a.id; });
    // announce.html 側の手動投稿ダミーID(1〜)と衝突しないようオフセット
    return Math.max.apply(null, [2000].concat(ids)) + 1;
  }
  function createAnnouncementForMinute(m){
    var anns = readJSON(LS_ANNS, []);
    var rec = {
      id: nextAnnId(),
      minutesId: m.id,
      minutesCat: m.cat,
      title: m.title,
      createdAt: Date.now(),
      deadline: Date.now() + HOLD_SEC * 1000,
      state: "pending",
      reads: 0,
      deleted: false
    };
    anns.push(rec);
    writeJSON(LS_ANNS, anns);
    return rec;
  }
  function annByMinutesId(id){
    return readJSON(LS_ANNS, []).find(function(a){ return a.minutesId === id && !a.deleted; }) || null;
  }
  function refreshAnnouncementForMinute(m){
    var anns = readJSON(LS_ANNS, []);
    var idx = anns.findIndex(function(a){ return a.minutesId === m.id && !a.deleted; });
    if(idx < 0) return null;
    anns[idx].title = m.title;
    anns[idx].minutesCat = m.cat;
    if(anns[idx].state === "pending"){
      anns[idx].deadline = Date.now() + HOLD_SEC * 1000; // 保留中の編集は保留時間をリセット
    }
    writeJSON(LS_ANNS, anns);
    return anns[idx];
  }
  function activeAnnouncements(){
    return readJSON(LS_ANNS, []).filter(function(a){ return !a.deleted; });
  }
  // 保留時間が過ぎたものを配信済みに遷移させる(ページ内タイマー・再読み込みの両方から呼ぶ)
  function tick(){
    var anns = readJSON(LS_ANNS, []);
    var changed = false;
    anns.forEach(function(a){
      if(!a.deleted && a.state === "pending" && Date.now() >= a.deadline){
        a.state = "sent";
        a.reads = 0;
        changed = true;
      }
    });
    if(changed) writeJSON(LS_ANNS, anns);
    return changed;
  }

  window.MinutesStore = {
    HOLD_SEC: HOLD_SEC,
    CATS: CATS,
    all: all,
    byId: byId,
    createMinute: createMinute,
    updateMinute: updateMinute,
    deleteMinute: deleteMinute,
    annByMinutesId: annByMinutesId,
    activeAnnouncements: activeAnnouncements,
    tick: tick
  };
})();
