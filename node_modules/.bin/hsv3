#!/usr/bin/env node

'use strict';

const path = require('path');
const fs = require('fs');
const program = require('commander');
const hsv3 = require('./index');


program
  .version(require('./package').version)
  .description('wrapper for ad-hoc establishing version 3 tor hidden services')
  .option('-d, --datadir <path>', 'hidden service data directory')
  .option('-p, --virtport <port>', 'virtual port for hidden service')
  .option('-m, --mapping <ip:port>', 'target to expose as hidden service')
  .option('-l, --log', 'passthrough tor process logging')
  .parse(process.argv);

const receivedValidOptions = program.datadir && program.virtport &&
  program.mapping;

if (!receivedValidOptions) {
  program.help();
  process.exit(1);
}

const tor = hsv3([
  {
    dataDirectory: path.join(program.datadir, 'hidden_service'),
    virtualPort: program.virtport,
    localMapping: program.mapping
  }
], {
  DataDirectory: program.datadir
});

tor.on('error', (err) => {
  console.error('  ');
  console.error('  ' + err.message);
  process.exit(1);
});

tor.on('ready', () => {
  const hostname = fs.readFileSync(path.join(program.datadir,
    'hidden_service', 'hostname')).toString();

  console.info('  ');
  console.info('  V3 Hidden Service Established: ' + hostname);

  if (program.log) {
    console.info('  ');
    tor.process.stdout.pipe(process.stdout);
  }
});
