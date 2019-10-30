'use strict';

const { expect } = require('chai');
const kadence = require('..');
const network = require('./fixtures/node-generator');
const spartacus = require('../lib/plugin-spartacus');
const { randomBytes } = require('crypto');


describe('@module kadence/spartacus + @class UDPTransport)', function() {

  kadence.constants.T_RESPONSETIMEOUT = 1000;

  let [node1, node2, node3, node4] = network(4, kadence.UDPTransport);
  let node3xpub = null;

  before(function(done) {
    kadence.constants.T_RESPONSETIMEOUT = 1000;
    [node1, node2, node3].forEach((node, i) => {
      if (i === 0) {
        node.spartacus = node.plugin(spartacus(
          null, // NB: autogenerate
          0,
          kadence.constants.HD_KEY_DERIVATION_PATH
        ));
      } else {
        node.spartacus = node.plugin(spartacus(
          kadence.utils.toExtendedFromPrivateKey(randomBytes(32)),
          0,
          kadence.constants.HD_KEY_DERIVATION_PATH
        ));
      }
      node.listen(node.contact.port);
    });
    node4.listen(node4.contact.port); // NB: Not a spartacus node
    setTimeout(done, 1000);
  });

  it('should sign and verify messages', function(done) {
    node1.ping([node2.identity.toString('hex'), node2.contact], (err) => {
      expect(err).to.equal(null);
      done();
    });
  });

  it('should sign and verify messages', function(done) {
    node2.ping([node1.identity.toString('hex'), node1.contact], (err) => {
      expect(err).to.equal(null);
      done();
    });
  });

  it('should fail to validate if reflection attack', function(done) {
    this.timeout(4000);
    node3xpub = node3.contact.xpub;
    node3.contact.xpub = 'invalid';
    node3.ping([node1.identity.toString('hex'), node1.contact], (err) => {
      expect(err.message).to.equal('Timed out waiting for response');
      done();
    });
  });

  it('should fail to validate if no response', function(done) {
    this.timeout(4000);
    node3.contact.xpub = node3xpub;
    node3.contact.port = 0;
    node1.spartacus.setValidationPeriod(0);
    node3.ping([node1.identity.toString('hex'), node1.contact], (err) => {
      expect(err.message).to.equal('Timed out waiting for response');
      done();
    });
  });

  it('should timeout and not crash if no auth payload', function(done) {
    this.timeout(4000);
    node4.ping([node2.identity.toString('hex'), node2.contact], (err) => {
      expect(err.message).to.equal('Timed out waiting for response');
      done();
    });
  });

});
