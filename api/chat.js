const https = require('https');

// ── FALLBACK: Rule-based answers when no API key ─────
const RULES = [
  { keys: ['best crop','which crop','what crop','crop this month','இந்த மாதம்','பயிர்'], 
    en: 'For Tamil Nadu this season: Tomato, Onion, and Paddy are excellent choices. Tomato gives high returns in Nov-Feb. Groundnut is ideal for dry regions. Choose based on your soil type and water availability.',
    ta: 'தமிழ்நாட்டில் இந்த மாதம்: தக்காளி, வெங்காயம் மற்றும் நெல் சிறந்த பயிர்கள். தக்காளி நவம்பர்-பிப்ரவரியில் அதிக வருவாய் தரும். உங்கள் மண் வகை மற்றும் நீர் கிடைக்கும் அளவை பொறுத்து தேர்வு செய்யுங்கள்.' },
  { keys: ['blight','கருகல்','leaf spot','இலை'],
    en: 'To prevent leaf blight: 1) Spray copper oxychloride (3g/litre) every 15 days. 2) Avoid overhead irrigation. 3) Remove infected leaves immediately. 4) Ensure proper plant spacing for air circulation.',
    ta: 'இலை கருகல் தடுக்க: 1) கோப்பர் ஆக்சிகுளோரைட் (3 கிராம்/லிட்டர்) 15 நாட்களுக்கு ஒருமுறை தெளிக்கவும். 2) தலைக்கு நீர் பாய்ச்சுவதை தவிர்க்கவும். 3) பாதிக்கப்பட்ட இலைகளை உடனே அகற்றவும்.' },
  { keys: ['stem borer','தண்டு துளைப்பான்','borer','boring'],
    en: 'Stem borer signs: Small holes in stem, fine powder (frass) at entry point, wilting shoots. Control: Apply chlorpyrifos 2.5ml/litre at base of plant. Use pheromone traps (5/acre). Remove and burn affected plants.',
    ta: 'தண்டு துளைப்பான் அறிகுறிகள்: தண்டில் சிறு துளைகள், நுழைவு புள்ளியில் மெல்லிய தூள், வாடும் தளிர்கள். கட்டுப்பாடு: குளோர்பைரிபாஸ் 2.5 மி.லி/லிட்டர் தாவரத்தின் அடியில் தெளிக்கவும்.' },
  { keys: ['irrigat','water','நீர்','பாசன'],
    en: 'Irrigation guide: Paddy needs 2-3cm standing water. Tomato needs irrigation every 3-4 days. Groundnut needs water at flowering and pod development stages. Always irrigate in evening to reduce evaporation.',
    ta: 'நீர்ப்பாசன வழிகாட்டி: நெல்லுக்கு 2-3 செ.மீ. நிலை நீர் தேவை. தக்காளிக்கு 3-4 நாட்களுக்கு ஒருமுறை பாசனம். வேர்க்கடலைக்கு பூக்கும் மற்றும் காய் வளரும் நிலையில் நீர் தேவை.' },
  { keys: ['fertilizer','fertiliser','உரம்','compost','கம்போஸ்ட்'],
    en: 'Fertilizer advice for Tamil Nadu: Apply FYM 10 tonnes/acre before planting. For paddy: NPK 80:40:40 kg/acre split in 3 doses. For vegetables: 6:6:6 NPK ratio. Always do soil test first for accurate dosage.',
    ta: 'தமிழ்நாட்டில் உர ஆலோசனை: நடவுக்கு முன் 10 டன்/ஏக்கர் தொழு உரம் இடவும். நெல்லுக்கு: NPK 80:40:40 கி/ஏக்கர் 3 தவணைகளாக. காய்கறிகளுக்கு: NPK 6:6:6 விகிதம்.' },
  { keys: ['pest','பூச்சி','insect','disease','நோய்'],
    en: 'Integrated Pest Management: 1) Use yellow sticky traps for whiteflies. 2) Neem oil spray (5ml/litre) for sucking pests. 3) Trichogramma cards for bollworm. 4) Scout field weekly. 5) Chemical spray only when pest count exceeds threshold.',
    ta: 'ஒருங்கிணைந்த பூச்சி மேலாண்மை: 1) வெள்ளை ஈக்களுக்கு மஞ்சள் பசை பொறி. 2) வெள்ளுணி பூச்சிகளுக்கு வேப்பம் எண்ணெய் (5 மி.லி/லிட்டர்). 3) வாரம் ஒருமுறை வயலை ஆய்வு செய்யுங்கள்.' },
  { keys: ['weather','rain','வானிலை','மழை','temperature','வெப்ப'],
    en: 'I can see your live weather on the map! Click your field to get real-time temperature, humidity, rainfall and 7-day forecast. For general advice: irrigate in evenings, avoid spraying before rain, protect crops during extreme heat above 40°C.',
    ta: 'வரைபடத்தில் உங்கள் நேரடி வானிலை காணலாம்! வெப்பநிலை, ஈரப்பதம், மழை மற்றும் 7-நாள் முன்னறிவிப்பு பெற உங்கள் வயலை கிளிக் செய்யுங்கள். பொது ஆலோசனை: மாலையில் நீர் பாய்ச்சவும், மழைக்கு முன் தெளிப்பை தவிர்க்கவும்.' },
  { keys: ['soil','மண்','pH','organic'],
    en: 'Soil health tips: 1) Test soil every 2 years. 2) Maintain pH 6.5-7.5 for most crops. 3) Add organic matter (compost/FYM) annually. 4) Practice crop rotation. Tamil Nadu has red loamy, black cotton, alluvial and laterite soils — each suits different crops.',
    ta: 'மண் ஆரோக்கிய குறிப்புகள்: 1) 2 ஆண்டுகளுக்கு ஒருமுறை மண் பரிசோதனை செய்யுங்கள். 2) பெரும்பாலான பயிர்களுக்கு pH 6.5-7.5 பராமரிக்கவும். 3) ஆண்டுதோறும் கரிம பொருட்கள் சேர்க்கவும். 4) பயிர் சுழற்சி பின்பற்றுங்கள்.' },
  { keys: ['price','market','mandi','விலை','மண்டி','sell','விற்'],
    en: 'For current market prices: Visit agmarknet.gov.in or your nearest mandi. Call your local KVK center — they provide daily price information. Also check the e-NAM portal for transparent price discovery. Sell when demand is high (festival seasons, export demand).',
    ta: 'தற்போதைய சந்தை விலைகளுக்கு: agmarknet.gov.in பார்வையிடுங்கள் அல்லது அருகிலுள்ள மண்டிக்கு செல்லுங்கள். உங்கள் KVK மையத்தை அழைக்கவும் — அவர்கள் தினசரி விலை தகவல் வழங்குகிறார்கள்.' },
  { keys: ['kvk','agricultural','வேளாண்','expert','நிபுணர்'],
    en: 'KVK (Krishi Vigyan Kendra) services: Free soil testing, crop demonstrations, expert consultations, training programs, seed distribution, and weather advisories. Visit your nearest KVK — check the Soil & KVK tab in AgriPulse for locations and phone numbers.',
    ta: 'KVK (கிருஷி விஞ்ஞான் கேந்திரம்) சேவைகள்: இலவச மண் பரிசோதனை, பயிர் நிரூபணம், நிபுணர் ஆலோசனை, பயிற்சி திட்டங்கள், விதை விநியோகம். AgriPulse இல் மண் & KVK தாவலில் இடம் மற்றும் தொலைபேசி எண்களை பாருங்கள்.' },
  { keys: ['paddy','rice','நெல்','ஆரி'],
    en: 'Paddy cultivation tips: Transplant at 25-30 days old seedlings. Maintain 5cm water depth. Apply Urea in 3 splits (basal, tillering, panicle). Common pests: stem borer, BPH, blast disease. KVK recommended varieties for TN: ADT 43, CR 1009, BPT 5204.',
    ta: 'நெல் சாகுபடி குறிப்புகள்: 25-30 நாள் வயதான நாற்றுகளை நடவு செய்யவும். 5 செ.மீ. நீர் ஆழம் பராமரிக்கவும். யூரியாவை 3 தவணைகளாக இடவும். பரிந்துரைக்கப்பட்ட ரகங்கள்: ADT 43, CR 1009, BPT 5204.' },
  { keys: ['tomato','தக்காளி'],
    en: 'Tomato cultivation: Plant in raised beds. Spacing 60x45cm. Stake plants at 30cm height. Irrigate every 3-4 days. Watch for early blight, leaf curl virus, fruit borer. Apply calcium to prevent blossom end rot. Best season: Oct-Feb in TN.',
    ta: 'தக்காளி சாகுபடி: உயர்த்திய பாத்திகளில் நடவு. 60x45 செ.மீ. இடைவெளி. 30 செ.மீ. உயரத்தில் தடி கட்டவும். 3-4 நாட்களுக்கு ஒருமுறை நீர் பாய்ச்சவும். ஆரம்ப கருகல், இலை சுருட்டல் வைரஸை கவனியுங்கள்.' },
];

