// Shared Tailwind class fragments so buttons, inputs, and cards stay
// visually consistent without duplicating long class strings everywhere.

export const cx = (...classes) => classes.filter(Boolean).join(' ');

const btnBase =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-rose-600 dark:focus-visible:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed';

const btnVariants = {
  primary:
    'bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200',
  outline:
    'border border-zinc-300 text-zinc-700 hover:border-zinc-900 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-white dark:hover:text-white',
  secondary:
    'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700',
  ghost:
    'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

const btnSizes = {
  sm: 'px-3.5 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const btn = ({ variant = 'primary', size = 'md', block = false, className = '' } = {}) =>
  cx(btnBase, btnVariants[variant], btnSizes[size], block && 'w-full', className);

export const input =
  'block w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-white dark:focus:ring-white';

export const inputError = 'border-red-400 focus:border-red-500 focus:ring-red-500 dark:border-red-500';

export const label = 'mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300';

export const fieldError = 'mt-1.5 text-xs text-red-600 dark:text-red-400';

export const card =
  'rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900';

export const alert = {
  danger:
    'rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300',
  success:
    'rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300',
};

export const spinner = (className = 'h-5 w-5') =>
  cx(
    className,
    'animate-spin rounded-full border-2 border-current border-t-transparent'
  );

export const kicker = 'text-xs font-semibold uppercase tracking-widest text-rose-700 dark:text-rose-400';
