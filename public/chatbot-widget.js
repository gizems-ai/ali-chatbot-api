(function() {
  'use strict';

  // ---- CONFIG ----
  const N8N_WEBHOOK_URL = "https://alisalesai.app.n8n.cloud/webhook/ali-proxy";
  const VIDEO_URL = "https://ali-chatbot-api.vercel.app/2406834.mp4";
  const THREAD_ID_KEY = "ali_thread_id";
  
  let currentThreadId = localStorage.getItem(THREAD_ID_KEY) || null;
  let isChatOpen = false;
  let isSending = false;
  let hasOpenedOnce = false;

  // ---- N8N API CALL ----
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`N8N error: ${res.status}`);
    }

    const data = await res.json();
    
    if (data.threadId) {
      currentThreadId = data.threadId;
      localStorage.setItem(THREAD_ID_KEY, currentThreadId);
    }

    return data.response || "Şu an bir sorun yaşıyorum, birazdan tekrar dener misin?";
  }

  // ---- WIDGET HTML ----
  const widgetHTML = `
    <div id="ali-chatbot-widget">
      <!-- Video Launcher Button -->
      <div id="ali-chat-bubble" class="ali-chat-bubble">
        <video class="ali-video" autoplay loop muted playsinline>
          <source src="${VIDEO_URL}" type="video/mp4">
        </video>
      </div>
      
      <!-- Tooltip -->
      <div id="ali-chat-tooltip" class="ali-tooltip">
        Bitirim Satışçınız Ali ile Tanışın 👋
      </div>

      <!-- Chat Window -->
      <div id="ali-chat-window" class="ali-chat-window">
        <div class="ali-chat-header">
          <div class="ali-chat-avatar">ALI</div>
          <div class="ali-chat-title-row">
            <div class="ali-chat-title">ALI – Satıştaki Sağ Kolunuz</div>
            <div class="ali-chat-subtitle">Türkiye'nin satışçısı yanınızda</div>
          </div>
          <button class="ali-chat-close" aria-label="Kapat">&times;</button>
        </div>
        <div class="ali-chat-body">
          <div class="ali-chat-messages"></div>
        </div>
        <div class="ali-chat-footer">
          <input class="ali-chat-input" type="text" placeholder="Mesajınızı yazın..." />
          <button class="ali-chat-send">Gönder</button>
        </div>
      </div>
    </div>
  `;

  // ---- CSS ----
  const style = document.createElement('style');
  style.innerHTML = `
    #ali-chatbot-widget * {
      box-sizing: border-box;
      font-family: system-ui, -apple-system, sans-serif;
    }

    /* Video Launcher Bubble */
    .ali-chat-bubble {
      position: fixed;
      right: 24px;
      bottom: 24px;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      border: 3px solid rgba(95, 77, 238, 0.3);
      background: transparent;
      cursor: pointer;
      z-index: 999999;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(95, 77, 238, 0.3);
    }

    .ali-chat-bubble:hover {
      transform: translateY(-4px) scale(1.05);
      box-shadow: 0 12px 40px rgba(95, 77, 238, 0.5);
      border-color: rgba(95, 77, 238, 0.6);
    }

    .ali-video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
      pointer-events: none;
    }

    /* Tooltip */
    .ali-tooltip {
      position: fixed;
      right: 116px;
      bottom: 40px;
      background: white;
      padding: 12px 16px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-size: 14px;
      font-weight: 500;
      color: #1f2937;
      opacity: 0;
      transform: translateX(10px);
      transition: all 0.3s ease;
      pointer-events: none;
      z-index: 999998;
      max-width: 250px;
    }

    .ali-tooltip.show {
      opacity: 1;
      transform: translateX(0);
    }

    /* Chat Window */
    .ali-chat-window {
      position: fixed;
      right: 24px;
      bottom: 24px;
      width: min(420px, calc(100vw - 32px));
      max-height: min(600px, calc(100vh - 80px));
      background: white;
      border-radius: 24px;
      box-shadow: 0 24px 80px rgba(15, 23, 42, 0.55);
      display: none;
      flex-direction: column;
      z-index: 1000000;
      overflow: hidden;
      animation: ali-pop-in 0.18s ease-out;
    }

    .ali-chat-window.open {
      display: flex;
    }

    @keyframes ali-pop-in {
      from { opacity: 0; transform: scale(0.85) translateY(8px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }

    /* Header */
    .ali-chat-header {
      padding: 16px 18px;
      background: linear-gradient(135deg, #020617, #020720);
      color: #e5e7eb;
      display: flex;
      align-items: center;
      gap: 10px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.35);
    }

    .ali-chat-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: radial-gradient(circle at 30% 0%, #4cf5ff, #2e83ff 45%, #1f3ad8 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 800;
      font-size: 15px;
      flex-shrink: 0;
    }

    .ali-chat-title-row {
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
      background: transparent;
      border: none;
      color: #9ca3af;
      font-size: 24px;
      cursor: pointer;
      padding: 4px;
      line-height: 1;
      transition: color 0.2s;
    }

    .ali-chat-close:hover {
      color: #e5e7eb;
    }

    /* Body */
    .ali-chat-body {
      flex: 1;
      padding: 14px 16px;
      background: radial-gradient(circle at top, #e5ecff, #f9fafb 42%, #eef2ff 100%);
      overflow-y: auto;
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

    .ali-msg-bot-avatar {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: radial-gradient(circle at 30% 0%, #4cf5ff, #2e83ff 45%, #1f3ad8 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 11px;
      font-weight: 800;
      flex-shrink: 0;
    }

    .ali-msg-bubble {
      max-width: 82%;
      padding: 10px 12px;
      border-radius: 16px;
      font-size: 14px;
      line-height: 1.4;
    }

    .ali-msg-bubble.bot {
      background: white;
      color: #020617;
      border: 1px solid rgba(148, 163, 184, 0.35);
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.1);
    }

    .ali-msg-bubble.user {
      background: linear-gradient(135deg, #5f4dee, #b34dff);
      color: white;
      border-radius: 16px 16px 4px 16px;
    }

    .ali-msg-loading {
      display: inline-flex;
      gap: 4px;
    }

    .ali-msg-loading span {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #9ca3af;
      animation: ali-bounce 0.9s infinite ease-in-out;
    }

    .ali-msg-loading span:nth-child(2) { animation-delay: 0.18s; }
    .ali-msg-loading span:nth-child(3) { animation-delay: 0.36s; }

    @keyframes ali-bounce {
      0%, 80%, 100% { transform: translateY(0); opacity: 0.35; }
      40% { transform: translateY(-4px); opacity: 1; }
    }

    /* Footer */
    .ali-chat-footer {
      padding: 10px 12px;
      background: white;
      border-top: 1px solid rgba(148, 163, 184, 0.4);
      display: flex;
      gap: 8px;
    }

    .ali-chat-input {
      flex: 1;
      border-radius: 999px;
      border: 1px solid rgba(148, 163, 184, 0.8);
      padding: 9px 14px;
      font-size: 13px;
      outline: none;
      background: #f9fafb;
    }

    .ali-chat-input:focus {
      border-color: #6366f1;
      background: white;
      box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.65);
    }

    .ali-chat-send {
      border-radius: 999px;
      border: none;
      padding: 9px 16px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.12s ease;
    }

    .ali-chat-send:hover {
      transform: translateY(-1px);
    }

    .ali-chat-send:disabled {
      opacity: 0.6;
      cursor: default;
      transform: none;
    }

    @media (max-width: 640px) {
      .ali-chat-window {
        right: 12px;
        bottom: 12px;
        width: calc(100vw - 24px);
        max-height: calc(100vh - 40px);
      }
      .ali-chat-bubble {
        right: 16px;
        bottom: 16px;
      }
      .ali-tooltip {
        right: 108px;
        bottom: 32px;
      }
    }
  `;

  document.head.appendChild(style);

  // ---- WIDGET'İ SAYFAYA EKLE ----
  document.addEventListener('DOMContentLoaded', function() {
    const widgetContainer = document.createElement('div');
    widgetContainer.innerHTML = widgetHTML;
    document.body.appendChild(widgetContainer);

    const bubble = document.getElementById('ali-chat-bubble');
    const tooltip = document.getElementById('ali-chat-tooltip');
    const chatWindow = document.getElementById('ali-chat-window');
    const closeBtn = chatWindow.querySelector('.ali-chat-close');
    const messagesEl = chatWindow.querySelector('.ali-chat-messages');
    const inputEl = chatWindow.querySelector('.ali-chat-input');
    const sendBtn = chatWindow.querySelector('.ali-chat-send');

    // Tooltip animasyonu
    setTimeout(() => {
      tooltip.classList.add('show');
      setTimeout(() => tooltip.classList.remove('show'), 5000);
    }, 2000);

    // Bubble click - Open/Close chat
    bubble.addEventListener('click', function() {
      isChatOpen = !isChatOpen;
      chatWindow.classList.toggle('open', isChatOpen);
      
      if (isChatOpen && !hasOpenedOnce) {
        hasOpenedOnce = true;
        addBotMessage("Merhaba, ben ALI. İşlerini kolaylaştırıp satışlarını artırmak için sana nasıl yardımcı olabilirim?");
      }

      if (isChatOpen) {
        setTimeout(() => inputEl?.focus(), 120);
      }
    });

    closeBtn.addEventListener('click', function() {
      isChatOpen = false;
      chatWindow.classList.remove('open');
    });

    // Message helpers
    function addBotMessage(text, isLoading = false) {
      const row = document.createElement('div');
      row.className = 'ali-msg-row bot';

      const avatar = document.createElement('div');
      avatar.className = 'ali-msg-bot-avatar';
      avatar.textContent = 'ALI';

      const bubble = document.createElement('div');
      bubble.className = 'ali-msg-bubble bot';

      if (isLoading) {
        bubble.innerHTML = '<div class="ali-msg-loading"><span></span><span></span><span></span></div>';
      } else {
        bubble.textContent = text;
      }

      row.appendChild(avatar);
      row.appendChild(bubble);
      messagesEl.appendChild(row);
      messagesEl.scrollTop = messagesEl.scrollHeight;

      return bubble;
    }

    function addUserMessage(text) {
      const row = document.createElement('div');
      row.className = 'ali-msg-row user';

      const bubble = document.createElement('div');
      bubble.className = 'ali-msg-bubble user';
      bubble.textContent = text;

      row.appendChild(bubble);
      messagesEl.appendChild(row);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    // Send message
    async function handleSend() {
      const value = (inputEl.value || '').trim();
      if (!value || isSending) return;

      addUserMessage(value);
      inputEl.value = '';

      isSending = true;
      sendBtn.disabled = true;

      const loadingBubble = addBotMessage('', true);

      try {
        const reply = await callAliProxy(value);
        loadingBubble.innerHTML = '';
        loadingBubble.textContent = reply;
      } catch (err) {
        console.error(err);
        loadingBubble.parentElement?.remove();
        addBotMessage('Şu an bağlantıda bir sıkıntı var. Birazdan tekrar dener misin?');
      } finally {
        isSending = false;
        sendBtn.disabled = false;
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }
    }

    sendBtn.addEventListener('click', handleSend);
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });
  });
})();
