<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/01dc631d-b75b-4871-b0e2-0c0b410d041f

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Supabase Auth + Role Dashboard

Fitur auth TERRA sekarang memakai Supabase:
- Login
- Register khusus siswa
- Lupa password + reset password
- Dashboard berdasarkan role: `siswa`, `petugas`, `admin`
- Role saat register publik selalu `siswa` dan tidak berasal dari input pengguna

### Setup

1. Buat project di Supabase.
2. Buka SQL Editor lalu jalankan `supabase/schema.sql`.
3. Ambil Project URL dan anon/publishable key dari Supabase.
4. Salin `.env.example` menjadi `.env.local`, lalu isi:

```env
VITE_SUPABASE_URL="https://PROJECT.supabase.co"
VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
```

5. Install dependency:

```bash
npm install
```

6. Jalankan:

```bash
npm run dev
```

### Membuat akun petugas/admin

Form register publik **tidak menyediakan pilihan role**. Setelah akun dibuat sebagai siswa, admin dapat menaikkan role melalui proses administrasi yang aman, misalnya SQL Editor:

```sql
update public.profiles
set role = 'petugas'
where id = 'UUID_USER';

update public.profiles
set role = 'admin'
where id = 'UUID_USER';
```

Jangan expose operasi perubahan role ini ke browser. Kalau nanti dibuat menu manajemen user, endpoint backend wajib memverifikasi bahwa requester memang admin.


## Keamanan akun

Fitur auth TERRA sekarang memakai beberapa lapisan perlindungan:

1. Register publik selalu membuat role `siswa`; tidak ada role selector.
2. Aktifkan **Confirm email** di Supabase Authentication agar akun harus memverifikasi email.
3. Aktifkan **CAPTCHA** di Supabase Authentication dan gunakan Cloudflare Turnstile. Isi `VITE_TURNSTILE_SITE_KEY` dengan site key Turnstile.
4. Form auth memiliki honeypot dan minimum dwell-time untuk menangkap bot sederhana.
5. Dashboard admin/petugas punya manajemen akun untuk blokir/buka blokir. Blokir memakai Supabase Auth Admin API di server, bukan sekadar menyembunyikan akun di frontend.
6. `SUPABASE_SERVICE_ROLE_KEY` hanya boleh berada di `.env.local` server. Jangan pernah memberi prefix `VITE_` pada key ini dan jangan commit ke Git.
7. Petugas hanya boleh memblokir siswa. Admin dapat memblokir siswa/petugas, tetapi tidak akun admin.

### Environment

Selain `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`, server membutuhkan:

```env
SUPABASE_SERVICE_ROLE_KEY=...
VITE_TURNSTILE_SITE_KEY=...
```

Untuk production, tambahkan rate limiting di reverse proxy/WAF juga. Rate limiter bawaan server ini hanya lapisan tambahan dan bersifat in-memory.

### Supabase CAPTCHA

Di Supabase Dashboard, buka Authentication settings, aktifkan CAPTCHA, pilih Cloudflare Turnstile, lalu masukkan secret key Turnstile di Supabase. Site key untuk browser dimasukkan ke `VITE_TURNSTILE_SITE_KEY`.


## Setup TERRA Bank Sampah + Gemini

1. Copy `.env.example` to `.env.local`.
2. Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `GEMINI_API_KEY`, and the server-only `SUPABASE_SERVICE_ROLE_KEY`.
3. Run the complete `supabase/schema.sql` in Supabase SQL Editor. It creates the XP/reward tables and the private `waste-deposit-photos` storage bucket.
4. Student waste reports require a JPG/PNG/WebP photo. Staff receive a temporary signed URL to review the proof photo.
5. The waste scanner uses the server-side Gemini API. Keep `GEMINI_API_KEY` server-only, never under a `VITE_` prefix.

The scanner uses `gemini-3.7-flash` first, then falls back to `gemini-3.6-flash` and `gemini-2.5-flash`.


## Production deployment

TERRA is configured to run as one production Node/Express service that serves the Vite build and the `/api/*` backend from the same origin.

### Required production environment variables

Public browser variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Server-only variables:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`

Do not commit `.env.local`, service-role keys, or Gemini keys.

### Render

Use `render.yaml`, or create a Node web service manually:
- Build: `npm ci && npm run build`
- Start: `npm start`
- Health check: `/api/health`

Set the environment variables above in the hosting dashboard.

### Supabase Auth

After deployment, add the public production URL to Supabase Authentication URL Configuration:
- Site URL: your production URL
- Redirect URLs: your production URL and the password-reset/verification callback URL used by TERRA.

### HTTPS

Use the hosting provider's HTTPS URL in production. Browser camera access for the waste scanner requires a secure context (HTTPS, except localhost).

### Local development

Use `.env.local` and `npm run dev`.


### Reward pickup workflow
Run `supabase/migrations/003_reward_pickup_status.sql` in the Supabase SQL Editor after the existing schema/migrations. It adds the `picked_up` redemption state and the staff action used after a student collects an approved reward.


## Supabase reward pickup fix

If an existing production database was created before the reward pickup feature, run `supabase/2026-08-30_reward-pickup-fix.sql` once in Supabase SQL Editor. It adds the `picked_up` lifecycle and the `mark_reward_redemption_picked_up(uuid, uuid)` RPC used by the staff dashboard.
