const Axios = require('axios');

const Fetcher = require('./fetcher');
const Pair = require('./pair');

const delay = timeout => new Promise(resolve => setTimeout(resolve, timeout));
const createDefer = () => {
    const defer = {};
    defer.promise = new Promise((resolve, reject) => {
        defer.resolve = resolve;
        defer.reject = reject;
    });
    return defer;
};

const validateLevel = str => {
    return !isNaN(str) && !isNaN(parseFloat(str)) && isFinite(str) && parseFloat(str) > 0;
};

function createApp(config, axios=Axios, fetcher=Fetcher) {
    const app = {};

    function runLoop() {
        (async () => {
            let busy = false;
            while (app.runLoop) {
                if (busy) {
                    await delay(app.config.tick);
                    continue;
                }
                busy = true;
                console.info('Running ...');
                await app.fetcher.load();

                for (const p of app.pairs) {
                    await p.process();
                }

                await delay(app.config.tick);
                busy = false;
            }
            app.stoppingDefer.resolve();
        })();
    }

    app.start = async function start() {
        app.config = config;
        app.runLoop = true;
        app.stoppingDefer = createDefer();
        app.fetcher = new fetcher(['kraken']);
        await app.fetcher.load();

        app.axios = axios.create({
            baseURL: config.apiUrl,
            headers: { 'X-Authorization': config.token }
        });

        const { userId } = (await app.axios.get('/auth/whoami')).data;
        app.userId = userId;

        // levels
        const bidLevels = app.config.bidLevels.split(',');
        const askLevels = app.config.askLevels.split(',');
        const levels = [...bidLevels, ...askLevels];
        for (const l of levels) {
            if (!validateLevel(l)) {
                console.error(`Wrong level ${l}`);
                app.stop();
                return;
            }
        }

        app.levels = {
            bid: bidLevels.map(parseFloat),
            ask: askLevels.map(parseFloat)
        };

        // pairs
        let bzpairs = (await app.axios.get('/market/v1/public/pairs/')).data;

        if (app.config.pairs !== 'all') {
            const pairs = app.config.pairs.split(',');
            if (pairs.legth === 0) {
                console.error('Empty pairs list');
                app.stop();
                return;
            }
            for (const p of pairs) {
                if (!bzpairs.some(({ id }) => p === id)) {
                    console.error(`Wrong pair id ${p}`);
                    app.stop();
                    return;
                }
            }
            bzpairs = bzpairs.filter(({ id }) => pairs.includes(id));
        }

        app.pairs = [];
        bzpairs.forEach(bz => {
            console.info(`Adding ${bz.id}`);
            app.pairs.push(new Pair({ local: bz.id, exchange: 'kraken', app }));
        });

        console.log('Staring mirror trade bot...');
        runLoop();
    };

    app.stop = async function stopApp() {
        console.log('Stopping mirror trade bot...');
        app.runLoop = false;
        await app.stoppingDefer.promise;
    };

    return app;
}



module.exports = { createApp };
