/* eslint-env mocha */
const should = require('should'); // eslint-disable-line

const mirror = require('../lib/mirror');

describe('Mirror', () => {
    it('Can start & can stop', async () => {
        await mirror.startApp({ exchanges: [] });
        await mirror.stopApp();
    });
});
