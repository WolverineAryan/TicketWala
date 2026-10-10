import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function NotFound() {
  return (
    <div className="public-page">
      <Navbar />
      <main className="public-empty-state">
        <p className="public-eyebrow">404</p>
        <h1>That page missed its event.</h1>
        <p>The requested page could not be located.</p>
        <Link href="/" className="public-submit">Return home</Link>
      </main>
    </div>
  );
}
