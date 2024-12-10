require('dotenv').config();
const fs = require('fs');
const { Spot } = require('@binance/connector');

// Create an instance of the Binance client
const client = new Spot(process.env.API_KEY, process.env.API_SECRET);

// Function to fetch historical data
async function fetchHistoricalData(symbol, interval, startTime, endTime, outputFile) {
    try {
        let allData = [];
        let lastEndTime = startTime;

        console.log(`Starting to fetch data for ${symbol}...`);

        // Fetching data in a loop
        while (true) {
            console.log(`Fetching data starting from ${new Date(lastEndTime).toISOString()}...`);

            const response = await client.klines(symbol, interval, {
                startTime: lastEndTime,
                endTime,
                limit: 1000, // Maximum number of candles in one request
            });

            // If no results are returned, exit the loop
            if (!response || response.data.length === 0) break;

            // Process the candle data
            const processedData = response.data.map(candle => ({
                time: candle[0], // Opening time of the candle
                open: parseFloat(candle[1]),
                high: parseFloat(candle[2]),
                low: parseFloat(candle[3]),
                close: parseFloat(candle[4]),
                volume: parseFloat(candle[5]),
            }));

            allData = allData.concat(processedData);

            // Update the last candle's time
            lastEndTime = response.data[response.data.length - 1][0] + 1;

            // If the last range of data exceeds the end time, exit the loop
            if (lastEndTime >= endTime) break;
        }

        // Save the data to a file
        fs.writeFileSync(outputFile, JSON.stringify(allData, null, 2));
        console.log(`Historical data for ${symbol} has been saved to ${outputFile}`);
    } catch (error) {
        console.error('Error while fetching data:', error.response ? error.response.data : error);
    }
}

// Parameters for fetching data
const symbol = 'BTCUSDT'; // Trading pair
const interval = '1m'; // Candle interval (e.g., '1m', '5m', '1h', '1d')
const startTime = new Date('2023-01-01').getTime(); // Start date (in ms)
const endTime = new Date('2023-01-10').getTime(); // End date (in ms)
const outputFile = 'historical_data.json'; // Output file name

// Call the function
fetchHistoricalData(symbol, interval, startTime, endTime, outputFile);
