'use strict';

const { expect } = require('chai');
const kadence = require('..');
const network = require('./fixtures/node-generator');
const trust = require('../lib/plugin-trust');
const sinon = require('sinon');
const async = require('async');


describe('@module kadence/trust + @class UDPTransport', function() {

  let clock = null;
  let [node1, node2, node3, node4] = network(4, kadence.UDPTransport);

  before(function(done) {
    this.timeout(12000);
    clock = sinon.useFakeTimers(0);
    async.eachSeries([node1, node2, node3, node4], (node, next) => {
      node.listen(node.contact.port, next);
    }, done);
  });

  after(function() {
    clock.restore();
    process._getActiveHandles().forEach((h) => h.unref());
  })

  it('should allow the whitelisted contact', function(done) {
    node2.trust = node2.plugin(trust([
      {
        identity: node1.identity,
        methods: ['PING']
      }
    ], trust.MODE_WHITELIST));
    node1.trust = node1.plugin(trust([
      {
        identity: node2.identity,
        methods: ['PING']
      }
    ], trust.MODE_WHITELIST));
    node1.send('PING', [], [
      node2.identity.toString('hex'),
      node2.contact
    ], done);
  });

  it('should prevent the blacklisted contact', function(done) {
    node3.trust = node3.plugin(trust([
      {
        identity: node1.identity,
        methods: ['PING']
      }
    ], trust.MODE_BLACKLIST));
    node1.trust.addTrustPolicy({
      identity: node3.identity,
      methods: ['*']
    })
    node1.send('PING', [], [
      node3.identity.toString('hex'),
      node3.contact
    ], err => {
      expect(err.message.includes('Refusing')).to.equal(true);
      done();
    });
  });

  it('should allow the non-blacklisted contact', function(done) {
    node2.trust.addTrustPolicy({
      identity: node3.identity.toString('hex'),
      methods: ['PING']
    })
    node2.send('PING', [], [
      node3.identity.toString('hex'),
      node3.contact
    ], done);
  });

  it('should prevent the non-whitelisted contact', function(done) {
    node4.send('PING', [], [
      node2.identity.toString('hex'),
      node2.contact
    ], err => {
      expect(err.message.includes('Refusing')).to.equal(true);
      done();
    });
  });

  it('should blacklist all nodes from using PING', function(done) {
    node3.trust.addTrustPolicy({
      identity: '*',
      methods: ['PING']
    });
    node2.send('PING', [], [
      node3.identity.toString('hex'),
      node3.contact
    ], err => {
      expect(err.message.includes('Refusing')).to.equal(true);
      node2.send('PING', [], [
        node3.identity.toString('hex'),
        node3.contact
      ], err => {
        expect(err.message.includes('Refusing')).to.equal(true);
        done();
      });
    });
  });

  it('should refuse send to node with missing trust policy', function(done) {
    node1.trust.removeTrustPolicy(node2.identity);
    node1.send('PING', [], [
      node2.identity.toString('hex'),
      node2.contact
    ], err => {
      expect(err.message.includes('Refusing')).to.equal(true);
      done();
    });
  });

  it('should allow if method is not blacklisted', function(done) {
    node2.trust.addTrustPolicy({
      identity: node3.identity,
      methods: ['PING']
    });
    node3.trust.addTrustPolicy({
      identity: node2.identity,
      methods: ['FIND_NODE']
    });
    node2.send('PING', [], [
      node3.identity,
      node3.contact
    ], done);
  });

  it('should reject if method is not whitelisted', function(done) {
    node4.trust = node4.plugin(trust([
      {
        identity: node2.identity,
        methods: ['FIND_NODE']
      }
    ], trust.MODE_WHITELIST));
    node2.trust.addTrustPolicy({
      identity: node4.identity,
      methods: ['PING']
    });
    node4.send('FIND_NODE', [], [
      node2.identity.toString('hex'),
      node2.contact
    ], err => {
      expect(err.message.includes('Refusing')).to.equal(true);
      done();
    });
  });

});
