import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <p className="footer-text">
            &copy; {currentYear} NewsHub. Stay informed with news from around the world.
          </p>
          <div className="footer-links">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="footer-link">
              GitHub
            </a>
            <span className="footer-divider">|</span>
            <a href="/privacy" className="footer-link">
              Privacy
            </a>
            <span className="footer-divider">|</span>
            <a href="/terms" className="footer-link">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
