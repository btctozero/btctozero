const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const app = express();
const PORT = 3000;

let btcData = {
  price: 0,
  ath: 0,
  progress: 0,
  change24h: 0,
  change7d: 0,
  change30d: 0
};

// Funzione per proteggere le variazioni da NaN
const safeValue = (val) => isNaN(val) ? 0 : val;

// Aggiorna dati ogni 5 minuti
async function updateBTCData() {
  try {
    const response = await fetch("https://api.coingecko.com/api/v3/coins/bitcoin");
    console.log("Status API:", response.status);
    const data = await response.json();

    const currentPrice = data.market_data.current_price.usd;
    const ath = data.market_data.ath.usd;
    let progress = ((ath - currentPrice) / ath) * 100;
    if (progress < 0) progress = 0;
    if (progress > 100) progress = 100;

    // Fetch storico 30 giorni per calcolare variazioni
    const historyResp = await fetch("https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=30&interval=daily");
    const historyData = await historyResp.json();
    const prices = historyData.prices.map(p => p[1]);

    // Protezione array vuoti o incompleti
    const lastIndex = prices.length - 1;
    const progress1d = lastIndex >= 1 ? ((ath - prices[lastIndex - 1]) / ath) * 100 : progress;
    const progress7d = lastIndex >= 7 ? ((ath - prices[lastIndex - 7]) / ath) * 100 : progress;
    const progress30d = lastIndex >= 29 ? ((ath - prices[0]) / ath) * 100 : progress;

    const change24h = (progress - progress1d).toFixed(2);
    const change7d = (progress - progress7d).toFixed(2);
    const change30d = (progress - progress30d).toFixed(2);

    btcData = { 
      price: currentPrice, 
      ath: ath, 
      progress: progress.toFixed(2),
      change24h: safeValue(change24h),
      change7d: safeValue(change7d),
      change30d: safeValue(change30d)
    };

    console.log("BTC data updated:", btcData);

  } catch (err) {
    console.error("Errore fetch BTC:", err);
  }
}

updateBTCData();
setInterval(updateBTCData, 30 * 1000); // 30s

// Endpoint per frontend
app.get('/api/btc', (req, res) => {
  if (btcData) res.json(btcData);
  else res.status(503).json({ error: "Data not ready" });
});

// Serve i file statici
app.use(express.static('public'));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

