// ===============================
// ALI CHATBOT - WINDOW ONLY
// N8N OpenAI Proxy
// ===============================

(function() {
  'use strict';

  if (window.__aliChatWindowInjected) return;
  window.__aliChatWindowInjected = true;

  const N8N_URL = "https://alisalesai.app.n8n.cloud/webhook/ali-proxy";
  const THREAD_KEY = "ali_thread_id";
  let currentThreadId = localStorage.getItem(THREAD_KEY) || null;
  let isChatOpen = false;
  let isSending = false;
  let hasWelcomed = false;

  const style = document.createElement('style');
  style.innerHTML = `
    .ali-chat-window {
      position: fixed;
      right: 20px;
      bottom: 20px;
      width: min(420px, calc(100vw - 40px));
      max-height: min(600px, calc(100vh - 80px));
      background: white;
      border-radius: 24px;
      box-shadow: 0 24px 80px rgba(15, 23, 42, 0.55);
      display: none;
      flex-direction: column;
      z-index: 999998;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: ali-pop-in 0.18s ease-out;
    }
    .ali-chat-window.open { display: flex; }
    @keyframes ali-pop-in {
      from { opacity: 0; transform: scale(0.85) translateY(8px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    .ali-chat-header {
      padding: 16px 18px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .ali-chat-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #667eea;
      font-weight: 800;
      font-size: 16px;
      flex-shrink: 0;
    }
    .ali-chat-title-row { flex: 1; min-width: 0; }
    .ali-chat-title { font-size: 16px; font-weight: 700; }
    .ali-chat-subtitle { font-size: 13px; opacity: 0.9; }
    .ali-chat-close {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      font-size: 24px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      line-height: 1;
      transition: background 0.2s;
    }
    .ali-chat-close:hover { background: rgba(255, 255, 255, 0.3); }
    .ali-chat-body {
      flex: 1;
      padding: 16px;
      background: #f7fafc;
      overflow-y: auto;
    }
    .ali-chat-messages {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .ali-msg-row {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }
    .ali-msg-row.user { justify-content: flex-end; }
    .ali-msg-bot-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
      font-weight: 800;
      flex-shrink: 0;
    }
    .ali-msg-bubble {
      max-width: 75%;
      padding: 12px 16px;
      border-radius: 16px;
      font-size: 14px;
      line-height: 1.5;
    }
    .ali-msg-bubble.bot {
      background: white;
      color: #2d3748;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .ali-msg-bubble.user {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
      background: #cbd5e0;
      animation: ali-bounce 0.9s infinite ease-in-out;
    }
    .ali-msg-loading span:nth-child(2) { animation-delay: 0.18s; }
    .ali-msg-loading span:nth-child(3) { animation-delay: 0.36s; }
    @keyframes ali-bounce {
      0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
      40% { transform: translateY(-6px); opacity: 1; }
    }
    .ali-chat-footer {
      padding: 12px 16px;
      background: white;
      border-top: 1px solid #e2e8f0;
      display: flex;
      gap: 8px;
    }
    .ali-chat-input {
      flex: 1;
      border-radius: 24px;
      border: 1px solid #cbd5e0;
      padding: 10px 16px;
      font-size: 14px;
      outline: none;
      background: #f7fafc;
      color: #2d3748;
      transition: all 0.2s;
    }
    .ali-chat-input::placeholder { color: #a0aec0; }
    .ali-chat-input:focus {
      border-color: #667eea;
      background: white;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    .ali-chat-send {
      border-radius: 24px;
      border: none;
      padding: 10px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .ali-chat-send:hover { transform: translateY(-1px); }
    .ali-chat-send:disabled {
      opacity: 0.6;
      cursor: default;
      transform: none;
    }
    @media (max-width: 640px) {
      .ali-chat-window {
        right: 16px;
        bottom: 16px;
        width: calc(100vw - 32px);
        max-height: calc(100vh - 40px);
      }
    }
  `;
  document.head.appendChild(style);

  const chatWindow = document.createElement('div');
  chatWindow.className = 'ali-chat-window';
  chatWindow.id = 'ali-chat-window';
  chatWindow.innerHTML = `
    <div class="ali-chat-header">
      <div class="ali-chat-avatar">ALI</div>
      <div class="ali-chat-title-row">
        <div class="ali-chat-title">ALI – Satıştaki Sağ Kolunuz</div>
        <div class="ali-chat-subtitle">Türkiye'nin satışçısı yanınızda</div>
      </div>
      <button class="ali-chat-close">&times;</button>
    </div>
    <div class="ali-chat-body">
      <div class="ali-chat-messages"></div>
    </div>
    <div class="ali-chat-footer">
      <input class="ali-chat-input" type="text" placeholder="Mesajınızı yazın..." />
      <button class="ali-chat-send">Gönder</button>
    </div>
  `;

  document.body.appendChild(chatWindow);

  const closeBtn = chatWindow.querySelector('.ali-chat-close');
  const messagesEl = chatWindow.querySelector('.ali-chat-messages');
  const inputEl = chatWindow.querySelector('.ali-chat-input');
  const sendBtn = chatWindow.querySelector('.ali-chat-send');

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

  async function handleSend() {
    const value = (inputEl.value || '').trim();
    if (!value || isSending) return;
    addUserMessage(value);
    inputEl.value = '';
    isSending = true;
    sendBtn.disabled = true;
    const loadingBubble = addBotMessage('', true);
    try {
      const res = await fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: value,
          threadId: currentThreadId,
          context: { source: 'website', timestamp: new Date().toISOString() }
        })
      });
      const data = await res.json();
      if (data.threadId) {
        let cleanThreadId = data.threadId;
        if (cleanThreadId.startsWith('=')) {
          cleanThreadId = cleanThreadId.substring(1);
        }
        currentThreadId = cleanThreadId;
        localStorage.setItem(THREAD_KEY, currentThreadId);
      }
      let reply = data.response || 'Şu an bir sorun yaşıyorum, birazdan tekrar dener misin?';
      if (reply.startsWith('=')) {
        reply = reply.substring(1);
      }
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

  closeBtn.addEventListener('click', () => {
    isChatOpen = false;
    chatWindow.classList.remove('open');
  });

  sendBtn.addEventListener('click', handleSend);

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  window.AliChat = {
    open: function() {
      isChatOpen = true;
      chatWindow.classList.add('open');
      if (!hasWelcomed) {
        hasWelcomed = true;
        addBotMessage("Merhaba, ben Ali. İşlerini kolaylaştırıp satışlarını artırmak için sana nasıl yardımcı olabilirim?");
      }
      setTimeout(() => inputEl.focus(), 120);
    },
    close: function() {
      isChatOpen = false;
      chatWindow.classList.remove('open');
    },
    toggle: function() {
      if (isChatOpen) {
        this.close();
      } else {
        this.open();
      }
    }
  };

})();
