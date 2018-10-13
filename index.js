'use strict'
const StellarSdk = require('stellar-sdk')
const nacl = require('tweetnacl')
const naclUtil = require('tweetnacl-util')
const scrypt = require('scrypt')

const path = require('path')
const fs = require('fs')

module.exports = {
    create: create,
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
     * Create a `secret` structure that holds account information in the
     * wallet. Encrypt this by generating a key from the user's
     * password.
     */
    function create_account_1(kp, name, password, wallet, cb) {
        let serial = keypair2Str(kp)
        let secret = {
            label: name,
            pub: kp.publicKey(),
            pkg: 'tweetnacl',
            nonce: createNonce(),
            salt: createSalt(),
        }
        password2key(secret.salt, password, (err, key) => {
            if(err) cb(err)
            else {
                let enc = encode(serial, secret.nonce, key)
                secret.keypair = enc
                saveSecret(wallet, secret, (err) => {
                    if(err) cb(err)
                    else cb(null, secret.pub)
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
 * Save the current secret to the wallet in a file with the following
 * format:
 *      <Name>-<Public Key>.stellar
 */
function saveSecret(wallet, secret, cb) {
    let fname = `${secret.label}-${secret.pub}.stellar`
    let p = path.join(wallet, fname)
    fs.writeFile(p, JSON.stringify(secret,null,2), 'utf-8', cb)
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

/*      outcome/
 * Convert the keypair to a string by JSON-encoding it.
 */
function keypair2Str(kp) {
    return JSON.stringify(kp)
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
