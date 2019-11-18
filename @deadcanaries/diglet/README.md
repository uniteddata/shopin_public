Diglet
======

[![NPM](https://img.shields.io/npm/v/diglet.svg?style=flat-square)](https://www.npmjs.com/package/@deadcanaries/diglet)
[![License](https://img.shields.io/badge/license-AGPL3.0-blue.svg?style=flat-square)](https://gitlab.com/deadcanaries/diglet/raw/master/LICENSE)

Diglet is an *fully encrypted* reverse HTTPS tunnel server and client. It 
enables you to securely make any HTTP(S) server running behind a restrictive 
NAT or firewall accessible from the internet.

Installation
------------

Diglet depends on Node.js LTS and the appropriate packages for building native 
modules for your platform.

```bash
# install nodejs via node version manager
# skip this step on windows and just install the package from nodejs.org
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash

# source node version manager
source ~/.bashrc

# install nodejs lts release
nvm install --lts

# install build dependencies (debian based)
#   apt install build-essential 
# 
# install build dependencies (macos / osx)
#   xcode-select --install
# 
# install build dependencies (windows)
#   npm install -g windows-build-tools

# install diglet using node package manager
npm install -g @deadcanaries/diglet
```

Client Tunneling
----------------

Once you have the `diglet` package installed, you can use it to establish a 
reverse tunnel from a local HTTP(S) server to a diglet server on the internet.
By default, diglet is configured to use a test server `tunnel.bookch.in`. Don't
depend on it, but if it's online you can feel free to test with it. It is 
recommended to run your own diglet server, which is described in detail in the 
next section.

Setting up a tunnel is easy. Let's say you have a website running at 
`localhost:8080`:

```bash
diglet tunnel --port 8080
```

Diglet will establish a tunnel and print your unique public URL to the console. 
If you would like more verbose logging, which can be useful for debugging, add 
the `--debug` flag to the above command. Your unique URL includes a subdomain 
that is a 160 bit hash of your public key. The private portion of this key is 
generated automatically every time you run diglet. 

If you want to re-use the same URL every time you create a tunnel, pass the 
`--save` flag and it will be saved to `$HOME/.diglet.prv` and that key will be 
used going forward when called with the `--load` option. Note that if you use a 
saved key, you must not load the same key when running multiple tunnels on the 
same host or you will get unexpected results. 

After setting up your own server, create a configuration file to reflect this 
at the path `$HOME/.digletrc`:

```
Hostname=mydomain.tld
TunnelPort=8443
```

Server Setup
------------

This guide makes a few assumptions about the providers you will use for your 
server and for your domains, however this should translate to any number of 
other providers.

### Step 1: Create a VPS on Digital Ocean

* Login or create an account at [Digital Ocean](https://digitalocean.com), then 
navigate to *Droplets > Create*. Under *Distributions*, select *Debian*.
* Diglet does not require very many resources, so you may safely select the 
cheapest option with *1 vCPU + 1GB Memory*.
* Be sure to add your SSH public key to the droplet so we are able to log into 
it when we are ready.
* Name your droplet something memorable like "diglet-server" and create it.
* When your droplet is finished being created, take note of its IP address, 
because we'll need it for the next step.

### Step 2: Setup DNS A Records on Namecheap

* Login or create an account at [Namecheap](https://namecheap.com), then either 
purchase a new domain or navigate to your existing domain list.
* Navigate to *Advanced DNS* and create a two new A records:
  * `@ -> <droplet ip address>`
  * `* -> <droplet ip address>`
* You'll want to set the TTL to the lowest available option, because we want 
this to propagate as quickly as possible so we can generate our SSL 
certificate.

### Step 3: Generate Wildcard SSL with LetsEncrypt

SSH into your droplet with `ssh root@<your droplet ip address>` and install 
LetsEncrypt's `certbot-auto` program. The version that is in the Debian 
repositories does not support wildcard certs, so you must install with:

```bash
# download the certbot program
wget https://dl.eff.org/certbot-auto

# make it executable
chmod +x certbot-auto

# request certificates for your domain and wildcard subdomain
./certbot-auto certonly --manual -d *.mydomainname.tld \ 
--agree-tos \
--no-bootstrap --manual-public-ip-logging-ok --preferred-challenges dns-01 \
-m your-email-address  \
--server https://acme-v02.api.letsencrypt.org/directory
```

Certbot will do some work and respond with something similar to:

```
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Please deploy a DNS TXT record under the name
_acme-challenge.tunnel.bookch.in with the following value:

20BbljVikhE2Hc4O6LsFoBuxUNSycRkioV2sezLnVLA

Before continuing, verify the record is deployed.
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Press Enter to Continue

```

Log back into Namecheap and navigate back to *Domain List > Domain > Advanced 
DNS* and create a new TXT record according to the instructions provided by 
certbot. Set TTL to 1 minute and save. Come back to your SSH session where 
certbot is waiting and press enter. Certbot will verify the TXT record and 
issue you a wildcard subdomain certificate and private key will be placed in 
`/etc/letsencrypt/live/mydomain.tld/`. Note that path, because you'll need it 
in the next step where we will configure our Diglet server.

### Step 4: Configure Diglet Server

Install Diglet on your droplet according to the instructions in the 
*Installation* section. Note that if you are installing and running 
diglet as root, you need to append `--unsafe-perm` to the install 
command.

Create a file called `.digletrc` in the home directory (`/root/.digletrc`),
containing the following:

```ini
Hostname = mydomain.tld
ProxyPort = 443
RedirectPort = 80
TunnelPort = 8443
ServerPrivateKey = /etc/letsencrypt/live/mydomain.tld/privkey.pem
ServerSSLCertificate = /etc/letsencrypt/live/mydomain.tld/fullchain.pem
```

Be sure to replace `mydomain.tld` with your domain name. When you are ready 
go ahead and run `diglet server` to start up your server!

#### Using a Process Manager

You can run Diglet in the background and have it restart automatically in the 
unlikely event the process crashes using the 
[`forever`](https://github.com/foreverjs/forever) package.

```bash
npm install -g forever # add --unsafe-perm if running as root
```

Then start Diglet using forever with:

```bash
forever start $(which diglet)
```

Refer to the forever documentation for more information on how to monitor your 
process.

#### Whitelisting Clients

Diglet also supports a whitelist feature that prevents arbitrary clients from
establishing tunnels. This is an optional feature that allows you to set a 
list of client tunnel identifiers in your configuration file. The identifiers 
are the RMD-160 hash of the user's public key.

For example, if you want to only allow the identity 
`3b7bc044d717e272cde960a8da782846425fd59c` to establish a tunnel, add the 
following to your `.digletrc`:

```ini
Whitelist[]=3b7bc044d717e272cde960a8da782846425fd59c
```

Repeat as many of these lines as you like to add more authorized clients.

How It Works
------------

Diglet is a relatively simple machine. It consists of only 4 classes: Server, 
Proxy, Tunnel, and Handshake. A server performs two duties: it listens for 
HTTPS requests on the internet and forwards them through a pool of tunnels 
associated with a proxy.

When a client establishes a tunnel, it connects to a TCP socket on the Diglet 
server over TLS. The server issues a challenge to the client which the client 
signs using ECDSA to authenticate it's identity. This is the handshake and if 
it's successful, the client keeps the socket open and the server adds it to a 
pool of other connections ("tunnels") from this same client.

This connection pool is associated with the client's identity key and is called 
a "proxy". When the diglet server receives a HTTPS request on the "front", it 
parses the subdomain, matches it against the currently managed proxies. If it 
finds a proxy that matches, it selects one of the open tunnels back to the 
client and pipes the incoming request through it.

On the client's end, every tunnel that is established is connected to an open 
socket to a local HTTP(S) service running on the client's computer (but not 
accessible directly over the internet). When the diglet proxy forwards an 
incoming request down the tunnel, it is received by the client and forwarded 
straight through to the client's local server which responds and the resulting 
response get piped back through the tunnel, up to the diglet server, and on 
through to the host that made the original HTTPS request.

Every connection along this path is secured with TLS, making all messages sent 
over the wire fully encrypted, even if the server running on the client's 
computer is *not* secured with SSL. Every time a a tunnel is used, it is 
disposed of and new tunnel is opened in its place. This allows for a fairly 
high number of requests to be serviced at any given moment. Diglet will even 
queue requests until a new tunnel is opened if all tunnels are exhausted or 
if the client disconnects or has a poor connection.

Diglet intentionally does not support cleartext connections and by default is 
configured to redirect all requests to port 80 to port 443. We recommend using 
the browser extension [HTTPSEverywhere](https://www.eff.org/https-everywhere), 
since this technique still allows an attacker to intercept and redirect the 
original request if HTTPS is not explicity used. Diglet does, however, modify 
the response sent back from your tunneled server to include a 
[HTTP Strict Transport Security (HSTS)](https://en.m.wikipedia.org/wiki/HTTP_Strict_Transport_Security) 
header so that there should only *ever* be a single unencrypted request that 
has to be redirected for a user *if* they mistakenly try to access your tunnel 
over HTTP.

Programmatic Usage
------------------

You can establish a reverse tunnel programmatically from other Node.js 
programs easily. Just install diglet as a dependency of your project:

```bash
npm install diglet --save
```

Import the module and use the `Tunnel` class:

```js
const { Tunnel } = require('@deadcanaries/diglet');
const options = {
  localAddress: '127.0.0.1',
  localPort: 8080,
  remoteAddress: 'mydigletserver.tld',
  remotePort: 8443,
  logger: console, // optional
  privateKey: require('crypto').randomBytes(32) // optional
};
const tunnel = new Tunnel(options);

tunnel.once('disconnected', function(err) {
  console.error(err);
});

tunnel.once('connected', function() {
  console.log(tunnel.url);
});

tunnel.open();
```

Building a Release
------------------

```bash
git clone https://gitlab.com/deadcanaries/diglet.git
cd diglet
npm install
npm run release # releases for all platforms will be in dist/
```

License
-------

Diglet - Fully Encrypted Reverse HTTPS Tunnel  
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
along with this program.  If not, see http://www.gnu.org/licenses/.


