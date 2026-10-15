import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Check, Info, TriangleAlert, X, XCircle } from 'lucide-react';

/* ------------------------------------------------------------------ layout */

export function Card({ className = '', children, ...props }) {
  return (
    <div
      className={`rounded-2xl border border-line bg-panel shadow-lg shadow-black/10 ${className}`}
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
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent-text ring-1 ring-accent/25">
            <Icon size={24} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">{title}</h1>
            <p className="mt-0.5 text-sm text-ink-soft">{subtitle}</p>
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
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-panel-2 text-ink-soft ring-1 ring-line">
        <Icon size={26} />
      </div>
      <p className="font-medium text-ink">{title}</p>
      <p className="max-w-sm text-sm text-ink-mute">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </Card>
  );
}

/* --------------------------------------------------------------- sezioni */

export function Section({ icon: Icon, title, subtitle, actions, children }) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent-text ring-1 ring-accent/25">
              <Icon size={19} />
            </div>
          )}
          <div>
            <h2 className="text-base font-semibold text-ink">{title}</h2>
            {subtitle && <p className="text-xs text-ink-mute">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      <div className="mt-4">{children}</div>
    </Card>
  );
}

/* ----------------------------------------------------------------- bottoni */

const BUTTON_VARIANTS = {
  primary:
    'bg-accent text-on-accent hover:bg-accent-strong shadow-lg shadow-accent/25 focus-visible:outline-accent-text',
  outline:
    'border border-line-strong bg-panel-2 text-ink hover:border-ink-faint hover:bg-panel focus-visible:outline-ink-mute',
  ghost: 'text-ink-soft hover:bg-panel-2 hover:text-ink focus-visible:outline-ink-mute',
  danger:
    'border border-accent/30 bg-accent/10 text-accent-text hover:bg-accent/20 focus-visible:outline-accent-text',
};

const BUTTON_SIZES = {
  sm: 'px-3 py-2 text-xs',
  md: 'px-4 py-2.5 text-sm',
};

const BUTTON_BASE =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-panel disabled:pointer-events-none disabled:opacity-40';

export function Button({ variant = 'primary', size = 'md', className = '', type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={`${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`}
      {...props}
    />
  );
}

/** Link con l'aspetto di un Button (evita <a> annidato a <button>). */
export function ButtonLink({ to, variant = 'primary', size = 'md', className = '', children, ...props }) {
  return (
    <Link
      to={to}
      className={`${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`}
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
      className={`${BUTTON_BASE} h-9 w-9 ${BUTTON_VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ campi */

export const inputClass = (error = false) =>
  `w-full min-w-0 max-w-full rounded-xl border bg-panel-2 px-3.5 py-2.5 text-sm text-ink placeholder-ink-faint outline-none transition-colors focus:ring-2 ${
    error
      ? 'border-accent/60 focus:border-accent focus:ring-accent/25'
      : 'border-line-strong focus:border-accent focus:ring-accent/20'
  }`;

export function Field({ label, htmlFor, error, hint, children }) {
  return (
    // min-w-0: senza, un input "largo di suo" (data/ora su Safari) fa
    // traboccare la colonna della griglia e si sovrappone ai campi affiancati.
    <div className="min-w-0">
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink-soft">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-ink-mute">{hint}</p>}
      {error && <p className="mt-1.5 text-xs font-medium text-accent-text">{error}</p>}
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

/* ------------------------------------------------------- controllo segmentato */

export function SegmentedControl({ options, value, onChange, ariaLabel }) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex w-full gap-1 rounded-xl border border-line bg-panel-2 p-1 sm:w-auto"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors duration-150 sm:flex-none ${
              active
                ? 'bg-accent text-on-accent shadow-sm'
                : 'text-ink-soft hover:bg-panel hover:text-ink'
            }`}
          >
            {option.icon && <option.icon size={16} />}
            {option.label}
          </button>
        );
      })}
    </div>
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
        className="anim-pop relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-line bg-panel shadow-2xl shadow-black/50 outline-none sm:max-h-[85vh] sm:max-w-lg sm:rounded-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-line bg-panel px-5 py-4">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent-text ring-1 ring-accent/25">
                <Icon size={18} />
              </div>
            )}
            <h2 className="text-base font-semibold text-ink">{title}</h2>
          </div>
          <IconButton label="Chiudi" variant="ghost" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-line bg-panel-2 px-5 py-4">
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
      <p className="text-sm leading-relaxed text-ink-soft">{message}</p>
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
  success: 'text-ok bg-ok/10 ring-ok/30',
  error: 'text-ko bg-ko/10 ring-ko/30',
  info: 'text-info bg-info/10 ring-info/30',
};
