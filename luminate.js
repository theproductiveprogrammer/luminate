#!/usr/bin/env node
'use strict'
const u = require('./util')
const StellarSdk = require('stellar-sdk')
const nacl = require('tweetnacl')
const naclUtil = require('tweetnacl-util')
const scrypt = require('scrypt')
const read = require('read')
const path = require('path')
const fs = require('fs')


/*      outcome/
 * Load the configuration, set up the stellar network, and then do what
 * the user (via the command line arguments) has asked us to do.
 */
function main() {
    let cfg = loadConfig()
    if(cfg.DEBUG) u.setDbgOn()
    setupStellarNetwork(cfg)
    let do_what_user_asked = args2UserReq(cfg)
    do_what_user_asked()
}

/*      outcome/
 * Load the configuration (from environment variables) or defaults
 */
function loadConfig() {
    let cfg = {};
    cfg.DEBUG = process.env.DEBUG
    if(process.env.KEYSTORE_FOLDER) {
        cfg.KEYSTORE_FOLDER = process.env.KEYSTORE_FOLDER;
    } else {
        cfg.KEYSTORE_FOLDER = "./stellar-keystore"
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

/*      outcome/
 * Set up the stellar network id based on if it is the test network or
 * the public network.
 * TODO: Why? What happens if we have a different network (not testnet
 * or stellar public horizon) is unclear.
 */
function setupStellarNetwork(cfg) {
    if(cfg.HORIZON == "https://horizon.stellar.org/") {
            StellarSdk.Network.usePublicNetwork()
    } else {
            StellarSdk.Network.useTestNetwork()
    }
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
    const argmap = [
        { rx: /status/, fn: showStatus },
        { rx: /new/, fn: newAccount },
        { rx: /create/, fn: createAccount },
        { rx: /add/, fn: addAccount },
        { rx: /trust/, fn: manageTrustline },
        { rx: /-h|--help|help/, fn: showHelp },
    ];

    process.argv.shift()
    process.argv.shift()

    let cmd = process.argv[0]
    if(!cmd) return showHelp

    process.argv.shift()
    for(let i = 0;i < argmap.length;i++) {
        if(cmd.match(argmap[i].rx)) {
            return () => argmap[i].fn(cfg, process.argv)
        }
    }
    return () => didNotUnderstand(cmd)
}

function didNotUnderstand(cmd) {
    if(!cmd) cmd = ""
    u.showErr(`Did not understand: '${cmd}'`)
}

function manageTrustline(cfg, cmds) {
    let revoke = false
    if(cmds[0] == "-revoke" || cmds[0] == "--revoke") {
        revoke = true
        cmds.shift()
    }

    let acc = cmds[0]
    let code = cmds[1]
    let issuer = cmds[2]

    if(!issuer) return u.showErr(`!Error: Invalid parameters`)

    let verbose = false

    loadSecrets(verbose, cfg, (err, secrets) => {
        if(err) u.showErr(err)
        else {
            matchSecret(secrets, acc, (err, secret) => {
                if(err) u.showErr(err)
                else {
                    withPassword((err, pw) => {
                        if(err) u.showErr(err)
                        else decodeSecretInfo(pw, secret, (err, s) => {
                            if(err) u.showErr(err)
                            else {
                                if(revoke) {
                                    u.showMsg(`Removing trustline from ${s.pub} for ${code} from ${issuer}`)
                                } else {
                                    u.showMsg(`Setting up trustline for ${s.pub} to allow ${code} from ${issuer}`)
                                }
                                addTrustline(cfg, revoke, s, code, issuer, (err) => {
                                    if(err) u.showErr(err)
                                    else {
                                        if(revoke) u.showMsg(`Trustline revoked`)
                                        else u.showMsg(`Trustline added`)
                                    }
                                })
                            }
                        })
                    })
                }
            })
        }
    })


}

/*      outcome/
 * Create (and fund) an account on the stellar network using the funds
 * from an account in our wallet.
 */
function createAccount(cfg, cmds) {
    let verbose = true
    if(cmds[0] == '-q') {
        verbose = false
        cmds.shift()
    }

    if(cmds.length != 3) return u.showErr(`!Error: Incorrect parameters`)
    let acc = cmds[0]
    let funds = cmds[1]
    let src = cmds[2]

    create_account_1(funds, acc, src)

    /*      outcome/
     * Find the matching account from our wallet and create the new
     * account (which should generally also be in our wallet unless we
     * are creating an account for someone else).
     * Create a stellar account with these accounts.
     */
    function create_account_1(funds, acc, src) {
        loadSecrets(verbose, cfg, (err, secrets) => {
            if(err) {
                if(verbose) u.showErr(err)
                else u.showErr(`!Error`)
            } else {
                matchSecret(secrets, acc, (err, acc_) => {
                    if(err) {
                        if(verbose) {
                            u.showMsg(`!Warning: You are creating an account (${acc}) that is not in the wallet and managed by you`)
                            read({
                                prompt: "Are you sure you want to proceed?(yes/*):",
                            }, (err, res) => {
                                if(err) {
                                    if(verbose) u.showErr(err)
                                } else {
                                    if(res !== "yes") {
                                        create_account_2_1(secrets, acc)
                                    }
                                }
                            })
                        } else {
                            create_account_2_1(secrets, acc)
                        }
                    } else {
                        create_account_2_1(secrets, acc_.pub)
                    }
                })
            }
        })

        function create_account_2_1(secrets, acc) {
            matchSecret(secrets, src, (err, secret) => {
                if(err) u.showErr(err)
                else create_stellar_account_1(secret, acc)
            })
        }

        /*      understand/
         * Stellar accounts need to be funded before they are allowed on
         * the network. Therefore we need use a source account from our
         * wallet to fund it.
         *
         *      outcome/
         * Open the wallet account and use it to fund the newly created
         * `acc` on the stellar network.
         */
        function create_stellar_account_1(src, acc) {
            withPassword((err, pw) => {
                if(err) {
                    if(verbose) u.showErr(err)
                    else u.showErr(`!Error`)
                } else {
                    decodeSecretInfo(pw, src, (err, src_) => {
                        if(err) {
                            if(verbose) u.showErr(err)
                            else u.showErr(`!Error: bad password`)
                        } else {
                            if(verbose) u.showMsg(`Creating ${acc} on the stellar network with ${funds} from ${src_.pub}`)
                            createStellarAccount(cfg, acc, funds, src_,(err) => {
                                if(err) {
                                    if(verbose) u.showErr(err)
                                    else u.showErr(`!Error`)
                                } else {
                                    u.showMsg(`Account ${acc} created on stellar`)
                                }
                            })
                        }
                    })
                }
            })
        }
    }
}

/*      situation/
 * The user wants to select an account from the wallet.
 *
 *      outcome/
 * We look for matching secrets in the wallet and - if exactly one is
 * found - that must be the one the user is looking for
 */
function matchSecret(secrets, secret, cb) {
    secrets = filterSecrets(secrets, [secret])
    if(secrets.length == 0) cb(`${secret} does not match any wallet account`)
    else if(secrets.length != 1) cb(`${secret} matches multiple wallet accounts`)
    else cb(null, secrets[0])
}

/*      outcome/
 * Given an existing account (we prove we have access because we have
 * the secret key) we create a keypair and add it to our wallet to
 * manage.
 */
function addAccount(cfg, cmds) {
    let verbose = false
    if(cmds[0] == '-v') {
        verbose = true
        cmds.shift()
    }
    let secret = cmds[0]
    if(!secret) u.showErr(`Provide secret to add to wallet`)
    else {
        u.showMsg(`Adding account to the wallet...`)
        try {
            let kp = StellarSdk.Keypair.fromSecret(secret)
            addAccountKP(cfg, verbose, kp)
        } catch(e) {
            u.showErr(e)
        }
    }
}

/*      outcome/
 * Check if we want to be verbose or silent and then create a new
 * account in the wallet.
 */
function newAccount(cfg, cmds) {
    let verbose = cmds[0] != '-q'
    if(verbose) u.showMsg(`Adding a new account to the wallet...`)
    try {
        let kp = StellarSdk.Keypair.random()
        addAccountKP(cfg, verbose, kp)
    } catch(e) {
        if(verbose) u.showErr(e)
        else u.showErr(`!Error`)
    }
}

/*      outcome/
 * Add a keypair to the wallet
 */
function addAccountKP(cfg, verbose, kp) {
    u.ensureExists(cfg.KEYSTORE_FOLDER, (err) => {
        if(err) {
            if(verbose) u.showErr(err)
            else u.showErr(`!Error creating wallet folder: ${cfg.KEYSTORE_FOLDER}`)
        } else {
            new_account_1(kp, cfg.KEYSTORE_FOLDER, verbose)
        }
    })

    /*      outcome/
     * Get the label for this account, and the password to encrypt it
     * from the user. Create the account in the wallet.
     */
    function new_account_1(kp, wallet, verbose) {
        if(verbose) u.showMsg(`Please provide a name for the new account`)
        read({
            prompt: "Name:",
        }, (err, name) => {
            if(err) {
                if(verbose) u.showErr(err)
                else u.showErr(`!Error`)
            } else {
                if(!name) u.showError('Please provide a name')
                else {
                    if(verbose) {
                        u.withIndent(() => {
                            u.showMsg("Please provide a secure password to encrypt your keypair")
                            u.showMsg("WARNING: IF YOU FORGET THIS PASSWORD YOUR KEYPAIR CANNOT BE DECRYPTED!")
                        })
                    }
                    withPassword((err, pw) => {
                        if(err) {
                            if(verbose) u.showErr(err)
                            else u.showErr(`!Error`)
                        } else {
                            create_account_1(kp, name, pw, wallet, (err, secret) => {
                                if(err) {
                                    if(verbose) u.showErr(err)
                                    else u.showErr(`!Error`)
                                } else {
                                    decodeSecretInfo(pw, secret, (err, s) => {
                                        if(err) {
                                            if(verbose) u.showErr(err)
                                            else u.showErr(`!Error`)
                                        } else {
                                            showSecretInfo(cfg, verbose, s, () => {})
                                        }
                                    })
                                }
                            })
                        }
                    })
                }
            }
        })
    }

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
                    else cb(null, secret)
                })
            }

        })
    }
}

