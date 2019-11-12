'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const ms = require('ms');
const { ChurnFilterPlugin } = require('../lib/plugin-churnfilter');


describe('@class ChurnFilterPlugin', function() {

  let node = {
    use: sinon.stub(),
    send: sinon.stub(),
    _updateContact: sinon.stub(),
    logger: {
      warn: sinon.stub(),
      debug: sinon.stub()
    },
    router: {
      removeContactByNodeId: sinon.stub()
    }
  };
  let blacklist = null;
  let clock = null;

  before(() => {
    clock = sinon.useFakeTimers();
    blacklist = new ChurnFilterPlugin(node);
  });

  after(() => clock.restore());

  describe('@method setBlock', function() {

    it('should create blocked with cooldown', function() {
      blacklist.setBlock('fingerprint 1');
      blacklist.setBlock('fingerprint 2');
      blacklist.setBlock('fingerprint 3');
      expect(blacklist.cooldown.size).to.equal(3);
      expect(blacklist.blocked.size).to.equal(3);
    });

    it('should multiply the cooldown time', function() {
      blacklist.setBlock('fingerprint 1');
      expect(blacklist.cooldown.get('fingerprint 1').expiration).to.not.equal(
        blacklist.cooldown.get('fingerprint 2').expiration
      );
    });

  });

  describe('@method delBlock', function() {

    it('should remove the block altogether', function() {
      blacklist.delBlock('fingerprint 3');
      expect(blacklist.blocked.size).to.equal(2);
      expect(blacklist.cooldown.size).to.equal(2);
    });

  });

  describe('@method hasBlock', function() {

    it('should expire the blocked correctly', function() {
      expect(blacklist.hasBlock('fingerprint 1')).to.equal(true);
      expect(blacklist.hasBlock('fingerprint 2')).to.equal(true);
      clock.tick(ms(blacklist.opts.cooldownBaseTimeout));
      expect(blacklist.hasBlock('fingerprint 1')).to.equal(true);
      expect(blacklist.hasBlock('fingerprint 2')).to.equal(false);
      clock.tick(ms(blacklist.opts.cooldownBaseTimeout));
      expect(blacklist.hasBlock('fingerprint 1')).to.equal(false);
    });

  });

  describe('@method resetCooldownForStablePeers', function() {

    it('should reset the cooldown multiplier for stable peers', function() {
      clock.tick(ms(blacklist.opts.cooldownResetTime) / 2);
      blacklist.setBlock('fingerprint 1');
      clock.tick(ms(blacklist.opts.cooldownResetTime) / 2);
      blacklist.resetCooldownForStablePeers();
      expect(blacklist.blocked.size).to.equal(1);
      expect(blacklist.cooldown.size).to.equal(1);
    });

  });

  describe('@method reset', function() {

    it('should clear out all blocked', function() {
      blacklist.reset();
      expect(blacklist.blocked.size).to.equal(0);
      expect(blacklist.cooldown.size).to.equal(0);
    });

  });

});
