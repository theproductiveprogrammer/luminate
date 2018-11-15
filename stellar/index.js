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
    activate: activate,
    pay: pay,
    listAssets: listAssets,
    setTrustline: setTrustline,
    revokeTrustline: revokeTrustline,
    setFlags: setFlags,
    clearFlags: clearFlags,
    allowTrust: allowTrust,
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

function activate(hz, from, amt, acc, cb) {
    let svr = getSvr(hz)
    if(!from._kp) return cb(`Account missing keypair - did you forget to load it?`)
    if(!StellarSdk.StrKey.isValidEd25519PublicKey(acc.pub)) return cb(`Not a valid account: ${acc.pub}`)

    svr.loadAccount(from.pub)
        .then(ai => {
            let txn = new StellarSdk.TransactionBuilder(ai)
                .addOperation(StellarSdk.Operation.createAccount({
                    destination: acc.pub,
                    startingBalance: amt,
                }))
                .build()
            txn.sign(from._kp)
            return svr.submitTransaction(txn)
        })
        .then(txnres => cb(null, txnres))
        .catch(cb)
}


function pay(hz, from, asset, amt, to, cb) {
    let svr = getSvr(hz)
    if(!from._kp) return cb(`Account missing keypair - did you forget to load it?`)
    if(!StellarSdk.StrKey.isValidEd25519PublicKey(to.pub)) return cb(`Not a valid account: ${to.pub}`)

    status(hz, from, (err, ai) => {
        if(err) cb(err)
        else {
            with_stellar_asset_1(from, asset, (err, asset_) => {
                let txn = new StellarSdk.TransactionBuilder(ai)
                    .addOperation(StellarSdk.Operation.payment({
                        destination: to.pub,
                        asset: asset_,
                        amount: amt,
                    }))
                    .build()
                txn.sign(from._kp)
                svr.submitTransaction(txn)
                    .then(txnres => cb(null, txnres))
                    .catch(cb)
            })
        }
    })

    function with_stellar_asset_1(from, asset, cb) {
        if(asset.toLowerCase() == 'xlm') {
            cb(null, StellarSdk.Asset.native())
        } else {
            with_matching_issuer_1(hz, asset, ai, to, (err, issuer) => {
                if(err) cb(err)
                else cb(null, StellarSdk.Asset(asset, issuer))
            })
        }
    }

    /*      understand/
     * In order to pay from a destination account, the account must
     * contain a balance of that asset or be the issuer of that asset.
     *
     *      situtation/
     * The user has asked to pay with a certain asset (say 'CAR').
     *
     *      problem/
     * We also need to know who is responsible for issuing these
     * 'CAR's.
     *
     *      way/
     * We look into the account balances to find a matching asset of
     * type 'CAR'. The balance will contain the issuer which we can then
     * return. If we find more than one match we fail (we don't want to
     * return the wrong asset! Better, in this case, to force the user
     * to specify the issuer manually)
     * If we still fail, perhaps this account is the issuer of the
     * asset so we look in the destination account to check if that is
     * the case.
     */
    function with_matching_issuer_1(hz, asset, ai, dest, cb) {
        let issuer
        for(let i = 0;i < ai.balances.length;i++) {
            let b = ai.balances[i]
            if(b.asset_code == asset) {
                if(issuer) return cb(`More than one matching asset: "${asset}"`)
                issuer = b.asset_issuer
            }
        }
        if(issuer) return cb(null, issuer)
        status(hz, dest, (err, dai) => {
            if(err) cb(err)
            else {
                for(let i = 0;i < dai.balances.length;i++) {
                    let b = dai.balances[i]
                    if(b.asset_code == asset &&
                        b.asset_issuer == ai.id) {
                        return cb(null, b.asset_issuer)
                    }
                }
                cb(`No matching asset found for: "${asset}"`)
            }
        })
    }
}


/*      outcome/
 * Load assets along with their issuers from the Stellar network and
 * provide them to the callback.
 */
function listAssets(hz, out, err) {
    let svr = getSvr(hz)
    svr.assets()
        .call()
        .then(show_asset_1)
        .catch(err)

    function show_asset_1(a) {
        if(a.records) {
            for(let i = 0;i < a.records.length;i++) {
                out(a.records[i])
            }
        }
        if(a.next) {
            a.next()
            .then(show_asset_1)
            .catch(err)
        }
    }
}

function setTrustline(hz, for_, assetcode, issuer, cb) {
    try {
        let svr = getSvr(hz)
        let asset = new StellarSdk.Asset(assetcode, issuer)
        let op = { asset : asset }
        svr.loadAccount(for_.pub)
            .then(ai => {
                let txn = new StellarSdk.TransactionBuilder(ai)
                    .addOperation(StellarSdk.Operation.changeTrust(op))
                    .build()
                txn.sign(for_._kp)
                return svr.submitTransaction(txn)
            })
            .then(txnres => cb(null, txnres))
            .catch(cb)
    } catch(e) {
        cb(e)
    }
}

function revokeTrustline(hz, for_, assetcode, issuer, cb) {
    try {
        let svr = getSvr(hz)
        let asset = new StellarSdk.Asset(assetcode, issuer)
        let op = { asset : asset, limit: "0" }
        svr.loadAccount(for_.pub)
            .then(ai => {
                let txn = new StellarSdk.TransactionBuilder(ai)
                    .addOperation(StellarSdk.Operation.changeTrust(op))
                    .build()
                txn.sign(for_._kp)
                return svr.submitTransaction(txn)
            })
            .then(txnres => cb(null, txnres))
            .catch(cb)
    } catch(e) {
        cb(e)
    }
}

function setFlags(hz, for_, flags, cb) {
    try {
        let svr = getSvr(hz)
        let op = { setFlags: flags }
        svr.loadAccount(for_.pub)
            .then(ai => {
                let txn = new StellarSdk.TransactionBuilder(ai)
                    .addOperation(StellarSdk.Operation.setOptions(op))
                    .build()
                txn.sign(for_._kp)
                return svr.submitTransaction(txn)
            })
            .then(txnres => cb(null, txnres))
            .catch(cb)
    } catch (e) {
        cb(e)
    }
}

function clearFlags(hz, for_, flags, cb) {
    try {
        let svr = getSvr(hz)
        let op = { clearFlags: flags }
        svr.loadAccount(for_.pub)
            .then(ai => {
                let txn = new StellarSdk.TransactionBuilder(ai)
                    .addOperation(StellarSdk.Operation.setOptions(op))
                    .build()
                txn.sign(for_._kp)
                return svr.submitTransaction(txn)
            })
            .then(txnres => cb(null, txnres))
            .catch(cb)
    } catch (e) {
        cb(e)
    }
}

function allowTrust(hz, for_, assetcode, to_, allow, cb) {
    try {
        let svr = getSvr(hz)
        let op = { trustor: to_, assetCode: assetcode, authorize: allow }
        svr.loadAccount(for_.pub)
            .then(ai => {
                let txn = new StellarSdk.TransactionBuilder(ai)
                    .addOperation(StellarSdk.Operation.allowTrust(op))
                    .build()
                txn.sign(for_._kp)
                return svr.submitTransaction(txn)
            })
            .then(txnres => cb(null, txnres))
            .catch(cb)
    } catch(e) {
        cb(e)
    }
}
