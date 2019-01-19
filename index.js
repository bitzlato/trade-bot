const program = require('commander');

const { startApp, stopApp } = require('./lib/mirror');

program
    .option('--token <token>', 'API Token')
    .option('--api [api]', 'API endpoint', )
    .option('--pause [pause]', 'Pause in ms between ticks. Default 30000')
    .option('--random [random]', 'Place random orders. Default false')
    .option('--amount [amount]', 'Order amount in USD. Default 1 USD')
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
};

const appPromise = startApp(config);

process.on('SIGTERM', () => appPromise.then(() => stopApp()));
process.on('SIGINT', () => appPromise.then(() => stopApp()));
