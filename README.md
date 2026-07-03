# QR Menü Projesi

React, TypeScript, Tailwind CSS ve Supabase ile hazırlanmış tek restoran odaklı mobil QR menü ve admin paneli uygulaması.

Müşteri masadaki QR kodu okutarak menüye ulaşır, ürünleri sepete ekler ve sipariş oluşturur. Restoran sahibi admin panelinden menüyü, masaları, QR kodları, siparişleri, tema ayarlarını ve raporları yönetir.

## Özellikler

- Mobil uyumlu müşteri QR menüsü: `/menu/:tableCode`
- Kategori bazlı menü görünümü ve kategoriye smooth scroll
- Ürün detay modalı, sepet, sipariş notu ve sipariş oluşturma
- Müşteri tarafında TR/EN dil seçimi ve açık/koyu tema seçimi
- Admin giriş ekranı ve Supabase Auth desteği
- Canlı sipariş takibi ve sipariş durumu güncelleme
- Menü, kategori, ürün, masa ve QR yönetimi
- Ürünlerde Türkçe/İngilizce ad-açıklama, görsel URL/dosya yükleme ve besin değerleri
- Restoran logosu, hero arka planı, font ve 10 hazır tema paleti
- Supabase Storage ile ürün ve marka görseli yükleme
- Raporlar: gelir, ortalama sepet, çok/az satan ürünler, yoğun saatler ve masa bazlı sipariş adedi

## Kullanılan Teknolojiler

- React + TypeScript
- Vite
- Tailwind CSS
- Supabase CLI, Database, Auth, Realtime ve Storage
- react-router-dom
- react-hook-form
- lucide-react
- qrcode

## Kurulum

Bağımlılıkları yükleyin:

```bash
npm install
```

Ortam değişkenlerini hazırlayın:

```bash
cp .env.example .env.local
```

Local Supabase servislerini başlatın:

```bash
npx supabase start
```

Komut çıktısındaki `API URL` ve `anon key` değerlerini `.env.local` dosyasına yazın:

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=anon-key-buraya
VITE_PUBLIC_SITE_URL=http://localhost:5173
```

Migration ve seed verilerini local veritabanına uygulayın:

```bash
npx supabase db reset
```

Uygulamayı çalıştırın:

```bash
npm run dev
```

## Demo URL'leri

- Ana sayfa: `http://localhost:5173`
- Örnek masa: `http://localhost:5173/menu/masa-1`
- Admin giriş: `http://localhost:5173/admin/login`

## Admin Kullanıcı Oluşturma

Local Supabase Studio genellikle şu adreste açılır:

```text
http://127.0.0.1:54323
```

1. Supabase Studio > Authentication > Users sayfasına gidin.
2. Yeni kullanıcı oluşturun.
3. Kullanıcıyı oluştururken `Auto Confirm User` seçeneğini işaretleyin.
4. Oluşturduğunuz email ve şifre ile `/admin/login` ekranından giriş yapın.

## Supabase Yapısı

Proje Supabase CLI migration akışıyla gelir.

- Migration dosyaları: `supabase/migrations/`
- Başlangıç verileri: `supabase/seed.sql`
- Ürün ve marka görselleri için public `menu-images` bucket'ı kullanılır.
- Public kullanıcılar aktif menü, masa ve restoran ayarlarını okuyabilir.
- Public kullanıcılar sipariş oluşturabilir.
- Admin işlemleri Supabase Auth kullanıcısına kısıtlanır.

Local veritabanını sıfırlamak ve seed verilerini yeniden yüklemek için:

```bash
npm run supabase:reset
```

## GitHub'a Yüklerken Dikkat

`.env.local` dosyasını kesinlikle GitHub'a yüklemeyin. Bu dosya `.gitignore` içindedir.

GitHub'a yüklenmemesi gereken diğer dosyalar:

- `node_modules/`
- `dist/`
- `.DS_Store`
- `*.tsbuildinfo`
- `supabase/.temp/`
- `supabase/.branches/`

## Production Notları

1. Supabase Cloud üzerinde yeni proje oluşturun.
2. Migration dosyalarını remote Supabase projenize uygulayın.
3. Gerekirse seed verilerini remote veritabanına çalıştırın.
4. Deployment ortamında şu environment variable'ları tanımlayın:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_PUBLIC_SITE_URL`
5. Supabase Auth redirect URL listesine production domaininizi ekleyin.

## Lisans

MIT
