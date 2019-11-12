'use strict';

const os = require('os');
const async = require('async');
const { https } = require('follow-redirects');
const semver = require('semver');
const cheerio = require('cheerio');
const base = 'https://dist.torproject.org/torbrowser';
const isAlphaVersion = /[0-9].[0-9]a[0-9]/;
const isMissingPatch = /^\d+\.\d$/;


function semverfix(ver) {
  return isMissingPatch.test(ver) ? ver + '.0' : ver;
}

/**
 * Scrapes the dist page at https://dist.torproject.org/torbrowser and returns
 * the latest stable version string
 * @param {string} [platform]
 * @param {boolean} [unstable]
 */
function getLatestTorBrowserVersion(platform = os.platform(), alpha = false) {
  return new Promise((resolve, reject) => {
    https.get(base, (res) => {
      let body = '';

      res.on('error', reject);
      res.on('data', (d) => body += d.toString());
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(body));
        }

        let $ = cheerio.load(body);
        let links = [];

        $('a[href]').each((i, link) => {
          let href = link.attribs.href;

          if (alpha) {
            if (isAlphaVersion.test(href.substr(0, href.length - 1))) {
              links.push(href.substr(0, href.length - 1));
            }
          } else if (semver.valid(semverfix(href.substr(0, href.length - 1)))) {
            links.push(href.substr(0, href.length - 1));
          }
        });

        links = alpha ? links.sort((a, b) => {
          return parseInt(b.split('a')[1]) - parseInt(a.split('a')[1])
        }) : links.sort((a, b) => semver.lt(semverfix(a), semverfix(b)));

        async.detectSeries(links, (v, done) => {
          checkPlatformSupported(v, platform)
            .then(result => done(null, result), done);
        }, (err, version) => {
          if (err) {
            reject(err);
          } else if (!version) {
            reject(new Error(`Unsupported platform "${platform}"`));
          } else {
            resolve(version);
          }
        });
      });
    }).on('error', reject);
  });
}

/**
 * Scrapes the dist page by the given tor version and returns if the platform
 * is supported by the release
 * @param {string} version
 * @param {string} platform
 */
function checkPlatformSupported(version, platform) {
  const url = `${base}/${version}`;

  if (platform === 'darwin') {
    platform = 'osx64';
  }

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = '';

      res.on('error', reject);
      res.on('data', (d) => body += d.toString());
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(body));
        }

        let $ = cheerio.load(body);
        let links = [];

        $('a[href]').each((i, link) => links.push(link.attribs.href));

        for (let link of links) {
          if (link.includes(platform)) {
            return resolve(true);
          }
        }

        resolve(false);
      });
    }).on('error', reject);
  });
}

module.exports = getLatestTorBrowserVersion;
