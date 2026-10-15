/*!
 * KhaleejiBot website widget loader.
 *
 *   <script src="https://YOUR_APP/widget.js" data-bot-id="BOT_UUID" data-lang="ar" async></script>
 *
 * Optional attributes:
 *   data-lang      "ar" (default) or "en"
 *   data-position  "left" or "right" (defaults to left for Arabic, right for English)
 *   data-color     launcher colour, any CSS colour (default #0f5e5c)
 */
(function () {
  "use strict";
  var script = document.currentScript;
  if (!script || window.__khaleejibotLoaded) return;
  window.__khaleejibotLoaded = true;

  var botId = script.getAttribute("data-bot-id");
  if (!botId) {
    console.warn("[KhaleejiBot] data-bot-id is missing");
    return;
  }
  var origin = new URL(script.src).origin;
  var lang = script.getAttribute("data-lang") === "en" ? "en" : "ar";
  var side = script.getAttribute("data-position") || (lang === "ar" ? "left" : "right");
  var color = script.getAttribute("data-color") || "#0f5e5c";
  var labels = lang === "ar" ? { open: "افتح المحادثة", close: "أغلق المحادثة" } : { open: "Open chat", close: "Close chat" };

  var host = document.createElement("div");
  host.setAttribute("data-khaleejibot", "");
  var root = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;

  var style = document.createElement("style");
  style.textContent =
    ":host{all:initial}" +
    ".kb-launcher{position:fixed;bottom:20px;" + side + ":20px;z-index:2147483646;width:60px;height:60px;border-radius:50%;border:0;cursor:pointer;" +
    "background:" + color + ";color:#fff;box-shadow:0 8px 24px rgba(0,0,0,.2);display:flex;align-items:center;justify-content:center;transition:transform .15s ease}" +
    ".kb-launcher:hover{transform:scale(1.05)}.kb-launcher:focus-visible{outline:3px solid " + color + ";outline-offset:3px}" +
    ".kb-frame{position:fixed;bottom:92px;" + side + ":20px;z-index:2147483647;width:380px;height:600px;max-height:calc(100vh - 112px);" +
    "border:0;border-radius:16px;box-shadow:0 16px 48px rgba(0,0,0,.25);background:#fff;display:none}" +
    ".kb-open .kb-frame{display:block}" +
    "@media (max-width:480px){.kb-frame{inset:0;width:100%;height:100%;max-height:none;border-radius:0}.kb-open .kb-launcher{display:none}}" +
    "@media (prefers-reduced-motion:reduce){.kb-launcher{transition:none}}";
  root.appendChild(style);

  var wrapper = document.createElement("div");
  var launcher = document.createElement("button");
  launcher.className = "kb-launcher";
  launcher.type = "button";
  launcher.setAttribute("aria-label", labels.open);
  launcher.setAttribute("aria-expanded", "false");
  launcher.innerHTML =
    '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>';

  var frame = null;
  function ensureFrame() {
    if (frame) return frame;
    frame = document.createElement("iframe");
    frame.className = "kb-frame";
    frame.title = lang === "ar" ? "محادثة" : "Chat";
    frame.allow = "microphone";
    frame.src = origin + "/widget/" + encodeURIComponent(botId) + "?embedded=1&lang=" + lang;
    wrapper.appendChild(frame);
    return frame;
  }

  function setOpen(open) {
    if (open) ensureFrame();
    wrapper.className = open ? "kb-open" : "";
    launcher.setAttribute("aria-expanded", String(open));
    launcher.setAttribute("aria-label", open ? labels.close : labels.open);
  }

  launcher.addEventListener("click", function () {
    setOpen(wrapper.className !== "kb-open");
  });
  window.addEventListener("message", function (event) {
    if (event.origin === origin && event.data && event.data.type === "khaleejibot:close") {
      setOpen(false);
      launcher.focus();
    }
  });

  wrapper.appendChild(launcher);
  root.appendChild(wrapper);
  (document.body || document.documentElement).appendChild(host);
})();
