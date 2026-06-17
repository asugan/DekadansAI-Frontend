# Bilinen Problemler, Riskler ve Uygulama Planı

Bu rapor, `dekadansai-frontend` ve kardeş backend projesi `../dekadansai` üzerinde yapılan kod incelemesine göre hazırlanmıştır. Amaç sadece sorunları listelemek değil, her bulgu için kanıt, etki, çözüm ve uygulanabilir todo planı vermektir.

## Yönetici Özeti

| Öncelik | Alan | Durum | Kısa Etki |
| --- | --- | --- | --- |
| P0 | Abonelik durumu | Canlı Polar API'ye fazla bağımlı | Her AI isteğinde gecikme ve dış servis arızası riski |
| P0 | Webhook işleme | Handler ve idempotency eksik | Abonelik state'i yerelde güncellenemiyor |
| P1 | Rate limit | Read-then-write akışı var | Çoklu process/deploy altında kota tutarsızlığı riski |
| P1 | CORS ve ortam ayarları | Geniş origin ve dev URL kalıntıları var | Üretimde yanlış callback, checkout ve credential riski |
| P2 | Model kataloğu | Frontend fallback ve backend upstream bağımlılığı var | Kullanıcıya eski veya geçersiz model bilgisi gösterilebilir |
| P2 | Auth baseURL | Client/server çözümleme ayrışmış | Preview/SSR origin tutarsızlığı riski |
| P3 | Hata dili | Türkçe ve İngilizce karışık | UI ve dokümantasyon tutarsızlığı |

## Kanıt Haritası

- Backend abonelik sorguları:
  - `../dekadansai/src/routes/account.ts`
  - `../dekadansai/src/middleware/weekly-plan.ts`
- Polar webhook kurulumu:
  - `../dekadansai/src/auth.ts`
- Rate limit depolama:
  - `../dekadansai/src/lib/account-rate-limit.ts`
- CORS ve config:
  - `../dekadansai/src/app.ts`
  - `../dekadansai/src/config.ts`
  - `../dekadansai/.env`
  - `../dekadansai/.env.example`
- Model kataloğu:
  - `../dekadansai/src/lib/model-catalog.ts`
  - `../dekadansai/src/app.ts`
  - `../dekadansai/src/routes/account.ts`
  - `dekadansai-frontend/app/page.tsx`
  - `dekadansai-frontend/app/docs/page.tsx`
- Frontend auth ve hata mesajları:
  - `dekadansai-frontend/lib/auth-client.ts`
  - `dekadansai-frontend/lib/account-client.ts`
  - `dekadansai-frontend/app/dashboard/page.tsx`

## 1. P0 - Abonelik durumu her istekte canlı Polar API'den sorgulanıyor

### Sorun

Backend, kullanıcının planını belirlemek için birden fazla kritik akışta `polarClient.customers.getStateExternal()` çağrısı yapıyor.

Etkilenen akışlar:

- `GET /account/billing`
- `GET /account/rate-limit`
- Tüm `/ai/*` istekleri öncesindeki `weeklyPlanMiddleware`
- Dashboard tarafındaki 15 saniyelik polling nedeniyle `/api/account/rate-limit`

### Etki

- Her AI isteği, asıl model çağrısından önce Polar'a ek HTTP isteği atabilir.
- Polar yavaşlarsa AI endpoint'leri de yavaşlar.
- Polar geçici olarak hata verirse abonelikli kullanıcılar yanlış şekilde free plana düşebilir veya istekleri başarısız olabilir.
- Dashboard açık kalan her kullanıcı, periyodik olarak dolaylı Polar yükü oluşturur.
- Sistem yatay ölçeklenince Polar API rate limit riski artar.

### Çözüm

Abonelik state'i backend'in yerel veritabanına senkronize edilmeli. Runtime'da AI endpoint'leri ve account endpoint'leri önce yerel state'i okumalı. Polar API yalnızca webhook, reconciliation ve kontrollü fallback için kullanılmalı.

### Implementasyon Todo

- [ ] `subscriptions` tablosu oluştur:
  - [ ] `userId`
  - [ ] `polarCustomerId`
  - [ ] `polarSubscriptionId`
  - [ ] `productId`
  - [ ] `tierSlug`
  - [ ] `status`
  - [ ] `currentPeriodEnd`
  - [ ] `canceledAt`
  - [ ] `updatedAt`
- [ ] `subscription-events` veya `webhook_events` tablosu oluştur:
  - [ ] `eventId`
  - [ ] `type`
  - [ ] `processedAt`
  - [ ] `payloadHash`
