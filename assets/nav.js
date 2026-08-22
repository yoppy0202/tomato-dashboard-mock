/*
 * 共通ナビゲーション帯(管理者用/一般ユーザー用)+ 表示モード切替(モック用)
 * 全ページ共通で読み込む。localStorage に役割(admin/general)を保存し、
 * ページ遷移をまたいで管理者/一般ユーザーの見え方を確認できるようにする。
 */
(function(){
  "use strict";

  var ROLE_KEY = "tomato_mock_role";

  var NAV_ADMIN = [
    { href:"admin.html",    label:"データ入力" },
    { href:"list.html",     label:"データ一覧" },
    { href:"announce.html", label:"お知らせ投稿" },
    { href:"markets.html",  label:"市場の管理" },
    { href:"minutes.html",  label:"議事録" },
    { href:"members.html",  label:"部会員名簿" }
  ];
  var NAV_GENERAL = [
    { href:"index.html",   label:"ダッシュボード" },
    { href:"list.html",    label:"データ一覧" },
    { href:"minutes.html", label:"議事録" }
  ];

  function getRole(){
    return localStorage.getItem(ROLE_KEY) === "general" ? "general" : "admin";
  }
  function setRole(r){
    try{ localStorage.setItem(ROLE_KEY, r); }catch(e){}
  }
  function isAdmin(){ return getRole() === "admin"; }

  function navigate(href){
    if(window.UnsavedGuard && typeof window.UnsavedGuard.guardNavigate === "function"){
      window.UnsavedGuard.guardNavigate(href);
    }else{
      location.href = href;
    }
  }

  function injectStyle(){
    if(document.getElementById("tomatoNavStyle")) return;
    var css = ""
      + ".roleswitch{display:flex;align-items:center;gap:6px;flex-wrap:wrap;"
      + "background:#eef1f6;border-bottom:1px dashed #b9c3d6;color:#3a4a63;"
      + "font-size:10.5px;padding:6px 10px;}"
      + ".roleswitch .rs-label{font-weight:700;}"
      + ".roleswitch .rs-btn{font-family:inherit;font-size:10.5px;font-weight:700;"
      + "border:1px solid #b9c3d6;background:#fff;color:#3a4a63;border-radius:20px;"
      + "padding:3px 10px;cursor:pointer;}"
      + ".roleswitch .rs-btn.active{background:#3a4a63;border-color:#3a4a63;color:#fff;}"
      + ".adminband-wrap{background:#f6efd9;border-bottom:2px solid #8a6d1f;}"
      + ".adminband-top{display:flex;align-items:center;justify-content:space-between;gap:8px;"
      + "flex-wrap:wrap;color:#8a6d1f;font-size:12px;font-weight:700;padding:6px 16px 2px 16px;}"
      + ".adminband-top .who{font-weight:400;font-size:11px;}"
      + ".navrow{display:flex;gap:6px;overflow-x:auto;padding:6px 16px 8px 16px;"
      + "scrollbar-width:none;-webkit-overflow-scrolling:touch;}"
      + ".navrow::-webkit-scrollbar{display:none;}"
      + "@media (min-width:601px){.navrow{flex-wrap:wrap;overflow-x:visible;}}"
      + ".navpill{flex:0 0 auto;font-family:inherit;font-size:11.5px;font-weight:700;"
      + "text-decoration:none;white-space:nowrap;border-radius:20px;padding:6px 12px;"
      + "border:1px solid #cbb877;background:#fff;color:#8a6d1f;}"
      + ".navpill.current{background:#8a6d1f;border-color:#8a6d1f;color:#fff;cursor:default;}"
      + ".navrow.general{padding-top:8px;border-bottom:1px solid #e3e2df;background:#faf9f7;}"
      + ".navrow.general .navpill{border-color:#c7d6c8;color:#33583a;}"
      + ".navrow.general .navpill.current{background:#33583a;border-color:#33583a;color:#fff;}";
    var style = document.createElement("style");
    style.id = "tomatoNavStyle";
    style.textContent = css;
    document.head.appendChild(style);
  }

  function pillsHtml(items, current){
    return items.map(function(it){
      var active = it.href === current;
      return '<a href="' + it.href + '" class="navpill' + (active ? " current" : "") + '"'
        + (active ? ' aria-current="page"' : "") + '>' + it.label + "</a>";
    }).join("");
  }

  function bindNav(root){
    var links = root.querySelectorAll(".navpill");
    for(var i=0;i<links.length;i++){
      (function(a){
        if(a.classList.contains("current")){
          a.addEventListener("click", function(e){ e.preventDefault(); });
          return;
        }
        a.addEventListener("click", function(e){
          e.preventDefault();
          navigate(a.getAttribute("href"));
        });
      })(links[i]);
    }
  }

  function renderRoleToggle(mountId){
    var el = document.getElementById(mountId);
    if(!el) return;
    var role = getRole();
    el.innerHTML =
      '<div class="roleswitch">'
      + '<span class="rs-label">【デモ用】表示モード切替:</span>'
      + '<button type="button" class="rs-btn' + (role==="general"?" active":"") + '" data-role="general">一般ユーザー</button>'
      + '<button type="button" class="rs-btn' + (role==="admin"?" active":"") + '" data-role="admin">管理者</button>'
      + '</div>';
    var btns = el.querySelectorAll("[data-role]");
    for(var i=0;i<btns.length;i++){
      btns[i].addEventListener("click", function(e){
        var newRole = e.currentTarget.getAttribute("data-role");
        if(newRole === getRole()) return;
        var apply = function(){ setRole(newRole); location.reload(); };
        if(window.UnsavedGuard && window.UnsavedGuard.isDirty && window.UnsavedGuard.isDirty()){
          window.UnsavedGuard.guardAction(apply);
        }else{
          apply();
        }
      });
    }
  }

  function renderAdminBand(mountId, current, title){
    var el = document.getElementById(mountId);
    if(!el) return;
    if(!isAdmin()){
      el.style.display = "none";
      el.innerHTML = "";
      return;
    }
    el.style.display = "";
    el.className = (el.className ? el.className + " " : "") + "adminband-wrap";
    el.innerHTML =
      '<div class="adminband-top"><span>🔑 ' + title + '</span>'
      + '<span class="who">ログイン中:山田(管理者) ・ 操作はすべて記録されます</span></div>'
      + '<div class="navrow admin">' + pillsHtml(NAV_ADMIN, current) + '</div>';
    bindNav(el);
  }

  function renderGeneralNav(mountId, current){
    var el = document.getElementById(mountId);
    if(!el) return;
    el.innerHTML = '<div class="navrow general">' + pillsHtml(NAV_GENERAL, current) + '</div>';
    bindNav(el);
  }

  function guardBackLinks(){
    var links = document.querySelectorAll("a.backlink[href]");
    for(var i=0;i<links.length;i++){
      (function(a){
        a.addEventListener("click", function(e){
          e.preventDefault();
          navigate(a.getAttribute("href"));
        });
      })(links[i]);
    }
  }

  window.TomatoNav = {
    isAdmin: isAdmin,
    getRole: getRole,
    setRole: setRole,
    init: function(opts){
      opts = opts || {};
      injectStyle();
      renderRoleToggle(opts.roleToggleId || "roleToggleMount");
      renderAdminBand(opts.adminBandId || "adminBand", opts.current || "", opts.title || "管理モード");
      renderGeneralNav(opts.generalNavId || "generalNav", opts.current || "");
      guardBackLinks();
    }
  };
})();
