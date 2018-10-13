'use strict'

/*      section/
 * Import all the things!
 */
const StellarSdk = require('stellar-sdk')

/*      understand/
 * Provide stellar functionality
 */
module.exports = {
    status: status,
    pay: pay,
}

/*      understand/
 * Stellar 'horizon' is the gateway to the Stellar network. Stellar
 * gives us - by default - a 'test' horizon net to play and experiment
 * and the 'live' net to work with.
 *
 *      outcome/
 * Set up the correct network identifier and return the appropriate
 * stellar server.
 * TODO: How do we link to a new horizon server?
 */
const LIVE_HORIZON = "https://horizon.stellar.org/"
const TEST_HORIZON = "https://horizon-testnet.stellar.org/"
function getSvr(horizon) {
    if(horizon == 'live') {
        StellarSdk.Network.usePublicNetwork()
        return new StellarSdk.Server(LIVE_HORIZON)
    } else {
        StellarSdk.Network.useTestNetwork()
        return new StellarSdk.Server(TEST_HORIZON)
    }
}

function status(hz, acc, cb) {
    let svr = getSvr(hz)

    svr.loadAccount(acc.pub)
        .then(ai => cb(null, ai))
        .catch(err => {
            if(err.response && err.response.status == 404) {
                cb(null, { id: acc.pub, notfound: true })
            } else {
                cb(err)
            }
        })
}

function pay(hz, from, amt, to, cb) {
    let svr = getSvr(hz)
    if(!from._kp) return cb(`Account missing keypair - did you forget to load it?`)
    if(!StellarSdk.StrKey.isValidEd25519PublicKey(to.pub)) return cb(`Not a valid account: ${to.pub}`)

    cb(`from: ${JSON.stringify(from, null, 2)}, to: ${to.pub}`)
}

