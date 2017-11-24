/*

 ----------------------------------------------------------------------------
 | ewd-qoper8-koa: Koa.js Integration Module for ewd-qoper8                 |
 |                                                                          |
 | Copyright (c) 2017 M/Gateway Developments Ltd,                           |
 | Reigate, Surrey UK.                                                      |
 | All rights reserved.                                                     |
 |                                                                          |
 | http://www.mgateway.com                                                  |
 | Email: rtweed@mgateway.com                                               |
 |                                                                          |
 |                                                                          |
 | Licensed under the Apache License, Version 2.0 (the "License");          |
 | you may not use this file except in compliance with the License.         |
 | You may obtain a copy of the License at                                  |
 |                                                                          |
 |     http://www.apache.org/licenses/LICENSE-2.0                           |
 |                                                                          |
 | Unless required by applicable law or agreed to in writing, software      |
 | distributed under the License is distributed on an "AS IS" BASIS,        |
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. |
 | See the License for the specific language governing permissions and      |
 |  limitations under the License.                                          |
 ----------------------------------------------------------------------------

  11 May 2017

*/

const microServiceRouter = require('qewd-microservice-router');
const pkg = require('../package.json');
const debug = require('debug')('ewd-qoper8-koa');
const build = pkg.version;

let qoper8;

function init(q) {
  qoper8 = q;
  if (!qoper8.workerResponseHandlers) qoper8.workerResponseHandlers = {};
  qoper8.microServiceRouter = microServiceRouter;
}

function handleMessage(ctx, resolve) {
  const request = ctx.request;
  const params = ctx.state.params;
  const message = {
    type: 'ewd-qoper8-express',
    path: request.originalUrl,
    method: request.method,
    headers: request.headers,
    params: params,
    query: request.query,
    body: request.body,
    ip: request.ip,
    ips: request.ips
  };

  debug('request message: %s', JSON.stringify(message));

  if (request.path && request.path !== '') {
    const pieces = request.path.split('/');
    message.application = pieces[1];
  }

  if (request.application) {
    message.application = request.application;
  }

  if (params && params.type) {
    message.expressType = params.type;
  }

  if (request.expressType) {
    message.expressType = request.expressType;
  }

  const handleResponse = function(resultObj) {
    debug('resultObj: %s', JSON.stringify(resultObj));

    if (resultObj.socketId && resultObj.socketId !== '') return;

    if (!resultObj.message && resultObj.error) resultObj = {
      message: resultObj
    };

    let message = resultObj.message;

    debug('response message: %s', JSON.stringify(message));

    if (typeof message === 'undefined') {
      message = {
        error: 'Invalid or missing response'
      };
    }

    if (message.error && resultObj.status) {
      message.status = resultObj.status;
    }

    if (message.error) {
      const status = message.status;
      const code = status && status.code ?
        parseInt(status.code, 10) :
        400;
      const response = message.error.response ?
        message.error.response :
        { error: message.error };

      debug('setting ctx.body to %s', JSON.stringify(response));
      debug('setting ctx.status to %d', code);

      ctx.state.responseObj = response;
      ctx.status = code;

      resolve();
    }
    else {
      // intercept response for further processing / augmentation of message response on master process if required
      const application = message.ewd_application;
      if (application) {
        if (typeof qoper8.workerResponseHandlers[application] === 'undefined') {
          try {
            qoper8.workerResponseHandlers[application] = require(application).workerResponseHandlers || {};
          }
          catch(err) {
            debug('No worker response intercept handler module for: %s or unable to load it', application);
            qoper8.workerResponseHandlers[application] = {};
          }
        }

        const type = message.type;
        if (type && qoper8.workerResponseHandlers && qoper8.workerResponseHandlers[application] && qoper8.workerResponseHandlers[application][type]) {
          message = qoper8.workerResponseHandlers[application][type].call(qoper8, message);
        }

        delete message.ewd_application;
      }

      if (message.restMessage) {
        delete message.restMessage;
      }

      debug('setting ctx.body to %s', JSON.stringify(message));

      ctx.state.responseObj = message;

      resolve();
    }
  };

  // should this message be forwarded to a different QEWD Micro-service system?
  if (qoper8.router && qoper8.u_services.byDestination) {
    debug('the message is being forwarded to QEWD Micro-service system');
    const routed = microServiceRouter.call(qoper8, message, handleResponse);
    if (routed) return;
  }

  debug('handling message');
  qoper8.handleMessage(message, handleResponse);
}

function workerMessage(messageObj, send, finished) {
  debug('worker message: %s', JSON.stringify(messageObj));

  if (messageObj.type !== 'ewd-qoper8-express') return false;

  this.on('unknownExpressMessage', function(messageObj, send, finished) {
    const results = {
      error: 'No handler found for ' + messageObj.path + ' request'
    };
    finished(results);
  });

  const ok = this.emit('expressMessage', messageObj, send, finished);
  if (!ok) this.emit('unknownExpressMessage', messageObj, send, finished);

  return true;
}

module.exports = {
  build: build,
  init: init,
  addTo: init,
  handleMessage: handleMessage,
  workerMessage: workerMessage
};

