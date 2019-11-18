'use strict';

const commands = require('../lib/commands');
const { expect } = require('chai');


describe('@module:granax/commands', function() {

  describe('AUTHENTICATE', function() {

    it('should return auth message with token', function() {
      expect(commands.AUTHENTICATE('token')).to.equal(
        'AUTHENTICATE token'
      );
    });

  });

  describe('AUTHCHALLENGE', function() {

    it('should return auth challenge message', function() {
      expect(commands.AUTHCHALLENGE('nonce')).to.equal(
        'AUTHCHALLENGE SAFECOOKIE nonce'
      );
    });

  });

  describe('PROTOCOLINFO', function() {

    it('should return protocol info message', function() {
      expect(commands.PROTOCOLINFO()).to.equal('PROTOCOLINFO');
    });

  });

  describe('ADD_ONION', function() {

    it('should return add onion message with basic auth', function() {
      expect(commands.ADD_ONION([{target: '127.0.0.1:8080'}], {
        clientName: 'user',
        clientBlob: 'pass',
        basicAuth: true
      })).to.equal(
        'ADD_ONION NEW:BEST Flags=BasicAuth Port=80,127.0.0.1:8080 ' +
          'ClientAuth=user:pass'
      );
    });

    it('should return add onion message', function() {
      expect(commands.ADD_ONION([{target: '127.0.0.1:8080'}])).to.equal(
        'ADD_ONION NEW:BEST Port=80,127.0.0.1:8080'
      );
    });

    it('should return add onion message with multiple ports', function() {
      const ports = [
        {target: '127.0.0.1:8080'},
        {virtualPort: 8070, target: '127.0.0.1:8090'}
      ];
      expect(commands.ADD_ONION(ports)).to.equal(
        'ADD_ONION NEW:BEST Port=80,127.0.0.1:8080 Port=8070,127.0.0.1:8090'
      );
    });

    it('should return add onion message with given single port', function() {
      expect(commands.ADD_ONION([{virtualPort: 8080}])).to.equal(
        'ADD_ONION NEW:BEST Port=8080'
      );
    });

    it('should return add onion message with default port', function() {
      expect(commands.ADD_ONION([])).to.equal(
        'ADD_ONION NEW:BEST Port=80'
      );
    });

    describe('ports as string and virtualport in options', function() {

      it('should return add onion message', function() {
        expect(commands.ADD_ONION('127.0.0.1:8080')).to.equal(
          'ADD_ONION NEW:BEST Port=80,127.0.0.1:8080'
        );
      });

      it('should return add onion message with correct vport', function() {
        expect(commands.ADD_ONION('127.0.0.1:8080',{
          virtualPort: 8080
        })).to.equal(
          'ADD_ONION NEW:BEST Port=8080,127.0.0.1:8080'
        );
      });

    })

  });

  describe('DEL_ONION', function() {

    it('should return del onion message', function() {
      expect(commands.DEL_ONION('serviceid')).to.equal(
        'DEL_ONION serviceid'
      );
    });

  });

  describe('SETCONF', function() {

    it('should return set config message', function() {
      expect(commands.SETCONF('key', 'value')).to.equal(
        'SETCONF key="value"'
      );
    });

  });

  describe('RESETCONF', function() {

    it('should return reset config message', function() {
      expect(commands.RESETCONF('key')).to.equal('RESETCONF key');
    });

  });

  describe('GETCONF', function() {

    it('should return get config message', function() {
      expect(commands.GETCONF('key')).to.equal('GETCONF key');
    });

  });

  describe('SAVECONF', function() {

    it('should return save config message', function() {
      expect(commands.SAVECONF()).to.equal('SAVECONF');
    });

  });

  describe('SIGNAL', function() {

    it('should return signal message', function() {
      expect(commands.SIGNAL('signal')).to.equal('SIGNAL signal');
    });

  });

  describe('MAPADDRESS', function() {

    it('should return map address message', function() {
      expect(commands.MAPADDRESS('target.tld', 'replace.tld')).to.equal(
        'MAPADDRESS target.tld=replace.tld'
      );
    });

  });

  describe('EXTENDCIRCUIT', function() {

    it('should return extend circuit with purpose', function() {
      expect(commands.EXTENDCIRCUIT('circuitid', 'general')).to.equal(
        'EXTENDCIRCUIT circuitid purpose="general"'
      );
    });

    it('should return extend circuit', function() {
      expect(commands.EXTENDCIRCUIT('circuitid')).to.equal(
        'EXTENDCIRCUIT circuitid'
      );
    });

  });

  describe('SETCIRCUITPURPOSE', function() {

    it('should return set circuit purpose message', function() {
      expect(commands.SETCIRCUITPURPOSE('circuitid', 'general')).to.equal(
        'SETCIRCUITPURPOSE circuitid purpose="general"'
      );
    });

  });

  describe('ATTACHSTREAM', function() {

    it('should return attach stream message with hop', function() {
      expect(commands.ATTACHSTREAM('streamid', {
        circuitId: 'circuitid',
        hopNumber: 2
      })).to.equal(
        'ATTACHSTREAM streamid circuitid HOP=2'
      );
    });

    it('should return attach stream message', function() {
      expect(commands.ATTACHSTREAM('streamid', { circuitId: 0 })).to.equal(
        'ATTACHSTREAM streamid 0'
      );
    });

  });

  describe('POSTDESCRIPTOR', function() {

    it('should return post descriptor message with cache', function() {
      expect(commands.POSTDESCRIPTOR({
        key: 'value',
        beep: 'boop'
      })).to.equal(
        '+POSTDESCRIPTOR purpose=general cache=yes\r\n' +
          'key=value\r\nbeep=boop\r\n.'
      );
    });

    it('should return post descriptor message without cache', function() {
      expect(commands.POSTDESCRIPTOR({
        key: 'value',
        beep: 'boop'
      }, { cache: false, purpose: 'controller' })).to.equal(
        '+POSTDESCRIPTOR purpose=controller cache=no\r\n' +
          'key=value\r\nbeep=boop\r\n.'
      );
    });

  });

  describe('REDIRECTSTREAM', function() {

    it('should return redirect stream message', function() {
      expect(commands.REDIRECTSTREAM('streamid', '127.0.0.1', 8080)).to.equal(
        'REDIRECTSTREAM streamid 127.0.0.1 8080'
      );
    });

  });

  describe('CLOSESTREAM', function() {

    it('should return close stream message', function() {
      expect(commands.CLOSESTREAM('streamid')).to.equal(
        'CLOSESTREAM streamid 1'
      );
    });

  });

  describe('CLOSECIRCUIT', function() {

    it('should return close circuit message if unused', function() {
      expect(commands.CLOSECIRCUIT('circuitid', { ifUnused: true })).to.equal(
        'CLOSECIRCUIT circuitid IfUnused'
      );
    });

    it('should return close circuit message', function() {
      expect(commands.CLOSECIRCUIT('circuitid')).to.equal(
        'CLOSECIRCUIT circuitid'
      );
    });

  });

  describe('QUIT', function() {

    it('should return quit message', function() {
      expect(commands.QUIT()).to.equal('QUIT');
    });

  });

  describe('RESOLVE', function() {

    it('should return resolve message', function() {
      expect(commands.RESOLVE('some.host.name')).to.equal(
        'RESOLVE some.host.name'
      );
    });

    it('should return reverse resolve message', function() {
      expect(commands.RESOLVE('some.host.name', true)).to.equal(
        'RESOLVE mode=reverse some.host.name'
      );
    });

  });

  describe('LOADCONF', function() {

    it('should return load config message', function() {
      expect(commands.LOADCONF('my config text file')).to.equal(
        '+LOADCONF\r\nmy config text file\r\n.'
      );
    });

  });

  describe('TAKEOWNERSHIP', function() {

    it('should return take ownership message', function() {
      expect(commands.TAKEOWNERSHIP()).to.equal('TAKEOWNERSHIP');
    });

  });

  describe('DROPGUARDS', function() {

    it('should return drop guards message', function() {
      expect(commands.DROPGUARDS()).to.equal('DROPGUARDS');
    });

  });

  describe('HSFETCH', function() {

    it('should return hidden service fetch message', function() {
      expect(commands.HSFETCH('onionurl')).to.equal('HSFETCH onionurl');
    });

    it('should return hidden service fetch message with server', function() {
      expect(commands.HSFETCH('onionurl', 'servername')).to.equal(
        'HSFETCH onionurl SERVER=servername'
      );
    });

  });

  describe('HSPOST', function() {

    it('should return hidden service post message', function() {
      expect(commands.HSPOST('my descriptor')).to.equal(
        '+HSPOST\r\nmy descriptor\r\n.'
      );
    });

    it('should return hidden service post message with server', function() {
      expect(commands.HSPOST('my descriptor', 'servername')).to.equal(
        '+HSPOST\r\nSERVER=servername\r\nmy descriptor\r\n.'
      );
    });

  });

  describe('GETINFO', function() {

    it('should return get info message', function() {
      expect(commands.GETINFO('keyword')).to.equal('GETINFO keyword');
    });

  });

  describe('SETEVENTS', function() {

    it('should return set events message', function() {
      expect(commands.SETEVENTS(['DEBUG', 'ADDRMAP', 'TEST'])).to.equal(
        'SETEVENTS DEBUG ADDRMAP TEST'
      );
    });

  });

});
