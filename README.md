# ewd-qoper8-koa: Koa.js integration module for ewd-qoper8

[![Build Status](https://travis-ci.org/robtweed/ewd-qoper8-koa.svg?branch=master)](https://travis-ci.org/robtweed/ewd-qoper8-koa) [![Coverage Status](https://coveralls.io/repos/github/robtweed/ewd-qoper8-koa/badge.svg?branch=master)](https://coveralls.io/github/robtweed/ewd-qoper8-koa?branch=master) [![Dependency Status](https://gemnasium.com/badges/github.com/robtweed/ewd-qoper8-koa.svg)](https://gemnasium.com/github.com/robtweed/ewd-qoper8-koa)

Rob Tweed <rtweed@mgateway.com>
10 May 2017, M/Gateway Developments Ltd [http://www.mgateway.com](http://www.mgateway.com)

Twitter: [@rtweed](https://twitter.com/rtweed)

Google Group for discussions, support, advice etc: [http://groups.google.co.uk/group/enterprise-web-developer-community](http://groups.google.co.uk/group/enterprise-web-developer-community).


## ewd-qoper8-koa

This module may be used to integrate Koa.js with ewd-qoper8, for simpler routing and handling of incoming HTTP requests within ewd-qoper8's master and worker processes.


## Installing

       npm install ewd-qoper8-koa


## Getting Started

server.js
```js
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const Router = require('koa-router');
const qoper8 = require('ewd-qoper8');
const qx = require('ewd-qoper8-koa');

const app = new Koa();
const router = new Router();

const q = new qoper8.masterProcess();
qx.addTo(q);

const qxHandleMessage = (ctx) => {
  ctx.state.params = ctx.params;

  return new Promise((resolve) => {
    qx.handleMessage(ctx, resolve);
  });
};

const qHandleMessage = (ctx) => {
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
};

const finalize () => (ctx) => !ctx.state.nextCallback && ctx.state.responseObj && (ctx.body = ctx.state.responseObj);


router.post('/qoper8', async function (ctx, next) {
  await utils.qxHandleMessage(ctx);
  await next();
});

router.get('/qoper8/test', async function (ctx, next) {
  const message = {
    type: 'non-express-message',
    hello: 'world'
  };
  ctx.state.message = message;

  await utils.qHandleMessage(ctx);
  await next();
});

app.use(bodyParser());
app.use(router.routes());
app.use(router.allowedMethods());
app.use(finalize());

q.on('start', function () {
  this.worker.module = process.cwd() + '/worker-module';
});

q.on('started', function () {
  app.listen(8080);
});

q.start();
```

worker-module.js
```js
'use strict';

module.exports = function () {

  const handleExpressMessage = require('ewd-qoper8-koa').workerMessage;

  this.on('expressMessage', function (messageObj, send, finished) {
    const results = {
      youSent: messageObj,
      workerSent: 'hello from worker ' + process.pid,
      time: new Date().toString()
    };
    finished(results);
  });

  this.on('message', function (messageObj, send, finished) {
    const expressMessage = handleExpressMessage.call(this, messageObj, send, finished);
    if (expressMessage) {
      return;
    }

    // handle any non-Express messages
    if (messageObj.type === 'non-express-message') {
      const results = {
        messageType: 'non-express',
        workerSent: 'hello from worker ' + process.pid,
        time: new Date().toString()
      };
      finished(results);
    } else {
      this.emit('unknownMessage', messageObj, send, finished);
    }
  });

};

```


## Debug

```
DEBUG=ewd-qoper8-koa server.js
```


## License
```
 Copyright (c) 2017 M/Gateway Developments Ltd,                           
 Reigate, Surrey UK.                                                      
 All rights reserved.                                                     
                                                                           
  http://www.mgateway.com                                                  
  Email: rtweed@mgateway.com                                               
                                                                           
                                                                           
  Licensed under the Apache License, Version 2.0 (the "License");          
  you may not use this file except in compliance with the License.         
  You may obtain a copy of the License at                                  
                                                                           
      http://www.apache.org/licenses/LICENSE-2.0                           
                                                                           
  Unless required by applicable law or agreed to in writing, software      
  distributed under the License is distributed on an "AS IS" BASIS,        
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. 
  See the License for the specific language governing permissions and      
   limitations under the License.      
```