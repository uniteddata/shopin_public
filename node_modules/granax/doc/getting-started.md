When Granax is installed on Mac OSX or Windows platforms, it will automatically
download a copy of the Tor Browser Bundle locally and use it - 
**no configuration required!** On GNU+Linux systems, Granax expects the `tor` 
package to be installed.

Granax will start Tor with a custom `torrc` file that can be found in 
`lib/torrc.js`, however if you prefer to use a custom `torrc` or a different 
Tor executable, follow this guide. This guide assumes you are running 
[Debian](https://debian.org) or a derivitive, however it should translate 
easily to any other operating system.

### Step 0: Install Tor

Use your system's package manager to install the latest Tor release:

```
sudo apt install tor
```

> See [https://www.torproject.org/docs/installguide.html.en](https://www.torproject.org/docs/installguide.html.en)

### Step 1: Give User Access

On Debian systems, Tor is compartmentalized for security. You'll need to be 
able to read Tor's authentication cookie file. There are a couple ways to do 
this without running Granax as root.

Run your program as the `debian-tor` user:

```
sudo -u debian-tor /path/to/nodejs granax/examples/hidden-service.js
```

Add your user to the `debian-tor` group:

```
sudo adduser $USER debian-tor
```

Then log out and back in and Granax will be able to access Tor's control
interface.

### Step 2: Enable Tor's Control Interface

By default, Tor does not enable the control port, so you must enable it in 
your `torrc` file. 

```
sudo vim /etc/tor/torrc
```

> Don't know where your `torrc` is? 
> See [https://www.torproject.org/docs/faq#torrc](https://www.torproject.org/docs/faq#torrc)

Find the section that contains the text below.

```
## The port on which Tor will listen for local connections from Tor
## controller applications, as documented in control-spec.txt.
#ControlPort 9051
## If you enable the controlport, be sure to enable one of these
## authentication methods, to prevent attackers from accessing it.
#HashedControlPassword 16:872860B76453A77D60CA2BB8C1A7042072093276A3D701AD684053EC4C
#CookieAuthentication 1
```

And uncomment `ControlPort 9051` and `CookieAuthentication 1`.

```
## The port on which Tor will listen for local connections from Tor
## controller applications, as documented in control-spec.txt.
ControlPort 9051
## If you enable the controlport, be sure to enable one of these
## authentication methods, to prevent attackers from accessing it.
#HashedControlPassword 16:872860B76453A77D60CA2BB8C1A7042072093276A3D701AD684053EC4C
CookieAuthentication 1
```

Write the changes and restart Tor.

```
sudo /etc/init.d/tor restart
```

### Step 3: Hack The Planet

Now that you have a running Tor, configured to allow your user to access it's 
control port, you can integrate Tor into your own packages using Granax!

```
const { connect } = require('net');
const { TorController } = require('granax');
const tor = new TorController(connect(9051));

tor.on('ready', function() {
  // Tor controller is ready!
});
```

Happy hacking!
