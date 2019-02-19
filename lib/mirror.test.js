/* eslint-env jest */
const Axios = require('axios');
const MockAdapter = require('axios-mock-adapter');

const { createApp } = require('../lib/mirror');

class MockFetcher {
    constructor(exchanges = []) {
        this.exchanges = exchanges;
        this.tickers = {
            kraken: {
                'ETH/BTC': {
                    symbol: 'ETH/BTC',
                    timestamp: 1550481820465,
                    datetime: '2019-02-18T09:23:40.465Z',
                    high: 0.03722,
                    low: 0.03417,
                    bid: 0.03688,
                    ask: 0.03689,
                    vwap: 0.035658,
                    open: 0.03655,
                    close: 0.03688,
                    last: 0.03688,
                    baseVolume: 28630.70418798,
                    quoteVolume: 1020.913649934991,
                    info: {
                        a: ['0.036890', '8', '8.000'],
                        b: ['0.036880', '206', '206.000'],
                        c: ['0.036880', '0.03736482'],
                        v: ['7336.66228266', '28630.70418798'],
                        p: ['0.036688', '0.035658'],
                        t: [1632, 5700],
                        l: ['0.036230', '0.034170'],
                        h: ['0.037220', '0.037220'],
                        o: '0.036550'
                    }
                },
                'BTC/USD': {
                    symbol: 'BTC/USD',
                    timestamp: 1550481820465,
                    datetime: '2019-02-18T09:23:40.465Z',
                    high: 3733,
                    low: 3552.7,
                    bid: 3697.3,
                    ask: 3697.4,
                    vwap: 3635.50861,
                    open: 3625.1,
                    close: 3697.3,
                    last: 3697.3,
                    baseVolume: 6918.27493392,
                    quoteVolume: 25151448.08861334,
                    info: {
                        a: ['3697.40000', '7', '7.000'],
                        b: ['3697.30000', '1', '1.000'],
                        c: ['3697.30000', '0.00300000'],
                        v: ['3412.56502842', '6918.27493392'],
                        p: ['3675.26884', '3635.50861'],
                        t: [5585, 11562],
                        l: ['3617.00000', '3552.70000'],
                        h: ['3733.00000', '3733.00000'],
                        o: '3625.10000'
                    }
                }
            }
        };
        this.lastUpdate = 0;
    }

    async load() {
        this.lastUpdate = +new Date();
        return Promise.resolve();
    }
}

describe('Mirror', () => {
    it('Can start & can stop', async () => {
        const mock = new MockAdapter(Axios);

        Axios.create = () => Axios;

        mock.onGet('/auth/whoami').reply(200, { userId: 1 });
        mock.onGet('/market/v1/public/pairs/').reply(200, [
            {
                id: 'ETH-BTC',
                label: 'ETH-BTC',
                status: 'active',
                price: { min: null, max: null, last: null },
                volume: { base: null, quote: null },
                priceChange: null
            }
        ]);
        mock.onGet('/market/v1/private/1/orders/').reply(200, {
            data: [
                {
                    id: 1,
                    pair: 'ETH-BTC',
                    offerType: 'bid',
                    amount: { origin: 1, matched: 0, rest: 1 },
                    price: '1',
                    fee: '0',
                    status: 'open',
                    created: 1550487924760,
                    active: true
                }
            ],
            total: 1
        });
        mock.onDelete(/\/market\/v1\/private\/1\/orders\/\d+/).reply(200, {});
        mock.onGet(/\/p2p\/1\/wallets\/.+/).reply(200, { balance: 9999999999 });
        mock.onPost('/market/v1/private/1/orders/').reply(200, {});

        const config = {
            token: 123321,
            apiUrl: 'https://bitzlato.com/api',
            tick: 1,
            random: true,
            amount: '1',
            pairs: 'all',
            bidLevels: '1,0.95,0.9,0.85,0.8',
            askLevels: '1,1.05,1.1,1.15,1.2'
        };
        const mirror = createApp(config, Axios, MockFetcher);
        await mirror.start();
        await mirror.stop();
    });
});
