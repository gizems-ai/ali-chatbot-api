// ===============================
// ALI – Satıştaki Sağ Kolunuz v5 (Video Launcher)
// N8N OpenAI Proxy + Video Button
// ===============================

(function() {
  'use strict';

  // ---- GLOBAL DEĞİŞKENLER ----
  const N8N_WEBHOOK_URL = "https://alisalesai.app.n8n.cloud/webhook/ali-proxy";
  const THREAD_ID_KEY = "ali_thread_id";
  const VIDEO_URL = "https://ali-chatbot-api.vercel.app/2406834.mp4";

  let currentThreadId = localStorage.getItem(THREAD_ID_KEY) || null;

  // ---- HELPER: N8N'E İSTEK GÖNDER ----
  async function callAliProxy(userMessage) {
    const payload = {
      message: userMessage,
      threadId: currentThreadId,
      context: {
        source: "website",
        timestamp: new Date().toISOString()
      }
    };

    const res = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(
        `HTTP ${res.status} – N8N isteğinde hata. Detay: ${errText || "Bilinmiyor"}`
      );
    }

    const data = await res.json();
    
    if (data.threadId) {
      currentThreadId = data.threadId;
      localStorage.setItem(THREAD_ID_KEY, currentThreadId);
    }

    return data.response || "Şu an yanıt üretirken bir sıkıntı yaşıyorum. Birazdan tekrar dener misin?";
  }

  // ---- WIDGET'İ YALNIZCA BİR KEZ EKLE ----
  if (window.__aliChatInjected) return;
  window.__aliChatInjected = true;

  // ---- STYLES ----
  const style = document.createElement("style");
  style.innerHTML = `
    .ali-chat * {
      box-sizing: border-box;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
    }

    /* Video Launcher */
    .ali-launcher {
      position: fixed;
      right: 24px;
      bottom: 24px;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      border: 3px solid rgba(95, 77, 238, 0.3);
      padding: 0;
      background: transparent;
      cursor: pointer;
      z-index: 999999;
      transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(95, 77, 238, 0.3);
    }

    .ali-launcher:hover {
      transform: translateY(-4px) scale(1.05);
      box-shadow: 0 12px 40px rgba(95, 77, 238, 0.5);
      border-color: rgba(95, 77, 238, 0.6);
    }

    .ali-launcher-video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
      pointer-events: none;
    }

    /* Chat container */
    .ali-chat {
      position: fixed;
      right: 24px;
      bottom: 24px;
      width: min(420px, calc(100vw - 32px));
      max-height: min(600px, calc(100vh - 80px));
      background: #ffffff;
      border-radius: 24px;
      box-shadow: 0 24px 80px rgba(15, 23, 42, 0.55);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      z-index: 1000000;
      transform-origin: bottom right;
      animation: ali-pop-in 0.18s ease-out;
    }

    @keyframes ali-pop-in {
      from { opacity: 0; transform: scale(0.85) translateY(8px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }

    /* Header */
    .ali-chat-header {
      padding: 16px 18px 14px;
      background: radial-gradient(circle at 0 0, rgba(255,255,255,0.14), transparent 55%),
                  linear-gradient(135deg, #020617, #020617 25%, #020720 100%);
      color: #e5e7eb;
      display: flex;
      align-items: center;
      gap: 10px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.35);
    }

    .ali-chat-avatar {
      flex-shrink: 0;
      width: 38px;
      height: 38px;
      border-radius: 999px;
      background: radial-gradient(circle at 30% 0%, #4cf5ff, #2e83ff 45%, #1f3ad8 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-weight: 800;
      font-size: 15px;
      box-shadow: 0 0 0 2px rgba(15,23,42,0.8), 0 10px 26px rgba(15,13,90,0.75);
    }

    .ali-chat-title-row {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
      min-width: 0;
    }

    .ali-chat-title {
      font-size: 15px;
      font-weight: 700;
      color: #f9fafb;
    }

    .ali-chat-subtitle {
      font-size: 12px;
      color: #cbd5f5;
    }

    .ali-chat-close {
      border: none;
      background: transparent;
      color: #9ca3af;
      font-size: 18px;
      cursor: pointer;
      padding: 4px;
      border-radius: 999px;
      transition: background 0.12s ease, color 0.12s ease;
    }

    .ali-chat-close:hover {
      background: rgba(148, 163, 184, 0.25);
      color: #e5e7eb;
    }

    /* Mesaj alanı */
    .ali-chat-body {
      flex: 1;
      padding: 14px 16px 10px;
      background: radial-gradient(circle at top, #e5ecff, #f9fafb 42%, #eef2ff 100%);
      overflow-y: auto;
      position: relative;
    }

    .ali-chat-messages {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .ali-msg-row {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }

    .ali-msg-row.user {
      justify-content: flex-end;
    }

    .ali-msg-bot-avatar-mini {
      width: 26px;
      height: 26px;
      border-radius: 999px;
      background: radial-gradient(circle at 30% 0%, #4cf5ff, #2e83ff 45%, #1f3ad8 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 11px;
      font-weight: 800;
      box-shadow: 0 0 0 1px rgba(15,23,42,0.4);
      flex-shrink: 0;
    }

    .ali-msg-bubble {
      max-width: 82%;
      border-radius: 16px;
      padding: 10px 12px;
      font-size: 14px;
      line-height: 1.4;
    }

    .ali-msg-bubble.bot {
      background: #ffffff;
      color: #020617;
      border: 1px solid rgba(148, 163, 184, 0.35);
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
    }

    .ali-msg-bubble.user {
      background: linear-gradient(135deg, #5f4dee, #b34dff);
      color: #ffffff;
      border-radius: 16px 16px 4px 16px;
      box-shadow: 0 12px 28px rgba(88, 28, 135, 0.55);
    }

    /* Loading animation */
    .ali-msg-loading-dots {
      display: inline-flex;
      gap: 4px;
      align-items: center;
    }
    .ali-msg-loading-dots span {
      width: 6px;
      height: 6px;
      border-radius: 999px;
      background: #9ca3af;
      animation: ali-bounce 0.9s infinite ease-in-out;
    }
    .ali-msg-loading-dots span:nth-child(2) { animation-delay: 0.18s; }
    .ali-msg-loading-dots span:nth-child(3) { animation-delay: 0.36s; }

    @keyframes ali-bounce {
      0%, 80%, 100% { transform: translateY(0); opacity: 0.35; }
      40% { transform: translateY(-4px); opacity: 1; }
    }

    /* Input alanı */
    .ali-chat-footer {
      padding: 10px 12px 12px;
      background: #ffffff;
      border-top: 1px solid rgba(148, 163, 184, 0.4);
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .ali-chat-input {
      flex: 1;
      border-radius: 999px;
      border: 1px solid rgba(148, 163, 184, 0.8);
      padding: 9px 14px;
      font-size: 13px;
      outline: none;
      background: #f9fafb;
      color: #020617;
      transition: border-color 0.14s ease, box-shadow 0.14s ease, background 0.14s ease;
    }

    .ali-chat-input::placeholder {
      color: #6b7280;
    }

    .ali-chat-input:focus {
      border-color: #6366f1;
      background: #ffffff;
      box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.65);
    }

    .ali-chat-send {
      border-radius: 999px;
      border: none;
      padding: 9px 16px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #ffffff;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
      box-shadow: 0 12px 28px rgba(79, 70, 229, 0.6);
      display: flex;
      align-items: center;
      gap: 6px;
      transition: transform 0.12s ease, box-shadow 0.12s ease;
    }

    .ali-chat-send:hover {
      transform: translateY(-1px);
      box-shadow: 0 16px 40px rgba(79, 70, 229, 0.75);
    }

    .ali-chat-send:disabled {
      opacity: 0.6;
      cursor: default;
      box-shadow: none;
      transform: none;
    }

    /* Mobile optimizasyon */
    @media (max-width: 640px) {
      .ali-chat {
        right: 12px;
        bottom: 12px;
        width: calc(100vw - 24px);
        max-height: calc(100vh - 40px);
      }
      .ali-launcher {
        right: 16px;
        bottom: 16px;
      }
    }
  `;
  document.head.appendChild(style);

  // ---- DOM OLUŞTUR ----
  const launcher = document.createElement("button");
  launcher.className = "ali-launcher";
  launcher.setAttribute("id", "ali-launcher");
  launcher.setAttribute("aria-label", "Ali ile sohbet başlat");

  launcher.innerHTML = `
    <video class="ali-launcher-video" autoplay loop muted playsinline>
      <source src="${VIDEO_URL}" type="video/mp4">
    </video>
  `;

  const chat = document.createElement("div");
  chat.className = "ali-chat";
  chat.style.display = "none";

  chat.innerHTML = `
    <div class="ali-chat-header">
      <div class="ali-chat-avatar">ALI</div>
      <div class="ali-chat-title-row">
        <div class="ali-chat-title">ALI – Satıştaki Sağ Kolunuz</div>
        <div class="ali-chat-subtitle">Türkiye'nin satışçısı yanınızda.</div>
      </div>
      <button class="ali-chat-close" aria-label="Kapat">&times;</button>
    </div>
    <div class="ali-chat-body">
      <div class="ali-chat-messages"></div>
    </div>
    <div class="ali-chat-footer">
      <input class="ali-chat-input" type="text"
        placeholder="ALI'ye sorun, ben özetleyeyim..." />
      <button class="ali-chat-send">
        <span>Gönder</span>
      </button>
    </div>
  `;

  document.body.appendChild(launcher);
  document.body.appendChild(chat);

  const messagesEl = chat.querySelector(".ali-chat-messages");
  const closeBtn = chat.querySelector(".ali-chat-close");
  const inputEl = chat.querySelector(".ali-chat-input");
  const sendBtn = chat.querySelector(".ali-chat-send");

  let hasOpenedOnce = false;
  let isSending = false;

  // ---- MESAJ HELPERS ----
  function addBotMessage(text, { isLoading = false } = {}) {
    const row = document.createElement("div");
    row.className = "ali-msg-row bot";

    const avatarMini = document.createElement("div");
    avatarMini.className = "ali-msg-bot-avatar-mini";
    avatarMini.textContent = "ALI";

    const bubble = document.createElement("div");
    bubble.className = "ali-msg-bubble bot";

    if (isLoading) {
      bubble.innerHTML = `
        <div class="ali-msg-loading-dots">
          <span></span><span></span><span></span>
        </div>
      `;
    } else {
      bubble.textContent = text;
    }

    row.appendChild(avatarMini);
    row.appendChild(bubble);
    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    return bubble;
  }

  function addUserMessage(text) {
    const row = document.createElement("div");
    row.className = "ali-msg-row user";

    const bubble = document.createElement("div");
    bubble.className = "ali-msg-bubble user";
    bubble.textContent = text;

    row.appendChild(bubble);
    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function addErrorMessage(errText) {
    addBotMessage(
      "ALI: Şu an bağlantıda bir sıkıntı var gibi görünüyor. Birazdan tekrar dener misin?\n\nTeknik detay: " +
      errText
    );
  }

  // ---- İLK AÇILIŞ ----
  function ensureWelcomeMessage() {
    if (hasOpenedOnce) return;
    hasOpenedOnce = true;

    const welcomeText = "Merhaba, ben ALI. İşlerini kolaylaştırıp satışlarını artırmak için sana nasıl yardımcı olabilirim?";
    addBotMessage(welcomeText);
  }

  // ---- GÖNDERME ----
  async function handleSend() {
    const value = (inputEl.value || "").trim();
    if (!value || isSending) return;

    addUserMessage(value);
    inputEl.value = "";
    inputEl.focus();

    isSending = true;
    sendBtn.disabled = true;

    const loadingBubble = addBotMessage("", { isLoading: true });

    try {
      const reply = await callAliProxy(value);
      
      loadingBubble.innerHTML = "";
      loadingBubble.textContent = reply;
      
    } catch (err) {
      console.error(err);
      loadingBubble.parentElement?.remove();
      addErrorMessage(err.message || String(err));
    } finally {
      isSending = false;
      sendBtn.disabled = false;
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  }

  // ---- EVENTS ----
  launcher.addEventListener("click", () => {
    const isOpen = chat.style.display === "flex";
    if (isOpen) {
      chat.style.display = "none";
    } else {
      chat.style.display = "flex";
      ensureWelcomeMessage();
      setTimeout(() => {
        inputEl?.focus();
      }, 120);
    }
  });

  closeBtn.addEventListener("click", () => {
    chat.style.display = "none";
  });

  sendBtn.addEventListener("click", handleSend);

  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

})();
