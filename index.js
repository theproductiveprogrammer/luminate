'use strict'

/*      section/
 * Import all the things!
 */
const StellarSdk = require('stellar-sdk')
const nacl = require('tweetnacl')
const naclUtil = require('tweetnacl-util')
const scrypt = require('scrypt')
const base32 = require('base32')

const path = require('path')
const fs = require('fs')

/*      understand/
 * Provide functionality from this module
 */
module.exports = {
    create: create,
    list: list,
    status: status,
}

function list(wallet, cb) {
    fs.readdir(wallet, 'utf8', (err, files) => {
        if(err) cb(err)
        else {
            let accs = []
            let errs = []
            for(let i = 0;i < files.length;i++) {
                let m = files[i].match(/(.*)-(.*)-(.*)\.stellar/)
                if(!m) errs.push(files[i])
                else {
                    let name = m[1]
                    let pub = m[2]
                    let crc = m[3]

                    try {
                        let validate = crcPublic(pub)
                        if(crc != crcPublic(pub)) errs.push(files[i])
                        else accs.push({
                            name: m[1],
                            pub: m[2],
                        })
                    } catch(e) {
                        errs.push(files[i])
                    }

                }
            }
            cb(null, accs, errs)
        }
    })
}

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

function status(wallet, hz, acc, cb) {
    let svr = getSvr(hz)
    if(!acc) cb(`No account provided`)

    getPub(wallet, acc, (err, name, pub) => {
        if(err) cb(err)
        else {
            svr.loadAccount(pub)
                .then(ai => cb(null, wn_1(ai)))
                .catch(err => {
                    if(err.response && err.response.status == 404) {
                        cb(null, wn_1({ id: pub }))
                    } else {
                        cb(err)
                    }
                })


            function wn_1(o) {
                if(name) o._name = name
                return o
            }
        }
    })
}

/*      outcome/
 * Returns the public key for the given account - either a mapping of a
 * wallet account or the actual key itself.
 */
function getPub(wallet, acc, cb) {
    list(wallet, (err, accs) => {
        if(err) cb(err)
        else {
            for(let i = 0;i < accs.length;i++) {
                let acc_ = accs[i]
                if(acc_.name == acc) return cb(null, acc_.name, acc_.pub)
            }
            cb(null, null, acc)
        }
    })
}

function create(pw, wallet, from, amt, name, cb) {
    if(!pw) return cb("Need Password")
    if(!wallet) return cb("Need wallet folder")
    if(!name) return cb("Need name of account")

    ensureExists(wallet, (err) => {
        if(err) cb(err)
        else {
            let kp = StellarSdk.Keypair.random()
            create_account_1(kp, name, pw, wallet, cb)
        }
    })

    /*      outcome/
     * Create a structure that holds account information in the
     * wallet. Encrypt this by generating a key from the user's
     * password.
     */
    function create_account_1(kp, name, password, wallet, cb) {
        let account = {
            label: name,
            pub: kp.publicKey(),
            pkg: 'tweetnacl',
            nonce: createNonce(),
            salt: createSalt(),
        }
        password2key(account.salt, password, (err, key) => {
            if(err) cb(err)
            else {
                account.secret = encode(kp.secret(), account.nonce, key)
                saveWalletAccount(wallet, account, (err) => {
                    if(err) cb(err)
                    else cb(null, account.pub)
                })
            }

        })
    }
}

/*      outcome/
 * Create the folders in the path by creating each path in turn
 */
function ensureExists(path_, cb) {
    try {
        path_ = path.normalize(path_)
    } catch(err) {
        return cb(err)
    }
    let p = path_.split(path.sep)
    if(p[0] == '.') p.shift() // Don't create current directory
    ensure_exists_1(p, 1)

    function ensure_exists_1(p, upto) {
        if(p.length < upto) cb(null, path_)
        else {
            let curr = path.join.apply(path, p.slice(0,upto))
            fs.mkdir(curr, '0777', (err) => {
                if (err && err.code != 'EEXIST') cb(err)
                else ensure_exists_1(p, upto+1)
            })
        }
    }
}

/*      problem/
 * The `scrypt` package provides a `params` function that is supposed to
 * wrap the parameters we require. However, using it somehow makes the
 * parameters sometimes fail and scrypt crashes with `invalid
 * parameters`.
 *
 *      way/
 * As a work-around I have seen multiple places directly specifying
 * parameters. I copied one of their paramters and thus 'solved' the
 * problem for now
 */
const latestScryptOptions = {
    N: 16384,
    r: 8,
    p: 1,
    dkLen: nacl.secretbox.keyLength,
    encoding: 'binary'
};
function password2key(salt, password, cb) {
    scrypt.hash(password, latestScryptOptions, nacl.secretbox.keyLength, salt, cb)
}

/*      outcome/
 * Save the current account to the wallet in a file with the following
 * format:
 *      <Name>-<Public Key>-<crc>.stellar
 */
function saveWalletAccount(wallet, account, cb) {
    let crc = crcPublic(account.pub)
    let fname = `${account.label}-${account.pub}-${crc}.stellar`
    let p = path.join(wallet, fname)
    fs.writeFile(p, JSON.stringify(account,null,2), 'utf-8', cb)
}

/*      outcome/
 * Create a CRC of the public key so it's not easy to tamper with.
 */
function crcPublic(pub) {
    return base32.encode(StellarSdk.StrKey.decodeEd25519PublicKey(pub))
}

/*      problem/
 * We have a serialized string that contains object information. Like
 * all objects we now have a problem bringing them 'to life' (JSON
 * doesn't understand our object types).
 *
 *      way/
 * We recognize 'Buffer' types and convert them during the parse cycle.
 * Then we create a `StellarSdk.Keypair` using our internal keypair to
 * create the appropriate object. Then we use `Object.assign` to replace
 * all it's internal fields with the data from our de-serialized object
 * which (hopefully) keeps it a valid `StellarSdk.Keypair` but
 * containing our data.
 */
function str2Keypair(str) {
    let kp_ = JSON.parse(str, (k, v) => {
            if (
                v !== null            &&
                typeof v === 'object' &&
                'type' in v           &&
                v.type === 'Buffer'   &&
                'data' in v           &&
                Array.isArray(v.data)) {
                return Buffer.from(v.data);
            }
            return v;
    })
    let kp = new StellarSdk.Keypair({
        type: 'ed25519',
        publicKey: kp_._publicKey,
    })

    return Object.assign(kp, kp_)
}

function createNonce() {
    return naclUtil.encodeBase64(nacl.randomBytes(nacl.secretbox.nonceLength))
}

function createSalt() {
    return naclUtil.encodeBase64(nacl.randomBytes(32))
}

/*      outcome/
 * Encode the given string using the given nonce
 */
function encode(str, nonce, password) {
    let v = naclUtil.decodeUTF8(str)
    let n = naclUtil.decodeBase64(nonce)
    return naclUtil.encodeBase64(nacl.secretbox(v, n, password))
}

/*      outcome/
 * Decode the given string using the given password and nonce (return
 * false if decoding fails).
 */
function decode(enc, nonce, password) {
    let v = naclUtil.decodeBase64(enc)
    let n = naclUtil.decodeBase64(nonce)
    let dec = nacl.secretbox.open(v, n, password)
    if(!dec) return dec
    else return naclUtil.encodeUTF8(dec)
}
