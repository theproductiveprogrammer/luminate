'use strict'

/*      section/
 * Load our modules
 */
const wallet = require('./wallet')
const stellar = require('./stellar')

/*      understand/
 * By default we provide all the functions that the wallet provides as
 * well as the functions we have wrapped around the 'stellar' api.
 *
 * Developers can choose to only use the 'wallet' functionality if they
 * only need that.
 */
module.exports = {
    wallet: wallet,
    stellar: stellar,
}

