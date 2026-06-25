# Pi CLI Fork Yol Haritası

## Hedef

`earendil-works/pi` altyapısını fork ederek Dekadans AI markasına ait, kendi OAuth/API key akışımızla çalışan bağımsız bir CLI ürünü çıkarmak.

Önerilen ürün konumu:

```text
Dekadans AI CLI
→ Pi agent/TUI altyapısını kullanır
→ Dekadans AI backend üzerinden login olur
→ Dekadans AI gateway modellerini kullanır
→ Kendi marka, config, paket ve update altyapısına sahiptir
```

## Genel Strateji

Fork süreci tek seferde büyük rebrand olarak değil, kontrollü aşamalarla ilerlemeli:

1. Önce çalışan fork alınır.
2. Marka ve tema izleri değiştirilir.
3. Auth/provider katmanı Dekadans AI backend’e bağlanır.
4. Paketleme ve dağıtım bağımsızlaştırılır.
5. Upstream Pi güncellemelerini takip edecek bakım süreci kurulur.

## Faz 0: Hazırlık ve Karar Seti

### Kararlar

- CLI adı ne olacak?
  - Öneri: `dekadans`
  - Alternatif: `dekadans-ai`, `dai`, `dkai`
- Config dizini:
  - Öneri: `~/.dekadans`
- NPM package adı:
  - Öneri: `@dekadans-ai/cli`
- Backend base URL:
  - Production: `https://api.dekadans.net`
  - Local/dev: `.env` veya config üzerinden değişebilir olmalı.
- İlk auth akışı:
  - MVP: dashboard’dan API key kopyalama
  - Ürünleşmiş çözüm: `dekadans login` ile browser OAuth + callback/pairing code

### Çıktılar

- Fork repo adı belirlenir.
- Paket adı belirlenir.
- Marka renkleri ve terminal tema kararları netleşir.

## Faz 1: Fork ve Çalışan Build

### Yapılacaklar

1. `earendil-works/pi` fork edilir.
2. Fork ayrı repo olarak klonlanır.
3. Mevcut build/test komutları çalıştırılır:

```bash
npm install --ignore-scripts
npm run build
npm run check
./test.sh
./pi-test.sh
```

4. Hiçbir rebrand yapılmadan upstream kodun lokal çalıştığı doğrulanır.

### Başarı Kriteri

- CLI kaynak koddan çalışır.
- TUI açılır.
- Test/check komutları geçer veya bilinen upstream hataları notlanır.

## Faz 2: Minimal Rebrand

### Değiştirilecek Alanlar

- CLI görünen adı
- Terminal başlığı
- İlk açılış metinleri
- Header/footer/status line
- Tema renkleri
- Logo/ascii görseller
- `.pi` config dizini

### Muhtemel Dosyalar

```text
packages/coding-agent/package.json
packages/coding-agent/src/config.ts
packages/coding-agent/src/modes/interactive/interactive-mode.ts
packages/coding-agent/src/modes/interactive/components/first-time-setup.ts
packages/coding-agent/src/modes/interactive/components/*
packages/coding-agent/src/modes/interactive/theme/dark.json
packages/coding-agent/src/modes/interactive/theme/light.json
```

### Önerilen Yaklaşım

Önce Pi’nin mevcut extension/theme imkanları kullanılarak düşük riskli rebrand yapılmalı. Kod içindeki tüm `pi` referanslarını körlemesine değiştirmek yerine, config destekli alanlar tercih edilmeli.

### Başarı Kriteri

- CLI açıldığında Dekadans AI markası görünür.
- Eski Pi/Earendil görsel izleri ana kullanıcı akışlarında görünmez.
- Core agent davranışı bozulmaz.

## Faz 3: Dekadans AI Provider Entegrasyonu

### Amaç

CLI’ın model çağrılarını doğrudan Dekadans AI backend’e yönlendirmek.

### Backend Uyum Noktaları

Mevcut backend API key ile şu endpointleri destekliyor:

```text
GET /v1/models
POST /v1/chat/completions
POST /v1/responses
POST /v1/messages
POST /v1/messages/count_tokens
```

Auth:

```text
Authorization: Bearer <api-key>
```

veya:

```text
x-api-key: <api-key>
```

### Yapılacaklar

1. Pi provider sistemi incelenir.
2. Dekadans AI için yeni provider eklenir.
3. Default provider Dekadans AI yapılır.
4. Model listesi `GET /v1/models` üzerinden alınır veya başlangıçta sabit katalog kullanılır.
5. Chat/completion istekleri `/v1/chat/completions` veya uyumlu endpoint’e yönlendirilir.

### Başarı Kriteri

- CLI, Dekadans AI API key ile model listesi çekebilir.
- Basit prompt gönderip cevap alabilir.
- Rate limit ve `402 weekly_plan_required` hataları kullanıcıya anlaşılır gösterilir.

## Faz 4: Login ve API Key Akışı

### MVP Akışı

İlk sürümde:

```text
dekadans login
→ kullanıcıdan API key ister
→ key lokal config’e kaydedilir
```

Bu en hızlı ve düşük riskli yoldur.

### Ürünleşmiş Akış

Sonraki sürümde:

```text
dekadans login
→ browser açılır
→ kullanıcı Google/GitHub ile giriş yapar
→ backend tek kullanımlık pairing code üretir
→ CLI pairing code'u API key'e çevirir
→ API key güvenli config’e kaydedilir
```

### Backend’de Gerekebilecek Ekler

