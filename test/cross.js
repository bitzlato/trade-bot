/* eslint-env mocha */

const should = require('should'); // eslint-disable-line

const delay = timeout => new Promise(resolve => setTimeout(resolve, timeout));

describe('Cross', function() {
    before(async () => {
        await delay(1);
    });

    after(async () => {
        await delay(1);
    });

    it('Cross test', async () => {
        const events = [];
        events.should.be.deepEqual([]);
    });
});
