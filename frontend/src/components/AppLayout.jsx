import Footer from "./Footer";

export default function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <main className="app-content">
        {children}
      </main>

      <Footer />
    </div>
  );
}