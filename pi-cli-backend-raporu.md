# Pi CLI Backend Altyapı Raporu

## Kısa Sonuç

Evet, `../dekadansai` backend’i `pi` CLI için altyapı olarak kullanmak mantıklı, ancak mevcut haliyle login/OAuth tarafı CLI için tam hazır değil.

## Bulgular

- Backend Express + Better Auth kullanıyor.
- OAuth sağlayıcıları mevcut:
  - Google
  - GitHub
- Auth route’u:
  - `POST/GET /api/auth/*`
  - Kaynak: `/home/asugan/Projects/dekadansai/src/app.ts`
- API key altyapısı hazır:
  - `better-auth/plugins` içindeki `apiKey`
  - Kaynak: `/home/asugan/Projects/dekadansai/src/auth.ts`
- AI endpointleri CLI için uygun şekilde API key kabul ediyor:
  - `Authorization: Bearer <api-key>`
  - `x-api-key: <api-key>`
  - Kaynak: `/home/asugan/Projects/dekadansai/src/middleware/auth.ts`
- Mevcut AI endpointleri:
  - `GET /v1/models`
  - `POST /v1/chat/completions`
  - `POST /v1/responses`
  - `POST /v1/messages`
  - `POST /v1/messages/count_tokens`

## Ana Değerlendirme

`pi` CLI’ın inference tarafı için bu backend uygundur. CLI, API key aldıktan sonra doğrudan `/v1/*` endpointlerine istek atabilir.

Ancak `pi login` için eksik vardır. Mevcut OAuth akışı browser/session-cookie merkezlidir. CLI’a özel `device code`, `localhost callback`, `PKCE`, ya da “pairing code” akışı görünmemektedir.

## Önerilen Mimari

En mantıklı akış:

```text
pi login
→ browser açılır
→ kullanıcı Google/GitHub ile giriş yapar
→ backend CLI için tek kullanımlık kod veya localhost callback üretir
→ CLI bu kodu API key'e çevirir
→ ~/.config/pi/config.json içine API key kaydeder
```

Sonra:

```text
pi chat "hello"
→ Authorization: Bearer <stored-api-key>
→ POST https://api.dekadans.net/v1/chat/completions
```

## Riskler

- API key üretimi şu an dashboard/browser session üzerinden yapılıyor.
- CLI login için özel endpoint yok.
- `/v1/*` endpointleri aktif plan istiyor, plansız kullanıcı `402 weekly_plan_required` alır.
- API key saklama, revoke ve rotate komutları ayrıca tasarlanmalı.

## Tavsiye

Bu backend kullanılmalı. Sıfırdan auth/API gateway yazmaya gerek yok. Sadece CLI için küçük bir auth bridge eklemek gerekir.

En temiz çözüm `pi login` için browser OAuth + localhost callback veya pairing-code endpoint’i eklemektir.
