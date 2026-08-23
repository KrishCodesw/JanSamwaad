import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        This JanSamvaad resource does not exist. Agents and crawlers can discover available resources through the sitemap, agent guidance, and developer documentation.
      </p>
      <nav className="mt-6 flex gap-4">
        <Link href="/" className="underline">JanSamvaad home</Link>
        <a href="/sitemap.xml" className="underline">Sitemap</a>
        <a href="/llms.txt" className="underline">Agent guidance</a>
        <a href="/docs" className="underline">API docs</a>
      </nav>
    </main>
  );
}
