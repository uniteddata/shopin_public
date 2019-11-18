hsv3
====

convenience wrapper for establishing version 3 tor hidden services

install
-------

as a dependency of your own package

```
npm install @deadcanaries/hsv3
```

as a standalone command line tool

```
npm install @deadcanaries/hsv3 --global
```

usage
-----

```
const hsv3 = require('@deadcanaries/hsv3');

const tor = hsv3([
  {
    dataDirectory,
    virtualPort: 80,
    localMapping: '127.0.0.1:8099'
  }
]);

tor.on('error', console.error).on('ready', () => {
  console.info('hidden service v3 established',
    fs.readFileSync(path.join(dataDirectory, 'hostname')).toString());
});
```

```
$ hsv3 --datadir /tmp/hsv3-test --virtport 80 --mapping 127.0.0.1:8080
```

license
-------

HSV3 - Tor Hidden Services Version 3 Wrapper for Node.js  
Copyright (C) 2019 Dead Canaries, Inc.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.

