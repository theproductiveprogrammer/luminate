'use strict'
const read = require('read')
const luminate = require('./index')

module.exports = {
    create: create,
}

function create(cfg, args, op) {
    let p = loadParams(args)
    let name = p._rest[0]
    if(!name) return err_no_name_1()

    if(p._rest.length > 1) return err_too_many_1()

    op.out(op.chalk`Creating account "{green.bold ${name}}"`)

    withPassword(cfg, (err, pw) => {
        if(err) op.err(err)
        else {
            luminate.create(
                pw,
                cfg.wallet_dir,
                p.from,
                p.amt,
                name,
                (err, acc) => {
                    if(err) op.err(err)
                    else op.out(op.chalk`{grey ${acc}}`)
                })
        }
    })

    function err_no_name_1() {
        op.err(op.chalk`{red.bold Error:} Please provide a name`)
    }

    function err_too_many_1() {
        let names = p._rest.map(n => `"${n}"`).join(", ")
        op.err(op.chalk`{red.bold Error:} Too many names for account: {green ${names}}`)
    }
}

/*      outcome/
 * If the password is set in the environment use that otherwise prompt
 * the user for a password. Provide this to the callback.
 */
function withPassword(cfg, cb) {
    if(cfg.wallet_pw) {
        cb(null, cfg.wallet_pw)
    } else {
        read({
            prompt: "Password:",
            silent: true,
        }, cb)
    }
}

/*      outcome/
 * Takes the given parameter array and converts them into an object
 * with corresponding values and the `_rest`.
 */
function loadParams(args) {
    let p = {}
    let rest = []
    if(args && args.length) {
        let val;
        for(let i = 0;i < args.length;i++) {
            let arg = args[i]
            let m = arg.match(/^-+(.*)/)
            if(m) {
                p[m[1]] = true // value is present
                val = m[1] // load next item as value
            } else if(val) {
                p[val] = arg
                val = false;
            } else {
                rest.push(arg)
            }
        }
    }
    p._rest = rest
    return p
}
