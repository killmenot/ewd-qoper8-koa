'use strict';

const path = require('path');

module.exports = function () {

  this.on('message', function (messageObj, send, finished) {
    const results = {
      type: messageObj.params.type,
      youSent: messageObj,
      workerSent: 'hello from worker ' + process.pid,
      time: new Date().toString(),
      ewd_application: path.join(__dirname, messageObj.query.ewd)
    };
    finished(results);
  });

};
