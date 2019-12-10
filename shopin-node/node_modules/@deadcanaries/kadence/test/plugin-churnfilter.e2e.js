'use strict';

const async = require('async');
const { expect } = require('chai');
const network = require('./fixtures/node-generator');
const kadence = require('..');
const churnfilter = require('../lib/plugin-churnfilter');


describe('@module kadence/churnfilter + @class UDPTransport', function() {

  let timeout = null;
  let node1, node2, node3, node4;

  before(function(done) {
    timeout = kadence.constants.T_RESPONSETIMEOUT;
    kadence.constants.T_RESPONSETIMEOUT = 200;
    [node1, node2, node3, node4] = network(4, kadence.HTTPTransport);
    [node1, node2, node3, node4].forEach((node) => {
      node.blacklist = node.plugin(churnfilter());
      node.listen(node.contact.port);
    });
    setTimeout(done, 200);
  });

  after(() => kadence.constants.T_RESPONSETIMEOUT = timeout);

  it('should allow nodes to enter the routing table', function(done) {
    this.timeout(10000);
    async.eachOf([node3, node4, node1, node2], function(node, i, done) {
      if (i === 3) {
        node.join([node4.identity, node4.contact], done);
      } else {
        node.join([node2.identity, node2.contact], done);
      }
    }, function() {
      expect(node1.router.size).to.equal(3);
      expect(node2.router.size).to.equal(3);
      expect(node3.router.size).to.equal(3);
      expect(node4.router.size).to.equal(3);
      expect(node1.blacklist.hasBlock(node3.identity)).to.equal(false);
      expect(node2.blacklist.hasBlock(node3.identity)).to.equal(false);
      expect(node3.blacklist.hasBlock(node3.identity)).to.equal(false);
      expect(node4.blacklist.hasBlock(node3.identity)).to.equal(false);
      done();
    });
  });

  it('should block node 3 from entering the routing table', function(done) {
    node3.transport.server.close();
    this.timeout(10000);
    async.eachOf([node3, node4, node1, node2], function(node, i, done) {
      if (i === 3) {
        node.join([node4.identity, node4.contact], done);
      } else {
        node.join([node2.identity, node2.contact], done);
      }
    }, function() {
      expect(node1.router.size).to.equal(2);
      expect(node2.router.size).to.equal(2);
      expect(node3.router.size).to.equal(3);
      expect(node4.router.size).to.equal(2);
      expect(node1.blacklist.hasBlock(node3.identity)).to.equal(true);
      expect(node2.blacklist.hasBlock(node3.identity)).to.equal(true);
      expect(node3.blacklist.hasBlock(node3.identity)).to.equal(false);
      expect(node4.blacklist.hasBlock(node3.identity)).to.equal(true);
      done();
    });
  });

});
