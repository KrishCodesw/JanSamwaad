# Deployment Guide

## Vercel

1. Import the GitHub repository into Vercel.
2. Select the intended branch.
3. Add the required environment variables from `.env.local.example`.
4. Set the public Supabase URL and publishable/anon key to the same project used by the database schema.
5. Add `SUPABASE_SERVICE_ROLE_KEY` as a server-only secret.
6. Configure Supabase Auth redirect URLs for the deployed domain.
7. Deploy and review the build logs.
8. Test login, issue submission, nearby search, official status updates, and proof upload.

The repository includes `vercel.json` with a 30-second function duration and permissive API CORS headers. Review whether these values match the production requirements.

## Docker

The Dockerfile uses Node.js 22 and builds a multi-stage image. It copies `.next/standalone` and starts `server.js`.

### Important build requirement

Confirm that `next.config.*` contains:

```js
const nextConfig = {
  output: "standalone",
};

export default nextConfig;
```

Merge this setting with the existing configuration. Do not replace other required settings.

Build the image:

```bash
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT.supabase.co" \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY="YOUR_PUBLIC_KEY" \
  --build-arg NEXT_PUBLIC_BASE_URL="https://YOUR_DOMAIN" \
  -t jansamwaad:local .
```

Run the image:

```bash
docker run --rm -p 3000:3000 \
  -e SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVER_SECRET" \
  jansamwaad:local
```

Provide any other required runtime variables as needed. Never put the service-role key in a Docker build argument or a public variable. Public variables are embedded during the build, so build a separate image for each environment when those values differ.

## Supabase production checklist

- Apply the reviewed schema and migrations.
- Configure Auth providers and redirect URLs.
- Configure Storage buckets and policies.
- Confirm RLS policies and privileged server operations.
- Add valid department and region boundary data.
- Use separate development and production projects.
- Back up important data and test recovery.

## Post-deployment smoke tests

- Home page and issue pages load.
- Login and logout work.
- Anonymous users cannot perform private actions.
- A citizen can submit a valid issue.
- Invalid coordinates and malformed input are rejected.
- Nearby search returns results within the requested radius.
- An official can update status only when authorized.
- Proof uploads use the correct Storage bucket.
- Failed writes return safe error messages.
- Server logs do not expose secrets or personal data.
