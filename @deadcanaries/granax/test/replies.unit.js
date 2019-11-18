'use strict';

const replies = require('../lib/replies');
const { expect } = require('chai');


describe('@module:granax/replies', function() {

  describe('AUTHCHALLENGE', function() {

    it('should return hash+nonce', function() {
      let result = replies.AUTHCHALLENGE(
        ['AUTHCHALLENGE SERVERHASH=hash SERVERNONCE=nonce']
      );
      expect(result.hash).to.equal('hash');
      expect(result.nonce).to.equal('nonce');
    });

    it('should return hash', function() {
      let result = replies.AUTHCHALLENGE(
        ['AUTHCHALLENGE SERVERHASH=hash']
      );
      expect(result.hash).to.equal('hash');
    });

  });

  describe('PROTOCOLINFO', function() {

    it('should return auth, protocol, version', function() {
      let result = replies.PROTOCOLINFO([
        'PROTOCOL 1',
        'AUTH METHODS=COOKIE,SAFECOOKIE COOKIEFILE=/path/to/cookie with/space',
        'VERSION Tor="0.2.9.10"'
      ]);
      expect(result.protocol).to.equal('1');
      expect(result.version.tor).to.equal('0.2.9.10');
      expect(result.auth.methods[0]).to.equal('COOKIE');
      expect(result.auth.methods[1]).to.equal('SAFECOOKIE');
      expect(result.auth.cookieFile).to.equal('/path/to/cookie with/space');
    });

    it('should return auth, protocol, version', function() {
      let result = replies.PROTOCOLINFO([
        'PROTOCOL 1',
        'AUTH METHODS=COOKIE,SAFECOOKIE COOKIEFILE=/path/to/cookie',
        'VERSION Tor="0.2.9.10"'
      ]);
      expect(result.protocol).to.equal('1');
      expect(result.version.tor).to.equal('0.2.9.10');
      expect(result.auth.methods[0]).to.equal('COOKIE');
      expect(result.auth.methods[1]).to.equal('SAFECOOKIE');
      expect(result.auth.cookieFile).to.equal('/path/to/cookie');
    });

    it('should return auth, protocol, version', function() {
      let result = replies.PROTOCOLINFO([
        'PROTOCOL 1',
        'AUTH METHODS=PASSWORD',
        'VERSION Tor="0.2.9.10"'
      ]);
      expect(result.protocol).to.equal('1');
      expect(result.version.tor).to.equal('0.2.9.10');
      expect(result.auth.methods[0]).to.equal('PASSWORD');
      expect(result.auth.cookieFile).to.equal(null);
    });

  });

  describe('ADD_ONION', function() {

    it('should return the service id and private key', function() {
      let result = replies.ADD_ONION([
        'ServiceID=myonionaddress',
        'PrivateKey=someprivatekey'
      ]);
      expect(result.serviceId).to.equal('myonionaddress');
      expect(result.privateKey).to.equal('someprivatekey');
    });

    it('should return the service id', function() {
      let result = replies.ADD_ONION([
        'ServiceID=myonionaddress'
      ]);
      expect(result.serviceId).to.equal('myonionaddress');
    });

  });

  describe('GETCONF', function() {

    it('should return the value portions', function() {
      let result = replies.GETCONF([
        'SomeKey=value1',
        'SomeKey=value2'
      ]);
      expect(result[0]).to.equal('value1');
      expect(result[1]).to.equal('value2');
    });

  });

  describe('GETINFO', function() {

    it('should return multiline strings', function() {
      let result = replies.GETINFO([
        'SomeKey=valuestart',
        'SomeKey=valuemiddle',
        'SomeKey=valueend'
      ]);
      expect(result).to.equal('valuestart\nvaluemiddle\nvalueend');
    });

    it('should return singleline strings', function() {
      let result = replies.GETINFO(['SomeKey=someValue']);
      expect(result).to.equal('someValue');
    });

  });

});
