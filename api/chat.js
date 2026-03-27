export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { messages, context } = req.body || {};
  if (!messages) return res.status(400).json({ error: 'messages required' });

  const key = process.env.GROK_API_KEY;
  if (!key) return res.status(500).json({ error: 'GROK_API_KEY not set in Vercel environment variables' });

  const system = `You are AgriPulse AI, an expert farming assistant for Tamil Nadu farmers. ${context || ''}
- Answer in Tamil if question is in Tamil, English if in English
- Keep answers under 80 words, concise and practical
- Give specific advice for Tamil Nadu crops and climate
- Be friendly and simple
- Never make up data`;

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'grok-3-mini',
        max_tokens: 300,
        messages: [
          { role: 'system', content: system },
          ...messages
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: data.error?.message || 'xAI API error' });
    }

    const reply = data.choices?.[0]?.message?.content?.trim() || 'Sorry, please try again.';
    res.json({ reply });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
