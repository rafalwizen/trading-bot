require('dotenv').config();
const Binance = require('node-binance-api');

const binance = new Binance().options({
    APIKEY: process.env.API_KEY,
    APISECRET: process.env.API_SECRET
});

let purchasePrice = 0;

function trade() {
    binance.prices('BTCUSDT', (error, prices) => {
        if (error) {
            console.error('Błąd podczas pobierania ceny:', error);
            return;
        }

        const currentPrice = parseFloat(prices.BTCUSDT);
        console.log(`Aktualna cena BTC/USDT: ${currentPrice} USDT`);

        if (purchasePrice === 0) {
            purchasePrice = currentPrice;
            binance.marketBuy('BTCUSDT', 0.001, (error, response) => {
                if (error) {
                    console.error('Błąd podczas kupowania BTC:', error.body);
                } else {
                    console.log(`Kupiono BTC za ${purchasePrice} USDT`);
                }
            });
        } else if (currentPrice >= purchasePrice * 1.01) {
            binance.marketSell('BTCUSDT', 0.001, (error, response) => {
                if (error) {
                    console.error('Błąd podczas sprzedawania BTC:', error.body);
                } else {
                    console.log(`Sprzedano BTC za ${currentPrice} USDT`);
                    purchasePrice = 0; // Reset ceny zakupu
                }
            });
        }
    });
}

setInterval(trade, 6000);
