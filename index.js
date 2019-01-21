const program = require('commander');

const { startApp, stopApp } = require('./lib/mirror');

program
    .option('--token <token>', 'API Token')
    .option('--api [api]', 'API endpoint', )
    .option('--pause [pause]', 'Pause in ms between ticks. Default 30000')
    .option('--random [random]', 'Place random orders. Default false')
    .option('--amount [amount]', 'Order amount in USD. Default 1 USD')
    .option('--pairs [pairs]', 'List of comma-separated bitzlato pairs to work on. Default all')
    .option('--bid-levels [bidLevels]', 'List of comma-separated multipliers for buying orders. Default 1.0 0.95 0.9 0.85 0.8')
    .option('--ask-levels [askLevels]', 'List of comma-separated multipliers for selling orders. Default 1.0 1.05 1.1 1.15 1.2')
    .parse(process.argv);

if (!program.token) {
    console.error('--token required');
    process.exit(1);
}

const config = {
    token: program.token,
    apiUrl: program.api || 'https://bitzlato.com/api',
    tick: program.pause || 30000,
    random: program.random || false,
    amount: program.amount || 1,
    pairs: program.pairs || 'all',
    levels: program.levels || 'default',
    bidLevels: program.bidLevels || '1,0.95,0.9,0.85,0.8',
    askLevels: program.askLevels || '1,1.05,1.1,1.15,1.2',
};

const appPromise = startApp(config);

process.on('SIGTERM', () => appPromise.then(() => stopApp()));
process.on('SIGINT', () => appPromise.then(() => stopApp()));
