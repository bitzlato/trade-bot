const ccxt = require('ccxt');

class Fetcher {
    constructor(exchanges = []) {
        this.exchanges = exchanges;
        this.tickers = {};
    }

    async load() {
        const loading = this.exchanges.map(async k => {
            const ticker = await new ccxt.kraken().fetchTickers();
            this.tickers[k] = ticker;
        });

        return Promise.all(loading);
    }
}

module.exports = Fetcher;
