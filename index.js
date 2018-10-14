'use strict'

/*      section/
 * Load our modules
 */
const crypt = require('./crypt')
const wallet = require('./wallet')
const stellar = require('./stellar')

/*      understand/
 * For use by other programmers `luminate` provides:
 *      - `crypt`-ography functions
 *      - `wallet` management functions
 *      - `stellar` helper functions
 */
module.exports = {
    crypt: crypt,
    wallet: wallet,
    stellar: stellar,
}

