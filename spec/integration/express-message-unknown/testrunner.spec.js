'use strict';

const request = require('supertest')('http://localhost:8080');
const utils = require('../utils');

describe('integration/ewd-qoper8-koa/express-message-unknown:', () => {
  let cp;

  beforeAll(done => {
    cp = utils.fork(require.resolve('./server'), done);
  });

  afterAll(done => {
    utils.exit(cp, done);
  });

  it('should handle unhandled express message', done => {
    request.
      get('/qoper8/test').
      expect(400).
      expect(res => {
        const body = res.body;

        expect(body).toEqual({
          error: 'No handler found for /qoper8/test request'
        });
      }).
      end(err => err ? done.fail(err) : done());
  });
});
