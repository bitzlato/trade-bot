const { getCrossPrice } = require('./getCrossPrice');

const LEVELS = {
    ask: [1, 1.05, 1.1, 1.15, 1.2],
    bid: [1, 0.95, 0.9, 0.85, 0.8]
};

class Pair {
    constructor({ local, exchange, app: { fetcher, axios, userId } }) {
        this.local = local;
        this.fetcher = fetcher;
        this.exchange = exchange;
        this.axios = axios;
        this.userId = userId;

        const [base, quote] = this.local.split('-');
        getCrossPrice(fetcher.tickers[exchange], base, quote);

        this.amount = getCrossPrice(fetcher.tickers[exchange], 'USD', base).last.toFixed(8);
        console.info(`1 USD ~ ${this.amount} ${base}`);
    }

    getNewOrders() {
        const [base, quote] = this.local.split('-');
        const { ask, bid } = getCrossPrice(this.fetcher.tickers[this.exchange], base, quote);
        const bidOrders = LEVELS.bid
            .map(l => ({
                amount: this.amount,
                price: (l * bid).toFixed(8),
                offerType: 'bid'
            }))
            .reverse();

        const askOrders = LEVELS.ask.map(l => ({
            amount: this.amount,
            price: (l * ask).toFixed(8),
            offerType: 'ask'
        }));

        return [...askOrders, ...bidOrders];
    }

    async cancelOrders() {
        console.info(' Cancelling orders');
        const orders = (await this.axios.get(`/market/v1/private/${this.userId}/orders/`, {
            params: { pair: this.local }
        })).data;
        for (const o of orders.data) {
            try {
                await this.axios.delete(`/market/v1/private/${this.userId}/orders/${o.id}`);
            } catch (e) {
                console.error(`Error cancelling order #${o.id}`);
            }
        }
    }

    async placeOrders(orders) {
        const ask = orders
            .filter(({ offerType }) => offerType === 'ask')
            .reduce((prev, o) => `${prev} price:${o.price}; amount: ${o.amount}`, '');
        const bid = orders
            .filter(({ offerType }) => offerType === 'bid')
            .reduce((prev, o) => `${prev} price:${o.price}; amount: ${o.amount}`, '');

        console.info(` Placing ASK: ${ask}`);
        console.info(` Placing BID: ${bid}`);

        for (const o of orders) {
            await this.axios.post(`/market/v1/private/${this.userId}/orders/`, { pair: this.local, ...o });
        }
    }

    async process() {
        console.info(`Processing ${this.local} -> ${this.exchange}`);
        await this.cancelOrders();
        const orders = this.getNewOrders();
        await this.placeOrders(orders);
        await this.placeRandomTrade(orders);
    }

    async placeRandomTrade(orders) {
        const order = orders[Math.floor(Math.random() * orders.length)];
        const offerType = order.offerType === 'bid' ? 'ask' : 'bid';
        const o = { ...order, offerType, amount: (order.amount / 10).toFixed(8), pair: this.local };

        console.info(`Placing random order ${o.pair} ${o.offerType} price:${o.price} amount:${o.amount}`);
        await this.axios.post(`/market/v1/private/${this.userId}/orders/`, o);
    }
}

module.exports = Pair;
