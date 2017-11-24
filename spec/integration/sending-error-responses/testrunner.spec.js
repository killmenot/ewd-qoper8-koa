'use strict';

const request = require('supertest')('http://localhost:8080');
const utils = require('../utils');

describe('integration/ewd-qoper8-express/sending-error-responses:', () => {
  let cp;

  beforeAll(done => {
    cp = utils.fork(require.resolve('./server'), done);
  });

  afterAll(done => {
    utils.exit(cp, done);
  });

  it('should be passed', done => {
    request.
      get('/qoper8/pass').
      expect(200).
      expect(res => {
        const body = res.body;

        expect(body.youSent).toEqual(jasmine.any(Object));
        expect(body.workerSent).toMatch(/^hello from worker \d{4,5}$/);
        expect(body.time).toMatch(/(\w{3}) (\w{3}) (\d{2}) (\d{4}) ((\d{2}):(\d{2}):(\d{2})) GMT\+\d{4}/);
      }).
      end(err => err ? done.fail(err) : done());
  });

  it('should be failed', done => {
    request.
      get('/qoper8/fail').
      expect(403).
      expect(res => {
        const body = res.body;

        expect(body).toEqual({
          error: 'An error occurred!'
        });
      }).
      end(err => err ? done.fail(err) : done());
  });

  it('should have no handler', done => {
    request.
      get('/qoper8/nohandler').
      expect(400).
      expect(res => {
        const body = res.body;

        expect(body).toEqual({
          error: 'No handler found for ewd-qoper8-express message'
        });
      }).
      end(err => err ? done.fail(err) : done());
  });
});
