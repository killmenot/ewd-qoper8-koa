const fork = require('child_process').fork;

module.exports = {

  fork: (modulePath, callback) => {
    const cp = fork(modulePath);

    cp.on('message', function (message) {
      if (message.type === 'koa-started') {
        callback();
      }
    });

    return cp;
  },

  exit: (cp, callback) => {
    cp.on('exit', () => callback());
    cp.kill();
  },

  qxHandleMessage: (qx, ctx) => {
    ctx.state.params = ctx.params;

    return new Promise((resolve) => {
      qx.handleMessage(ctx, resolve);
    });
  },

  qHandleMessage: (q, ctx) => {
    return new Promise((resolve) => {
      q.handleMessage(ctx.state.message, (response) => {
        const message = response.message;

        if (message.error) {
          ctx.status = 400;
          ctx.state.responseObj = {
            error: message.error
          };
        } else {
          ctx.state.responseObj = response;
        }

        resolve();
      });
    });
  },

  finalize: (ctx) => {
    !ctx.state.nextCallback && ctx.state.responseObj && (ctx.body = ctx.state.responseObj);
  }
};