/*      outcome/
 * We check the parameters given by the user to see if we need to be
 * verbose (`-v`) or limit ourselves to specific accounts (listed on
 * command line). Then we show the status of the matching secrets in our
 * wallet.
 */
function showStatus(cfg, cmds) {
    let verbose = false
    let accs = []
    for(let i = 0;i < cmds.length;i++) {
        if(cmds[i] == '-v') verbose = true
        else accs.push(cmds[i])
    }
    loadSecrets(verbose, cfg, (err, secrets) => {
        if(err) {
            if(!verbose) {
                u.showErr(`!Error loading wallet. Use verbose (-v) flag to see details`)
            } else {
                u.showErr(err)
            }
        } else {
            if(!secrets || !secrets.length) showNoAccountsMsg(cfg, verbose)
            else {
                secrets = filterSecrets(secrets, accs)
                show_secrets_status_1(verbose, secrets)
            }
        }
    })

    /*      outcome/
     * Given account secrets we assume they all share the same
     * password so we ask the user for a password and use it try and
     * open each file in turn recursively.
     */
    function show_secrets_status_1(verbose, secrets) {
        if(!secrets || !secrets.length) {
            if(verbose) u.showErr(`No matching accounts found in wallet`)
            return
        }
        withPassword((err, pw) => {
            if(err) {
                if(verbose) u.showErr(err)
                else u.showErr(`!Error getting password`)
            } else {
                show_secret_ndx_1(pw, 0)
            }
        })

        function show_secret_ndx_1(pw, ndx) {
            if(ndx < secrets.length) {
                decodeSecretInfo(pw, secrets[ndx], (err, s) => {
                    if(err) {
                        if(verbose) u.showErr(err)
                        else u.showErr(`!Error: ${secrets[ndx].label}`)
                        show_secret_ndx_1(pw, ndx+1)
                    } else {
                        showSecretInfo(cfg, verbose, s, () => {
                            show_secret_ndx_1(pw, ndx+1)
                        })
                    }
                })
            }
        }
    }
}

