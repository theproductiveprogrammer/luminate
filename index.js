'use strict'
const u = require('./util')
const StellarSdk = require('stellar-sdk')
const nacl = require('tweetnacl')
const naclUtil = require('tweetnacl-util')
const scrypt = require('scrypt')
const prompt = require('prompt')
const path = require('path')
const fs = require('fs')


/*      outcome/
 * Do what the user (via the command line arguments) has asked us to do.
 */
function main() {
    let cfg = loadConfig()
    let do_what_user_asked = args2UserReq(cfg)
    do_what_user_asked()
}

/*      outcome/
 * Load the configuration (from environment variables) or defaults
 */
function loadConfig() {
    let cfg = {};
    if(process.env.KEYSTORE_FOLDER) {
        cfg.KEYSTORE_FOLDER = process.env.KEYSTORE_FOLDER;
    } else {
        cfg.KEYSTORE_FOLDER = "./stellar-keystore";
    }
    if(process.env.HORIZON) {
        if(process.env.HORIZON == "LIVE") {
            cfg.HORIZON = "https://horizon.stellar.org/"
        } else {
            cfg.HORIZON = process.env.HORIZON
        }
    } else {
        cfg.HORIZON = "https://horizon-testnet.stellar.org/"
    }
    return cfg;
}

/*      problem/
 * The user wants to ask us to somethings with different parameters
 *
 *      understand/
 * `process.argv` contains an array with
 *  a) The path to Nodejs binary
 *  b) The path to the javascript file being executed
 *  c) Additional user arguments...
 *
 *      way/
 * We get rid of the path to nodejs and the file being executed and look
 * to see if we understand the first command. If we do, we pass the rest
 * of the arguments to the command. If we don't understand, we return a
 * function that informs the user that we don't.
 */
function args2UserReq(cfg) {
    const keypairHelp = `keypair management:\n\t\t- new\n\t\t- list`
    const argmap = [
        { rx: /keypair/, fn: keypairCmd, help: "Show keypairs", help: keypairHelp },
        { rx: /-h|--help|help/, fn: () => showHelp(argmap), help: "Show help" },
    ];

    process.argv.shift()
    process.argv.shift()

    let cmd = process.argv[0]
    if(!cmd) return doNothing

    process.argv.shift()
    for(let i = 0;i < argmap.length;i++) {
        if(cmd.match(argmap[i].rx)) {
            return () => argmap[i].fn(cfg, process.argv)
        }
    }
    return () => didNotUnderstand(cmd)
}

function doNothing() {}

function didNotUnderstand(cmd) {
    u.showMsg(`Did not understand: '${cmd}'`)
}

function keypairCmd(cfg, cmd) {
    if(cmd == "new") return newKeypair(cfg)
    if(cmd == "list") return listKeypairs(cfg)
    didNotUnderstand(cmd)
}

/*      outcome/
 * Find matching keypair files under the cfg.KEYSTORE_FOLDER and show
 * their information.
 */
function listKeypairs(cfg) {
    u.showMsg(`Listing keypairs from: ${cfg.KEYSTORE_FOLDER}`)
    fs.readdir(cfg.KEYSTORE_FOLDER, 'utf8', (err, files) => {
        if(err) u.showErr(err)
        else {
            files = files.filter(f => f.match(/^UTC-.*\.stellar$/))
            show_keypairs_1(files)
        }
    })


    /*      outcome/
     * If there are keypair files we assume they all share the same
     * password so we ask the user for the password and use it to open
     * each file in turn recursively.
     */
    function show_keypairs_1(files) {
        withPassword((err, pw) => {
            if(err) u.showErr(err)
            else show_ndx_keypair_1(pw, files, 0)
        })


        /*      outcome/
         * Read in the file data for the current index, convert to a
         * `secret` JSON object and use it to show keypair information
         * before moving to the next index.
         */
        function show_ndx_keypair_1(pw, files, ndx) {
            if(ndx >= files.length) return

            let f = files[ndx]
            u.showMsg(`\n\n\n\nKeypair File: ${f}\n========================`)

            let p = path.join(cfg.KEYSTORE_FOLDER, f)
            fs.readFile(p, 'utf8', (err, data) => {
                if(err) u.showErr(err)
                else {
                    try {
                        let secret = JSON.parse(data)
                        showKeypairInfo(cfg, pw, secret, (err) => {
                            if(err) u.showErr(err)
                            show_ndx_keypair_1(pw, files, ndx+1)
                        })
                    } catch (e) {
                        u.showErr(e)
                    }
                }
            })
        }
    }
}

