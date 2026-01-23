export default async function handler(req, res) {
  console.log('Webhook received:', JSON.stringify(req.body, null, 2));
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 360Dialog payload yapısı
    const messages = req.body.messages || [];
    
    if (messages.length === 0) {
      console.log('No messages in payload');
      return res.status(200).json({ message: 'No messages' });
    }

    const message = messages[0];
    const from = message.from;
    const text = message.text?.body;
    
    console.log('Processing message from:', from);
    console.log('Message text:', text);

    if (!text) {
      return res.status(200).json({ message: 'No text' });
    }

    // Claude API call
    console.log('Calling Claude API...');
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: `Senin adın Ali. Her zaman "Ali" olarak yazılır.

Sen Türkiye merkezli bir yapay zeka satış yönetimi platformusun. KOBİ'ler, mikro işletmeler ve girişimciler için satışı kolay ve verimli hale getiren bir yapay zekâ satış ortağısın.

Ali bir chatbot değil, "Satış zekası"dır. Türkiye'nin Bitirim Satışçısı.

FİYATLANDIRMA:
- Başlangıç paketi: 999 TL/ay
- Profesyonel paket: 2.999 TL/ay  
- İşletme paketi: 8.999 TL/ay
- Lansman özel: İlk kullanıcılara 6 ay ücretsiz + ömür boyu %40 indirim

KİŞİLİK:
- Samimi ama laubali değil, "siz" diye hitap edersin
- Profesyonel ama robotik değil
- Kısa ve net konuşursun
- Az emoji kullanırsın

SATIŞ AKIŞI:
1) Kullanıcının işini ve ihtiyacını anla
2) Kısa sorularla ihtiyaç analizi yap
3) Ali'nin nasıl yardımcı olacağını anlat
4) Demo/görüşme öner

YASAK: Hemen link vermezsin, uydurma fiyat söylemezsin, acele ettirmezsin.`,
        messages: [
          {
            role: 'user',
            content: text
          }
        ]
      })
    });

    const claudeData = await claudeResponse.json();
    console.log('Claude response:', JSON.stringify(claudeData, null, 2));
    
    if (!claudeData.content || !claudeData.content[0]) {
      throw new Error('Invalid Claude response: ' + JSON.stringify(claudeData));
    }

    const reply = claudeData.content[0].text;
    console.log('Sending reply:', reply);

    // 360Dialog'a cevap gönder
    const sendResponse = await fetch('https://waba.360dialog.io/v1/messages', {
      method: 'POST',
      headers: {
        'D360-API-KEY': process.env.DIALOG360_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: from,
        type: 'text',
        text: { body: reply }
      })
    });

    const sendData = await sendResponse.json();
    console.log('360Dialog send response:', JSON.stringify(sendData, null, 2));

    return res.status(200).json({ success: true, reply });
  } catch (error) {
    console.error('ERROR:', error);
    return res.status(500).json({ error: error.message });
  }
}
