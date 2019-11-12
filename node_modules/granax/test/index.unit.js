'use strict';

const { expect } = require('chai');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const { EventEmitter } = require('events');
const { TorController } = require('..');


describe('@module granax', function() {

  describe('@exports', function() {

    let sandbox = sinon.sandbox.create();
    let _execFileSync = sandbox.stub();
    let _proc = new EventEmitter();
    _proc.stdout = new EventEmitter();
    _proc.kill = sandbox.stub();
    let _spawn = sandbox.stub().returns(_proc);
    let _socket = new EventEmitter();
    _socket.connect = sandbox.stub();
    _socket.pipe = (o) => o;
    function _Socket() {
      return _socket;
    }
    let _readFileSync = sandbox.stub().returns('127.0.0.1:9051');
    let granax = proxyquire('..', {
      child_process: {
        execFileSync: _execFileSync,
        spawn: _spawn
      },
      net: {
        Socket: _Socket
      },
      fs: {
        readFileSync: _readFileSync
      }
    });
    sandbox.stub(granax, 'tor').returns('tor');
    let tor = null;

    before(() => tor = granax());
    after(() => sandbox.restore());

    it('should return a TorController', function() {
      expect(tor).to.be.instanceOf(TorController);
    });

    it('should connect on stdout from child', function(done) {
      _proc.stdout.emit('data', 'tor is running');
      setTimeout(() => {
        expect(_socket.connect.called).to.equal(true);
        done();
      }, 1000);
    });

    it('should bubble child error on controller', function(done) {
      tor.once('error', () => done());
      setImmediate(() => _proc.emit('error', new Error('tor failed')));
    });

  });

  describe('@function tor', function() {

    let sandbox = sinon.sandbox.create();
    let _execFileSync = sandbox.stub().returns('/usr/bin/tor');
    let granax = proxyquire('..', {
      child_process: {
        execFileSync: _execFileSync
      }
    });

    after(() => sandbox.restore());

    it('should return the windows path', function() {
      expect(granax.tor('win32').includes(
        'bin/Browser/TorBrowser/Tor/tor.exe'
      )).to.equal(true);
    });

    it('should return the macintosh path', function() {
      expect(granax.tor('darwin').includes(
        'bin/.tbb.app/Contents/Resources/TorBrowser/Tor/tor'
      )).to.equal(true);
    });

    it('should return the gnu+linux path', function() {
      expect(granax.tor('linux').includes(
        'bin/tor-browser_en-US/Browser/TorBrowser/Tor/tor'
      )).to.equal(true);
      expect(granax.tor('android').includes(
        'bin/tor-browser_en-US/Browser/TorBrowser/Tor/tor'
      )).to.equal(true);
    });

    it('should throw if tor not installed on gnu_linux', function() {
      expect(function() {
        granax.tor('blackberry lol');
      }).to.throw(Error, 'Unsupported platform "blackberry lol"');
    });

    it('should throw if unsupported platform', function() {

    });

  });

});
