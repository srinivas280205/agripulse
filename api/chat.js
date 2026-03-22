const https = require('https');

// ── FALLBACK RULES ─────────────────────────────────
const RULES = [
  { keys: ['best crop','which crop','what crop','crop this month','இந்த மாதம்','பயிர்'],
    en: 'For Tamil Nadu this season: Tomato, Onion, and Paddy are excellent choices. Tomato gives high returns in Nov-Feb. Groundnut is ideal for dry regions. Choose based on your soil type and water availability.',
    ta: 'தமிழ்நாட்டில் இந்த மாதம்: தக்காளி, வெங்காயம் மற்றும் நெல் சிறந்த பயிர்கள். தக்காளி நவம்பர்-பிப்ரவரியில் அதிக வருவாய் தரும்.' },
  { keys: ['blight','கருகல்','leaf spot'],
    en: 'To prevent leaf blight: 1) Spray copper oxychloride (3g/litre) every 15 days. 2) Avoid overhead irrigation. 3) Remove infected leaves immediately. 4) Ensure proper plant spacing.',
    ta: 'இலை கருகல் தடுக்க: 1) கோப்பர் ஆக்சிகுளோரைட் (3 கி/லி) 15 நாட்களுக்கு ஒருமுறை. 2) பாதிக்கப்பட்ட இலைகளை உடனே அகற்றவும்.' },
  { keys: ['stem borer','தண்டு துளைப்பான்','borer'],
    en: 'Stem borer: Small holes in stem, wilting shoots. Apply chlorpyrifos 2.5ml/litre at plant base. Use pheromone traps (5/acre). Remove affected plants.',
    ta: 'தண்டு துளைப்பான்: தண்டில் துளைகள், வாடும் தளிர்கள். குளோர்பைரிபாஸ் 2.5 மி.லி/லி தெளிக்கவும். பெரோமோன் பொறி பயன்படுத்தவும்.' },
  { keys: ['irrigat','water','நீர்','பாசன','drip','sprinkler'],
    en: 'Drip irrigation: Water goes directly to roots, saves 50% water, best for vegetables. Sprinkler irrigation: Covers large area, good for field crops like groundnut and maize. For Tamil Nadu: drip is recommended for tomato, onion, banana.',
    ta: 'சொட்டு நீர்ப்பாசனம்: நேரடியாக வேர்களுக்கு நீர், 50% நீர் சேமிப்பு. தெளிப்பு நீர்ப்பாசனம்: பரந்த பகுதியை மூடும். தக்காளி, வெங்காயம், வாழைக்கு சொட்டு நீர் பரிந்துரை.' },
  { keys: ['fertilizer','fertiliser','உரம்','compost','rain','மழை'],
    en: 'After heavy rain: Wait 2-3 days before applying fertilizer. Then apply Urea or DAP in split doses. Avoid nitrogen fertilizer just before rain — it will wash away. Apply potash to strengthen roots.',
    ta: 'கனமழைக்கு பிறகு: 2-3 நாட்கள் கழித்து உரம் இடவும். யூரியா அல்லது DAP தவணைகளாக. மழைக்கு முன் நைட்ரஜன் உரம் தவிர்க்கவும் — கழுவப்படும்.' },
  { keys: ['yellow','மஞ்சள்','turning','leaves','இலைகள்'],
    en: 'Yellowing tomato leaves at bottom: Likely nitrogen deficiency or early blight. Apply urea spray (2%) on leaves. Remove yellowed leaves. Check for overwatering. Apply copper fungicide if brown spots are present.',
    ta: 'தக்காளி இலைகள் மஞ்சளாவது: நைட்ரஜன் குறைபாடு அல்லது ஆரம்ப கருகல். யூரியா தெளிப்பு (2%) இடவும். மஞ்சள் இலைகளை அகற்றவும். அதிக நீர்ப்பாசனம் குறைக்கவும்.' },
  { keys: ['pest','பூச்சி','insect','disease','நோய்'],
    en: 'Integrated pest management: Yellow sticky traps for whiteflies. Neem oil (5ml/litre) for sucking pests. Scout weekly. Chemical spray only when threshold exceeded.',
    ta: 'பூச்சி மேலாண்மை: மஞ்சள் பசை பொறி. வேப்பம் எண்ணெய் (5 மி.லி/லி). வாரம் ஒருமுறை வயல் ஆய்வு.' },
  { keys: ['price','market','mandi','விலை','மண்டி'],
    en: 'For current market prices: Visit agmarknet.gov.in or call your local KVK center. They provide daily price updates for all crops.',
    ta: 'சந்தை விலைகளுக்கு: agmarknet.gov.in பார்க்கவும் அல்லது KVK மையத்தை அழைக்கவும்.' },
  { keys: ['paddy','rice','நெல்'],
    en: 'Paddy: Transplant 25-30 day seedlings. Maintain 5cm water. Urea in 3 splits. TN varieties: ADT 43, CR 1009, BPT 5204.',
    ta: 'நெல்: 25-30 நாள் நாற்றுகள். 5 செ.மீ. நீர். யூரியா 3 தவணை. ரகங்கள்: ADT 43, CR 1009.' },
  { keys: ['tomato','தக்காளி'],
    en: 'Tomato: Raised beds, 60x45cm spacing, irrigate every 3-4 days. Watch for blight, leaf curl. Best season Oct-Feb in TN.',
    ta: 'தக்காளி: 60x45 செ.மீ. இடைவெளி. 3-4 நாட்களுக்கு ஒருமுறை நீர். ஆக்-பிப் சிறந்த மாதங்கள்.' },
  { keys: ['soil','மண்','ph','organic'],
    en: 'Soil health: Test every 2 years. Maintain pH 6.5-7.5. Add organic matter annually. TN soils: red loamy, black cotton, alluvial, laterite.',
    ta: 'மண்: 2 ஆண்டுகளுக்கு ஒருமுறை பரிசோதனை. pH 6.5-7.5. ஆண்டுதோறும் கரிம பொருட்கள்.' },
  { keys: ['joke','funny','story','கதை'],
    en: 'A farmer planted jokes but only reaped laughs! 😄 Here is a real one: Why did the scarecrow win an award? Because he was outstanding in his field! Now, how can I help you with your actual farming questions?',
    ta: 'ஒரு விவசாயி கேட்டார்: "எனது பயிர் ஏன் வளரவில்லை?" விஞ்ஞானி சொன்னார்: "நீங்கள் நம்பிக்கை விதைக்கவில்லை!" 😄 இப்போது உங்கள் வேளாண் கேள்விகளுக்கு உதவட்டுமா?' },
];

