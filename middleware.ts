import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

const MARKDOWN_ROUTES: Record<string, string> = {
  "/": `# JanSamvaad\n\nJanSamvaad is a crowdsourced civic issue reporting and resolution platform. Citizens can report local civic problems, discover nearby issues, and track progress as officials work toward resolution.\n\n## Resources\n\n- API documentation: /docs\n- OpenAPI specification: /openapi.json\n- Public issues API: /api/issues\n- Agent guidance: /llms.txt\n- Sitemap: /sitemap.xml\n- About: /about\n- Contact: /contact\n- Privacy: /privacy\n`,
  "/docs": `# JanSamvaad Developer Documentation\n\nJanSamvaad provides a public read API for discovering civic issues and an authenticated reporting API for citizens.\n\n- OpenAPI: /openapi.json\n- Public issues: /api/issues\n- Agent guidance: /llms.txt\n`,
};

export async function middleware(request: NextRequest) {
  const accept = request.headers.get("accept") || "";
  const markdown = MARKDOWN_ROUTES[request.nextUrl.pathname];

  if (markdown && accept.includes("text/markdown")) {
    return new NextResponse(markdown, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Vary": "Accept, Accept-Encoding",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  const response = await updateSession(request);
  response.headers.set("Vary", "Accept, Accept-Encoding");
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
