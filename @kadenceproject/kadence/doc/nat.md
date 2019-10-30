One of the most frustrating and daunting problems when deploying a distributed 
network to users is dealing with NAT (or "[Network Address Translation](https://en.wikipedia.org/wiki/Network_address_translation)". 
Kadence provides a plugin for traversing these systems with mulitple strategies 
and is capable of breaking out of just about any network (albeit sometimes at 
the expensive of performance).

This functionality is encapsulated in the {@link module:kadence/traverse} 
plugin, which initializes a {@link module:kadence/traverse~TraversePlugin}. 
This plugin makes use of the {@link module:kadence/traverse~TraverseStrategy} 
instances that are passed to it. At the time of writing, Kadence supports 
UPnP, NAT-PMP, and a fallback reverse HTTPS tunneling mechanism (for use with 
the {@link HTTPSTransport} and {@link HTTPTransport}).

#### Using the Plugin

Generally, you'll want to use all of the available strategies, but since some 
strategies may only work with certain transports, you must explicity define 
them when calling the plugin.

```js
const node = new kadence.KademliaNode(options); // See "Getting Started"

node.spartacus = node.plugin(kadence.spartacus()); // Optional, but recommended

node.traverse = node.plugin(kadence.traverse([ // List in order of attempt
  new kadence.traverse.UPNPStrategy({
    mappingTtl: 0, // Means keep this mapping until unmapped
    publicPort: node.contact.port // The public port to map
  }),
  new kadence.traverse.NATPMPStrategy({
    mappingTtl: 0, // Means keep this mapping until unmapped
    publicPort: node.contact.port // The public port to map
  }),
  new kadence.traverse.ReverseTunnelStrategy({
    remoteAddress: 'tunnel.bookch.in', // Hostname of a Diglet server
    remotePort: 8443, // Tunnel port of a Diglet server
    verboseLogging: false, // If debuggin, set to `true`
    secureLocalConnection: false, // Set to `true` if using HTTPSTransport
    privateKey: node.spartacus.privateKey // Uses identity for tunnel routing
  })
]));
```

In the example above, we are assuming use of the {@link HTTPTransport}. When 
the method {@link KademliaNode#listen} is called, this plugin will execute 
each strategy in the order they are defined until one of them successfully 
traverses the NAT and becomes public on the internet. If all of them fail, a
message will indicate that you are not addressable.

The UPnP and NAT-PMP strategies attempt to instruct the router / NAT device 
to forward a port to internet. Sometimes this is a feature that must be 
enabled on the router itself and sometimes it is not supported at all - either 
by the device or the ISP.

The reverse tunnel strategy works by establishing an outbound connection to a 
[Diglet server](https://gitlab.com/bookchin/diglet) which acts as a reverse 
proxy back to your node on the outbound connection. By default, the plugin will 
use a test server, but this may or may not be online or functioning at any 
given time. The recommendation is to run your own Diglet server, which is very 
simple to set up. Ideally, your users should each run their own Diglet server 
to prevent dense centralization around a single tunnel, however this is 
generally unreasonable to expect so it's good to bake in a rotating list of 
public Diglet servers into your code.
