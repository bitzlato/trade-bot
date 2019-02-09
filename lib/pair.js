const { getCrossPrice } = require('./getCrossPrice');

const delay = timeout => new Promise(resolve => setTimeout(resolve, timeout));

class Pair {
    constructor({ local, exchange, app }) {
        this.local = local;
        this.exchange = exchange;
        this.fetcher = app.fetcher;
        this.axios = app.axios;
        this.userId = app.userId;
        this.random = app.config.random;
        this.levels = app.levels;

        let [amountMin, amountMax] = app.config.amount.split('-');
        if (!amountMax) amountMax = amountMin;

        const [base, quote] = this.local.split('-');
        getCrossPrice(app.fetcher.tickers[exchange], base, quote);

        const amountUSD = getCrossPrice(app.fetcher.tickers[exchange], 'USD', base).last.toFixed(8);
        this.amountMin = amountUSD * amountMin;
        this.amountMax = amountUSD * amountMax;
        console.info(`1 USD ~ ${amountUSD} ${base}`);
        if (this.amountMax === this.amountMin) {
            console.info(`Order size ${this.amountMin.toFixed(8)} ${base}`);
        } else {
            console.info(`Order size from ${this.amountMin.toFixed(8)} to ${this.amountMax.toFixed(8)} ${base}`);
        }
    }

    getAmount() {
        const rand = Math.random() * (this.amountMax - this.amountMin) + this.amountMin;
        return rand.toFixed(8);
    }

    getNewOrders() {
        const [base, quote] = this.local.split('-');
        const { ask, bid } = getCrossPrice(this.fetcher.tickers[this.exchange], base, quote);
        const bidOrders = this.levels.bid
            .map(l => ({
                amount: this.getAmount(),
                price: (l * bid).toFixed(8),
                offerType: 'bid'
            }))
            .reverse();

        const askOrders = this.levels.ask.map(l => ({
            amount: this.getAmount(),
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
                console.info(`  #${o.id}`);
            } catch (e) {
                console.error(`  Error cancelling order #${o.id}`);
            }
        }
        console.info(' Cancelling orders');
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
            console.info(`   ${o.offerType} ${o.price} ${o.amount}`);
        }
        console.info(' Placing done');
    }

    async checkBalance(orders) {
        const [base, quote] = this.local.split('-');
        const baseBalance = (await this.axios.get(`/p2p/${this.userId}/wallets/${base}`, {
            params: { currency: 'RUB' }
        })).data.balance;
        const quoteBalance = (await this.axios.get(`/p2p/${this.userId}/wallets/${quote}`, {
            params: { currency: 'RUB' }
        })).data.balance;
        console.info(` Balance ${baseBalance} ${base}, ${quoteBalance} ${quote}`);

        const bidRequired = orders
            .filter(({ offerType }) => offerType === 'bid')
            .reduce((prev, o) => prev + Number(o.amount) * Number(o.price), 0);

        const askRequired = orders
            .filter(({ offerType }) => offerType === 'ask')
            .reduce((prev, o) => prev + Number(o.amount), 0);

        console.info(`  Required to place buy orders: ${bidRequired} ${quote}, sell orders: ${askRequired} ${base}`);

        return quoteBalance > bidRequired && baseBalance > askRequired;
    }

    async process() {
        console.info(`Processing ${this.local} -> ${this.exchange}`);
        await this.cancelOrders();
        const orders = this.getNewOrders();
        console.info(' waiting 1 sec...')
        await delay(1000);
        const balance = await this.checkBalance(orders);
        if (!balance) {
            console.error(` Not enought funds to place orders on ${this.local} pair`);
            return;
        }
        await this.placeOrders(orders);
        if (this.random) await this.placeRandomTrade(orders);
    }

    async placeRandomTrade(orders) {
        const order = orders[Math.floor(Math.random() * orders.length)];
        const offerType = order.offerType === 'bid' ? 'ask' : 'bid';
        const o = { ...order, offerType, amount: (order.amount / 3).toFixed(8), pair: this.local };

        console.info(` Placing random order ${o.pair} ${o.offerType} price:${o.price} amount:${o.amount}`);
        await this.axios.post(`/market/v1/private/${this.userId}/orders/`, o);
    }
}

module.exports = Pair;
