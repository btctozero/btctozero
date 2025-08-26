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

    btcData = { price: currentPrice, ath: ath, progress: progress.toFixed(2) };
    console.log("BTC data updated:", btcData);
  } catch (err) {
    console.error("Errore fetch BTC:", err);
  }
}

updateBTCData();
setInterval(updateBTCData, 60000);

// Endpoint corretto per frontend
app.get('/api/btc', (req, res) => {
  if (btcData) res.json(btcData);
  else res.status(503).json({ error: "Data not ready" });
});

// Serve i file statici
app.use(express.static('public'));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


