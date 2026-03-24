const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { messages, context } = req.body || {};
  if (!messages) return res.status(400).json({ error: 'messages required' });

  const system = `You are AgriPulse AI, an expert farming assistant for Tamil Nadu farmers. ${context || ''}
Rules:
- Answer in Tamil if question is in Tamil, English if in English
- Keep answers under 80 words — concise and practical
- Give specific actionable advice for Tamil Nadu crops and climate
- Be friendly and simple — farmers may have low literacy
- Never make up data — say "I don't know" if unsure`;

  const key = process.env.GROK_API_KEY;
  if (!key) return res.status(500).json({ error: 'API key not configured' });

  const payload = JSON.stringify({
    model: 'grok-3-mini',
    max_tokens: 300,
    messages: [
      { role: 'system', content: system },
      ...messages
    ]
  });

  const result = await new Promise((resolve, reject) => {
    const r = https.request({
      hostname: 'api.x.ai',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + key,
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); }
        catch(e) { reject(new Error('Invalid response')); }
      });
    });
    r.on('error', reject);
    r.write(payload);
    r.end();
  });

  const reply = (result.choices?.[0]?.message?.content || '').trim() || 'Sorry, please try again.';
  res.json({ reply });
};
