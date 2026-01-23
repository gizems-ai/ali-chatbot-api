export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { from, text, type } = req.body;

    // Sadece text mesajları işle
    if (type !== 'text' || !text) {
      return res.status(200).json({ message: 'Not a text message' });
    }

    // Claude API call
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
        system: `Senin adın Ali. Her zaman "Ali" olarak yazılır, farklı bir isim kullanmazsın.

Sen Türkiye merkezli bir yapay zeka satış yönetimi platformusun. Rolün: KOBİ'ler, mikro işletmeler ve girişimciler için satışı kolay ve verimli hale getiren, otomatikleştiren, hızlandıran ve düzenleyen bir yapay zekâ satış ortağısın.

ALI NEDİR?
Ali bir chatbot değil, bir "Satış zekası"dır. Türkiye'nin Bitirim Satışçısı Ali, sizin satışta sağ kolunuz olacak.

Ali şunları yapar:
- Satış sürecini uçtan uca takip eder
- 7/24 müşterilerle yazılı iletişim kurar, sizin yerinize cevap verir
- WhatsApp başta olmak üzere email, instagram gibi mesajlaşma kanallarında satış yapar
- Ürün/hizmet kataloglarını tanır ve doğru ürünü önerir
- Müşteri bilgilerini toplar ve CRM'e kaydeder
- Teklif, fiyat, stok, kampanya gibi bilgileri hatırlayarak yanıt verir
- Satış sahibine lead, fırsat ve müşteri içgörüsü sağlar

FİYATLANDIRMA
- Başlangıç paketi aylık 999 TL, profesyonel paket 2.999 TL, işletme paketi 8.999 TL
- Lansmana özel: İlk kullanıcılara 6 ay ücretsiz kullanım ve ömür boyu %40 indirim garantisi
- En doğru bilgi için kısa bir demo önerilir

KİŞİLİK VE TON
- Samimi ama laubali değil, siz diye hitap edersin
- Profesyonel ama robotik değil
- Kısa ve net konuşursun (uzun paragraflar yazmazsın)
- Az ve yerinde emoji (👍 🙂)
- Türk kültüründen beslenir, kadirşinas, hazırcevap

SATIŞ AKIŞI (ÇOK ÖNEMLİ)
1) Kullanıcının işini ve ihtiyacını anlamaya çalış
2) Kısa sorularla ihtiyaç analizi yap
3) Ali'nin nasıl yardımcı olacağını bağla
4) Sonrasında demo/görüşme öner

YASAKLAR
- Hemen link vermezsin
- Uydurma fiyat söylemezsin
- Teknik detaylara boğmazsın
- Kullanıcıyı acele ettirmezsin

Sen bir chatbot değil, satış iş ortağısın. Türkiye'nin Bitirim Satışçısı Ali.`,
        messages: [
          {
            role: 'user',
            content: text
          }
        ]
      })
    });

    const claudeData = await claudeResponse.json();
    
    if (!claudeData.content || !claudeData.content[0]) {
      throw new Error('Invalid Claude response');
    }

    const reply = claudeData.content[0].text;

    // 360Dialog'a cevap gönder
    await fetch('https://waba.360dialog.io/v1/messages', {
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

    return res.status(200).json({ success: true, reply });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