function ruleAnswer(question, lang) {
  var q = question.toLowerCase();
  for (var i = 0; i < RULES.length; i++) {
    for (var j = 0; j < RULES[i].keys.length; j++) {
      if (q.indexOf(RULES[i].keys[j]) >= 0) {
        return lang === 'ta' ? RULES[i].ta : RULES[i].en;
      }
    }
  }
  return lang === 'ta'
    ? 'மன்னிக்கவும், இந்த கேள்விக்கு என்னிடம் தகவல் இல்லை. பயிர்கள், நீர்ப்பாசனம், பூச்சிகள், நோய்கள் அல்லது உரங்கள் பற்றி கேளுங்கள்.'
    : 'I am not sure about that. Please ask about crops, irrigation, pests, diseases, fertilizers, or Tamil Nadu farming.';
}

// ── GROQ API ───────────────────────────────────────
function callGroq(key, messages, system) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'llama3-8b-8192',
      max_tokens: 300,
      messages: [{ role: 'system', content: system }, ...messages]
    });
    const req = https.request({
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + key,
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(body);
    req.end();
  });
}

// ── MAIN ───────────────────────────────────────────
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const { messages, context, lang } = req.body || {};
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages required' });
    }

    const lastMessage = messages[messages.length - 1].content || '';
    const key = process.env.GROQ_API_KEY;

    if (key && key.startsWith('gsk_')) {
      try {
        const system = `You are AgriPulse AI, an expert farming assistant for Tamil Nadu, India.
${context ? 'Field context: ' + context : ''}
- Reply in Tamil if question is in Tamil, English if in English
- Keep answers under 80 words, practical and specific to Tamil Nadu
- Be friendly and simple for low-literacy farmers`;

        const result = await callGroq(key, messages, system);
        if (result.choices && result.choices[0] && result.choices[0].message) {
          const reply = result.choices[0].message.content.trim();
          if (reply) return res.json({ reply, source: 'ai' });
        }
      } catch(e) {
        console.log('Groq failed:', e.message);
      }
    }

    // Fallback
    const isTamil = /[\u0B80-\u0BFF]/.test(lastMessage);
    const reply = ruleAnswer(lastMessage, isTamil ? 'ta' : (lang || 'en'));
    res.json({ reply, source: 'rules' });

  } catch(e) {
    res.status(500).json({ reply: 'Sorry, please try again.', source: 'error' });
  }
};
