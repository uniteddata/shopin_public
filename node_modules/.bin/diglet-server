#!/usr/bin/env node

'use strict';

const fs = require('fs');
const async = require('async');
const https = require('https');
const diglet = require('..');
const path = require('path');
const tld = require('tldjs');
const bunyan = require('bunyan');
const config = require('./_config');
const program = require('commander');

program
  .version(require('../package').version)
  .option('-d, --debug', 'show verbose logs')
  .parse(process.argv);

if (!config.ServerPrivateKey || !config.ServerSSLCertificate) {
  console.error('\n  error: no private key or certificate defined in config');
  process.exit(1);
}

const credentials = {
  key: fs.readFileSync(config.ServerPrivateKey),
  cert: fs.readFileSync(config.ServerSSLCertificate)
};
const logger = bunyan.createLogger({
  name: 'diglet-server',
  level: program.debug ? 'info' : 'error'
});
const whitelist = config.Whitelist && config.Whitelist.length
  ? config.Whitelist
  : false;
const server = new diglet.Server({ logger, whitelist, ...credentials });

function getProxyIdFromSubdomain(request) {
  let subdomain = tld.getSubdomain(request.headers.host);
  let parts = subdomain ? subdomain.split('.') : [];

  if (request.headers.host === config.Hostname) {
    return '';
  } else if (parts.length > 1) {
    return parts[0];
  } else {
    return subdomain;
  }
}

function handleServerRequest(request, response) {
  let proxyId = getProxyIdFromSubdomain(request);

  if (proxyId) {
    server.routeHttpRequest(proxyId, request, response, () => null);
  } else {
    response.writeHead(301, {
      Location: `https://gitlab.com/bookchin/diglet`
    });
    response.end();
  }
}

function handleServerUpgrade(request, socket) {
  let proxyId = getProxyIdFromSubdomain(request);

  if (!proxyId) {
    return socket.destroy();
  }

  server.routeWebSocketConnection(proxyId, request, socket, () => null);
}

const proxy = https.createServer(credentials);

proxy.on('request', handleServerRequest)
proxy.on('upgrade', handleServerUpgrade)

require('http').createServer(function(req, res) {
  res.writeHead(301, {
    Location: `https://${req.headers.host}${req.url}`
  });
  res.end();
}).listen(parseInt(config.RedirectPort));

console.info(`

   ____  _     _     _
  |    \\|_|___| |___| |_
  |  |  | | . | | -_|  _|
  |____/|_|_  |_|___|_|
          |___|

   Copyright (c) 2018, Gordon Hall
   Licensed under the GNU Affero General Public License Version 3
`);

proxy.listen(parseInt(config.ProxyPort), function() {
  console.log(
    `   Your Diglet proxy is running on port ${config.ProxyPort}`
  );
});
server.listen(parseInt(config.TunnelPort), function() {
  console.log(
    `   Your Diglet tunnel is running on port ${config.TunnelPort}`
  );
});

// NB: We do a heartbeat every minute
setInterval(() => {
  async.eachLimit([...server._proxies], 6, ([id, proxy], done) => {
    if (proxy._connectedSockets.length === 0) {
      logger.info('proxy %s has no connected sockets, destroying...', id);
      server._proxies.delete(id);
      return done();
    }

    const url = `https://${id}.${config.Hostname}:${config.ProxyPort}`;

    logger.info('sending heartbeat to %s (%s)', id, url);
    https.request({
      host: `${id}.${config.Hostname}`,
      port: parseInt(config.ProxyPort),
      headers: {
        'User-Agent': 'Diglet Heartbeat'
      }
    }, (res) => {
      res.resume();
      done();
    }).on('error', () => null);
  });
}, 60000);
