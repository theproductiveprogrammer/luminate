'use strict'

/*      section/
 * Import all the things!
 */
const StellarSdk = require('stellar-sdk')
const path = require('path')
const fs = require('fs')
const base32 = require('base32')

const crypt = require('./crypt')

/*      outcome/
 * This module provides an embedded 'wallet' functionality - the ability
 * to create and manage accounts that are mapped to names and contain
 * password protected secret keys.
 */
module.exports = {
    create: create,
    list: list,
    find: find,
    load: load,
    importSecret: importSecret,
}

/*      outcome/
 * Creates a new account in the wallet with the given name.
 */
function create(pw, wallet, name, cb) {
    if(!pw) return cb("Need Password")
    if(!wallet) return cb("Need wallet folder")
    if(!name) return cb("Need name of account")

    try {
        let kp = StellarSdk.Keypair.random()
        createWalletAccount(pw, wallet, name, kp, cb)
    } catch(e) {
        cb(e)
    }
}

/*      outcome/
 * Imports an existing secret into the wallet.
 */
function importSecret(pw, wallet, name, secret, cb) {
    if(!pw) return cb("Need Password")
    if(!wallet) return cb("Need wallet folder")
    if(!name) return cb("Need name of account")
    if(!StellarSdk.StrKey.isValidEd25519SecretSeed(secret)) return cb("Invalid secret")

    try {
        let kp = StellarSdk.Keypair.fromSecret(secret)
        createWalletAccount(pw, wallet, name, kp, cb)
    } catch(e) {
        cb(e)
    }
}


/*      outcome/
 * Create a wallet and save the given keypair as the named account.
 */
function createWalletAccount(pw, wallet, name, kp, cb) {
    ensureExists(wallet, (err) => {
        if(err) cb(err)
        else create_account_1(kp, name, pw, wallet, cb)
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
            nonce: crypt.createNonce(),
            salt: crypt.createSalt(),
        }
        crypt.password2key(account.salt, password, (err, key) => {
            if(err) cb(err)
            else {
                account.secret = crypt.encrypt(kp.secret(), account.nonce, key)
                saveWalletAccount(wallet, account, (err) => {
                    if(err) cb(err)
                    else cb(null, account)
                })
            }

        })
    }
}

/*      outcome/
 * Save the current account to the wallet in a file with the following
 * format:
 *      <Name>-<Public Key>-<crc>.stellar
 */
function saveWalletAccount(wallet, account, cb) {
    let crc = crcPublic(account.pub)
    if(!crc) cb(`Failed generating crc for ${account.pub}`)
    let fname = `${account.label}-${account.pub}-${crc}.stellar`
    let p = path.join(wallet, fname)
    fs.access(p, fs.constants.F_OK, (err) => {
        if(!err) cb(`Wallet account ${fname} already exists`)
        else fs.writeFile(p, JSON.stringify(account,null,2), 'utf-8', cb)
    });
}

function list(wallet, cb) {
    ensureExists(wallet, (err) => {
        if(err) cb(err)
        else {
            fs.readdir(wallet, 'utf8', (err, files) => {
                if(err) cb(err)
                else {
                    let accum = {
                        accs: [],
                        errs: [],
                    }
                    load_accs_1(files, 0, accum)
                }
            })
        }
    })

    /*      outcome/
     * Recursively load each file into `accs`, failing which put
     * it into the `errs`.
     */
    function load_accs_1(files, ndx, accum) {
        if(ndx >= files.length) return cb(null, accum.accs, accum.errs)
        let file = files[ndx]
        let m = file.match(/(.*)-(.*)-(.*)\.stellar/)
        if(!m) {
            accum.errs.push(file)
            load_accs_1(files, ndx+1, accum)
        } else {
            let name = m[1]
            let pub = m[2]
            let crc = m[3]
            if(crc != crcPublic(pub)) {
                accum.errs.push(file)
                load_accs_1(files, ndx+1, accum)
            } else {
                fs.readFile(path.join(wallet,file), 'utf8', (err, data) => {
                    if(err) {
                        accum.errs.push(file)
                        load_accs_1(files, ndx+1, accum)
                    } else {
                        try {
                            data = JSON.parse(data)
                            accum.accs.push({
                                name: name,
                                pub: pub,
                                data: data,
                                file: file,
                            })
                            load_accs_1(files, ndx+1, accum)
                        } catch(e) {
                            accum.errs.push(file)
                            load_accs_1(files, ndx+1, accum)
                        }
                    }
                })
            }
        }
    }
}

/*      outcome/
 * Returns the first matching account in the wallet (returns nothing if
 * not matched)
 */
function find(wallet, name, cb) {
    list(wallet, (err, accs) => {
        if(err) cb(err)
        else {
            for(let i = 0;i < accs.length;i++) {
                let acc = accs[i]
                if(acc.name == name) return cb(null, acc)
                if(acc.pub == name) return cb(null, acc)
            }
            cb()
        }
    })
}

/*      outcome/
 * Finds and loads the first matching account in the wallet (including
 * the full keypair - public and secret keys).
 */
function load(pw, wallet, acc, cb) {
    list(wallet, (err, accs) => {
        if(err) cb(err)
        else {
            for(let i = 0;i < accs.length;i++) {
                let acc_ = accs[i]
                if(acc_.name == acc) return load_secret_1(acc_.data)
            }
            cb(`Account "${acc}' not found in wallet`)
        }
    })

    function load_secret_1(account) {
        crypt.password2key(account.salt, pw, (err, key) => {
            if(err) cb(err)
            else {
                let secret = crypt.decrypt(account.secret, account.nonce, key)
                if(!secret) cb(`Incorrect password`)
                else {
                    try {
                        account._kp = StellarSdk.Keypair.fromSecret(secret)
                        cb(null, account)
                    } catch(e) {
                        cb(e)
                    }
                }
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
    else if(p[0] == '') { // Absolute path
        p.shift()
        p[0] = path.sep + p[0]
    }
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

/*      outcome/
 * Create a CRC of the public key so it's not easy to tamper with.
 */
function crcPublic(pub) {
    try {
        return base32.encode(StellarSdk.StrKey.decodeEd25519PublicKey(pub))
    } catch(e) {}
}
