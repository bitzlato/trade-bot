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

const app = {};

function runLoop() {
    (async () => {
        let busy = false;
        while (app.runLoop) {
            if (busy) {
                await delay(app.tick);
                continue;
            }
            busy = true;
            console.info('Running ...');
            await app.fetcher.load();

            for (const p of app.pairs) {
                await p.process();
            }

            await delay(app.tick);
            busy = false;
        }
        app.stoppingDefer.resolve();
    })();
}

async function startApp({ token, apiUrl, tick }) {
    app.token = token;
    app.apiUrl = apiUrl;
    app.tick = tick;
    app.runLoop = true;
    app.stoppingDefer = createDefer();
    app.fetcher = new Fetcher(['kraken']);
    await app.fetcher.load();

    app.axios = Axios.create({
        baseURL: app.apiUrl,
        headers: { 'X-Authorization': token }
    });

    const { userId } = (await app.axios.get('/auth/whoami')).data;
    app.userId = userId;

    const bzpairs = (await app.axios.get('/market/v1/public/pairs/')).data;

    app.pairs = [];
    bzpairs.forEach(bz => {
        console.info(`Adding ${bz.id}`);
        app.pairs.push(new Pair({ local: bz.id, exchange: 'kraken', app }));
    });

    console.log('Staring mirror trade bot...');
    runLoop();
}

async function stopApp() {
    console.log('Stopping mirror trade bot...');
    app.runLoop = false;
    await app.stoppingDefer.promise;
}

module.exports = { startApp, stopApp };
