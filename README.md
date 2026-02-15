# Dekadans AI Frontend

Bu proje, Better Auth tabanli backend (`../dekadansai`) icin hesap panelidir.

Kapsam:

- login / register
- API key olusturma
- hesap bazli ve key bazli rate limit takibi

## Calistirma

1. Backend'i ayaga kaldir (`../dekadansai`)
2. Frontend env dosyasini olustur

```bash
cp .env.example .env
```

3. Frontend'i baslat

```bash
npm install
npm run dev
```

Uygulama varsayilan olarak `http://localhost:3000` adresinde acilir.

## Env

- `BACKEND_BASE_URL`: Backend base URL (varsayilan: `http://localhost:4000`)
- `NEXT_PUBLIC_APP_URL`: Frontend public URL (varsayilan: `http://localhost:3000`)

Not: Frontend, backend'e Next.js route handler uzerinden proxy olur (`/api/auth/*`, `/api/account/rate-limit`).
