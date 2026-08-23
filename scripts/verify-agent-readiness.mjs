import assert from "node:assert/strict";

const base = process.env.AGENT_TEST_BASE_URL || "https://jansamwaad.vercel.app";

async function get(path, headers = {}) {
  return fetch(`${base}${path}`, { redirect: "manual", headers });
}

const notFound = await get(`/__agent-test-nonexistent-${Date.now()}`);
assert.equal(notFound.status, 404, `Expected 404, got ${notFound.status}`);

const html = await get("/");
assert.equal(html.status, 200);
const htmlText = await html.text();
assert.match(htmlText, /<h1[^>]*>[^<]+<\/h1>/i);
assert.ok(htmlText.replace(/<[^>]+>/g, " ").trim().length >= 500, "Homepage raw HTML should contain at least 500 characters");

const markdown = await get("/", { Accept: "text/markdown" });
assert.equal(markdown.status, 200);
assert.match(markdown.headers.get("content-type") || "", /text\/markdown/i);
assert.match(markdown.headers.get("vary") || "", /Accept/i);
assert.match(await markdown.text(), /^# JanSamvaad/m);

const openapi = await get("/openapi.json");
assert.equal(openapi.status, 200);
assert.match(openapi.headers.get("content-type") || "", /application\/json/i);
const spec = await openapi.json();
assert.equal(spec.openapi, "3.0.3");
assert.ok(spec.paths?.["/api/issues"]);

const api404 = await get(`/api/__agent-test-nonexistent-${Date.now()}`);
assert.equal(api404.status, 404);
assert.match(api404.headers.get("content-type") || "", /application\/json/i);
const apiError = await api404.json();
assert.equal(apiError.error.code, "API_NOT_FOUND");

for (const path of ["/llms.txt", "/sitemap.xml", "/about", "/contact", "/privacy", "/docs"]) {
  const response = await get(path);
  assert.equal(response.status, 200, `${path} should return 200`);
}

const homepage = htmlText;
assert.match(homepage, /Organization/);
assert.match(homepage, /Developer.*Agent Resources/i);

console.log(`Agent readiness checks passed for ${base}`);
