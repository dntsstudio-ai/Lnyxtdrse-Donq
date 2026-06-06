import Footer from "./Footer";
import Navbar from "./Navbar";

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageLayout({ children, className }: PageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className={`flex-1 pt-16 ${className ?? ""}`}>{children}</main>
      <Footer />
    </div>
  );
}
