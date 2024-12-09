require('dotenv').config();
const fs = require('fs');

class HistoricalTester {
    constructor(filePath, baseAmount = 1000, maxTrades = 20) {
        this.historicalPrices = []; // Dane historyczne
        this.historicalIndex = 0;   // Aktualny indeks danych historycznych
        this.baseAmount = baseAmount; // Bazowa kwota w USDT
        this.currentBalance = baseAmount; // Aktualny balans
        this.startPrice = 0; // Cena startowa
        this.purchasePrice = []; // Lista cen zakupu
        this.maxTrades = maxTrades; // Maksymalna liczba transakcji
        this.results = []; // Wyniki symulacji

        // Wczytanie danych historycznych z pliku
        this.loadHistoricalData(filePath);
    }

    // Wczytanie danych historycznych
    loadHistoricalData(filePath) {
        try {
            const data = fs.readFileSync(filePath, 'utf-8');
            this.historicalPrices = JSON.parse(data);
            console.log(`Wczytano ${this.historicalPrices.length} danych historycznych.`);
        } catch (error) {
            console.error('Błąd podczas wczytywania danych historycznych:', error);
        }
    }

    // Pobieranie ceny z danych historycznych
    async getCurrentPrice() {
        if (this.historicalIndex >= this.historicalPrices.length) {
            console.log("Symulacja zakończona - brak więcej danych historycznych.");
            return null;
        }

        const currentPrice = this.historicalPrices[this.historicalIndex].close;
        this.historicalIndex++;
        return currentPrice;
    }

    // Główna funkcja handlu
    async trade() {
        const currentPrice = await this.getCurrentPrice();
        if (!currentPrice) return;

        console.log(`Cena BTC: ${currentPrice} USDT`);

        // Ustawienie ceny startowej przy pierwszym uruchomieniu
        if (this.startPrice === 0) {
            this.startPrice = currentPrice;
            console.log(`Ustawiono cenę startową: ${this.startPrice} USDT`);
            return;
        }

        // Obliczanie kwoty zakupu (5% bazowej kwoty)
        const tradeAmount = this.baseAmount * 0.05;

        // Kupowanie BTC przy spadku o 1% od ceny startowej
        if (currentPrice <= this.startPrice * 0.99 && this.purchasePrice.length < this.maxTrades) {
            const quantity = tradeAmount / currentPrice;
            this.purchasePrice.push(currentPrice);
            this.currentBalance -= tradeAmount;
            this.logResult('Kupiono', quantity, currentPrice);
        }

        // Sprzedawanie BTC przy wzroście o 1% od ceny zakupu
        for (let i = this.purchasePrice.length - 1; i >= 0; i--) {
            if (currentPrice >= this.purchasePrice[i] * 1.01) {
                const quantity = tradeAmount / this.purchasePrice[i];
                this.currentBalance += tradeAmount;
                this.logResult('Sprzedano', quantity, currentPrice);
                this.purchasePrice.splice(i, 1); // Usuwanie transakcji z listy
            }
        }

        // Aktualizacja kwoty bazowej i ceny startowej
        if (this.currentBalance > this.baseAmount) {
            this.baseAmount = this.currentBalance;
            this.startPrice = currentPrice;
            console.log(`Zaktualizowano bazową kwotę: ${this.baseAmount} USDT. Nowa cena startowa: ${this.startPrice} USDT`);
        }
    }

    // Rejestrowanie wyników
    logResult(action, amount, price) {
        const result = {
            action,
            amount,
            price,
            balance: this.currentBalance,
            time: new Date().toISOString()
        };
        this.results.push(result);
        console.log(result);
    }

    // Uruchamianie symulacji
    async runSimulation() {
        console.log('Rozpoczynanie symulacji...');
        while (this.historicalIndex < this.historicalPrices.length) {
            await this.trade();
        }
        console.log('Symulacja zakończona.');
        this.saveResults();
    }

    // Zapisywanie wyników do pliku
    saveResults() {
        const resultsFile = 'simulation_results.json';
        fs.writeFileSync(resultsFile, JSON.stringify(this.results, null, 2));
        console.log(`Wyniki symulacji zapisane do pliku: ${resultsFile}`);
    }
}

// Tworzenie instancji testera i uruchamianie symulacji
const tester = new HistoricalTester('historical_data.json');
tester.runSimulation();
