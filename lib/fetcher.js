const ccxt = require('ccxt');

const TIMEOUT = 60 * 60 * 1000; // 1 hour

class Fetcher {
    constructor(exchanges = []) {
        this.exchanges = exchanges;
        this.tickers = {};
        this.lastUpdate = 0;
    }

    async load() {
        const loading = this.exchanges.map(async k => {
            const ticker = await new ccxt.kraken().fetchTickers();
            this.tickers[k] = ticker;
            this.lastUpdate = +new Date();
        });

        try {
            await Promise.all(loading);
        } catch (e) {
            const now = +new Date();
            if (this.lastUpdate && now - this.lastUpdate > TIMEOUT) {
                throw new Error("Exchange data hasn't updated for too long");
            }
        }

    }
}

module.exports = Fetcher;
