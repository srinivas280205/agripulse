const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
    }).on('error', reject);
  });
}

function soil(lat, lon) {
  if (lat > 13.0) return { type: 'Red Loamy Soil', tamil: 'சிவப்பு மண்', ph: '6.0–7.0', crops: 'Groundnut, Millets, Cotton', tip: 'Add organic compost to improve water retention.' };
  if (lat > 12.0 && lon > 79.0) return { type: 'Alluvial Soil', tamil: 'வண்டல் மண்', ph: '6.5–7.5', crops: 'Paddy, Sugarcane, Banana', tip: 'Excellent fertility. Ensure proper drainage.' };
  if (lat > 11.5 && lon < 77.5) return { type: 'Black Cotton Soil', tamil: 'கரிசல் மண்', ph: '7.5–8.5', crops: 'Cotton, Sorghum, Groundnut', tip: 'Very fertile. Avoid over-irrigation.' };
  if (lat > 10.5) return { type: 'Alluvial Soil', tamil: 'வண்டல் மண்', ph: '6.5–7.5', crops: 'Paddy, Banana, Vegetables', tip: 'Rich delta soil. Ideal for paddy.' };
  if (lat > 9.5) return { type: 'Red Sandy Soil', tamil: 'சிவப்பு மணல் மண்', ph: '5.5–6.5', crops: 'Coconut, Cashew, Tapioca', tip: 'Add compost and lime for better yield.' };
  return { type: 'Laterite Soil', tamil: 'லேட்டரைட் மண்', ph: '5.0–6.0', crops: 'Coconut, Rubber, Pepper', tip: 'Apply lime to reduce acidity.' };
}

function kvk(lat, lon) {
  const list = [
    { name: 'KVK Coimbatore', district: 'Coimbatore', lat: 11.017, lon: 76.956, phone: '0422-2441248', email: 'kvkcoimbatore@icar.gov.in' },
    { name: 'KVK Erode', district: 'Erode', lat: 11.341, lon: 77.717, phone: '0424-2225684', email: 'kvkerode@icar.gov.in' },
    { name: 'KVK Salem', district: 'Salem', lat: 11.664, lon: 78.146, phone: '0427-2345123', email: 'kvksalem@icar.gov.in' },
    { name: 'KVK Madurai', district: 'Madurai', lat: 9.925, lon: 78.120, phone: '0452-2380345', email: 'kvkmadurai@icar.gov.in' },
    { name: 'KVK Trichy', district: 'Tiruchirappalli', lat: 10.790, lon: 78.705, phone: '0431-2401234', email: 'kvktrichy@icar.gov.in' },
    { name: 'KVK Thanjavur', district: 'Thanjavur', lat: 10.787, lon: 79.138, phone: '04362-240987', email: 'kvkthanjavur@icar.gov.in' },
    { name: 'KVK Tirunelveli', district: 'Tirunelveli', lat: 8.714, lon: 77.757, phone: '0462-2578901', email: 'kvktirunelveli@icar.gov.in' },
    { name: 'KVK Vellore', district: 'Vellore', lat: 12.917, lon: 79.133, phone: '0416-2245678', email: 'kvkvellore@icar.gov.in' },
    { name: 'KVK Dindigul', district: 'Dindigul', lat: 10.366, lon: 77.970, phone: '0451-2431856', email: 'kvkdindigul@icar.gov.in' },
    { name: 'KVK Krishnagiri', district: 'Krishnagiri', lat: 12.519, lon: 78.213, phone: '04343-276492', email: 'kvkkrishnagiri@icar.gov.in' },
  ];
  return list.map(k => ({ ...k, km: Math.round(Math.sqrt(Math.pow(k.lat - lat, 2) + Math.pow(k.lon - lon, 2)) * 111) }))
    .sort((a, b) => a.km - b.km).slice(0, 3);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'lat and lon required' });
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code,uv_index&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&forecast_days=7&timezone=Asia%2FKolkata`;
    const w = await get(url);
    const c = w.current, d = w.daily || {};
    const forecast = (d.time || []).map((date, i) => ({
      date, max: d.temperature_2m_max[i], min: d.temperature_2m_min[i],
      rain: d.precipitation_sum[i], code: d.weathercode[i]
    }));
    const rainNext3 = forecast.slice(0, 3).reduce((s, x) => s + x.rain, 0);
    res.json({
      weather: { temperature: c.temperature_2m, humidity: c.relative_humidity_2m, precipitation: c.precipitation, wind_speed: c.wind_speed_10m, weather_code: c.weather_code, uv_index: c.uv_index || 0 },
      forecast, rainNext3,
      soil: soil(parseFloat(lat), parseFloat(lon)),
      kvk: kvk(parseFloat(lat), parseFloat(lon)),
      ts: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
