latest-torbrowser-version
=========================

get the latest stable semver tag for tor browser on your platform.

```
npm install latest-torbrowser-version
```

```js
const platform = require('os').platform(); // linux, darwin, win32
const alpha = false; // get latest alpha version
const getLatestTorBrowserVersion = require('latest-torbrowser-version');

getLatestTorBrowserVersion(platform, alpha)
  .then(console.info, console.error);
```
