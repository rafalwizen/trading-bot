const express = require('express');
const app = express();
const port = 3000;

require('./bot');

app.get('/', (req, res) => {
    res.send('Bot Binance działa i serwer jest aktywny!');
});

app.listen(port, () => {
    console.log(`Serwer działa na porcie http://localhost:${port}`);
});
