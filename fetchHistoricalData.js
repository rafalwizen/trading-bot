require('dotenv').config();
const fs = require('fs');
const { Spot } = require('@binance/connector');

const client = new Spot(process.env.API_KEY, process.env.API_SECRET);

async function fetchHistoricalData(symbol, interval, startTime, endTime, outputFile) {
    try {
        let allData = [];
        let lastEndTime = startTime;

        console.log(`Rozpoczynanie pobierania danych dla ${symbol}...`);

        while (true) {
            console.log(`Pobieranie danych od ${new Date(lastEndTime).toISOString()}...`);

            const response = await client.klines(symbol, interval, {
                startTime: lastEndTime,
                endTime,
                limit: 1000,
            });

            if (!response || response.data.length === 0) break;

            const processedData = response.data.map(candle => ({
                time: candle[0], // Czas otwarcia świecy
                open: parseFloat(candle[1]),
                high: parseFloat(candle[2]),
                low: parseFloat(candle[3]),
                close: parseFloat(candle[4]),
                volume: parseFloat(candle[5]),
            }));

            allData = allData.concat(processedData);

            lastEndTime = response.data[response.data.length - 1][0] + 1;

            if (lastEndTime >= endTime) break;
        }

        fs.writeFileSync(outputFile, JSON.stringify(allData, null, 2));
        console.log(`Pobrano dane historyczne dla ${symbol} i zapisano w pliku ${outputFile}`);
    } catch (error) {
        console.error('Błąd podczas pobierania danych:', error.response ? error.response.data : error);
    }
}

const symbol = 'BTCUSDT';
const interval = '1m';
const startTime = new Date('2023-01-01').getTime();
const endTime = new Date('2023-01-10').getTime();
const outputFile = 'historical_data.json';

fetchHistoricalData(symbol, interval, startTime, endTime, outputFile);
