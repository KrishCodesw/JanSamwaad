import { notFound } from "next/navigation";
import Image from "next/image";

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) notFound();

  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const res = await fetch(`${base}/api/issues/${id}`);

    if (!res.ok) {
      console.error(`API call failed: ${res.status} ${res.statusText}`);
      notFound();
    }

    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error("API returned non-JSON response:", contentType);
      notFound();
    }

    const data = await res.json();
    if (!data.issue) notFound();

    return (
      <main className="max-w-3xl mx-auto p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Issue #{id}</h1>
        <div className="text-sm space-y-2">
          <div>Status: {data.issue.status}</div>
          <div>Description: {data.issue.description}</div>
          <div>Tags: {(data.issue.tags || []).join(", ")}</div>
          <div className="grid gap-2">
            {(data.images || []).length ? (
              (data.images as { id: number; url: string }[]).map((img) => (
                <Image
                  key={img.id}
                  src={img.url}
                  alt="Issue image"
                  width={800}
                  height={600}
                  className="rounded border"
                />
              ))
            ) : (
              <em>No images</em>
            )}
          </div>
          <UpvoteButton id={id} />
        </div>
      </main>
    );
  } catch (error) {
    console.error("Error fetching issue:", error);
    notFound();
  }
}

function UpvoteButton({ id }: { id: number }) {
  return <ClientUpvote id={id} />;
}

// Client component wrapper
import ClientUpvote from "@/components/upvote-button";
