// Progressive enhancement for every code block on the site: a line-number
// gutter (like the editor) and a one-click Copy button. Purely additive —
// runs on load, wraps each <pre> and never touches the interactive editor.
(function () {
  "use strict";
  var COPY =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>';

  function enhance() {
    var pres = document.querySelectorAll("pre");
    Array.prototype.forEach.call(pres, function (pre) {
      if (pre.dataset.enhanced) return;
      if (pre.closest(".ax-ide")) return; // skip the live, interactive editor
      var code = pre.querySelector("code") || pre;

      // Line count + copy text: prefer explicit .line spans, else split on \n.
      var lineEls = code.querySelectorAll(".line");
      var raw, lines;
      if (lineEls.length) {
        raw = Array.prototype.map
          .call(lineEls, function (l) { return l.textContent; })
          .join("\n");
        lines = lineEls.length;
      } else {
        raw = code.textContent.replace(/\n$/, "");
        lines = raw.split("\n").length;
      }
      pre.dataset.enhanced = "1";

      var cb = document.createElement("div");
      cb.className = "cb";
      var top = document.createElement("div");
      top.className = "cb-top";
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cb-copy";
      btn.innerHTML = COPY + "<span>Copy</span>";
      top.appendChild(btn);

      var body = document.createElement("div");
      body.className = "cb-body";
      var gutter = document.createElement("div");
      gutter.className = "cb-gutter";
      gutter.setAttribute("aria-hidden", "true");
      var g = "";
      for (var i = 1; i <= lines; i++) g += i + (i < lines ? "\n" : "");
      gutter.textContent = g;

      pre.parentNode.insertBefore(cb, pre);
      body.appendChild(gutter);
      body.appendChild(pre);
      cb.appendChild(top);
      cb.appendChild(body);

      btn.addEventListener("click", function () {
        function done() {
          btn.classList.add("ok");
          var s = btn.querySelector("span");
          var prev = s.textContent;
          s.textContent = "Copied";
          setTimeout(function () {
            btn.classList.remove("ok");
            s.textContent = prev;
          }, 1400);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(raw).then(done, fallback);
        } else {
          fallback();
        }
        function fallback() {
          var t = document.createElement("textarea");
          t.value = raw;
          t.style.position = "fixed";
          t.style.opacity = "0";
          document.body.appendChild(t);
          t.select();
          try { document.execCommand("copy"); } catch (e) {}
          document.body.removeChild(t);
          done();
        }
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", enhance);
  } else {
    enhance();
  }
})();