/*      outcome/
 * Find maching secrets for the listed accounts.
 */
function filterSecrets(secrets, accs) {
    if(!accs || !accs.length) return secrets
    let r = []
    for(let i = 0;i < accs.length;i++) {
        filter_secrets_1(accs[i])
    }
    return r

    function filter_secrets_1(acc) {
        for(let i = 0;i < secrets.length;i++) {
            if(does_match_1(acc, secrets[i])) add_if_new_1(secrets[i])
        }
    }

    /*      outcome/
     * Check if the user has specified the label of the account OR the
     * first few characters of the id (public key)
     */
    function does_match_1(acc, secret) {
        if(acc == secret.label) return true
        if(acc.length < 4) return false
        return secret.pub.startsWith(acc)
    }

    function add_if_new_1(secret) {
        for(let i = 0;i < r.length;i++) {
            if(r[i] == secret) return
        }
        r.push(secret)
    }
}

/*      outcome/
 * Read all the encrypted account info from the wallet folder
 */
function loadSecrets(verbose, cfg, cb) {
    if(verbose) u.showMsg(`Loading accounts from: ${cfg.KEYSTORE_FOLDER}`)
    fs.readdir(cfg.KEYSTORE_FOLDER, 'utf8', (err, files) => {
        if(err) {
            if(err.code == 'ENOENT') cb()
            else cb(err)
        } else {
            load_secrets_1(files.filter(f => f.match(/^UTC-.*\.stellar$/)), cb)
        }
    })

    function load_secrets_1(files, cb) {
        let secrets = []
        load_secret_ndx_1(0)

        function load_secret_ndx_1(ndx) {
            if(ndx >= files.length) cb(null, secrets)
            else {
                let p = path.join(cfg.KEYSTORE_FOLDER, files[ndx])
                fs.readFile(p, 'utf8', (err, data) => {
                    if(err) cb(err)
                    else {
                        try {
                            let secret = JSON.parse(data)
                            secrets.push(secret)
                            load_secret_ndx_1(ndx+1)
                        } catch(e) {
                            if(verbose) u.showErr(`Failed parsing ${p}`)
                            cb(e)
                        }
                    }
                })
            }
        }
    }
}

