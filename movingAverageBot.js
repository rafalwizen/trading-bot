const fs = require('fs');

class MovingAverageBot {
    constructor(initialBalance = 1000.0, shortPeriod = 5, longPeriod = 15, orderSize = 0.01) {
        this.usdtBalance = initialBalance; // Initial balance in USDT
        this.btcBalance = 0; // Initial BTC balance
        this.shortPeriod = shortPeriod; // Short moving average period
        this.longPeriod = longPeriod; // Long moving average period
        this.orderSize = orderSize; // Amount of BTC per transaction (e.g. 0.01 BTC)
        this.priceHistory = []; // Stores historical prices for moving averages
        this.transactions = []; // Transaction history
    }

    loadData(filename) {
        // Loads data from JSON file (historical price data)
        const rawData = fs.readFileSync(filename);
        this.data = JSON.parse(rawData);
    }

    calculateMovingAverage(period) {
        // Calculates moving average for a given period
        if (this.priceHistory.length < period) return null; // Not enough data
        const prices = this.priceHistory.slice(-period); // Last 'period' prices
        const sum = prices.reduce((acc, price) => acc + price, 0);
        return sum / period;
    }

    placeOrder(price, orderType) {
        // Simulates placing orders on the market
        if (orderType === "buy") {
            if (this.usdtBalance >= price * this.orderSize) {
                this.usdtBalance -= price * this.orderSize; // Decrease USDT balance
                this.btcBalance += this.orderSize; // Increase BTC balance
                console.log(`Bought ${this.orderSize} BTC at ${price} USDT`);
            } else {
                console.log("Not enough USDT to place buy order.");
                return;
            }
        } else if (orderType === "sell") {
            if (this.btcBalance >= this.orderSize) {
                this.usdtBalance += price * this.orderSize; // Increase USDT balance
                this.btcBalance -= this.orderSize; // Decrease BTC balance
                console.log(`Sold ${this.orderSize} BTC at ${price} USDT`);
            } else {
                console.log("Not enough BTC to place sell order.");
                return;
            }
        }

        this.transactions.push({
            orderType,
            price,
            btcBalance: this.btcBalance,
            usdtBalance: this.usdtBalance,
        });

        // Save current state to file after each transaction
        this.saveSimulationResults();
    }

    executeStrategy() {
        // Executes the Moving Average Crossover strategy
        for (let candle of this.data) {
            const price = candle.close;
            this.priceHistory.push(price); // Add current price to history

            const shortMA = this.calculateMovingAverage(this.shortPeriod);
            const longMA = this.calculateMovingAverage(this.longPeriod);

            if (shortMA === null || longMA === null) continue; // Skip until enough data

            // Buy when short MA crosses above long MA
            if (shortMA > longMA && (this.transactions.length === 0 || this.transactions.at(-1).orderType !== "buy")) {
                this.placeOrder(price, "buy");
            }

            // Sell when short MA crosses below long MA
            if (shortMA < longMA && (this.transactions.length === 0 || this.transactions.at(-1).orderType !== "sell")) {
                this.placeOrder(price, "sell");
            }
        }
    }

    saveSimulationResults() {
        // Saves simulation results to simulation_results.json
        const results = {
            transactions: this.transactions
        };

        fs.writeFileSync('moving_average_results.json', JSON.stringify(results, null, 2));
        console.log('Simulation results updated in moving_average_results.json');
    }
}

// Example usage of the bot
const bot = new MovingAverageBot(1000, 5, 15, 0.01);
bot.loadData('historical_data.json');
bot.executeStrategy();

// Display the final state
console.log(`Final USDT Balance: ${bot.usdtBalance} USDT`);
console.log(`Final BTC Balance: ${bot.btcBalance} BTC`);
