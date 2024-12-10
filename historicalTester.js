const fs = require('fs');

// Read historical data from the file
const historicalData = JSON.parse(fs.readFileSync('historical_data.json', 'utf8'));

// Simulation parameters
let baseAmount = 1000; // Initial balance in USDT
let currentBalance = 1000; // Current balance
let startPrice = 0; // Starting price for BTC
let purchasePrice = []; // List of purchase prices
const maxTrades = 20; // Maximum number of trades
const tradeAmount = baseAmount * 0.05; // 5% of base amount for each trade
const simulationResults = [];

// Simulate trading
for (const dataPoint of historicalData) {
    const currentPrice = dataPoint.close; // Use the 'close' price from historical data

    // Log the current iteration details
    console.log(`\n-> Start price: ${startPrice} USDT`);
    console.log(`Current BTC price: ${currentPrice} USDT`);

    // Set the starting price at the first iteration
    if (startPrice < currentPrice && purchasePrice.length === 0) {
        startPrice = currentPrice;
        console.log(`Starting price set to ${startPrice} USDT`);
        continue;
    }

    // Buy BTC if the price drops 1% from the last purchase price
    if (purchasePrice.length > 0 && currentPrice <= purchasePrice[purchasePrice.length - 1] * 0.99 && purchasePrice.length < maxTrades) {
        purchasePrice.push(currentPrice); // Add purchase price to the list
        currentBalance -= tradeAmount;
        console.log(
            `Bought BTC for ${tradeAmount} USDT at ${currentPrice} USDT. Remaining balance: ${currentBalance} USDT`
        );
    } else if (purchasePrice.length === 0 && currentPrice <= startPrice * 0.99 && purchasePrice.length < maxTrades) {
        // If no purchases yet, buy BTC if the price drops 1% from the starting price
        purchasePrice.push(currentPrice); // Add purchase price to the list
        currentBalance -= tradeAmount;
        console.log(
            `Bought BTC for ${tradeAmount} USDT at ${currentPrice} USDT. Remaining balance: ${currentBalance} USDT`
        );
    }

    // Sell BTC if the price rises 1% from the purchase price
    for (let i = purchasePrice.length - 1; i >= 0; i--) {
        if (currentPrice >= purchasePrice[i] * 1.01) {
            const profit = tradeAmount * 1.01; // Calculate the sale amount with 1% profit
            currentBalance += profit; // Add profit to the balance
            console.log(
                `Sold BTC for ${profit} USDT at ${currentPrice} USDT. New balance: ${currentBalance} USDT`
            );
            purchasePrice.splice(i, 1); // Remove the transaction from the list
        }
    }

    // Update base amount and starting price if balance increases
    if (currentBalance > baseAmount) {
        baseAmount = currentBalance;
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
