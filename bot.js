require('dotenv').config({ override: true });
let DISCORD_TOKEN = process.env.DISCORD_TOKEN;

// Ošetření případné předpony z .env nebo špatného nastavení
if (DISCORD_TOKEN && DISCORD_TOKEN.includes('=')) {
  DISCORD_TOKEN = DISCORD_TOKEN.split('=')[1];
  console.log('Opravený DISCORD_TOKEN po odstranění předpony:', DISCORD_TOKEN);
}
console.log('Načtený DISCORD_TOKEN:', DISCORD_TOKEN);
console.log('Délka tokenu:', DISCORD_TOKEN?.length);
console.log('Celé prostředí:', JSON.stringify(process.env, null, 2));

if (!DISCORD_TOKEN) {
  console.error('Chyba: DISCORD_TOKEN není definován.');
  process.exit(1);
}

const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

/**
 * Funkce pro aktualizaci cen kryptoměn z Binance API a nastavení statusu
 */
async function updateCryptoPrices() {
  try {
    console.log('Počáteční pokus o aktualizaci cen...');
    const [btcResponse, ethResponse, solResponse] = await Promise.all([
      axios.get('https://api.binance.com/api/v3/ticker/price', { params: { symbol: 'BTCUSDT' } }),
      axios.get('https://api.binance.com/api/v3/ticker/price', { params: { symbol: 'ETHUSDT' } }),
      axios.get('https://api.binance.com/api/v3/ticker/price', { params: { symbol: 'SOLUSDT' } }),
    ]);

    const btcPrice = Math.round(btcResponse.data.price);
    const ethPrice = Math.round(ethResponse.data.price);
    const solPrice = Math.round(solResponse.data.price);

    const status = `$${btcPrice} | $${ethPrice} | $${solPrice}`;
    console.log('Aktualizuji status:', status);

    client.user.setPresence({
      activities: [{ name: status, type: 4 }],
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
    await client.login(DISCORD_TOKEN);
  } catch (error) {
    console.error("Bot se zhroutil:", error.message);
    console.log("Restartuji bota za 5 sekund...");
    setTimeout(startBot, 5000);
  }
}

// Event - Bot je připraven
client.once('ready', () => {
  console.log('Bot je připraven!');
  updateCryptoPrices();
  setInterval(updateCryptoPrices, 60000);
});

// Přidáno pro vynucení nového deployu
startBot();