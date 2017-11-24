'use strict';

const events = require('events');
const rewire = require('rewire');
const mockery = require('mockery');
const mockContext = require('./mocks/context');
const mockRouter = require('./mocks/router');
const qx = rewire('../../lib/koa');

describe('unit/koa:', () => {
  let MasterProcess;
  let q;

  const revert = (obj) => {
    obj.__revert__();
    delete obj.__revert__;
  };

  beforeAll(() => {
    MasterProcess = function () {
      this.handleMessage = jasmine.createSpy();

      events.EventEmitter.call(this);
    };

    MasterProcess.prototype = Object.create(events.EventEmitter.prototype);
    MasterProcess.prototype.constructor = MasterProcess;

    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false
    });
  });

  afterAll(function () {
    mockery.disable();
  });

  beforeEach(() => {
    q = new MasterProcess();
  });

  afterEach(() => {
    q.removeAllListeners();
    q = null;

    mockery.deregisterAll();
  });

  describe('#build', () => {
    it('should return build no', () => {
      expect(qx.build).toEqual(jasmine.any(String));
    });
  });

  describe('#init', () => {
    it('should be function', () => {
      expect(qx.init).toEqual(jasmine.any(Function));
    });

    it('should initialize qoper8', () => {
      qx.init(q);

      expect(qx.__get__('qoper8')).toBe(q);
    });

    describe('workerResponseHandlers', () => {
      it('should be initialized for qoper8', () => {
        expect(q.workerResponseHandlers).toBeUndefined();

        qx.init(q);

        expect(q.workerResponseHandlers).toEqual({});
      });

      it('should be not initialized for qoper8', () => {
        const workerResponseHandlers = q.workerResponseHandlers = {};

        qx.init(q);

        expect(q.workerResponseHandlers).toBe(workerResponseHandlers);
      });
    });

    describe('microServiceRouter', () => {
      let microServiceRouter;

      beforeEach(() => {
        microServiceRouter = jasmine.createSpy();
        microServiceRouter.__revert__ = qx.__set__('microServiceRouter', microServiceRouter);
      });

      afterEach(() => {
        revert(microServiceRouter);
      });

      it('should be attached to qoper8', () => {
        expect(q.microServiceRouter).toBeUndefined();

        qx.init(q);

        expect(q.microServiceRouter).toBe(microServiceRouter);
      });
    });
  });

  describe('#addTo', () => {
    it('should be function', () => {
      expect(qx.addTo).toEqual(jasmine.any(Function));
    });

    it('should be init', () => {
      expect(qx.addTo).toBe(qx.init);
    });
  });

  describe('#handleMessage', () => {
    let ctx;
    let resolve;

    beforeEach(() => {
      qx.init(q);

      ctx = mockContext.mock();
      resolve = jasmine.createSpy();
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it('should be function', () => {
      expect(qx.handleMessage).toEqual(jasmine.any(Function));
    });

    describe('microServiceRouter', () => {
      let microServiceRouter;

      beforeEach(() => {
        q.router = mockRouter.mock();
        q.u_services = require('./fixtures/servicesConfig');

        microServiceRouter = jasmine.createSpy();
        microServiceRouter.__revert__ = qx.__set__('microServiceRouter', microServiceRouter);
      });

      afterEach(() => {
        revert(microServiceRouter);
      });

      it('should call microServiceRouter with correct arguments', () => {
        qx.handleMessage(ctx, resolve);

        expect(microServiceRouter).toHaveBeenCalledWith({
          type: 'ewd-qoper8-express',
          path: ctx.request.originalUrl,
          method: ctx.request.method,
          headers: ctx.request.headers,
          params: ctx.state.params,
          query: ctx.request.query,
          body: ctx.request.body,
          ip: ctx.request.ip,
          ips: ctx.request.ips
        }, jasmine.any(Function));
      });

      describe('routed', () => {
        it('should not call qoper8.handleMessage', () => {
          microServiceRouter.and.returnValue(true);

          qx.handleMessage(ctx, resolve);

          expect(q.handleMessage).not.toHaveBeenCalled();
        });
      });

      describe('not routed', () => {
        it('should not call qoper8.handleMessage', () => {
          microServiceRouter.and.returnValue(false);

          qx.handleMessage(ctx, resolve);

          expect(q.handleMessage).toHaveBeenCalled();
        });
      });
    });

    it('should call qoper8.handleMessage with correct arguments', () => {
      qx.handleMessage(ctx, resolve);

      expect(q.handleMessage).toHaveBeenCalledWith({
        type: 'ewd-qoper8-express',
        path: ctx.request.originalUrl,
        method: ctx.request.method,
        headers: ctx.request.headers,
        params: ctx.state.params,
        query: ctx.request.query,
        body: ctx.request.body,
        ip: ctx.request.ip,
        ips: ctx.request.ips
      }, jasmine.any(Function));
    });

    describe('request.path', () => {
      beforeEach(() => {
        ctx.request.path = '/users';
      });

      it('should add application prop to message object', () => {
        qx.handleMessage(ctx, resolve);

        const args = q.handleMessage.calls.argsFor(0);

        expect(args[0].application).toBe('users');
      });
    });

    describe('request.application', () => {
      beforeEach(() => {
        ctx.request.application = 'messages';
      });

      it('should add application prop to message object', () => {
        qx.handleMessage(ctx, resolve);

        const args = q.handleMessage.calls.argsFor(0);

        expect(args[0].application).toBe('messages');
      });
    });

    describe('params.type', () => {
      beforeEach(() => {
        ctx.state.params.type = 'master';
      });

      it('should add expressType prop to message object', () => {
        qx.handleMessage(ctx, resolve);

        const args = q.handleMessage.calls.argsFor(0);

        expect(args[0].expressType).toBe('master');
      });
    });

    describe('request.expressType', () => {
      beforeEach(() => {
        ctx.request.expressType = 'worker';
      });

      it('should add application prop to message object', () => {
        qx.handleMessage(ctx, resolve);

        const args = q.handleMessage.calls.argsFor(0);

        expect(args[0].expressType).toBe('worker');
      });
    });

    describe('handleResponse', () => {
      let resultObj;

      beforeEach(() => {
        resultObj = {
          message: {}
        };
      });

      describe('socketId', () => {
        beforeEach(() => {
          resultObj.socketId = '/#yf_vd-S9Q7e-LX28AAAS';
        });

        it('should do nothing', () => {
          qx.handleMessage(ctx, resolve);

          const handleResponse = q.handleMessage.calls.argsFor(0)[1];
          handleResponse(resultObj);

          expect(resolve).not.toHaveBeenCalled();
        });
      });

      describe('restMessage', () => {
        beforeEach(() => {
          resultObj.message = {
            foo: 'bar',
            restMessage: true
          };
        });

        it('should delete message.restMessage', () => {
          qx.handleMessage(ctx, resolve);

          const handleResponse = q.handleMessage.calls.argsFor(0)[1];
          handleResponse(resultObj);

          expect(ctx.state.responseObj).toEqual({foo: 'bar'});
          expect(resolve).toHaveBeenCalled();
        });
      });

      describe('ewd_application', () => {
        describe('workerResponseHandlers', () => {
          it('should load worker response handlers from application module', () => {
            const appModule = {
              workerResponseHandlers: jasmine.createSpyObj(['foo'])
            };

            appModule.workerResponseHandlers.foo.and.returnValue({
              type: 'foo2',
              ewd_application: 'quux2'
            });

            mockery.registerMock('quux', appModule);

            resultObj.message = {
              type: 'foo',
              ewd_application: 'quux'
            };

            qx.handleMessage(ctx, resolve);

            const handleResponse = q.handleMessage.calls.argsFor(0)[1];
            handleResponse(resultObj);

            expect(appModule.workerResponseHandlers.foo).toHaveBeenCalledWithContext(q, resultObj.message);
            expect(ctx.state.responseObj).toEqual({
              type: 'foo2'
            });
            expect(resolve).toHaveBeenCalled();
          });

          it('should use default worker response handlers from application module', () => {
            const appModule = {};

            mockery.registerMock('quux', appModule);

            resultObj.message = {
              type: 'foo',
              ewd_application: 'quux'
            };

            qx.handleMessage(ctx, resolve);

            const handleResponse = q.handleMessage.calls.argsFor(0)[1];
            handleResponse(resultObj);

            expect(ctx.state.responseObj).toEqual({
              type: 'foo'
            });
            expect(resolve).toHaveBeenCalled();
          });

          it('should unable to load application module', () => {
            resultObj.message = {
              type: 'foo',
              ewd_application: 'quux'
            };

            qx.handleMessage(ctx, resolve);

            const handleResponse = q.handleMessage.calls.argsFor(0)[1];
            handleResponse(resultObj);

            expect(q.workerResponseHandlers).toEqual({
              quux: {}
            });
            expect(ctx.state.responseObj).toEqual({
              type: 'foo'
            });
            expect(resolve).toHaveBeenCalled();
          });

          it('should use loaded application module', () => {
            const appHandlers = jasmine.createSpyObj(['foo']);

            appHandlers.foo.and.returnValue({
              type: 'foo2',
              ewd_application: 'quux2'
            });

            q.workerResponseHandlers = {
              quux: appHandlers
            };

            resultObj.message = {
              type: 'foo',
              ewd_application: 'quux'
            };

            qx.handleMessage(ctx, resolve);

            var handleResponse = q.handleMessage.calls.argsFor(0)[1];
            handleResponse(resultObj);

            expect(appHandlers.foo).toHaveBeenCalledWithContext(q, resultObj.message);
            expect(ctx.state.responseObj).toEqual({
              type: 'foo2'
            });
            expect(resolve).toHaveBeenCalled();
          });
        });
      });

      describe('error handling', () => {
        describe('When resultObj.message.error', () => {
          beforeEach(() => {
            resultObj.message = {
              error: 'foo'
            };
          });

          it('should return correct error response', () => {
            qx.handleMessage(ctx, resolve);

            const handleResponse = q.handleMessage.calls.argsFor(0)[1];
            handleResponse(resultObj);

            expect(ctx.status).toBe(400);
            expect(ctx.state.responseObj).toEqual({
              error: 'foo'
            });
            expect(resolve).toHaveBeenCalled();
          });
        });

        describe('When resultObj.error', () => {
          beforeEach(() => {
            resultObj = {
              error: 'bar'
            };
          });

          it('should return correct error response', () => {
            qx.handleMessage(ctx, resolve);

            const handleResponse = q.handleMessage.calls.argsFor(0)[1];
            handleResponse(resultObj);

            expect(ctx.status).toBe(400);
            expect(ctx.state.responseObj).toEqual({
              error: 'bar'
            });
            expect(resolve).toHaveBeenCalled();
          });
        });

        describe('When resultObj.message undefined', () => {
          beforeEach(() => {
            resultObj = {};
          });

          it('should return correct error response', () => {
            qx.handleMessage(ctx, resolve);

            const handleResponse = q.handleMessage.calls.argsFor(0)[1];
            handleResponse(resultObj);

            expect(ctx.status).toBe(400);
            expect(ctx.state.responseObj).toEqual({
              error: 'Invalid or missing response'
            });
            expect(resolve).toHaveBeenCalled();
          });
        });

        describe('When resultObj.message.error and resultObj.status', () => {
          beforeEach(() => {
            resultObj = {
              message: {
                error: 'foo'
              },
              status: {
                code: 403
              }
            };
          });

          it('should return correct error response', () => {
            qx.handleMessage(ctx, resolve);

            const handleResponse = q.handleMessage.calls.argsFor(0)[1];
            handleResponse(resultObj);

            expect(ctx.status).toBe(403);
            expect(ctx.state.responseObj).toEqual({
              error: 'foo'
            });
            expect(resolve).toHaveBeenCalled();
          });
        });

        describe('When custom error response', () => {
          beforeEach(() => {
            resultObj.message = {
              error: {
                response: 'baz'
              }
            };
          });

          it('should return correct error response', () => {
            qx.handleMessage(ctx, resolve);

            const handleResponse = q.handleMessage.calls.argsFor(0)[1];
            handleResponse(resultObj);

            expect(ctx.status).toBe(400);
            expect(ctx.state.responseObj).toBe('baz');
            expect(resolve).toHaveBeenCalled();
          });
        });
      });
    });
  });

  describe('#workerMessage', () => {
    let messageObj;
    let send;
    let finished;

    beforeEach(() => {
      messageObj = {};
      send = jasmine.createSpy();
      finished = jasmine.createSpy();
    });

    it('should be function', () => {
      expect(qx.workerMessage).toEqual(jasmine.any(Function));
    });

    describe('When type is ewd-qoper8-express', () => {
      beforeEach(() => {
        messageObj.type = 'ewd-qoper8-express';
        messageObj.path = '/qoper8/test';
      });

      it('should return true', () => {
        const actual = qx.workerMessage.call(q, messageObj, send, finished);

        expect(actual).toBeTruthy();
      });

      describe('unknownExpressMessage', () => {
        it('should add event handler', () => {
          spyOn(q, 'on').and.callThrough();

          qx.workerMessage.call(q, messageObj, send, finished);

          expect(q.on).toHaveBeenCalledWith('unknownExpressMessage', jasmine.any(Function));
        });
      });

      it('should emit `expressMessage` event', () => {
        spyOn(q, 'emit').and.callThrough();

        const callback = jasmine.createSpy();
        q.on('expressMessage', callback);

        qx.workerMessage.call(q, messageObj, send, finished);

        expect(q.emit.calls.count()).toBe(1);
        expect(q.emit).toHaveBeenCalledWith('expressMessage', messageObj, send, finished);
        expect(callback).toHaveBeenCalledWith(messageObj, send, finished);
      });

      describe('and no handler for `expressMessage` event found', () => {
        it('should emit `unknownExpressMessage` event', () => {
          spyOn(q, 'emit').and.callThrough();

          qx.workerMessage.call(q, messageObj, send, finished);

          expect(q.emit.calls.count()).toBe(2);
          expect(q.emit.calls.argsFor(1)).toEqual(['unknownExpressMessage', messageObj, send, finished]);
          expect(finished).toHaveBeenCalledWith({
            error: 'No handler found for /qoper8/test request'
          });
        });
      });
    });

    it('should return false', () => {
      const actual = qx.workerMessage.call(q, messageObj, send, finished);

      expect(actual).toBeFalsy();
    });
  });
});