function ruleAnswer(question, lang) {
  var q = question.toLowerCase();
  for (var i = 0; i < RULES.length; i++) {
    var rule = RULES[i];
    for (var j = 0; j < rule.keys.length; j++) {
      if (q.indexOf(rule.keys[j]) >= 0) {
        return lang === 'ta' ? rule.ta : rule.en;
      }
    }
  }
  return lang === 'ta'
    ? 'மன்னிக்கவும், உங்கள் கேள்விக்கு தற்போது பதில் இல்லை. உங்கள் அருகிலுள்ள KVK மையத்தை தொடர்பு கொள்ளுங்கள் அல்லது வேறு வழியில் கேளுங்கள்.'
    : 'I am not sure about that. Please contact your nearest KVK center or rephrase your question. You can ask about crops, irrigation, pests, diseases, fertilizers, or weather.';
}

// ── CALL CLAUDE API ────────────────────────────────
function callClaude(key, messages, system) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: system,
      messages: messages
    });
    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); }
        catch(e) { reject(new Error('Parse error: ' + d.substring(0, 200))); }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(body);
    req.end();
  });
}

// ── MAIN HANDLER ──────────────────────────────────
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  try {
    const { messages, context, lang } = req.body || {};
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array required' });
    }

    const lastMessage = messages[messages.length - 1].content || '';
    const key = process.env.ANTHROPIC_API_KEY;

    // Try Claude API if key exists
    if (key && key.startsWith('sk-')) {
      try {
        const system = `You are AgriPulse AI, an expert farming assistant for Tamil Nadu, India.
${context ? 'Current field context: ' + context : ''}
Rules:
- If question is in Tamil script, reply entirely in Tamil
- If question is in English, reply in English
- Keep answers under 80 words — be concise and practical
- Give specific advice for Tamil Nadu crops and climate
- Be friendly — farmers may have low literacy
- Never invent prices or statistics`;

        const result = await callClaude(key, messages, system);

        if (result.content && result.content.length > 0) {
          const reply = result.content.map(c => c.text || '').join('').trim();
          if (reply) return res.json({ reply, source: 'ai' });
        }
        // API returned error — fall through to rules
        console.log('Claude API error:', JSON.stringify(result));
      } catch(e) {
        console.log('Claude call failed:', e.message);
        // Fall through to rules-based answer
      }
    }

    // Fallback: rules-based answer
    const detectedLang = /[\u0B80-\u0BFF]/.test(lastMessage) ? 'ta' : (lang || 'en');
    const reply = ruleAnswer(lastMessage, detectedLang);
    res.json({ reply, source: 'rules' });

  } catch(e) {
    console.error('Chat handler error:', e);
    res.status(500).json({ 
      reply: 'Sorry, please try again. If the problem continues, contact your nearest KVK center.',
      error: e.message 
    });
  }
};
