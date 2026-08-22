/*
 * 部会員名簿のダミーデータ(モック用共有データ)
 * members.html(名簿管理)と announce.html(既読/未読内訳・議事録由来お知らせの配信先)が
 * 同じ40名を参照するための共有ソース。姓が偏らないよう10姓を巡回させて生成している。
 */
(function(){
  "use strict";

  var SURNAMES = ["佐藤","鈴木","高橋","田中","伊藤","渡辺","山本","中村","小林","加藤"];
  var GIVEN_NAMES = [
    "太郎","花子","健太","由美子","誠","恵子","大輔","直美","修","久美子",
    "隆","美穂","秀樹","智子","浩二","綾子","敏之","真由美","和也","洋子",
    "拓也","千春","康弘","亜希子","正人","幸子","貴之","春香","学","弘子",
    "達也","由紀","昭夫","陽子","剛","美咲","光男","順子","健一","京子"
  ];
  var ADMIN_IDS = [1, 14, 27];               // 佐藤 太郎 / 田中 智子 / 山本 貴之
  var UNLINKED_IDS = [6, 15, 24, 29, 34, 40]; // LINE未連携(34/40人が連携済みになる)

  function fakeLastLogin(id){
    var day = Math.max(1, 22 - (id % 10));
    var h = 6 + (id % 13);
    var m = (id * 11) % 60;
    return "2026/08/" + String(day).padStart(2, "0") + " " + String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
  }

  var MEMBERS = [];
  for(var i = 1; i <= 40; i++){
    var linked = UNLINKED_IDS.indexOf(i) === -1;
    MEMBERS.push({
      id: i,
      name: SURNAMES[(i - 1) % 10] + " " + GIVEN_NAMES[i - 1],
      role: ADMIN_IDS.indexOf(i) !== -1 ? "admin" : "general",
      lineLinked: linked,
      lastLogin: linked ? fakeLastLogin(i) : null,
      active: true
    });
  }

  window.MembersData = {
    MEMBERS: MEMBERS,
    NEXT_ID: MEMBERS.length + 1,
    NAMES: MEMBERS.map(function(m){ return m.name; }),
    ADMINS: MEMBERS.filter(function(m){ return m.role === "admin"; })
  };
})();
