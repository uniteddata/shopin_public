'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const eclipse = require('../lib/plugin-eclipse');
const constants = require('../lib/constants');
const utils = require('../lib/utils');
const secp256k1 = require('secp256k1');


constants.IDENTITY_DIFFICULTY = constants.TESTNET_DIFFICULTY;

describe('@module kadence/eclipse', function() {

  describe('@class EclipseRules', function() {

    const prv = utils.generatePrivateKey();
    const pub = secp256k1.publicKeyCreate(prv);

    it('should validate the contact', function(done) {
      const rules = new eclipse.EclipseRules({});
      const ident = new eclipse.EclipseIdentity(pub);
      ident.solve().then(() => {
        rules.validate({
          contact: [
            ident.fingerprint.toString('hex'),
            {
              pubkey: pub.toString('hex'),
              nonce: ident.nonce,
              proof: ident.proof.toString('hex')
            }
          ]
        }, {}, err => {
          expect(err).to.equal(undefined);
          done();
        });
      });
    });

    it('should invalidate the request', function(done) {
      const rules = new eclipse.EclipseRules({});
      rules.validate({
        contact: [
          utils.toPublicKeyHash(pub).toString('hex'),
          {}
        ]
      }, {}, err => {
        expect(err.message).to.equal(
          'Fingerprint does not match the proof hash'
        );
        done();
      });
    });

  });

  describe('@class EclipsePlugin', function() {

    const prv = utils.generatePrivateKey();
    const pub = secp256k1.publicKeyCreate(prv);
    const ident = new eclipse.EclipseIdentity(pub);

    it('should call AbstractNode#use', function() {
      const use = sinon.stub();
      eclipse(ident)({ use, contact: {} });
      expect(use.called).to.equal(true);
    });

  });

});
