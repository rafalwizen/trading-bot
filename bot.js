require('dotenv').config();
const { Spot } = require('@binance/connector');

// Initialize Binance client
const client = new Spot(process.env.API_KEY, process.env.API_SECRET);

// Simulation parameters
let baseAmount = 1000; // Initial balance in USDT
let currentBalance = 1000; // Current balance
let startPrice = 0; // Initial BTC price
let purchasePrice = []; // List of purchase prices
const maxTrades = 20; // Maximum number of trades
const tradePercentage = 1; // Percentage price change (1% for buy and sell)
const tradeAmount = baseAmount * 0.05; // 5% of the initial amount for each trade

// Function to fetch the current BTC price from Binance API
async function getCurrentPrice() {
    try {
        console.log('Fetching current BTC price...');
        const prices = await client.avgPrice('BTCUSDT');
        if (prices && prices?.data?.price) {
            console.log(`Current BTC price: ${prices.data.price}`);
            return parseFloat(prices.data.price);
        } else {
            console.log('Price was not returned correctly, API response:', prices);
            return null;
        }
    } catch (error) {
        console.error('Error while fetching price:', error);
        return null;
    }
}

// Function to execute trading logic
async function trade() {
    const currentPrice = await getCurrentPrice();
    if (!currentPrice) return;

    console.log(`Current BTC/USDT price: ${currentPrice} USDT`);

    // Set the initial start price in the first run
    if (startPrice === 0) {
        startPrice = currentPrice;
        console.log(`Set the start price: ${startPrice} USDT`);
        return;
    }

    // Buy BTC if price dropped by "tradePercentage" % from the last purchase price
    if (purchasePrice.length > 0 && currentPrice <= purchasePrice[purchasePrice.length - 1] * (1 - tradePercentage / 100) && purchasePrice.length < maxTrades) {
        try {
            const quantity = tradeAmount / currentPrice;
            await client.newOrder('BTCUSDT', 'BUY', 'MARKET', { quantity });
            purchasePrice.push(currentPrice); // Add the purchase price to the list
            currentBalance -= tradeAmount; // Deduct the trade amount from the balance
            console.log(
                `Bought BTC for ${tradeAmount} USDT at price ${currentPrice} USDT. Remaining balance: ${currentBalance} USDT`
            );
        } catch (error) {
            console.error('Error while buying BTC:', error.response ? error.response.data : error);
        }
    }

    // Sell BTC if price increased by "tradePercentage" % from the purchase price
    for (let i = purchasePrice.length - 1; i >= 0; i--) {
        if (currentPrice >= purchasePrice[i] * (1 + tradePercentage / 100)) {
            try {
                const quantity = tradeAmount / purchasePrice[i];
                await client.newOrder('BTCUSDT', 'SELL', 'MARKET', { quantity });
                currentBalance += tradeAmount; // Add the profit to the balance
                console.log(
                    `Sold BTC for ${tradeAmount} USDT at price ${currentPrice} USDT. New balance: ${currentBalance} USDT`
                );
                purchasePrice.splice(i, 1); // Remove the transaction from the list
            } catch (error) {
                console.error('Error while selling BTC:', error.response ? error.response.data : error);
            }
        }
    }

    // Update the base amount if balance increased
    if (currentBalance > baseAmount) {
        baseAmount = currentBalance;
        startPrice = currentPrice;
        console.log(
            `Updated base amount: ${baseAmount} USDT. New start price: ${startPrice} USDT`
        );
    }
}

// Run the bot every minute to check the price and execute trades
setInterval(async () => {
    console.log('Checking price...');
    await trade();
}, 60000);
