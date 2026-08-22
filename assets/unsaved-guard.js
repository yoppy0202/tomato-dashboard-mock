/*
 * 未保存離脱ガード(共通コンポーネント)
 * 対象画面(admin.html / announce.html / markets.html / minutes-edit.html)から
 * 未保存の変更があるまま離れようとした際に、サイト内確認ダイアログで止める。
 *
 * 使い方:
 *   UnsavedGuard.markDirty() / UnsavedGuard.markClean() で状態を管理
 *   UnsavedGuard.init({ saveAndLeave: function(proceed){ ...保存処理...; proceed(); } })
 *   ナビゲーションリンクからの遷移は UnsavedGuard.guardNavigate(href) を経由させる(nav.js が自動で呼ぶ)
 */
(function(){
  "use strict";

  var state = { dirty:false, pendingAction:null, saveAndLeave:null };

  function isDirty(){ return state.dirty; }
  function markDirty(){ state.dirty = true; }
  function markClean(){ state.dirty = false; }

  function injectStyle(){
    if(document.getElementById("ugStyle")) return;
    var css = ""
      + ".ug-modalbg{display:none;position:fixed;inset:0;z-index:9000;"
      + "background:rgba(30,30,28,.5);align-items:center;justify-content:center;padding:20px;}"
      + ".ug-modalbg.show{display:flex;}"
      + ".ug-modal{background:#fff;border-radius:14px;max-width:360px;width:100%;"
      + "padding:22px 20px 18px 20px;box-shadow:0 12px 40px rgba(0,0,0,.28);"
      + "font-family:inherit;text-align:center;}"
      + ".ug-icon{font-size:26px;margin-bottom:6px;}"
      + ".ug-title{font-size:14.5px;font-weight:700;color:#232323;margin-bottom:8px;}"
      + ".ug-body{font-size:12.5px;line-height:1.7;color:#4a4238;margin-bottom:16px;}"
      + ".ug-btns{display:flex;flex-direction:column;gap:8px;}"
      + ".ug-btn{font-family:inherit;font-size:13px;font-weight:700;border-radius:8px;"
      + "padding:11px 14px;cursor:pointer;border:1px solid #e3e2df;background:#faf9f7;color:#232323;}"
      + ".ug-btn:active{transform:translateY(1px);}"
      + ".ug-btn.ug-primary{background:#4c7a52;border-color:#33583a;color:#fff;}"
      + ".ug-btn.ug-danger{background:#fdf4f3;border-color:#e0b7b1;color:#a63a2f;}"
      + ".ug-btn.ug-ghost{background:#fff;color:#6f6f6f;}";
    var style = document.createElement("style");
    style.id = "ugStyle";
    style.textContent = css;
    document.head.appendChild(style);
  }

  var els = null;
  function ensureModal(){
    if(els) return els;
    injectStyle();
    var wrap = document.createElement("div");
    wrap.className = "ug-modalbg";
    wrap.id = "ugModalBg";
    wrap.innerHTML =
      '<div class="ug-modal">'
      + '<div class="ug-icon">⚠️</div>'
      + '<div class="ug-title">保存されていない変更があります</div>'
      + '<div class="ug-body">このページを離れると、入力中の内容が失われる可能性があります。<br>どうしますか?</div>'
      + '<div class="ug-btns">'
      + '<button type="button" class="ug-btn ug-primary" id="ugSaveBtn">保存してから離れる</button>'
      + '<button type="button" class="ug-btn ug-danger" id="ugDiscardBtn">このまま離れる</button>'
      + '<button type="button" class="ug-btn ug-ghost" id="ugCancelBtn">キャンセル(このページに留まる)</button>'
      + '</div></div>';
    document.body.appendChild(wrap);
    els = {
      bg: wrap,
      save: wrap.querySelector("#ugSaveBtn"),
      discard: wrap.querySelector("#ugDiscardBtn"),
      cancel: wrap.querySelector("#ugCancelBtn")
    };
    els.save.addEventListener("click", function(){
      closeDialog();
      if(typeof state.saveAndLeave === "function"){
        state.saveAndLeave(runPending);
      }else{
        runPending();
      }
    });
    els.discard.addEventListener("click", function(){
      closeDialog();
      runPending();
    });
    els.cancel.addEventListener("click", function(){
      closeDialog();
      state.pendingAction = null;
    });
    return els;
  }

  function openDialog(){
    ensureModal().bg.classList.add("show");
  }
  function closeDialog(){
    if(els) els.bg.classList.remove("show");
  }
  function runPending(){
    var fn = state.pendingAction;
    state.pendingAction = null;
    state.dirty = false;
    if(typeof fn === "function") fn();
  }

  function guardNavigate(href){
    if(!state.dirty){ location.href = href; return; }
    state.pendingAction = function(){ location.href = href; };
    openDialog();
  }
  function guardAction(fn){
    if(!state.dirty){ fn(); return; }
    state.pendingAction = fn;
    openDialog();
  }

  window.addEventListener("beforeunload", function(e){
    if(state.dirty){
      e.preventDefault();
      e.returnValue = "";
      return "";
    }
  });

  window.UnsavedGuard = {
    isDirty: isDirty,
    markDirty: markDirty,
    markClean: markClean,
    guardNavigate: guardNavigate,
    guardAction: guardAction,
    init: function(opts){
      opts = opts || {};
      state.saveAndLeave = opts.saveAndLeave || null;
    }
  };
})();