/*      outcome/
 * Use the password to decrypt the keypair info in the secret and show
 * it along with information about the keypair account on the stellar
 * network.
 */
function showKeypairInfo(cfg, pw, secret, cb) {
    password2key(secret.salt, pw, (err, key) => {
        if(err) cb(err)
        else {
            let dec = decode(secret.keypair, secret.nonce, key)
            if(!dec) cb('Incorrect password!')
            else {
                let kp = str2Keypair(dec)
                u.withIndent(() => showKeypair(kp))
                cb(null)
            }
        }
    })
}

/*      outcome/
 * Create a new Stellar account keypair, encrypt it with a password got
 * from the user and save it
 */
function newKeypair(cfg) {
    u.showMsg("Generating new keypair...")
    u.ensureExists(cfg.KEYSTORE_FOLDER, (err, path_) => {
        let kp = StellarSdk.Keypair.random()
        let serial = keypair2Str(kp)
        let secret = {
            pkg: 'tweetnacl',
            nonce: createNonce(),
            salt: createSalt(),
        }
        u.withIndent(() => {
            u.showMsg("Please provide a secure password to encrypt your keypair")
            u.showMsg("WARNING: IF YOU FORGET THIS PASSWORD YOUR KEYPAIR CANNOT BE DECRYPTED!")
        })
        withPassword((err, password) => {
            if(err) u.showErr(err)
            else {
                password2key(secret.salt, password, (err, key) => {
                    if(err) u.showErr(err)
                    else {
                        let enc = encode(serial, secret.nonce, key)
                        secret.keypair = enc;
                        saveKeypair(cfg, kp.publicKey(), secret, (err) => {
                            if(err) u.showErr(err)
                            else u.withIndent(() => {
                                u.showMsg(`New keypair generated!`)
                                showKeypair(kp)
                            })
                        })
                    }
                })
            }
        })
    })
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

function showKeypair(kp) {
    u.showMsg(`Public Key: ${kp.publicKey()}`)
    u.showMsg(`Secret: ${kp.secret()}`)
}

function saveKeypair(cfg, pub, kp, cb) {
    let dt = new Date().toISOString()
    let fname = `UTC-${dt}-${pub}.stellar`
    let p = path.join(cfg.KEYSTORE_FOLDER, fname)
    fs.writeFile(p, JSON.stringify(kp), 'utf-8', cb)
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

/*      outcome/
 * Prompt the user for a password and provide it to the callback
 */
function withPassword(cb) {
    prompt.message = ""
    prompt.start()
    prompt.get({
        properties: {
            password: {
                description: 'Enter password',
                hidden: true,
            }
        }
    }, (err, res) => {
        if(err) cb(err)
        else {
            if(!res.password) cb('Please provide a password')
            else cb(null, res.password)
        }
    })
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

/*      outcome/
 * Use the argmap to show a help message directly converting the regular
 * expression to a string (and removing the start/end slashes so that
 * `/reg.*ex/` becomes `reg.*ex`) and showing the associated help
 * message.
 */
function showHelp(argmap) {
    u.showMsg("Help")
    for(let i = 0;i < argmap.length;i++) {
        let cmd = argmap[i].rx.toString()
        cmd = cmd.substr(1).substr(0,cmd.length-2)
        u.showMsg(`\t${cmd}: ${argmap[i].help}\n`)
    }
}

main()
