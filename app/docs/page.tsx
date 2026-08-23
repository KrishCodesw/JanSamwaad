import Link from "next/link";

export const metadata = {
  title: "JanSamvaad API Documentation",
  description: "Developer documentation and machine-readable API information for JanSamvaad.",
};

export default function DocsPage() {
  return (
    <main className="min-h-screen max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold">JanSamvaad Developer Documentation</h1>
      <p className="mt-5 text-lg text-muted-foreground">
        JanSamvaad provides a public read API for discovering civic issues and an authenticated reporting API for citizens. Agents should use the OpenAPI document for machine-readable endpoint discovery and this page for human-readable integration context.
      </p>
      <section className="mt-10 space-y-6">
        <h2 className="text-2xl font-semibold">Public API</h2>
        <p><code>GET /api/issues</code> returns publicly visible civic issues. Optional query parameters include <code>limit</code> and <code>status</code>.</p>
        <p><code>POST /api/issues</code> creates an issue and requires an authenticated session. Required fields are <code>description</code>, <code>latitude</code>, and <code>longitude</code>.</p>
        <h2 className="text-2xl font-semibold">Machine-readable specification</h2>
        <p><a className="underline" href="/openapi.json">OpenAPI 3.0 specification</a></p>
        <h2 className="text-2xl font-semibold">Agent discovery</h2>
        <p><a className="underline" href="/llms.txt">llms.txt</a> describes when agents should use JanSamvaad and where its machine-readable resources live.</p>
        <h2 className="text-2xl font-semibold">Trust and policy</h2>
        <div className="flex gap-4"><Link className="underline" href="/about">About</Link><Link className="underline" href="/contact">Contact</Link><Link className="underline" href="/privacy">Privacy</Link></div>
      </section>
    </main>
  );
}
