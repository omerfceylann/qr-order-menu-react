import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Button, Card, Field, Input } from '../components/ui';
import { supabase } from '../lib/supabase';
import { useApp } from '../state/AppProviders';

type LoginForm = {
  email: string;
  password: string;
};

export function AdminLogin() {
  const { session } = useApp();
  const { register, handleSubmit } = useForm<LoginForm>();
  const [error, setError] = useState('');

  if (session) return <Navigate to="/admin" replace />;

  async function onSubmit(values: LoginForm) {
    setError('');
    const { error: signInError } = await supabase.auth.signInWithPassword(values);
    if (signInError) setError(signInError.message);
  }

  return (
    <main className="grid min-h-screen place-items-center bg-cream px-5 dark:bg-leaf-950">
      <Card className="w-full max-w-md p-7">
        <div className="mb-6 grid h-12 w-12 place-items-center rounded-lg bg-[var(--brand-active)] text-white">
          <Lock size={22} />
        </div>
        <h1 className="font-display text-4xl text-leaf-950 dark:text-leaf-50">Admin girişi</h1>
        <p className="mt-2 text-sm text-leaf-700 dark:text-leaf-300">Supabase Auth ile restoran paneline girin.</p>
        <form className="mt-7 grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          <Field label="Email">
            <Input type="email" autoComplete="email" required {...register('email')} />
          </Field>
          <Field label="Şifre">
            <Input type="password" autoComplete="current-password" required {...register('password')} />
          </Field>
          {error ? <p className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
          <Button type="submit">Panele gir</Button>
        </form>
      </Card>
    </main>
  );
}
