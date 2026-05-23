export const runtime = "nodejs";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-sonnet-4-5";

export async function POST(req) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Server is missing ANTHROPIC_API_KEY" },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { system, messages, maxTokens = 600 } = body || {};
  if (typeof system !== "string" || !Array.isArray(messages)) {
    return Response.json(
      { error: "Body must include `system` (string) and `messages` (array)" },
      { status: 400 }
    );
  }

  const upstream = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      max_tokens: maxTokens,
      system,
      messages,
    }),
  });

  if (!upstream.ok) {
    const err = await upstream.json().catch(() => ({}));
    return Response.json(
      { error: err.error?.message || `Anthropic API error ${upstream.status}` },
      { status: upstream.status }
    );
  }

  const data = await upstream.json();
  const text = data.content?.[0]?.text ?? "";
  return Response.json({ text });
}
