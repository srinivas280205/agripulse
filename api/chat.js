const https = require('https');

module.exports = async function(req, res) {
  // 1. Setup CORS and Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  // 2. Handle Body Parsing (Vercel Node.js helper)
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
  }

  const { messages, context } = body || {};
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  // 3. Check Environment Variable
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error('ERROR: GEMINI_API_KEY is not defined in Vercel Environment Variables.');
    return res.status(500).json({ error: 'Server configuration error (API Key missing)' });
  }

  // 4. Prepare Gemini Prompt & Messages
  const systemInstruction = `You are AgriPulse AI, a farming assistant for Tamil Nadu farmers. ${context || ''}
Reply in Tamil if asked in Tamil, English otherwise. Max 80 words. Practical advice only.`;

  // Filter out empty messages and map to Gemini format
  const geminiMessages = messages
    .filter(m => m.content && m.content.trim() !== '')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

  const bodyData = JSON.stringify({
    contents: geminiMessages,
    system_instruction: { 
      parts: [{ text: systemInstruction }] 
    },
    generationConfig: { 
      maxOutputTokens: 300, 
      temperature: 0.7 
    }
  });

  // 5. Execute Request to Google Gemini API (v1 stable)
  try {
    const result = await new Promise((resolve, reject) => {
      // Using v1 stable endpoint
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
        response.on('data', (c) => { d += c; });
        response.on('end', () => {
          try { 
            resolve({ status: response.statusCode, body: JSON.parse(d) }); 
          } catch(e) { 
            reject(new Error('Failed to parse Gemini response: ' + d.slice(0, 100))); 
          }
        });
      });

      r.on('error', (err) => reject(err));
      r.write(bodyData);
      r.end();
    });

    // 6. Handle Gemini API Errors
    if (result.status !== 200) {
      console.error('Gemini API Error:', result.body);
      return res.status(result.status).json({ 
        error: result.body.error ? result.body.error.message : 'Gemini API Error',
        details: result.body
      });
    }

    // 7. Extract and Return Reply
    const reply = result.body.candidates?.[0]?.content?.parts?.[0]?.text?.trim() 
                  || 'Sorry, I could not generate a response. Please try again.';

    return res.status(200).json({ reply: reply });

  } catch (err) {
    console.error('Internal Server Error:', err.message);
    return res.status(500).json({ error: 'Internal Server Error: ' + err.message });
  }
};
