// ===============================
// ALI CHAT - WhatsApp Handler
// N8N OpenAI Proxy + Airtable (Threads + Mesajlar)
// Final Optimized Structure
// ===============================

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
    const from = message.from; // WhatsApp number
    const text = message.text?.body;
    
    console.log('Processing message from:', from);
    console.log('Message text:', text);

    if (!text) {
      return res.status(200).json({ message: 'No text' });
    }

    // ---- 1) THREADS TABLE'DAN THREAD ID'Yİ ÇEK ----
    let threadId = null;
    let threadRecord = null;

    try {
      console.log('Checking Threads table...');
      
      // identifier field'ına göre ara (phone number)
      const threadsSearchUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Threads?filterByFormula={identifier}='${from}'`;
      
      const searchResponse = await fetch(threadsSearchUrl, {
        headers: {
          'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const searchData = await searchResponse.json();
      console.log('Threads search result:', JSON.stringify(searchData, null, 2));

      if (searchData.records && searchData.records.length > 0) {
        // Mevcut thread bulundu
        threadRecord = searchData.records[0];
        threadId = threadRecord.fields.thread_id;
        console.log('Found existing thread:', threadId);
      } else {
        console.log('No existing thread found, will create new one');
      }

    } catch (airtableError) {
      console.error('Threads lookup error (non-critical):', airtableError.message);
    }

    // ---- 2) N8N ALI PROXY'YE İSTEK GÖNDER ----
    console.log('Calling N8N Ali Proxy...');
    const proxyResponse = await fetch('https://alisalesai.app.n8n.cloud/webhook/ali-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: text,
        threadId: threadId, // null veya mevcut thread_id
        context: {
          source: 'whatsapp',
          identifier: from,
          timestamp: new Date().toISOString()
        }
      })
    });

    if (!proxyResponse.ok) {
      const errorText = await proxyResponse.text();
      throw new Error(`N8N Proxy error (${proxyResponse.status}): ${errorText}`);
    }

    const proxyData = await proxyResponse.json();
    console.log('N8N Proxy response:', JSON.stringify(proxyData, null, 2));
    
    // N8N'den gelen thread ID ve reply
    const newThreadId = proxyData.threadId;
    const reply = proxyData.response || 'Şu an bir sorun yaşıyorum, birazdan tekrar dener misin?';
    
    console.log('Thread ID from N8N:', newThreadId);
    console.log('Reply:', reply);

    // ---- 3) THREADS TABLE'I GÜNCELLE/OLUŞTUR ----
    try {
      const now = new Date().toISOString();

      if (threadRecord) {
        // Mevcut thread'i güncelle (SonMesaj, MesajSayısı)
        console.log('Updating Threads record...');
        
        const updateUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Threads/${threadRecord.id}`;
        
        await fetch(updateUrl, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fields: {
              thread_id: newThreadId,
              SonMesaj: now,
              MesajSayısı: (threadRecord.fields.MesajSayısı || 0) + 2, // +2 çünkü gelen + giden
              Mesaj: text // Son mesajın içeriği
            }
          })
        });

        console.log('Threads record updated');

      } else {
        // Yeni thread kaydı oluştur
        console.log('Creating new Threads record...');
        
        const createUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Threads`;
        
        await fetch(createUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fields: {
              thread_id: newThreadId,
              identifier: from,
              Kaynak: 'whatsapp',
              İlkMesaj: now,
              SonMesaj: now,
              MesajSayısı: 2, // İlk mesaj (gelen + giden)
              Durum: 'active'
            }
          })
        });

        console.log('New Threads record created');
      }

    } catch (airtableError) {
      console.error('Threads save error (non-critical):', airtableError.message);
    }

    // ---- 4) MESAJLAR TABLE'INA DETAYLI LOG KAYDET ----
    try {
      console.log('Logging messages to Mesajlar table...');
      
      const messagesUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Mesajlar`;
      const now = new Date().toISOString();
      
      // Incoming message (user)
      await fetch(messagesUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            Özet: text.substring(0, 50), // İlk 50 karakter
            thread_id: newThreadId,
            Yön: 'Gelen',
            Mesaj: text,
            Telefon: from,
            Tarih: now,
            Okundu: false,
            Yanıtlandı: true
          }
        })
      });

      // Outgoing message (Ali's reply)
      await fetch(messagesUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            Özet: reply.substring(0, 50), // İlk 50 karakter
            thread_id: newThreadId,
            Yön: 'Giden',
            Mesaj: reply,
            Telefon: from,
            Tarih: now,
            Okundu: true,
            Yanıtlandı: false
          }
        })
      });

      console.log('Messages logged to Mesajlar table');

    } catch (messageLogError) {
      console.error('Message logging error (non-critical):', messageLogError.message);
    }

    // ---- 5) 360DIALOG'A CEVAP GÖNDER ----
    console.log('Sending reply to WhatsApp...');
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

    return res.status(200).json({ 
      success: true, 
      reply,
      threadId: newThreadId,
      from,
      messageCount: threadRecord ? (threadRecord.fields.MesajSayısı || 0) + 2 : 2
    });

  } catch (error) {
    console.error('ERROR:', error);
    return res.status(500).json({ error: error.message });
  }
}
