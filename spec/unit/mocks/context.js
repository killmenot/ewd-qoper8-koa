'use strict';

module.exports = {
  mock: function () {
    return {
      request: {
        originalUrl: '/qoper8/12345?foo=bar',
        method: 'POST',
        headers: {
          Authorization: 'Basic YWRtaW46MTIzNDU=',
          'X-Forwarded-For': 'client'
        },
        query: {
          foo: 'bar'
        },
        body: {
          name: 'baz'
        },
        ip: '127.0.0.1',
        ips: ['client']
      },
      state: {
        params: {
          id: '12345'
        }
      }
    };
  }
};
