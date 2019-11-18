'use strict';

const proxyquire = require('proxyquire');
const { expect } = require('chai');
const sinon = require('sinon');


describe('@module granax/torrc', function() {

  describe('@exports', function() {

    it('should write the torrc to tmp', function() {
      const _mkdirpSync = sinon.stub();
      const _writeFileSync = sinon.stub();
      const torrc = proxyquire('../lib/torrc', {
        mkdirp: {
          sync: _mkdirpSync
        },
        fs: {
          writeFileSync: _writeFileSync
        }
      });
      const result = torrc();
      expect(_mkdirpSync.called).to.equal(true);
      expect(_writeFileSync.called).to.equal(true);
      expect(typeof result[0]).to.equal('string');
      expect(typeof result[1]).to.equal('string');
      expect(Array.isArray(result)).to.equal(true);
    });

  });

});
