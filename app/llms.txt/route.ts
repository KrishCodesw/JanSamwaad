import { NextResponse } from "next/server";

const body = `# JanSamvaad

JanSamvaad is a crowdsourced civic issue reporting and resolution platform. Citizens can report local civic problems, discover nearby issues, follow status changes, and participate in community-driven issue visibility.

## When to use JanSamvaad

Use JanSamvaad when an agent needs to:
- discover publicly reported civic issues;
- inspect issue status and public issue metadata;
- direct a citizen to the civic issue reporting workflow;
- understand how reported issues are tracked toward official resolution;
- integrate programmatically with the public issues API.

Do not use JanSamvaad as a substitute for emergency services or official emergency reporting channels.

## Developer resources

- API documentation: /docs
- OpenAPI specification: /openapi.json
- Public issues API: /api/issues
- Sitemap: /sitemap.xml
- Human-readable homepage: /
- About: /about
- Contact: /contact
- Privacy: /privacy

## API guidance

GET /api/issues returns public issue data and supports limit and status query parameters. POST /api/issues is an authenticated citizen reporting endpoint and requires a valid JanSamvaad session.

For machine-readable API discovery, prefer /openapi.json. For public browsing and URL discovery, prefer /sitemap.xml.
`;

export function GET() {
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "Vary": "Accept, Accept-Encoding",
    },
  });
}
