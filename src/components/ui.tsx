import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  const variants = {
    primary: 'bg-[var(--brand-active)] text-white shadow-lift hover:text-white hover:brightness-110',
    secondary: 'border border-leaf-200 bg-white text-leaf-900 hover:bg-leaf-50 dark:border-leaf-700 dark:bg-leaf-900 dark:text-leaf-50 dark:hover:bg-leaf-800',
    ghost: 'text-leaf-900 hover:bg-leaf-100 dark:text-leaf-100 dark:hover:bg-leaf-900',
    danger: 'bg-red-600 text-white hover:bg-red-700 hover:text-white',
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-leaf-100 bg-white/90 shadow-soft dark:border-leaf-800 dark:bg-leaf-950/70 ${className}`}>{children}</section>;
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="grid h-full content-start gap-2 text-sm font-semibold text-leaf-950 dark:text-leaf-50">
      <span>{label}</span>
      {children}
      {hint ? <span className="text-xs font-normal text-leaf-700 dark:text-leaf-300">{hint}</span> : null}
    </label>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className = '', type, ...props }, ref) {
  const baseClass = 'w-full rounded-lg border border-leaf-200 bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-leaf-500 focus:ring-4 focus:ring-leaf-100 dark:border-leaf-700 dark:bg-leaf-900 dark:text-leaf-50 dark:placeholder:text-leaf-400 dark:focus:ring-leaf-900';
  const nativeClass =
    type === 'file'
      ? 'cursor-pointer file:mr-4 file:rounded-md file:border-0 file:bg-[var(--brand-active)] file:px-3 file:py-2 file:text-sm file:font-bold file:text-white file:transition hover:file:brightness-110'
      : type === 'date'
        ? 'min-h-[42px] cursor-pointer accent-[var(--brand-active)]'
        : '';

  return (
    <input
      ref={ref}
      type={type}
      className={`${baseClass} ${nativeClass} ${className}`}
      {...props}
    />
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className = '', ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={`min-h-24 w-full rounded-lg border border-leaf-200 bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-leaf-500 focus:ring-4 focus:ring-leaf-100 dark:border-leaf-700 dark:bg-leaf-900 dark:text-leaf-50 dark:placeholder:text-leaf-400 dark:focus:ring-leaf-900 ${className}`}
      {...props}
    />
  );
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className = '', ...props }, ref) {
  return (
    <select
      ref={ref}
      className={`w-full rounded-lg border border-leaf-200 bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-leaf-500 focus:ring-4 focus:ring-leaf-100 dark:border-leaf-700 dark:bg-leaf-900 dark:text-leaf-50 dark:focus:ring-leaf-900 ${className}`}
      {...props}
    />
  );
});

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-leaf-200 bg-leaf-50/70 p-8 text-center dark:border-leaf-800 dark:bg-leaf-950/70">
      <p className="font-display text-2xl text-leaf-950 dark:text-leaf-50">{title}</p>
      <p className="mt-2 text-sm text-leaf-700 dark:text-leaf-300">{text}</p>
    </div>
  );
}

export function StatCard({ label, value, tone = 'leaf' }: { label: string; value: string; tone?: 'leaf' | 'clay' | 'brass' }) {
  const color = tone === 'clay' ? 'text-clay' : tone === 'brass' ? 'text-brass' : 'text-leaf-800';
  return (
    <Card className="p-5">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-leaf-600 dark:text-leaf-300">{label}</p>
      <p className={`mt-3 font-display text-3xl ${color}`}>{value}</p>
    </Card>
  );
}
