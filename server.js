const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const app = express();
const PORT = 3000;

let btcData = null;

// Aggiorna dati ogni 1 minuto
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

    const progress1d = ((ath - prices[prices.length - 2]) / ath) * 100;
    const progress7d = ((ath - prices[prices.length - 8]) / ath) * 100;
    const progress30d = ((ath - prices[0]) / ath) * 100;

    const change24h = (progress - progress1d).toFixed(2);
    const change7d = (progress - progress7d).toFixed(2);
    const change30d = (progress - progress30d).toFixed(2);

    btcData = { 
      price: currentPrice, 
      ath: ath, 
      progress: progress.toFixed(2),
      change24h: change24h,
      change7d: change7d,
      change30d: change30d
    };

    console.log("BTC data updated:", btcData);

  } catch (err) {
    console.error("Errore fetch BTC:", err);
  }
}

updateBTCData();
setInterval(updateBTCData, 300000);

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

