const fs = require('fs');

// Read historical data from the file
const historicalData = JSON.parse(fs.readFileSync('historical_data.json', 'utf8'));

// Simulation parameters
let baseAmount = 1000; // Initial balance in USDT
let currentBalance = 1000; // Current balance
let startPrice = 0; // Starting price for BTC
let purchasePrice = []; // List of purchase prices
const maxTrades = 2; // Maximum number of trades
let tradeAmount = baseAmount * 0.5; // 5% of base amount for each trade
const tradePercentage = 1; // Set the trading percentage (1% for buying and selling)
const simulationResults = [];

// Simulate trading
for (const dataPoint of historicalData) {
    const currentPrice = dataPoint.close; // Use the 'close' price from historical data

    // Log the current iteration details
    // console.log(`\n-> Start price: ${startPrice} USDT`);
    // console.log(`Current BTC price: ${currentPrice} USDT`);

    // Set the starting price at the first iteration
    if (startPrice < currentPrice && purchasePrice.length === 0) {
        startPrice = currentPrice;
        console.log(`Starting price set to ${startPrice} USDT`);
        continue;
    }

    // Buy BTC if the price drops by tradePercentage% from the last purchase price
    if (purchasePrice.length > 0 && currentPrice <= purchasePrice[purchasePrice.length - 1] * (1 - tradePercentage / 100) && purchasePrice.length < maxTrades) {
        purchasePrice.push(currentPrice); // Add purchase price to the list
        currentBalance -= tradeAmount;
        console.log(
            `Bought BTC for ${tradeAmount} USDT at ${currentPrice} USDT. Remaining balance: ${currentBalance} USDT`
        );
    } else if (purchasePrice.length === 0 && currentPrice <= startPrice * (1 - tradePercentage / 100) && purchasePrice.length < maxTrades) {
        // If no purchases yet, buy BTC if the price drops by tradePercentage% from the starting price
        purchasePrice.push(currentPrice); // Add purchase price to the list
        currentBalance -= tradeAmount;
        console.log(
            `Bought BTC for ${tradeAmount} USDT at ${currentPrice} USDT. Remaining balance: ${currentBalance} USDT`
        );
    }

    // Sell BTC if the price rises by tradePercentage% from the purchase price
    for (let i = purchasePrice.length - 1; i >= 0; i--) {
        if (currentPrice >= purchasePrice[i] * (1 + tradePercentage / 100)) {
            const profit = tradeAmount * (1 + tradePercentage / 100); // Calculate the sale amount with profit
            currentBalance += profit; // Add profit to the balance
            // console.log(
            //     `Sold BTC for ${profit} USDT at ${currentPrice} USDT. New balance: ${currentBalance} USDT`
            // );
            purchasePrice.splice(i, 1); // Remove the transaction from the list
        }
    }

    // Update base amount and starting price if balance increases
    if (currentBalance > baseAmount) {
        baseAmount = currentBalance;
        tradeAmount = baseAmount * 0.5;
        startPrice = currentPrice;
        console.log(
            `Updated base amount to ${baseAmount} USDT. New starting price: ${startPrice} USDT`
        );
    }

    // Save the state to simulation results
    simulationResults.push({
        time: dataPoint.time,
        price: currentPrice,
        balance: currentBalance,
        purchases: [...purchasePrice],
    });
}

// Save simulation results to a file
fs.writeFileSync('simulation_results.json', JSON.stringify(simulationResults, null, 2));
console.log('Simulation results saved to simulation_results.json');
