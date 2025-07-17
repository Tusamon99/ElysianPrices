require('dotenv').config(); // Načtení proměnných prostředí
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

const TOKEN = process.env.DISCORD_TOKEN;

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

/**
 * Funkce pro aktualizaci cen kryptoměn z Binance API a nastavení statusu
 */
async function updateCryptoPrices() {
  try {
    const response = await axios.get('https://api.binance.com/api/v3/ticker/price', {
      params: {
        symbol: 'BTCUSDT,ETHUSDT,SOLUSDT' // Symboly pro BTC, ETH a SOL
      }
    });
    const data = response.data;

    // Kontrola, jestli API vrací platná data
    if (!Array.isArray(data) || data.length !== 3) {
      console.log("API nevrátilo platná data:", data);
      return;
    }

    // Extrahování cen (zaokrouhlení na celá čísla)
    const btcPrice = Math.round(data.find(item => item.symbol === 'BTCUSDT').price);
    const ethPrice = Math.round(data.find(item => item.symbol === 'ETHUSDT').price);
    const solPrice = Math.round(data.find(item => item.symbol === 'SOLUSDT').price);

    // Custom Status
    const status = `$${btcPrice} | $${ethPrice} | $${solPrice}`;
    console.log('Aktualizuji status:', status);

    client.user.setPresence({
      activities: [{ name: status, type: 4 }], // Typ 4 = Custom Status
      status: 'online',
    });

  } catch (error) {
    console.error('Chyba při načítání cen:', error.response?.data || error.message);
    if (error.response && error.response.status === 429) {
      console.log('Limit API překročen, čekám 1 minutu...');
      await new Promise(resolve => setTimeout(resolve, 60000));
    }
  }
}

/**
 * Funkce pro spuštění bota s automatickým restartem
 */
async function startBot() {
  try {
    console.log("Přihlašuji bota...");
    await client.login(TOKEN);
  } catch (error) {
    console.error("Bot se zhroutil:", error.message);
    console.log("Restartuji bota za 5 sekund...");
    setTimeout(startBot, 5000); // Restart za 5 sekund
  }
}

// Event - Bot je připraven
client.once('ready', () => {
  console.log('Bot je připraven!');

  // Okamžitá aktualizace statusu
  updateCryptoPrices();
  
  // Aktualizace každých 60 sekund (1 minuta)
  setInterval(updateCryptoPrices, 60000);
});

// Spuštění bota
startBot();