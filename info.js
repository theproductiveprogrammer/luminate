'use strict'

module.exports = showInfo

/*      problem/
 * We would like to expose some package properties (version number and
 * description etc).
 *
 *      understand/
 * `package.json` is a JSON so it can be pulled in with a simple
 * `require` call.
 *
 *      way/
 * Load the JSON from `package.json` and provide it when requested
 */
let packagejson = require('./package.json')

function showInfo(cfg, args, op) {
    op.out(op.chalk`{red Luminate} {gray ${packagejson.version}}`)
}

