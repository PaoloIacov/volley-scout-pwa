import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Check, Info, TriangleAlert, X, XCircle } from 'lucide-react';

/* ------------------------------------------------------------------ layout */

export function Card({ className = '', children, ...props }) {
  return (
    <div
      className={`rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-xl shadow-black/20 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function PageHeader({ icon: Icon, title, subtitle, actions }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-600/15 text-red-400 ring-1 ring-red-500/25">
            <Icon size={24} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">{title}</h1>
            <p className="mt-0.5 text-sm text-zinc-400">{subtitle}</p>
          </div>
        </div>
        {actions && <div className="flex flex-wrap gap-2 sm:justify-end">{actions}</div>}
      </div>
    </Card>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-400">
        <Icon size={26} />
      </div>
      <p className="font-medium text-zinc-200">{title}</p>
      <p className="max-w-sm text-sm text-zinc-500">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </Card>
  );
}

/* ----------------------------------------------------------------- bottoni */

const BUTTON_VARIANTS = {
  primary:
    'bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-950/40 focus-visible:outline-red-400',
  outline:
    'border border-zinc-700 bg-zinc-900/60 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-800 focus-visible:outline-zinc-400',
  ghost: 'text-zinc-300 hover:bg-zinc-800 hover:text-white focus-visible:outline-zinc-400',
  danger:
    'border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 focus-visible:outline-red-400',
};

const BUTTON_SIZES = {
  sm: 'px-3 py-2 text-xs',
  md: 'px-4 py-2.5 text-sm',
};

export function Button({ variant = 'primary', size = 'md', className = '', type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:pointer-events-none disabled:opacity-40 ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`}
      {...props}
    />
  );
}

/** Link con l'aspetto di un Button (evita <a> annidato a <button>). */
export function ButtonLink({ to, variant = 'primary', size = 'md', className = '', children, ...props }) {
  return (
    <Link
      to={to}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}

export function IconButton({ label, variant = 'outline', className = '', children, ...props }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:pointer-events-none disabled:opacity-40 ${BUTTON_VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ campi */

export const inputClass = (error = false) =>
  `w-full rounded-xl border bg-zinc-950/70 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:ring-2 ${
    error
      ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/25'
      : 'border-zinc-700 focus:border-zinc-500 focus:ring-zinc-500/20'
  }`;

export function Field({ label, htmlFor, error, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-zinc-300">
        {label}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs font-medium text-red-400">{error}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ badge */

export function Badge({ className = '', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold tracking-wide ${className}`}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ modal */

export function Modal({ open, onClose, title, icon: Icon, children, footer }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="anim-fade absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="anim-pop relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/60 outline-none sm:max-h-[85vh] sm:max-w-lg sm:rounded-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-900/95 px-5 py-4">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600/15 text-red-400 ring-1 ring-red-500/25">
                <Icon size={18} />
              </div>
            )}
            <h2 className="text-base font-semibold text-white">{title}</h2>
          </div>
          <IconButton label="Chiudi" variant="ghost" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-zinc-800 bg-zinc-950/40 px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- conferma */

export function ConfirmDialog({
  open,
  title = 'Conferma operazione',
  message,
  confirmLabel = 'Conferma',
  cancelLabel = 'Annulla',
  icon: Icon = TriangleAlert,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      icon={Icon}
      footer={
        <>
          <Button variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant="primary" onClick={onConfirm} autoFocus>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-zinc-400">{message}</p>
    </Modal>
  );
}

/* ------------------------------------------------------------------ toast */

export const TOAST_ICONS = {
  success: Check,
  error: XCircle,
  info: Info,
};

export const TOAST_STYLES = {
  success: 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/30',
  error: 'text-red-400 bg-red-500/10 ring-red-500/30',
  info: 'text-sky-400 bg-sky-500/10 ring-sky-500/30',
};
