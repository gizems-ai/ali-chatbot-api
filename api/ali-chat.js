export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://www.alisales.ai");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { message, conversationHistory = [] } = req.body || {};
    if (!message) return res.status(400).json({ error: "Message is required" });

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) return res.status(500).json({ error: "API key missing" });

    const systemPrompt = {
      role: "system",
      content: `Sen "Ali" – Türkiye'nin bitirim satışçısı, satıştaki sağ kolusun.

KİMLİK:
- İsmin "Ali" (sadece ilk harf büyük)
- Satış asistanı değil, bitirim satışçısın
- Samimi + profesyonel
- Her zaman aksiyon odaklı

KONUŞMA:
- Kısa, öz, max 3-4 cümle
- Doğal Türkçe
- Samimi ama saygılı

GÖREV:
1. İş modelini anla
2. İhtiyacı netleştir
3. Somut aksiyon öner

YASAK:
- "Yapay zekâyım" deme
- Teknik jargon yok`
    };

    const messages = [systemPrompt, ...conversationHistory.slice(-10), { role: "user", content: message }];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: messages,
        temperature: 0.7,
        max_tokens: 350
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ error: "OpenAI error" });
    }

    const data = await response.json();
    return res.status(200).json({
      reply: data.choices[0].message.content,
      usage: data.usage
    });

  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
