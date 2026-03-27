const https = require('https');

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } 
    catch (e) { return res.status(400).json({ error: 'Invalid JSON' }); }
  }

  const { messages, context } = body || {};
  const key = process.env.GEMINI_API_KEY;

  if (!key) return res.status(500).json({ error: 'GEMINI_API_KEY not set' });
  if (!messages) return res.status(400).json({ error: 'messages required' });

  const system = `You are AgriPulse AI, a farming assistant for Tamil Nadu farmers. ${context || ''}
Reply in Tamil if asked in Tamil, English otherwise. Max 80 words. Practical advice only.`;

  // 1. Clean the messages (Payload Validation)
  const geminiMessages = messages
    .filter(m => m.content && m.content.trim() !== '')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

  // 2. BUILD THE PAYLOAD (Correct structure for system_instruction)
  const bodyData = JSON.stringify({
    contents: geminiMessages,
    system_instruction: { 
      role: "user", // Some Gemini versions require a role even here
      parts: [{ text: system }] 
    },
    generationConfig: { 
      maxOutputTokens: 500, 
      temperature: 0.7 
    }
  });

  try {
    const result = await new Promise((resolve, reject) => {
      // Use v1 instead of v1beta for better stability
      const path = `/v1/models/gemini-1.5-flash:generateContent?key=${key}`;
      
      const r = https.request({
        hostname: 'generativelanguage.googleapis.com',
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyData)
        }
      }, (response) => {
        let d = '';
        response.on('data', (c) => d += c);
        response.on('end', () => {
          try { resolve({ status: response.statusCode, body: JSON.parse(d) }); }
          catch(e) { reject(new Error('Bad JSON from Gemini')); }
        });
      });
      r.on('error', reject);
      r.write(bodyData);
      r.end();
    });

    if (result.status !== 200) {
      console.error('Gemini Error Details:', JSON.stringify(result.body));
      return res.status(result.status).json({ 
        error: result.body.error?.message || 'Gemini API Error',
        details: result.body 
      });
    }

    const reply = result.body.candidates?.[0]?.content?.parts?.[0]?.text?.trim() 
                  || 'Sorry, I could not generate a response. Please try again.';

    res.json({ reply });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
