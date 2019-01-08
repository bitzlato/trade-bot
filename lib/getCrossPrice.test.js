/* eslint-env jest */
const { getCrossPrice, isPairsConnected } = require('./getCrossPrice');

const tickers = {
    'BTC/USD': {
        bid: 4000,
        ask: 5000
    },
    'BCH/BTC': {
        bid: 0.01,
        ask: 0.02
    },
    'BSV/BCH': {
        bid: 0.1,
        ask: 0.1
    }
};

describe('getCrossPrice', () => {
    describe('isPairsConnected', () => {
        it('BTC/USD and BCH/BTC are connected', () => {
            expect(isPairsConnected('BTC/USD', 'BCH/BTC')).toBeTruthy();
        });

        it('BCH/BTC and BTC/USD are connected', () => {
            expect(isPairsConnected('BCH/BTC', 'BTC/USD')).toBeTruthy();
        });

        it('BTC/USD and BCH/LTC are not connected', () => {
            expect(isPairsConnected('BTC/USD', 'BCH/LTC')).toBeFalsy();
        });
    });

    describe('getCrossPrice', () => {
        it('BTC in USD', () => {
            expect(getCrossPrice(tickers, 'BTC', 'USD')).toMatchObject({ bid: 4000, ask: 5000 });
        });
        it('USD in BTC', () => {
            expect(getCrossPrice(tickers, 'USD', 'BTC')).toMatchObject({ bid: 1 / 4000, ask: 1 / 5000 });
        });
        it('BCH in USD', () => {
            expect(getCrossPrice(tickers, 'BCH', 'USD')).toMatchObject({ bid: 40, ask: 100 });
        });
        it('USD in BCH', () => {
            expect(getCrossPrice(tickers, 'USD', 'BCH')).toMatchObject({ bid: 1 / 40, ask: 1 / 100 });
        });
        it('BSV in USD', () => {
            expect(getCrossPrice(tickers, 'BSV', 'USD')).toMatchObject({ bid: 40 / 10, ask: 100 / 10 });
        });

        it('ZEC in LTC', () => {
            expect(() => getCrossPrice(tickers, 'ZEC', 'LTC')).toThrow();
        });
    });
});
