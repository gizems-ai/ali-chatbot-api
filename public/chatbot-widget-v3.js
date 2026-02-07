(function() {
  'use strict';
  
  const N8N_URL = "https://alisalesai.app.n8n.cloud/webhook/chatbot";
  
  const styles = `
    #ali-chatbot {
      display: none;
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 400px;
      max-width: calc(100vw - 40px);
      height: 600px;
      max-height: calc(100vh - 40px);
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      z-index: 999998;
      flex-direction: column;
    }
    #ali-chatbot.open { display: flex; }
    #ali-chatbot-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 16px 16px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    #ali-chatbot-close {
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      font-size: 24px;
      cursor: pointer;
      width: 32px;
      height: 32px;
      border-radius: 8px;
    }
    #ali-chatbot-messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      background: #f9fafb;
    }
    #ali-chatbot-input-area {
      padding: 20px;
      border-top: 1px solid #e5e7eb;
      background: white;
      display: flex;
      gap: 10px;
    }
    #ali-chatbot-input {
      flex: 1;
      padding: 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
    }
    #ali-chatbot-send {
      background: #667eea;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: background 0.2s;
    }
    #ali-chatbot-send:hover { background: #5568d3; }
    .ali-message {
      margin-bottom: 16px;
      display: flex;
    }
    .ali-message.user {
      justify-content: flex-end;
    }
    .ali-message-content {
      max-width: 80%;
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.5;
    }
    .ali-message.user .ali-message-content {
      background: #667eea;
      color: white;
      border-radius: 12px 12px 0 12px;
    }
    .ali-message.assistant .ali-message-content {
      background: white;
      color: #1f2937;
      border-radius: 12px 12px 12px 0;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
  `;
  
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
  
  const chatbotHTML = `
    <div id="ali-chatbot">
      <div id="ali-chatbot-header">
        <div>
          <h3 style="margin:0;font-size:16px">Ali - Satış Asistanı</h3>
          <p style="margin:4px 0 0;font-size:12px;opacity:0.9">Online</p>
        </div>
        <button id="ali-chatbot-close">×</button>
      </div>
      <div id="ali-chatbot-messages"></div>
      <div id="ali-chatbot-input-area">
        <input type="text" id="ali-chatbot-input" placeholder="Mesajınızı yazın...">
        <button id="ali-chatbot-send">Gönder</button>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', chatbotHTML);
  
  const chatbot = document.getElementById('ali-chatbot');
  const closeBtn = document.getElementById('ali-chatbot-close');
  const messagesDiv = document.getElementById('ali-chatbot-messages');
  const inputField = document.getElementById('ali-chatbot-input');
  const sendBtn = document.getElementById('ali-chatbot-send');
  
  let threadId = localStorage.getItem('ali_thread_id');
  
  function addMessage(content, isUser) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `ali-message ${isUser ? 'user' : 'assistant'}`;
    msgDiv.innerHTML = `<div class="ali-message-content">${content}</div>`;
    messagesDiv.appendChild(msgDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }
  
  async function sendMessage() {
    const message = inputField.value.trim();
    if (!message) return;
    
    addMessage(message, true);
    inputField.value = '';
    sendBtn.disabled = true;
    
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, threadId })
      });
      
      const data = await response.json();
      
      if (data.threadId) {
        threadId = data.threadId;
        localStorage.setItem('ali_thread_id', threadId);
      }
      
      if (data.response) {
        addMessage(data.response, false);
      }
    } catch (error) {
      console.error('Error:', error);
      addMessage('Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.', false);
    } finally {
      sendBtn.disabled = false;
    }
  }
  
  window.AliChat = {
    open: function() {
      chatbot.classList.add('open');
    },
    close: function() {
      chatbot.classList.remove('open');
    }
  };
  
  closeBtn.addEventListener('click', () => window.AliChat.close());
  sendBtn.addEventListener('click', sendMessage);
  inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
  
})();
