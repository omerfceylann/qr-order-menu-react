import { Link } from 'react-router-dom';
import { ArrowRight, ClipboardList, Leaf, QrCode } from 'lucide-react';
import { useApp } from '../state/AppProviders';
import { Button, Card } from '../components/ui';

export function Home() {
  const { settings } = useApp();

  return (
    <main className="min-h-screen bg-cream px-5 py-8 text-ink">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="animate-rise">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-leaf-200 bg-white/80 px-4 py-2 text-sm font-semibold text-leaf-800">
            <Leaf size={16} /> QR ile hızlı servis
          </div>
          <h1 className="font-display text-5xl leading-[0.95] text-leaf-950 md:text-7xl">
            {settings?.restaurant_name || 'Verde QR Menu'}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-leaf-800">
            Masadan sipariş, canlı admin takibi, esnek menü yönetimi ve restoranınıza uygun sade bir deneyim.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/menu/masa-1">
              <Button>
                Demo menüyü aç <ArrowRight size={16} />
              </Button>
            </Link>
            <Link to="/admin/login">
              <Button variant="secondary">Admin panel</Button>
            </Link>
          </div>
        </section>
        <Card className="relative overflow-hidden p-6">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-leaf-200/60 blur-3xl" />
          <div className="relative grid gap-4">
            {[
              { step: '1', title: 'Masa QR kodu okutulur', Icon: QrCode },
              { step: '2', title: 'Ürünler sepete eklenir', Icon: ClipboardList },
              { step: '3', title: 'Sipariş admin paneline canlı düşer', Icon: Leaf },
            ].map(({ step, title, Icon }) => (
              <div key={step} className="flex items-center gap-4 rounded-lg border border-leaf-100 bg-white p-5">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-leaf-900 text-sm font-bold text-white">{step}</span>
                <div className="flex-1">
                  <p className="font-semibold text-leaf-950">{title}</p>
                </div>
                <Icon className="text-leaf-700" size={22} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </main>
  );
}