- CLI login session endpoint’i
- Pairing code oluşturma endpoint’i
- Pairing code doğrulama endpoint’i
- Session’dan API key üretme endpoint’i
- API key revoke/rotate endpointlerinin CLI uyumunun doğrulanması

### Başarı Kriteri

- Kullanıcı dashboard’a gitmeden CLI’dan login olabilir.
- API key localde saklanır.
- `logout`, `whoami`, `keys list`, `keys revoke` gibi komutlar için temel yapı hazır olur.

## Faz 5: Paketleme ve Dağıtım

### Değiştirilecekler

- NPM package namespace:

```text
@earendil-works/pi-coding-agent
→ @dekadans-ai/cli
```

- Binary adı:

```text
pi
→ dekadans
```

- Config dizini:

```text
~/.pi
→ ~/.dekadans
```

- Update endpointleri:

```text
https://pi.dev/api/latest-version
→ Dekadans AI update endpoint
```

### Başarı Kriteri

- `npm install -g @dekadans-ai/cli` çalışır.
- `dekadans` komutu global erişilebilir olur.
- Self-update ya devre dışıdır ya da Dekadans endpointlerine bağlıdır.

## Faz 6: Legal ve Attribution

Repo MIT lisanslı olduğu için fork ve rebrand mümkün. Ancak MIT lisans metni ve copyright korunmalı.

### Yapılacaklar

- `LICENSE` korunur.
- Third-party attribution dosyası eklenir.
- UI’da gerekirse “Built on Pi” benzeri düşük profilli attribution değerlendirilir.
- Paket metadata ve repo açıklaması netleştirilir.

### Başarı Kriteri

- MIT lisans uyumu korunur.
- Dekadans AI markası bağımsız görünür.
- Upstream Pi lisans yükümlülükleri ihlal edilmez.

## Faz 7: Upstream Takip Stratejisi

Pi hızlı gelişen bir proje olduğu için fork’un sürdürülebilirliği önemlidir.

### Önerilen Model

```text
upstream/main
→ düzenli takip edilir

dekadans/main
→ stabil ürün branch’i

dekadans/rebrand
→ marka ve provider değişiklikleri burada izole tutulur
```

### Pratik Kurallar

- Rebrand patchleri mümkün olduğunca küçük ve izole tutulmalı.
- Core agent koduna minimum müdahale edilmeli.
- Provider entegrasyonu ayrı modül olarak tutulmalı.
- Upstream merge ayda bir yapılmalı.
- Büyük upstream refactor sonrası test matrisi çalıştırılmalı.

### Başarı Kriteri

- Upstream güncellemeleri fork’a taşınabilir.
- Dekadans özel değişiklikleri merge sırasında sürekli çatışma üretmez.

## Faz 8: Test ve QA

### Test Edilecek Akışlar

- İlk kurulum
- Login
- API key saklama
- Model listeleme
- Prompt gönderme
- Streaming cevap
- Hatalı API key
- Plansız kullanıcı
- Rate limit
- Logout
- Config reset
- Linux/macOS/Windows terminal davranışı

### Komut Örnekleri

```bash
dekadans login
dekadans models
dekadans chat "Merhaba"
dekadans whoami
dekadans logout
```

### Başarı Kriteri

- Ana kullanıcı akışları stabil çalışır.
- Hata mesajları Dekadans AI terminolojisine uygundur.
- Terminal UI bozulmaz.

## Önerilen Zaman Planı

### Hafta 1

- Fork alınır.
- Build/test çalıştırılır.
- Minimal rebrand yapılır.
- Tema ve header/footer Dekadans AI olur.

### Hafta 2

- Dekadans AI provider eklenir.
- Manuel API key login yapılır.
- Model listeleme ve chat akışı çalışır.

### Hafta 3

- Browser OAuth + pairing code tasarlanır.
- Backend endpointleri eklenir.
- CLI login akışı ürünleşir.

### Hafta 4

- Paket adı, binary adı ve config dizini netleştirilir.
- NPM publish hazırlığı yapılır.
- QA, legal attribution ve release süreci tamamlanır.

## Önceliklendirilmiş İş Listesi

### P0

- Fork’u çalışır hale getir.
- Dekadans theme/header/footer uygula.
- Dekadans AI API key ile istek atabilen provider ekle.
- Manuel `login` ile API key sakla.

### P1

- `models`, `chat`, `whoami`, `logout` komutlarını netleştir.
- Plansız kullanıcı ve rate limit hata mesajlarını iyileştir.
- Config dizinini `~/.dekadans` yap.
- Binary adını değiştir.

### P2

- Browser OAuth + pairing code login ekle.
- API key revoke/rotate komutları ekle.
- Self-update endpointini Dekadans tarafına taşı.
- NPM publish pipeline kur.

### P3

- Upstream merge otomasyonu kur.
- Cross-platform test matrisi ekle.
- Telemetry veya session sharing varsa devre dışı bırak ya da Dekadans politikalarına göre yeniden tasarla.

## Nihai Tavsiye

Fork mantığıyla ilerlemek doğru, ancak ilk sürümde hedef “tam bağımsız ürün” değil, “Dekadans AI backend’e bağlı çalışan branded fork MVP” olmalı.

En düşük riskli MVP kapsamı:

```text
Dekadans tema
+ Dekadans provider
+ manuel API key login
+ model listeleme
+ chat/completion akışı
```

Bu doğrulandıktan sonra OAuth pairing, paketleme, self-update ve tam rebrand aşamalarına geçmek daha güvenli olur.
