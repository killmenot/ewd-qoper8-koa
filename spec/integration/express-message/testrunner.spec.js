'use strict';

const request = require('supertest')('http://localhost:8080');
const utils = require('../utils');

describe('integration/ewd-qoper8-koa/express-message:', () => {
  let cp;

  beforeAll(done => {
    cp = utils.fork(require.resolve('./server'), done);
  });

  afterAll(done => {
    utils.exit(cp, done);
  });

  it('should handle express message', done => {
    request.
      post('/qoper8').
      expect(200).
      expect(res => {
        const body = res.body;

        expect(body.youSent).toEqual(jasmine.any(Object));
        expect(body.workerSent).toMatch(/^hello from worker \d{4,5}$/);
        expect(body.time).toMatch(/(\w{3}) (\w{3}) (\d{2}) (\d{4}) ((\d{2}):(\d{2}):(\d{2})) GMT\+\d{4}/);
      }).
      end(err => err ? done.fail(err) : done());
  });

  it('should handle non-express message', done => {
    request.
      get('/qoper8/test').
      expect(200).
      expect(res => {
        const body = res.body;

        expect(body.type).toBe('non-express-message');
        expect(body.finished).toBeTruthy();
        expect(body.message.messageType).toBe('non-express');
        expect(body.message.workerSent).toMatch(/^hello from worker \d{4,5}$/);
        expect(body.message.time).toMatch(/(\w{3}) (\w{3}) (\d{2}) (\d{4}) ((\d{2}):(\d{2}):(\d{2})) GMT\+\d{4}/);
      }).
      end(err => err ? done.fail(err) : done());
  });

  it('should handle unhandled message', done => {
    request.
      get('/qoper8/fail').
      expect(400).
      expect(res => {
        const body = res.body;

        expect(body).toEqual({
          error: 'No handler found for unhandled-message message'
        });
      }).
      end(err => err ? done.fail(err) : done());
  });
});
