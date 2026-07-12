export default function Footer() {
  const anioActual = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="container-fluid text-center py-3">
        <span>
          © {anioActual} Transparencia360 · Desarrollado por{" "}
          <a
            href="https://portafolio-sm.vercel.app/#home"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            Steven Marin
          </a>
        </span>
      </div>
    </footer>
  );
}