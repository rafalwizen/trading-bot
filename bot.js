require('dotenv').config();
const Binance = require('node-binance-api');

const binance = new Binance().options({
    APIKEY: process.env.API_KEY,
    APISECRET: process.env.API_SECRET
});

binance.prices('BTCUSDT', (error, prices) => {
    if (error) {
        console.error('Error fetching prices:', error);
    } else {
        console.log('Current BTC/USDT price:', prices.BTCUSDT);
    }
});
