const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

const TOKEN = process.env.DISCORD_TOKEN; // Načtení tokenu z Railway Variables

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

async function updateCryptoPrices() {
    try {
        const response = await axios.get(
            'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd'
        );
        const data = response.data;

        const btcPrice = Math.round(data.bitcoin.usd);
        const ethPrice = Math.round(data.ethereum.usd);
        const solPrice = Math.round(data.solana.usd);

        // Nastavení Custom Statusu
        const status = `$${btcPrice} | $${ethPrice} | $${solPrice}`;
        console.log('Aktualizuji status:', status);

        client.user.setPresence({
            activities: [{ name: status, type: 4 }], // Typ 4 = Custom Status
            status: 'online',
        });

    } catch (error) {
        console.error('Chyba při načítání cen:', error);
    }
}

client.once('ready', () => {
    console.log('Bot je připraven!');
    updateCryptoPrices();
    setInterval(updateCryptoPrices, 60000);
});

// 🔹 Přihlášení bota až na konec!
client.login(TOKEN);
