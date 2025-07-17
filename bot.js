const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
require('dotenv').config(); // Načtení proměnných prostředí

const TOKEN = process.env.DISCORD_TOKEN;

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

/**
 * Funkce pro aktualizaci cen kryptoměn a nastavení statusu
 */
async function updateCryptoPrices() {
  try {
    const response = await axios.get(
      'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=BTC,ETH,SOL&convert=USD',
      {
        headers: {
          'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY,
          'Accept': 'application/json'
        }
      }
    );
    const data = response.data.data;

    // Kontrola, jestli API vrací platná data
    if (!data.BTC || !data.ETH || !data.SOL) {
      console.log("API nevrátilo platná data:", data);
      return;
    }

    const btcPrice = Math.round(data.BTC.quote.USD.price);
    const ethPrice = Math.round(data.ETH.quote.USD.price);
    const solPrice = Math.round(data.SOL.quote.USD.price);

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
      console.log('Limit API překročen, čekám 2 minuty...');
      await new Promise(resolve => setTimeout(resolve, 120000));
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
  
  // Aktualizace každých 60 sekund
  setInterval(updateCryptoPrices, 60000);
});

// Spuštění bota
startBot();