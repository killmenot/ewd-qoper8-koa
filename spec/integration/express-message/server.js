'use strict';

const path = require('path');
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const Router = require('koa-router');
const qoper8 = require('ewd-qoper8');
const qx = require('../../../');
const utils = require('../utils');

const app = new Koa();
const router = new Router();

const q = new qoper8.masterProcess(); // eslint-disable-line new-cap
qx.addTo(q);

router.post('/qoper8', async function (ctx, next) {
  await utils.qxHandleMessage(qx, ctx);
  await next();
});

router.get('/qoper8/test', async function (ctx, next) {
  const message = {
    type: 'non-express-message',
    hello: 'world'
  };
  ctx.state.message = message;

  await utils.qHandleMessage(q, ctx);
  await next();
});

router.get('/qoper8/fail', async function (ctx, next) {
  const message = {
    type: 'unhandled-message',
  };
  ctx.state.message = message;

  await utils.qHandleMessage(q, ctx);
  await next();
});

app.use(bodyParser());
app.use(router.routes());
app.use(router.allowedMethods());
app.use(utils.finalize);

q.on('start', function () {
  this.worker.module = path.join(__dirname, 'worker-module');
  this.log = false;
});

q.on('started', function () {
  app.listen(8080, function () {
    process.send({
      type: 'koa-started'
    });
  });
});

q.start();
