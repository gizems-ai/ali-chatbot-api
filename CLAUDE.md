# ali-chatbot-api (Vercel Widget) — CC Referansı

Ali Sales AI multi-tenant widget JS'i. Tüm tenant'ların kullandığı
shared widget CDN. Vercel'de host edilir (gizems-ai/ali-chatbot-api).

## SIFIRINCI KURAL — ÇOK KRİTİK

### ⚠️ VERCEL QUERY STRING VERSİYONLAMA ÇALIŞMIYOR

URL'de `?v=N` yazarsan da Vercel HER ZAMAN SON SÜRÜMÜ döndürür.

```
?v=16  →  son widget JS (şu an v17.1)
?v=17  →  son widget JS (şu an v17.1)
?v=999 →  son widget JS (şu an v17.1)
```

SONUÇ: Her deploy TÜM Vercel'e bağlı tenant'ları etkiler.

### YANLIŞ VARSAYIM (3 kez bozdu)
"?v=16 yazılırsa Vercel v16'yı döndürür" → HAYIR, YANLIŞ.

## TENANT İZOLASYON TABLOSU

| Tenant             | Widget kaynağı                             | Durum    |
|--------------------|-------------------------------------------|----------|
| alisales.ai        | VPS yerel `/assets/js/ali-widget-v16.js`  | DONMUŞ   |
| Fiscus AI          | Vercel v17.1+                             | Aktif    |
| TurkeyHealth.care  | Vercel v17.1+                             | Aktif    |
| London Bridge Club | Vercel v17.1+                             | Aktif    |

**alisales.ai Vercel'e BAĞLI DEĞİL** — widget değişikliğinden etkilenmez.
Diğer tenant'lar her deploy'da otomatik güncellenir.

## DEPLOY ÖNCESİ KONTROL LİSTESİ

1. Hangi tenant'lar etkilenir? (Tablo'ya bak — Vercel'e bağlı olanlar)
2. Her tenant'ın `data-*` attribute'ları hâlâ uyumlu mu?
3. Breaking change varsa (bubble, CSS, API) tenant başı koordinasyon
4. Test sayfalarında test et:
   - `https://alisales.ai/test-widget/fiscusai.html`
   - `https://alisales.ai/test-widget/turkeyhealth.html`
   - `https://alisales.ai/test-widget/lbc.html`
5. F12 Console → kırmızı hata yok
6. Mobile + Desktop ayrı test
7. CHANGELOG.md güncelle

## WIDGET VERSİYON GEÇMİŞİ

| Versiyon | Açıklama                                            | Breaking |
|----------|-----------------------------------------------------|----------|
| v16      | Chat window only, hardcoded bubble desteği          | —        |
| v17      | Self-contained (bubble + chat birlikte)             | EVET     |
| v17.1    | Avatar header, data-tooltips multi-lang, data-greetings | —    |

v17 BREAKING: Kendi bubble'ını üretir. Hardcoded bubble olan site
(alisales.ai) için çakışma yaratır → ikili bubble, üst üste binme.

## DATA-* ATTRIBUTE REFERANSI

**Zorunlu:**
- `data-tenant` — Airtable Tenants tablosu `page_id` lookup key

**Opsiyonel:**
- `data-tenant-name` — Greeting'te kullanılan isim ("X asistanı Ali")
- `data-brand-color` — Hex renk kodu (`#722F37`), bubble + header + buton
- `data-greeting` — Sabit greeting metni (auto-discovery'i kapatır)
- `data-greetings` — JSON multi-lang: `{"tr":"...","en":"...","de":"..."}`
- `data-tooltip` — Sabit tooltip metni
- `data-tooltips` — JSON multi-lang tooltip
- `data-mobile-mode` — `"chat"` (default) veya `"whatsapp"`
- `data-whatsapp-number` — `mobile-mode=whatsapp` için (`"905324069594"`)

**Auto-discovery (greeting yoksa):** Widget `<h1>` ve `<meta>` etiketlerinden
bağlamı öğrenir ve kendi greeting'ini üretir → alisales.ai için istenmeyen davranış.

## REPO YAPISI

```
/
├── public/
│   └── chatbot-widget.js  # TEK DOSYA — Vercel bu dosyayı serve eder
├── vercel.json            # {} olmalı — functions config yok
└── package.json
```

`vercel.json` içinde `functions` veya `builds` config = build hatası.
`api/` klasöründe sunucu dosyası olmadığı için `{}` yeterli.

## COMMIT MESAJI STANDARDI

```
<type>(<scope>): <açıklama>

types: feat | fix | refactor | docs | chore
scope: widget | deploy | docs
```

Aynı commit mesajını tekrar tekrar push ETME.
Vercel build fail oluyorsa sebebi commit'te değil, JS syntax'ında ara.

## VERCEL ERİŞİM

- Domain: `ali-chatbot-api.vercel.app`
- GitHub: `gizems-ai/ali-chatbot-api` → main branch → auto-deploy
- Son deploy tarihi: `curl -sI https://ali-chatbot-api.vercel.app/chatbot-widget.js | grep last-modified`

## N8N WEBHOOK

Widget backend: `https://n8n.alisales.ai/webhook/chatbot-v2`
(Hetzner VPS, n8n Docker container)
Tenant config: Airtable `appU51BpE3zDLumLV` → Tenants tablosu