/*      outcome/
 * Use the given password to decrypt the account info in the secret
 */
function decodeSecretInfo(pw, secret, cb) {
    password2key(secret.salt, pw, (err, key) => {
        if(err) cb(err)
        else {
            let dec = decode(secret.keypair, secret.nonce, key)
            if(!dec) {
                cb(`!Error: Incorrect password for: ${secret.label}`)
            } else {
                try {
                    secret._kp = str2Keypair(dec)
                    cb(null, secret)
                } catch(e) {
                    cb(e)
                }
            }
        }
    })
}

/*      outcome/
 * Get information about the account from the stellar network and show
 * the account information.
 */
function showSecretInfo(cfg, verbose, secret, cb) {
    getStellarInfo(cfg, secret._kp.publicKey(), (err,si) => {
        if(verbose) {
            if(err) u.showErr(err)
            else show_full_secret_info_1(secret, si)
        } else {
            if(err) u.showErr(`!Error getting info for: ${secret.label}`)
            else show_simple_secret_info_1(secret, si)
        }
        cb()
    })

    function show_full_secret_info_1(secret, si) {
        u.showMsg(`\n\nAccount ${secret.label}:`)
        u.withIndent(() => {
            u.showMsg(`Public Id: ${secret._kp.publicKey()}`)
            u.showMsg(`Secret: ${secret._kp.secret()}`)
            if(!si) u.showMsg(`***Account not on stellar network***`)
            else u.showObj(u.publicVals(si))
        })
    }

    function show_simple_secret_info_1(secret, si) {
        if(!si) {
            u.showMsg(`${secret.label}\t${secret._kp.publicKey()}\tNOTFOUND`)
        } else {
            let b = get_balances_1(si)
            u.showMsg(`${secret.label}\t${secret._kp.publicKey()}\t${b}`)
        }
    }

    function get_balances_1(si) {
        if(!si.balances || !si.balances.length) return
        let b = si.balances.map(b => `${b.balance} ${t(b)}`)
        return `[${b.join(",")}]`

        function t(b) {
            if(b.asset_type == 'native') return 'XLM'
            return b.asset_type
        }
    }
}


