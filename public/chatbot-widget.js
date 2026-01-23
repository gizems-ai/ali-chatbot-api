(function() {
  // Widget HTML'i oluştur
  const widgetHTML = `
    <div id="ali-chatbot-widget">
      <div id="ali-chat-bubble" class="ali-chat-bubble">
        <img src="https://ali-chatbot-api-ufjb.vercel.app/ali-avatar.png" alt="Ali" />
        <div class="ali-pulse"></div>
      </div>
      <div id="ali-chat-tooltip" class="ali-tooltip">
        Bitirim Satışçınız Ali ile Tanışın 👋
      </div>
    </div>
  `;

  // CSS'i inject et
  const styleLink = document.createElement('link');
  styleLink.rel = 'stylesheet';
  styleLink.href = 'https://ali-chatbot-api-ufjb.vercel.app/chatbot-widget.css';
  document.head.appendChild(styleLink);

  // Widget'ı sayfaya ekle
  document.addEventListener('DOMContentLoaded', function() {
    const widgetContainer = document.createElement('div');
    widgetContainer.innerHTML = widgetHTML;
    document.body.appendChild(widgetContainer);

    // WhatsApp numarasını config'den al
    const whatsappNumber = window.chatbotConfig?.businessPhone || '905XXXXXXXXX';
    const welcomeMessage = window.chatbotConfig?.welcomeMessage || 'Merhaba, Ali ile görüşmek istiyorum';

    // Click event
    document.getElementById('ali-chat-bubble').addEventListener('click', function() {
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(welcomeMessage)}`;
      window.open(whatsappUrl, '_blank');
    });

    // Tooltip animasyonu
    setTimeout(() => {
      document.getElementById('ali-chat-tooltip').classList.add('show');
      setTimeout(() => {
        document.getElementById('ali-chat-tooltip').classList.remove('show');
      }, 5000);
    }, 2000);
  });
})();
