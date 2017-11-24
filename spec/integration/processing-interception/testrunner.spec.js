'use strict';

const request = require('supertest')('http://localhost:8080');
const utils = require('../utils');

describe('integration/ewd-qoper8-koa/processing-interception:', () => {
  let cp;

  beforeAll(done => {
    cp = utils.fork(require.resolve('./server'), done);
  });

  afterAll(done => {
    utils.exit(cp, done);
  });

  it('should intercept processing', done => {
    request.
      get('/qoper8/users?ewd=testing').
      expect(200).
      expect(res => {
        const body = res.body;

        expect(body.data).toEqual(['John Doe', 'Jane Doe']);
      }).
      end(err => err ? done.fail(err) : done());
  });

  it('should not intercept processing', done => {
    request.
      get('/qoper8/users?ewd=staging').
      expect(200).
      expect(res => {
        const body = res.body;

        expect(body.youSent).toEqual(jasmine.any(Object));
        expect(body.workerSent).toMatch(/^hello from worker \d{4,5}$/);
        expect(body.time).toMatch(/(\w{3}) (\w{3}) (\d{2}) (\d{4}) ((\d{2}):(\d{2}):(\d{2})) GMT\+\d{4}/);
      }).
      end(err => err ? done.fail(err) : done());
  });
});
