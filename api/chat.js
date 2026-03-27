const https = require('https');

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { messages, context } = req.body || {};
  if (!messages) return res.status(400).json({ error: 'messages required' });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: 'GEMINI_API_KEY not set' });

  const system = `You are AgriPulse AI, a farming assistant for Tamil Nadu farmers. ${context || ''}
Reply in Tamil if asked in Tamil, English otherwise. Max 80 words. Practical advice only.`;

  const geminiMessages = messages.map(function(m) {
    return {
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    };
  });

  const bodyData = JSON.stringify({
    system_instruction: { parts: [{ text: system }] },
    contents: geminiMessages,
    generationConfig: { maxOutputTokens: 300, temperature: 0.7 }
  });

  try {
    const result = await new Promise(function(resolve, reject) {
      const path = '/v1beta/models/gemini-1.5-flash:generateContent?key=' + key;
      const r = https.request({
        hostname: 'generativelanguage.googleapis.com',
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyData)
        }
      }, function(response) {
        let d = '';
        response.on('data', function(c) { d += c; });
        response.on('end', function() {
          try { resolve({ status: response.statusCode, body: JSON.parse(d) }); }
          catch(e) { reject(new Error('Bad JSON: ' + d.slice(0, 200))); }
        });
      });
      r.on('error', reject);
      r.write(bodyData);
      r.end();
    });

    // Return full Gemini response for debugging
    if (result.status !== 200) {
      return res.status(500).json({ 
        error: result.body.error ? result.body.error.message : 'Gemini error',
        gemini_status: result.status,
        gemini_full: result.body
      });
    }

    const reply = result.body.candidates &&
                  result.body.candidates[0] &&
                  result.body.candidates[0].content &&
                  result.body.candidates[0].content.parts &&
                  result.body.candidates[0].content.parts[0].text
                  ? result.body.candidates[0].content.parts[0].text.trim()
                  : 'Sorry, please try again.';

    res.json({ reply: reply });

  } catch(err) {
    res.status(500).json({ error: err.message });
  }
};
