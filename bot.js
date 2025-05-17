const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

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
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd'
    );
    const data = response.data;

    // Kontrola, jestli API vrací platná data
    if (!data.bitcoin || !data.ethereum || !data.solana) {
      console.log("API nevrátilo platná data:", data);
      return;
    }

    const btcPrice = Math.round(data.bitcoin.usd);
    const ethPrice = Math.round(data.ethereum.usd);
    const solPrice = Math.round(data.solana.usd);

    // Custom Status
    const status = `$${btcPrice} | $${ethPrice} | $${solPrice}`;
    console.log('Aktualizuji status:', status);

    client.user.setPresence({
      activities: [{ name: status, type: 4 }], // Typ 4 = Custom Status
      status: 'online',
    });

  } catch (error) {
    console.error('Chyba při načítání cen:', error.message);
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
