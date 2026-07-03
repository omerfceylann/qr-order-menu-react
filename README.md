# QR Menu Project

React, TypeScript, Tailwind ve Supabase ile tek restoran odakli mobil QR menu uygulamasi.

## Ozellikler

- Musteri QR menusu: `/menu/:tableCode`
- Sepete ekleme, adet duzenleme ve siparis olusturma
- Supabase Auth ile admin girisi
- Canli siparis takibi
- Menu, kategori, masa ve tema yonetimi
- Supabase Storage ile urun gorseli yukleme
- Masa QR kodu onizleme ve indirme
- Siparis raporlari: yogun saatler, cok/az satan urunler, masa yogunlugu, gelir ve ortalama sepet

## Kullanilan Teknolojiler

- React + TypeScript
- Vite
- Tailwind CSS
- Supabase CLI, Auth, Database, Realtime, Storage
- react-router-dom
- react-hook-form
- lucide-react
- qrcode

## Kurulum

```bash
npm install
cp .env.example .env.local
```

Supabase local servislerini baslatin:

```bash
npx supabase start
npx supabase db reset
```

`supabase start` ciktisindaki `API URL` ve `anon key` degerlerini `.env.local` icine yazin:

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=anon-key-buraya
VITE_PUBLIC_SITE_URL=http://localhost:5173
```

Uygulamayi calistirin:

```bash
npm run dev
```

## Admin Kullanici Olusturma

Local Supabase Studio genelde `http://127.0.0.1:54323` adresinde acilir.

1. Studio > Authentication > Users sayfasina gidin.
2. Yeni bir kullanici olusturun.
3. Bu email ve sifre ile `/admin/login` sayfasindan giris yapin.

## Demo URL'leri

- Ana sayfa: `http://localhost:5173`
- Demo masa: `http://localhost:5173/menu/masa-1`
- Admin: `http://localhost:5173/admin/login`

## Supabase Notlari

- Migration dosyasi: `supabase/migrations/202606150001_initial_schema.sql`
- Seed dosyasi: `supabase/seed.sql`
- Urun gorselleri icin public `menu-images` Storage bucket'i olusturulur.
- Public kullanicilar aktif menu verilerini okuyabilir ve siparis olusturabilir.
- Admin islemleri Supabase Auth ile giris yapmis kullanicilara aciktir.

## Production Icin

1. Supabase cloud projesi olusturun.
2. Migration ve seed SQL'lerini Supabase CLI ile remote projeye uygulayin.
3. `.env.local` yerine deployment ortaminda `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_PUBLIC_SITE_URL` girin.
4. Supabase Auth redirect URL listesine production domaininizi ekleyin.