- [ ] `../dekadansai/src/lib/subscriptions.ts` benzeri bir servis katmanı ekle.
- [ ] `getUserPlanTier(userId)` fonksiyonunu yerel DB okuyacak şekilde tasarla.
- [ ] Yerel kayıt yoksa kontrollü şekilde Polar'dan bir kez hydrate et.
- [ ] `weeklyPlanMiddleware` içinde doğrudan Polar çağrısını kaldır.
- [ ] `/account/billing` endpoint'ini yerel subscription state okuyacak şekilde güncelle.
- [ ] `/account/rate-limit` endpoint'ini yerel plan tier okuyacak şekilde güncelle.
- [ ] Polar fallback olduğunda sonucu yerel DB'ye yaz.
- [ ] Fallback hatalarını kullanıcı isteğini mümkün olduğunca bozmayacak şekilde degrade et.
- [ ] Bu akışlar için unit/integration test ekle.

## 2. P0 - Polar webhook handler'ları ve idempotency eksik

### Sorun

`../dekadansai/src/auth.ts` içinde Polar webhook plugini kurulu fakat sadece `secret` verilmiş. Abonelik event'lerini yerel state'e uygulayan handler'lar yok.

```ts
webhooks({
  secret: config.polarWebhookSecret
})
```

`secret` imza doğrulamasını plugin seviyesinde sağlayabilir, ancak raporda doğrulanması gereken net eksik handler, idempotency ve event persistence tarafıdır.

### Etki

- Polar webhook gönderse bile backend abonelik state'ini değiştirmiyor.
- Kullanıcı checkout sonrası aktif abonelik alsa bile sistem bunu yerel olarak bilmiyor.
- Aynı webhook tekrar gelirse çift işlem yapılmasını engelleyen kayıt yok.
- Debug ve audit için webhook geçmişi tutulmuyor.

### Çözüm

Webhook handler'ları abonelik tablosunu güncellemeli. Her event `eventId` ile idempotent işlenmeli.

### Implementasyon Todo

- [ ] Polar webhook payload şemasını doğrula ve kullanılan event tiplerini netleştir.
- [ ] `webhook_events` tablosuyla event idempotency ekle.
- [ ] `onSubscriptionCreated` veya pluginin desteklediği eşdeğer created handler'ını bağla.
- [ ] `onSubscriptionActive` handler'ını bağla.
- [ ] `onSubscriptionCanceled` handler'ını bağla.
- [ ] `onSubscriptionRevoked` handler'ını bağla.
- [ ] `onSubscriptionUncanceled` veya eşdeğer reactivation handler'ını bağla.
- [ ] Handler'larda `productId` değerini `config.planTiers` ile eşleştir.
- [ ] Bilinmeyen product için güvenli fallback ve log ekle.
- [ ] Aynı event iki kez geldiğinde ikinci işlemin no-op olduğunu test et.
- [ ] Geçersiz imza / geçersiz payload testlerini ekle.

## 3. P1 - SQLite tabanlı rate limit çoklu process/deploy altında race condition riski taşıyor

### Sorun

`../dekadansai/src/lib/account-rate-limit.ts` içinde kota kontrolü `getRow.get()` ile okuma, ardından `upsertRow.run()` ile yazma şeklinde ilerliyor. Bu yapı tek Node process içinde daha düşük riskli olsa da, çoklu process, cluster, container veya yatay ölçekleme senaryolarında aynı kullanıcının eşzamanlı isteklerinde tutarsızlığa yol açabilir.

### Etki

- İki istek aynı eski değeri okuyup aynı anda yazarsa quota beklenenden az veya fazla tüketilebilir.
- Weekly quota ve burst quota yanlış hesaplanabilir.
- Kullanıcı kotayı aşmasına rağmen istek geçebilir ya da hakkı varken reddedilebilir.

### Çözüm

Kota tüketimi atomik hale getirilmeli. SQLite kalacaksa transaction ve write lock semantiği açıkça kullanılmalı. Daha yüksek trafik hedefleniyorsa Redis/Valkey gibi merkezi atomik sayaç sistemi tercih edilmeli.

### Implementasyon Todo

- [ ] Mevcut deploy modelini netleştir:
  - [ ] Tek process mi?
  - [ ] Birden fazla container mı?
  - [ ] SQLite dosyası paylaşılıyor mu?
- [ ] SQLite kalacaksa `database.transaction()` ile tüketim akışını tek transaction'a al.
- [ ] Transaction içinde normalize, kontrol ve update adımlarını birlikte çalıştır.
- [ ] `busy_timeout` ve WAL ayarlarını gözden geçir.
- [ ] `consumeAccountRateLimit` için eşzamanlı istek simülasyon testi yaz.
- [ ] Çoklu instance hedefleniyorsa Redis/Valkey tasarımına geç:
  - [ ] quota window key
  - [ ] burst window key
  - [ ] weekly quota key
  - [ ] TTL ve atomic increment
