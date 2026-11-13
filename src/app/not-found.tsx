import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container center" style={{ padding: "80px 16px" }}>
      <h1>Page not found</h1>
      <p className="muted">The page you are looking for doesn&apos;t exist or has been moved.</p>
      <Link href="/" className="btn btn-primary">Go to home page</Link>
    </div>
  );
}
