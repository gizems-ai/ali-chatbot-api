// ALI CHATBOT WIDGET V6 — SELF-CONTAINED
// Tek <script> tag ile bubble + chat + CSS gelir.
//
// Zorunlu:
//   data-tenant
// Opsiyonel:
//   data-tenant-name    → Chat header'da kullanılabilir (stored, future)
//   data-tooltip        → Bubble üstü metin (default: "Yardıma ihtiyacın var mı? 👋")
//   data-mobile-mode    → "chat" (default) | "whatsapp"
//   data-whatsapp-number→ Yalnızca mobile-mode="whatsapp" ise
//   data-brand-color    → CSS renk (default: "#5B47E0")
//   data-greeting       → Tek string, en yüksek öncelik
//   data-greetings      → JSON multi-lang: '{"tr":"...","en":"...","de":"..."}'
//
// Greeting priority:
//   1. data-greeting (string)
//   2. data-greetings (JSON, dil detect: document.documentElement.lang)
//   3. Auto-discovery (h1 → meta[description] → document.title)
//   4. Generic fallback
(function () {
  'use strict';
  if (window.__aliChatWindowInjected) return;
  window.__aliChatWindowInjected = true;

  // ── Config ───────────────────────────────────────────────────────────────────
  var scriptTag     = document.currentScript || document.querySelector('script[data-tenant]');
  var TENANT_ID     = (scriptTag && scriptTag.dataset.tenant)          || '905324069594';
  var TENANT_NAME   = (scriptTag && scriptTag.dataset.tenantName)      || '';
  var TOOLTIP_TEXT  = (scriptTag && scriptTag.dataset.tooltip)         || 'Yardıma ihtiyacın var mı? 👋';
  var MOBILE_MODE   = (scriptTag && scriptTag.dataset.mobileMode)      || 'chat';
  var WA_NUMBER     = (scriptTag && scriptTag.dataset.whatsappNumber)  || '';
  var BRAND_COLOR   = (scriptTag && scriptTag.dataset.brandColor)      || '#5B47E0';
  var GREETING      = (scriptTag && scriptTag.dataset.greeting)        || '';
  var N8N_URL       = 'https://n8n.alisales.ai/webhook/chatbot-v2';
  var AVATAR_URL    = 'https://raw.githubusercontent.com/gizems-ai/ali-chatbot-api/main/public/public/public:ali-avatar.png';
  var THREAD_KEY    = 'ali_thread_id_' + TENANT_ID;

  var GREETINGS_MULTILANG = null;
  try {
    var raw = scriptTag && scriptTag.dataset.greetings;
    if (raw) GREETINGS_MULTILANG = JSON.parse(raw);
  } catch (e) {
    console.warn('[AliChat v17] data-greetings JSON parse error:', e);
  }

  var currentThreadId = localStorage.getItem(THREAD_KEY) || null;
  var isChatOpen  = false;
  var isSending   = false;
  var hasWelcomed = false;

  // ── Brand color helpers ───────────────────────────────────────────────────────
  function getReadableTextColor(hex) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
    var r = parseInt(h.substring(0, 2), 16);
    var g = parseInt(h.substring(2, 4), 16);
    var b = parseInt(h.substring(4, 6), 16);
    return (0.299*r + 0.587*g + 0.114*b) > 128 ? '#1F2937' : '#FFFFFF';
  }

  var TEXT_ON_BRAND = getReadableTextColor(BRAND_COLOR);
  document.documentElement.style.setProperty('--ali-brand', BRAND_COLOR);
  document.documentElement.style.setProperty('--ali-text-on-brand', TEXT_ON_BRAND);

  // ── Greeting resolution (client-side, no backend call) ───────────────────────
  function resolveGreeting() {
    // 1. data-greeting (single string)
    if (GREETING) return GREETING;

    // 2. data-greetings (JSON multi-lang)
    if (GREETINGS_MULTILANG) {
      var lang = ((document.documentElement.lang || 'en').substring(0, 2)).toLowerCase();
      if (GREETINGS_MULTILANG[lang])   return GREETINGS_MULTILANG[lang];
      if (GREETINGS_MULTILANG['en'])   return GREETINGS_MULTILANG['en'];
      var firstKey = Object.keys(GREETINGS_MULTILANG)[0];
      if (firstKey) return GREETINGS_MULTILANG[firstKey];
    }

    // 3. Auto-discovery
    var h1 = document.querySelector('h1');
    if (h1 && h1.textContent.trim()) {
      return 'Merhaba! ' + h1.textContent.trim() + ' hakkında size nasıl yardımcı olabilirim?';
    }
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && metaDesc.getAttribute('content')) {
      var desc = metaDesc.getAttribute('content').trim();
      return (desc.length > 80 ? desc.substring(0, 80) + '…' : desc) + ' — Size nasıl yardımcı olabilirim?';
    }
    if (document.title) {
      return 'Merhaba! Ben ' + document.title + ' asistanı Ali. Nasıl yardımcı olabilirim?';
    }

    // 4. Generic fallback
    return 'Merhaba! Size nasıl yardımcı olabilirim?';
  }

  // ── CSS ──────────────────────────────────────────────────────────────────────
  var style = document.createElement('style');
  style.innerHTML = [
    '#ali-widget-wrap {',
    '  position:fixed; bottom:20px; right:20px; z-index:999999;',
    '  font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;',
    '}',
    '.ali-bubble {',
    '  width:72px; height:72px; border-radius:50%;',
    '  background:var(--ali-brand);',
    '  cursor:pointer; display:flex; align-items:center; justify-content:center;',
    '  box-shadow:0 8px 24px rgba(0,0,0,0.25);',
    '  transition:transform 0.2s ease,box-shadow 0.2s ease;',
    '  -webkit-tap-highlight-color:transparent;',
    '  user-select:none; -webkit-user-select:none; touch-action:manipulation; overflow:hidden;',
    '}',
    '.ali-bubble img { width:100%; height:100%; border-radius:50%; object-fit:cover; pointer-events:none; }',
    '.ali-bubble:hover  { transform:scale(1.08); box-shadow:0 12px 32px rgba(0,0,0,0.3); }',
    '.ali-bubble:active { transform:scale(0.94); transition:transform 0.1s ease; }',
    '.ali-tooltip {',
    '  position:absolute; bottom:84px; right:0;',
    '  background:var(--ali-brand); color:var(--ali-text-on-brand);',
    '  padding:10px 16px; border-radius:10px;',
    '  box-shadow:0 4px 16px rgba(0,0,0,0.2);',
    '  white-space:nowrap; font-size:13px; font-weight:600;',
    '  pointer-events:none; opacity:1; transition:opacity 0.3s ease;',
    '}',
    '.ali-tooltip::after {',
    '  content:""; position:absolute; bottom:-7px; right:28px;',
    '  width:0; height:0;',
    '  border-left:7px solid transparent; border-right:7px solid transparent;',
    '  border-top:7px solid var(--ali-brand);',
    '}',
    '@media (max-width:768px) {',
    '  .ali-bubble { width:56px; height:56px; }',
    '  .ali-tooltip { bottom:68px; font-size:12px; padding:8px 12px; }',
    '}',
    '.ali-chat-window {',
    '  position:fixed; right:20px; bottom:20px;',
    '  width:min(420px,calc(100vw - 40px)); max-height:min(600px,calc(100vh - 80px));',
    '  background:white; border-radius:24px;',
    '  box-shadow:0 24px 80px rgba(15,23,42,0.55);',
    '  display:none; flex-direction:column; z-index:999998; overflow:hidden;',
    '  font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;',
    '  animation:ali-pop-in 0.18s ease-out;',
    '  -webkit-tap-highlight-color:transparent;',
    '}',
    '.ali-chat-window.open { display:flex; }',
    '@keyframes ali-pop-in {',
    '  from { opacity:0; transform:scale(0.85) translateY(8px); }',
    '  to   { opacity:1; transform:scale(1)    translateY(0);   }',
    '}',
    '.ali-chat-header {',
    '  padding:16px 18px; background:var(--ali-brand); color:var(--ali-text-on-brand);',
    '  display:flex; align-items:center; gap:12px;',
    '}',
    '.ali-chat-hdr-avatar {',
    '  width:40px; height:40px; border-radius:50%;',
    '  background:rgba(255,255,255,0.2);',
    '  display:flex; align-items:center; justify-content:center;',
    '  color:var(--ali-text-on-brand); font-weight:800; font-size:16px; flex-shrink:0;',
    '}',
    '.ali-chat-title-row { flex:1; min-width:0; }',
    '.ali-chat-title    { font-size:16px; font-weight:700; }',
    '.ali-chat-subtitle { font-size:13px; opacity:0.85; }',
    '.ali-chat-close {',
    '  background:rgba(255,255,255,0.2); border:none; color:var(--ali-text-on-brand);',
    '  font-size:24px; width:32px; height:32px; border-radius:50%; cursor:pointer;',
    '  display:flex; align-items:center; justify-content:center;',
    '  padding:0; line-height:1; transition:background 0.2s;',
    '  -webkit-tap-highlight-color:transparent; user-select:none; -webkit-user-select:none;',
    '}',
    '.ali-chat-close:hover  { background:rgba(255,255,255,0.3); }',
    '.ali-chat-close:active { transform:scale(0.9); }',
    '.ali-chat-body {',
    '  flex:1; padding:16px; background:#f7fafc;',
    '  overflow-y:auto; -webkit-overflow-scrolling:touch;',
    '}',
    '.ali-chat-messages { display:flex; flex-direction:column; gap:12px; }',
    '.ali-msg-row { display:flex; align-items:flex-start; gap:8px; }',
    '.ali-msg-row.user { justify-content:flex-end; }',
    '.ali-msg-bot-av {',
    '  width:28px; height:28px; border-radius:50%; background:var(--ali-brand);',
    '  display:flex; align-items:center; justify-content:center;',
    '  color:var(--ali-text-on-brand); font-size:12px; font-weight:800; flex-shrink:0;',
    '}',
    '.ali-msg-bubble { max-width:75%; padding:12px 16px; border-radius:16px; font-size:14px; line-height:1.5; }',
    '.ali-msg-bubble.bot  { background:white; color:#2d3748; border:1px solid #e2e8f0; box-shadow:0 1px 3px rgba(0,0,0,0.1); }',
    '.ali-msg-bubble.user { background:var(--ali-brand); color:var(--ali-text-on-brand); border-radius:16px 16px 4px 16px; }',
    '.ali-msg-loading { display:inline-flex; gap:4px; }',
    '.ali-msg-loading span { width:6px; height:6px; border-radius:50%; background:#cbd5e0; animation:ali-bounce 0.9s infinite ease-in-out; }',
    '.ali-msg-loading span:nth-child(2) { animation-delay:0.18s; }',
    '.ali-msg-loading span:nth-child(3) { animation-delay:0.36s; }',
    '@keyframes ali-bounce {',
    '  0%,80%,100% { transform:translateY(0); opacity:0.4; }',
    '  40%          { transform:translateY(-6px); opacity:1; }',
    '}',
    '.ali-chat-footer { padding:12px 16px; background:white; border-top:1px solid #e2e8f0; display:flex; gap:8px; }',
    '.ali-chat-input {',
    '  flex:1; border-radius:24px; border:1px solid #cbd5e0;',
    '  padding:10px 16px; font-size:14px; outline:none;',
    '  background:#f7fafc; color:#2d3748; transition:all 0.2s;',
    '  -webkit-tap-highlight-color:transparent;',
    '}',
    '.ali-chat-input::placeholder { color:#a0aec0; }',
    '.ali-chat-input:focus { border-color:var(--ali-brand); background:white; box-shadow:0 0 0 3px rgba(91,71,224,0.12); }',
    '.ali-chat-send {',
    '  border-radius:24px; border:none; padding:10px 20px;',
    '  background:var(--ali-brand); color:var(--ali-text-on-brand);',
    '  font-size:14px; font-weight:600; cursor:pointer; transition:all 0.2s;',
    '  -webkit-tap-highlight-color:transparent; user-select:none; -webkit-user-select:none;',
    '}',
    '.ali-chat-send:hover  { filter:brightness(1.1); transform:translateY(-1px); }',
    '.ali-chat-send:active { transform:scale(0.95); }',
    '.ali-chat-send:disabled { opacity:0.6; cursor:default; transform:none; filter:none; }',
    '@media (max-width:640px) {',
    '  .ali-chat-window { right:16px; bottom:16px; width:calc(100vw - 32px); max-height:calc(100vh - 40px); }',
    '}'
  ].join('\n');
  document.head.appendChild(style);

  // ── Bubble + Tooltip ─────────────────────────────────────────────────────────
  var wrap = document.createElement('div');
  wrap.id = 'ali-widget-wrap';

  var tooltip = document.createElement('div');
  tooltip.className = 'ali-tooltip';
  tooltip.textContent = TOOLTIP_TEXT;

  var bubble = document.createElement('div');
  bubble.className = 'ali-bubble';
  var avatarImg = document.createElement('img');
  avatarImg.src = AVATAR_URL;
  avatarImg.alt = 'Ali';
  bubble.appendChild(avatarImg);

  wrap.appendChild(tooltip);
  wrap.appendChild(bubble);
  document.body.appendChild(wrap);

  // ── Chat Window ──────────────────────────────────────────────────────────────
  var chatWindow = document.createElement('div');
  chatWindow.className = 'ali-chat-window';
  chatWindow.id = 'ali-chat-window';
  chatWindow.innerHTML =
    '<div class="ali-chat-header">' +
      '<div class="ali-chat-hdr-avatar">Ali</div>' +
      '<div class="ali-chat-title-row">' +
        '<div class="ali-chat-title">Ali – Satıştaki Sağ Kolunuz</div>' +
        '<div class="ali-chat-subtitle">' + (TENANT_NAME || 'Yapay Zekali Satış Asistanı') + '</div>' +
      '</div>' +
      '<button class="ali-chat-close">×</button>' +
    '</div>' +
    '<div class="ali-chat-body"><div class="ali-chat-messages"></div></div>' +
    '<div class="ali-chat-footer">' +
      '<input class="ali-chat-input" type="text" placeholder="Mesajınızı yazın..." />' +
      '<button class="ali-chat-send">Gönder</button>' +
    '</div>';
  document.body.appendChild(chatWindow);

  var closeBtn   = chatWindow.querySelector('.ali-chat-close');
  var messagesEl = chatWindow.querySelector('.ali-chat-messages');
  var inputEl    = chatWindow.querySelector('.ali-chat-input');
  var sendBtn    = chatWindow.querySelector('.ali-chat-send');

  // ── Message helpers ───────────────────────────────────────────────────────────
  function addBotMessage(text, isLoading) {
    var row = document.createElement('div');
    row.className = 'ali-msg-row bot';
    var av = document.createElement('div');
    av.className = 'ali-msg-bot-av';
    av.textContent = 'ALI';
    var bub = document.createElement('div');
    bub.className = 'ali-msg-bubble bot';
    if (isLoading) {
      bub.innerHTML = '<div class="ali-msg-loading"><span></span><span></span><span></span></div>';
    } else {
      bub.textContent = text;
    }
    row.appendChild(av);
    row.appendChild(bub);
    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return bub;
  }

  function addUserMessage(text) {
    var row = document.createElement('div');
    row.className = 'ali-msg-row user';
    var bub = document.createElement('div');
    bub.className = 'ali-msg-bubble user';
    bub.textContent = text;
    row.appendChild(bub);
    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function cleanThreadId(threadId) {
    if (!threadId) return null;
    var cleaned = threadId.toString().trim().replace(/^=+|=+$/g, '').trim();
    if (!/^thread_[a-zA-Z0-9_-]+$/.test(cleaned)) return null;
    return cleaned;
  }

  // ── Send message ─────────────────────────────────────────────────────────────
  function handleSend() {
    var value = (inputEl.value || '').trim();
    if (!value || isSending) return;

    var cleanedThreadId = cleanThreadId(currentThreadId);
    addUserMessage(value);
    inputEl.value = '';
    isSending = true;
    sendBtn.disabled = true;
    var loadingBub = addBotMessage('', true);

    fetch(N8N_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: value,
        threadId: cleanedThreadId,
        tenant_id: TENANT_ID,
        context: { source: 'website', timestamp: new Date().toISOString() }
      })
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data.threadId) {
        var clean = cleanThreadId(data.threadId);
        if (clean) { currentThreadId = clean; localStorage.setItem(THREAD_KEY, clean); }
      }
      if (data.silent === true) {
        loadingBub.parentElement && loadingBub.parentElement.remove();
        return;
      }
      var reply = (data.text || 'Şu an bir sorun yaşıyorum, birazdan tekrar dener misin?').trim();
      if (reply.charAt(0) === '=') reply = reply.substring(1);
      loadingBub.innerHTML = '';
      loadingBub.textContent = reply;
    })
    .catch(function () {
      loadingBub.parentElement && loadingBub.parentElement.remove();
      addBotMessage('Şu an bağlantıda bir sıkıntı var. Birazdan tekrar dener misin?');
    })
    .finally(function () {
      isSending = false;
      sendBtn.disabled = false;
      messagesEl.scrollTop = messagesEl.scrollHeight;
    });
  }

  // ── Public API ────────────────────────────────────────────────────────────────
  window.AliChat = {
    open: function () {
      isChatOpen = true;
      chatWindow.classList.add('open');
      if (!hasWelcomed) {
        hasWelcomed = true;
        if (currentThreadId) {
          // Session restore — önceki konuşma devam ediyor, greeting gösterme
        } else {
          addBotMessage(resolveGreeting());
        }
      }
      setTimeout(function () { inputEl.focus(); }, 120);
    },
    close: function () {
      isChatOpen = false;
      chatWindow.classList.remove('open');
    },
    toggle: function () { if (isChatOpen) { this.close(); } else { this.open(); } },
    getThreadId: function () { return currentThreadId; },
    clearThread: function () { localStorage.removeItem(THREAD_KEY); currentThreadId = null; }
  };

  // ── Mobile detection ─────────────────────────────────────────────────────────
  function isMobile() {
    return window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent);
  }

  // ── Bubble click ─────────────────────────────────────────────────────────────
  function onBubbleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (isMobile() && MOBILE_MODE === 'whatsapp' && WA_NUMBER) {
      window.location.href = 'https://wa.me/' + WA_NUMBER;
      return;
    }
    window.AliChat.open();
    wrap.style.display = 'none';
  }

  bubble.addEventListener('click', onBubbleClick);
  bubble.addEventListener('touchstart', onBubbleClick, { passive: false });

  // ── MutationObserver: chat kapanınca bubble geri ──────────────────────────────
  new MutationObserver(function () {
    if (!chatWindow.classList.contains('open')) {
      wrap.style.display = '';
    }
  }).observe(chatWindow, { attributes: true, attributeFilter: ['class'] });

  // ── Close button ─────────────────────────────────────────────────────────────
  closeBtn.addEventListener('click', function () { window.AliChat.close(); });
  closeBtn.addEventListener('touchstart', function (e) {
    e.preventDefault();
    window.AliChat.close();
  }, { passive: false });

  // ── Send triggers ────────────────────────────────────────────────────────────
  sendBtn.addEventListener('click', handleSend);
  sendBtn.addEventListener('touchstart', function (e) { e.preventDefault(); handleSend(); }, { passive: false });
  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  });
  inputEl.addEventListener('touchstart', function (e) { e.stopPropagation(); });

  console.log('[AliChat v17] tenant=' + TENANT_ID + ' brand=' + BRAND_COLOR + ' mobile=' + MOBILE_MODE);
})();