- [ ] Eski SQLite sayaçlarından yeni sisteme geçiş planı oluştur.

## 4. P1 - CORS ve credential ayarları üretim için fazla geniş

### Sorun

Backend'de `cors` middleware'i `credentials: true` ile çalışıyor. Config tarafında `CORS_ORIGIN` varsayılanı `*`.

İlgili kod:

- `../dekadansai/src/app.ts`
- `../dekadansai/src/config.ts`
- `../dekadansai/.env`
- `../dekadansai/.env.example`

Express `cors` paketinde `origin: true` gelen origin'i yansıtabilir. Bu, cookie/session kullanan account ve billing endpoint'leri için üretimde dikkatle sınırlandırılmalıdır.

### Etki

- Yanlış production config ile beklenmeyen origin'ler credential'lı istek atabilir.
- Account ve billing yüzeylerinde güvenlik marjı düşer.
- Debug sırasında çalışan config production'a taşınırsa risk büyür.

### Çözüm

Production'da `CORS_ORIGIN=*` yasaklanmalı. Sadece beklenen frontend domainleri allowlist'e alınmalı.

### Implementasyon Todo

- [ ] `assertRequiredConfig()` içine production guard ekle.
- [ ] `NODE_ENV=production` iken `CORS_ORIGIN=*` kullanımını hata kabul et.
- [ ] `CORS_ORIGIN` değerini explicit allowlist olarak zorunlu kıl.
- [ ] `BETTER_AUTH_TRUSTED_ORIGINS` ile `CORS_ORIGIN` tutarlılığını doğrula.
- [ ] Account endpoint'leri için cookie/session davranışını test et.
- [ ] `.env.example` içinde production-safe örnek ver.

## 5. P1 - Auth, checkout ve portal URL'lerinde geliştirme ortamı kalıntıları var

### Sorun

Backend `.env` içinde geçici ngrok ve localhost URL'leri bulunuyor:

- `BETTER_AUTH_URL`
- `POLAR_CHECKOUT_SUCCESS_URL`
- `POLAR_PORTAL_RETURN_URL`
- `FRONTEND_APP_URL`

Bu değerler geliştirme sırasında normal olabilir, ancak production'a taşınırsa auth callback ve checkout dönüşleri bozulur.

### Etki

- Checkout sonrası kullanıcı localhost'a yönlenebilir.
- Better Auth callback'i yanlış host'a dönebilir.
- Preview ve production ortamları birbirine karışabilir.
- Production deployment sırasında hatalar ancak ödeme/auth akışında fark edilir.

### Çözüm

Environment bazlı config ayrımı netleştirilmeli ve production guard'ları eklenmeli.

### Implementasyon Todo

- [ ] `.env.development`, `.env.production` ve deployment secret yönetimini ayır.
- [ ] Production'da `localhost`, `127.0.0.1`, `ngrok`, `lvh.me` gibi host'ları reddeden validator ekle.
- [ ] `BETTER_AUTH_URL` değerinin backend public URL'i olduğunu doğrula.
- [ ] `FRONTEND_APP_URL` değerinin frontend public URL'i olduğunu doğrula.
- [ ] `POLAR_CHECKOUT_SUCCESS_URL` ve `POLAR_PORTAL_RETURN_URL` için frontend domain guard'ı ekle.
- [ ] Startup sırasında config özetini secretsız şekilde logla.
- [ ] Auth callback ve checkout dönüşü için smoke test ekle.

## 6. P2 - Model kataloğu fallback ve upstream bağımlılığı tutarsız olabilir

### Sorun

Frontend homepage ve docs sayfaları backend `/models` endpoint'i başarısız olursa sabit `FALLBACK_MODELS` listesine düşüyor. Backend tarafında `/models` ve `/account/models` da upstream inference proxy üzerinden katalog çekiyor.

Risk iki yönlü:

- Frontend fallback listesi gerçek backend/upstream katalogdan sapabilir.
- Backend model endpoint'i upstream proxy hata verdiğinde kullanıcıya katalog sağlayamaz.

### Etki

- Kullanıcıya çalışmayan veya eski model ID'leri gösterilebilir.
- Docs örnekleri gerçek API ile uyumsuz hale gelebilir.
- Landing page ve docs farklı model listeleri gösterebilir.

### Çözüm

Model metadata merkezi hale getirilmeli. Frontend fallback, backend'in beklediği şema ve desteklenen model maliyetleri ile aynı kaynaktan türetilmeli.

### Implementasyon Todo

