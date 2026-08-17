const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 px-4 py-8 text-sm text-zinc-500 dark:text-zinc-400 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
        <p>&copy; {currentYear} NewsHub. Stay informed with news from around the world.</p>
        <div className="flex items-center gap-3">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-zinc-900 dark:hover:text-white"
          >
            GitHub
          </a>
          <span className="text-zinc-300 dark:text-zinc-700">|</span>
          <a href="/privacy" className="transition-colors hover:text-zinc-900 dark:hover:text-white">
            Privacy
          </a>
          <span className="text-zinc-300 dark:text-zinc-700">|</span>
          <a href="/terms" className="transition-colors hover:text-zinc-900 dark:hover:text-white">
            Terms
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