/*      outcome/
 * Get status of the account on the stellar network
 */
function getStellarInfo(cfg, acc, cb) {
    let svr = new StellarSdk.Server(cfg.HORIZON)
    svr.loadAccount(acc)
        .then(ai => cb(null, ai))
        .catch(err => {
            if(err.response && err.response.status == 404) cb()
            else cb(err)
        })
}

/*      outcome/
 * Create account on the stellar network
 */
function createStellarAccount(cfg, acc, funds, src, cb) {
    let svr = new StellarSdk.Server(cfg.HORIZON)
    svr.loadAccount(src.pub)
        .then(ai => {
            let txn = new StellarSdk.TransactionBuilder(ai)
                .addOperation(StellarSdk.Operation.createAccount({
                    destination: acc,
                    startingBalance: funds,
                }))
                .build()
            txn.sign(src._kp)
            return svr.submitTransaction(txn)
        })
        .then(txnres => cb(null, txnres))
        .catch(cb)
}

/*      understand/
 * The stellar network allows us to trade in multiple asset types
 * (currencies?). In order to signal that we are willing to participate
 * in a currency, we need to signal that we 'trust' the issuer by
 * setting up a "trustline" for that issuer and currency.
 *
 *      outcome/
 * Add (or revoke) a trustline to an asset
 */
function addTrustline(cfg, revoke, acc, code, issuer, cb) {
    try {
        let asset = new StellarSdk.Asset(code, issuer)
        let svr = new StellarSdk.Server(cfg.HORIZON)
        let op = { asset : asset }
        if(revoke) op.limit = "0"
        svr.loadAccount(acc.pub)
            .then(ai => {
                let txn = new StellarSdk.TransactionBuilder(ai)
                    .addOperation(StellarSdk.Operation.changeTrust(op))
                    .build()
                txn.sign(acc._kp)
                return svr.submitTransaction(txn)
            })
            .then(txnres => cb(null, txnres))
            .catch(cb)
    } catch(e) {
        cb(e)
    }
}

/*      outcome/

/*      outcome/
 * If there are no existing accounts (and we are verbose) show the user
 * a helpful message. If we are in normal mode, in the tradition of
 * strong, silent, unix commands, we just quit silently.
 */
function showNoAccountsMsg(cfg, verbose) {
    if(!verbose) return
    u.showErr(`No accounts in wallet.  Use the 'new' command to create an account or the 'add' command to add an existing account.`)
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
 *      UTC-<ISO Date>-<Public Key>.stellar
 */
function saveSecret(wallet, secret, cb) {
    let dt = new Date().toISOString()
    let fname = `UTC-${dt}-${secret.pub}.stellar`
    let p = path.join(wallet, fname)
    fs.writeFile(p, JSON.stringify(secret), 'utf-8', cb)
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
    read({
        prompt: "Password:",
        silent: true,
    }, (err, res) => {
        if(err) cb(err)
        else {
            if(!res) cb('Please provide a password')
            else cb(null, res)
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
 * Show the user a helpful message.
 */
function showHelp() {
    u.showMsg(`
            *Luminate*
    Command-line wallet for Stellar

USAGE:
./luminate.js <commands>

where the commands are:
    status [-v] [acc...]: Show status of wallet accounts [optional verbose mode]
    new [-q]: Create a new wallet account (create on stellar using 'create' command)
    create [-q] <account> <funds> <acc>: Create (and fund) an account on stellar using wallet account 'acc'
    add [-v] <secret>: Import an existing account to the wallet (given the 32-byte ed25519 'secret' seed)
    trust [-revoke] <acc> <assetCode> <issuer>: Add[Revoke] Trustline for Asset from Issuer
`)
}

main()