- [ ] Frontend'de ortak `lib/models.ts` dosyası oluştur.
- [ ] Homepage ve docs fallback listesini ortak dosyadan kullan.
- [ ] Backend'de desteklenen default model ve request cost listesiyle fallback uyumunu kontrol et.
- [ ] `/models` başarısız olduğunda frontend'de küçük uyarı banner'ı göster.
- [ ] Backend tarafında son başarılı katalog cache'i değerlendir.
- [ ] Model normalize fonksiyonunu tekilleştir.
- [ ] Docs örnek model ID'sini ortak fallback/default modelden üret.

## 7. P2 - `authClient` baseURL çözümlemesi preview/SSR ortamlarında kırılgan

### Sorun

`dekadansai-frontend/lib/auth-client.ts` içinde browser tarafında `window.location.origin`, server tarafında ise `NEXT_PUBLIC_APP_URL` kullanılıyor. Bu ayrım preview deployment'larda veya build zamanı/runtime URL farklarında yanlış baseURL doğurabilir.

Bu kesin bir bug değil, ama deployment riski olarak takip edilmeli.

### Etki

- Preview deployment production auth endpoint'ine istek atabilir.
- Cookie origin ve callback tutarsızlıkları oluşabilir.
- SSR veya server component kullanımında beklenmeyen baseURL seçilebilir.

### Çözüm

Auth client mümkün olduğunca relative path kullanmalı. Server tarafı auth işlemleri gerekiyorsa request headers üzerinden dinamik origin çözülmeli.

### Implementasyon Todo

- [ ] `authClient` kullanım yerlerini çıkar.
- [ ] Sadece client component'lerde kullanılıyorsa server fallback'i kaldırmayı değerlendir.
- [ ] Better Auth relative `baseURL` kullanımını test et.
- [ ] Server tarafında auth ihtiyacı varsa `headers()` ile `host` / `x-forwarded-host` üzerinden origin çöz.
- [ ] Preview deployment için smoke test ekle.
- [ ] `NEXT_PUBLIC_APP_URL` kullanımını development fallback ile sınırla.

## 8. P3 - Hata mesajları İngilizce UI ile tutarsız

### Sorun

Frontend `dekadansai-frontend/lib/account-client.ts` içinde bazı fallback hata mesajları Türkçe:

- `Rate limit bilgisi alinamadi`
- `Billing bilgisi alinamadi`

UI ve docs genel olarak İngilizce.

### Etki

- Kullanıcıya yansıyan hata dili tutarsız görünür.
- Support/debug akışlarında mesaj standardı bozulur.
- Uluslararası kullanıcı deneyimi zayıflar.

### Çözüm

Kullanıcıya dönen tüm hata mesajları İngilizce standardize edilmeli. İç log dili ayrı kalabilir.

### Implementasyon Todo

- [ ] Frontend hata mesajlarını İngilizceye çevir.
- [ ] Backend API error body formatını standartlaştır:
  - [ ] `error`
  - [ ] `message`
  - [ ] `code`
  - [ ] opsiyonel `details`
- [ ] Account, billing, models ve AI endpoint hata mesajlarını gözden geçir.
- [ ] UI'da kullanıcı dostu fallback mesajları tanımla.
- [ ] Testlerde beklenen mesajları güncelle.

## Önerilen Uygulama Sırası

1. [ ] **P0 Abonelik state'i yerelleştirme**
2. [ ] **P0 Webhook handler ve idempotency**
3. [ ] **P1 Production config guard'ları**
4. [ ] **P1 CORS allowlist sıkılaştırması**
5. [ ] **P1 Rate limit atomik tüketim**
6. [ ] **P2 Model kataloğu merkezi fallback**
7. [ ] **P2 Auth baseURL sadeleştirme**
8. [ ] **P3 Hata dili standardizasyonu**

## Kabul Kriterleri

- [ ] AI isteği sırasında normal durumda Polar API çağrısı yapılmıyor.
- [ ] Abonelik değişiklikleri webhook ile yerel DB'ye yansıyor.
- [ ] Aynı webhook iki kez gönderildiğinde state bozulmuyor.
- [ ] `/account/billing` ve `/account/rate-limit` yerel subscription state üzerinden çalışıyor.
- [ ] Production config, localhost/ngrok ve wildcard CORS gibi riskli değerlerle başlamıyor.
- [ ] Rate limit tüketimi eşzamanlı isteklerde tutarlı kalıyor.
- [ ] Frontend model listesi homepage ve docs arasında tek kaynaktan geliyor.
- [ ] Kullanıcıya gösterilen hata mesajları İngilizce ve tutarlı.

## Sonuç

Mevcut sistem çalışabilir durumda olsa da abonelik, webhook ve production config tarafları üretim ölçeği için güçlendirilmelidir. En kritik mimari değişiklik, Polar'ı her istekte canlı sorgulamak yerine yerel subscription state'i kaynak kabul edip Polar'ı webhook ve reconciliation mekanizması olarak kullanmaktır.
