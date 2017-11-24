'use strict';

const request = require('supertest')('http://localhost:8080');
const utils = require('../utils');

describe('integration/ewd-qoper8-koa/basic:', () => {
  let cp;

  beforeAll(done => {
    cp = utils.fork(require.resolve('./server'), done);
  });

  afterAll(done => {
    utils.exit(cp, done);
  });

  it('should return correct response', done => {
    request.
      post('/qoper8/foo?bar=baz').
      send({data: 'foo@bar.com'}).
      expect(200).
      expect(res => {
        const body = res.body;

        expect(body.youSent.type).toBe('ewd-qoper8-express');
        expect(body.youSent.path).toBe('/qoper8/foo?bar=baz');
        expect(body.youSent.method).toBe('POST');
        expect(body.youSent.headers).toEqual(jasmine.any(Object));
        expect(body.youSent.params).toEqual({type: 'foo'});
        expect(body.youSent.query).toEqual({bar: 'baz'});
        expect(body.youSent.body).toEqual({data: 'foo@bar.com'});
        expect(body.youSent.ip).toMatch(/(::ffff:)?127\.0\.0\.1/);
        expect(body.youSent.ips).toEqual(jasmine.any(Array));
        expect(body.workerSent).toMatch(/^hello from worker \d{4,5}$/);
        expect(body.time).toMatch(/(\w{3}) (\w{3}) (\d{2}) (\d{4}) ((\d{2}):(\d{2}):(\d{2})) GMT\+\d{4}/);
      }).
      end(err => err ? done.fail(err) : done());
  });
});
