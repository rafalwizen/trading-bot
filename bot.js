require('dotenv').config();
const { Spot } = require('@binance/connector');

const client = new Spot(process.env.API_KEY, process.env.API_SECRET);

let baseAmount = 1000;
let currentBalance = 1000;
let startPrice = 0;
let purchasePrice = [];
const maxTrades = 20;

async function getCurrentPrice() {
    try {
        console.log('Pobieram cenę BTC...');
        const prices = await client.avgPrice('BTCUSDT');
        if (prices && prices?.data?.price) {
            console.log(`Aktualna cena BTC: ${prices.data.price}`);
            return parseFloat(prices.price);
        } else {
            console.log('Cena nie została zwrócona prawidłowo, odpowiedź z API:', prices);
            return null;
        }
    } catch (error) {
        console.error('Błąd podczas pobierania ceny:', error);
        return null;
    }
}

async function trade() {
    const currentPrice = await getCurrentPrice();
    if (!currentPrice) return;

    console.log(`Aktualna cena BTC/USDT: ${currentPrice} USDT`);

    if (startPrice === 0) {
        startPrice = currentPrice;
        console.log(`Ustawiono cenę startową: ${startPrice} USDT`);
        return;
    }

    const tradeAmount = baseAmount * 0.05;

    if (currentPrice <= startPrice * 0.99 && purchasePrice.length < maxTrades) {
        try {
            const quantity = tradeAmount / currentPrice;
            await client.newOrder('BTCUSDT', 'BUY', 'MARKET', { quantity });
            purchasePrice.push(currentPrice);
            currentBalance -= tradeAmount;
            console.log(
                `Kupiono BTC za ${tradeAmount} USDT po cenie ${currentPrice} USDT. Pozostały balans: ${currentBalance} USDT`
            );
        } catch (error) {
            console.error('Błąd podczas kupowania BTC:', error.response ? error.response.data : error);
        }
    }

    for (let i = purchasePrice.length - 1; i >= 0; i--) {
        if (currentPrice >= purchasePrice[i] * 1.01) {
            try {
                const quantity = tradeAmount / purchasePrice[i];
                await client.newOrder('BTCUSDT', 'SELL', 'MARKET', { quantity });
                currentBalance += tradeAmount;
                console.log(
                    `Sprzedano BTC za ${tradeAmount} USDT po cenie ${currentPrice} USDT. Nowy balans: ${currentBalance} USDT`
                );
                purchasePrice.splice(i, 1); // Usuwamy transakcję z listy
            } catch (error) {
                console.error('Błąd podczas sprzedawania BTC:', error.response ? error.response.data : error);
            }
        }
    }

    if (currentBalance > baseAmount) {
        baseAmount = currentBalance;
        startPrice = currentPrice;
        console.log(
            `Zaktualizowano bazową kwotę: ${baseAmount} USDT. Nowa cena startowa: ${startPrice} USDT`
        );
    }
}

setInterval(async () => {
    console.log('Sprawdzam cenę...');
    await trade();
}, 60000);
