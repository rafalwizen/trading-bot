const fs = require('fs');

class GridTradingBot {
    constructor(initialBalance = 1000.0, gridSize = 0.5, orderSize = 0.01) {
        this.usdtBalance = initialBalance; // Initial balance in USDT
        this.btcBalance = 0; // Initial BTC balance
        this.gridSize = gridSize / 100; // Price volatility (e.g. 0.5% = 0.005)
        this.orderSize = orderSize; // Amount of BTC per transaction (e.g. 0.01 BTC)
        this.lastPrice = null; // Last transaction price
        this.transactions = []; // Transaction history
    }

    loadData(filename) {
        // Loads data from JSON file (historical price data)
        const rawData = fs.readFileSync(filename);
        this.data = JSON.parse(rawData);
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

    executeGridTrading() {
        // Executes Grid Trading strategy
        for (let candle of this.data) {
            const price = candle.close;
            if (this.lastPrice === null) {
                this.lastPrice = price; // Set the initial price
                continue;
            }

            const priceChange = ((price - this.lastPrice) / this.lastPrice) * 100; // Price change percentage

            // If price increased by more than gridSize, sell
            if (priceChange > this.gridSize) {
                this.placeOrder(price, "sell");
            }
            // If price decreased by more than gridSize, buy
            else if (priceChange < -this.gridSize) {
                this.placeOrder(price, "buy");
            }

            this.lastPrice = price; // Update last price
        }
    }

    saveSimulationResults() {
        // Saves simulation results to simulation_results.json
        const results = {
            transactions: this.transactions
        };

        fs.writeFileSync('simulation_results.json', JSON.stringify(results, null, 2));
        console.log('Simulation results updated in simulation_results.json');
    }
}

// Example usage of the bot
const bot = new GridTradingBot(1000, 0.5, 0.01);
bot.loadData('historical_data.json');
bot.executeGridTrading();

// Display the final state
console.log(`Final USDT Balance: ${bot.usdtBalance} USDT`);
console.log(`Final BTC Balance: ${bot.btcBalance} BTC`);
