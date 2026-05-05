// Vercel Serverless Function — proxies requests to Anthropic Messages API
// so the API key stays server-side (never shipped to the browser).
// Place this file at /api/claude.js in your Vercel project root.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'Server misconfigured: ANTHROPIC_API_KEY environment variable is not set',
    });
  }
  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05',
      },
      body: JSON.stringify(req.body),
    });
    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch (e) {
    return res.status(500).json({ error: `Proxy error: ${e.message}` });
  }
}
