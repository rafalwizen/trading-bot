const fs = require('fs');

class RSIBot {
    constructor(initialBalance = 1000.0, orderSize = 0.01, rsiPeriod = 14, overbought = 70, oversold = 30) {
        this.usdtBalance = initialBalance; // Initial balance in USDT
        this.btcBalance = 0; // Initial BTC balance
        this.orderSize = orderSize; // Amount of BTC per transaction (e.g. 0.01 BTC)
        this.rsiPeriod = rsiPeriod; // Period for RSI calculation
        this.overbought = overbought; // RSI threshold for overbought condition
        this.oversold = oversold; // RSI threshold for oversold condition
        this.priceHistory = []; // Stores historical prices for RSI calculation
        this.transactions = []; // Transaction history
    }

    loadData(filename) {
        // Loads data from JSON file (historical price data)
        const rawData = fs.readFileSync(filename);
        this.data = JSON.parse(rawData);
    }

    calculateRSI() {
        // Calculates RSI (Relative Strength Index)
        if (this.priceHistory.length < this.rsiPeriod + 1) return null; // Not enough data

        let gains = 0;
        let losses = 0;

        for (let i = 1; i <= this.rsiPeriod; i++) {
            const change = this.priceHistory[this.priceHistory.length - i] - this.priceHistory[this.priceHistory.length - i - 1];
            if (change > 0) gains += change;
            else losses -= change; // Losses are negative, so subtract to get a positive value
        }

        const avgGain = gains / this.rsiPeriod;
        const avgLoss = losses / this.rsiPeriod;

        if (avgLoss === 0) return 100; // RSI is 100 if there are no losses
        const rs = avgGain / avgLoss;
        return 100 - 100 / (1 + rs);
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
        // Executes the RSI-based trading strategy
        for (let candle of this.data) {
            const price = candle.close;
            this.priceHistory.push(price); // Add current price to history

            const rsi = this.calculateRSI();
            if (rsi === null) continue; // Skip until enough data

            // Buy when RSI is below the oversold threshold
            if (rsi < this.oversold && (this.transactions.length === 0 || this.transactions.at(-1).orderType !== "buy")) {
                this.placeOrder(price, "buy");
            }

            // Sell when RSI is above the overbought threshold
            if (rsi > this.overbought && (this.transactions.length === 0 || this.transactions.at(-1).orderType !== "sell")) {
                this.placeOrder(price, "sell");
            }
        }
    }

    saveSimulationResults() {
        // Saves simulation results to rsi_results.json
        const results = {
            transactions: this.transactions
        };

        fs.writeFileSync('rsi_results.json', JSON.stringify(results, null, 2));
        console.log('Simulation results updated in rsi_results.json');
    }
}

// Example usage of the bot
const bot = new RSIBot(1000, 0.01, 14, 70, 30);
bot.loadData('historical_data.json');
bot.executeStrategy();

// Display the final state
console.log(`Final USDT Balance: ${bot.usdtBalance} USDT`);
console.log(`Final BTC Balance: ${bot.btcBalance} BTC`);
