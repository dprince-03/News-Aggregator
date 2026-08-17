import { Link } from 'react-router-dom';
import { btn } from '../utils/ui';

const NotFound = () => {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-8xl font-bold text-zinc-200 dark:text-zinc-800">404</p>
      <h2 className="mt-4 font-display text-2xl font-bold">Page Not Found</h2>
      <p className="mt-2 text-zinc-500 dark:text-zinc-400">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
      <Link to="/" className={btn({ size: 'lg', className: 'mt-6' })}>
        Go to Homepage
      </Link>
    </div>
  );
};

export default NotFound;
