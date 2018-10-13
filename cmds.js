'use strict'
const read = require('read')
const luminate = require('./index')

module.exports = {
    create: create,
    list: list,
    status: status,
}

function status(cfg, args, op) {
    let acc
    if(args.length == 1) return show_status_1([args[0]], 0)
    else {
        luminate.list(cfg.wallet_dir, (err, accs) => {
            if(err) op.err(err)
            else show_status_1(accs.map(a => a.name), 0)
        })
    }

    function show_status_1(accs, ndx) {
        if(ndx >= accs.length) return

        luminate.status(cfg.wallet_dir, cfg.horizon, accs[ndx], (err, ai) => {
            if(err) op.err(err)
            else {
                if(ai._name) op.out(op.chalk`{bold Account:} {green ${ai._name}}`)
                else op.out(op.chalk`{bold Account:} {green ${ai.id}}`)
                op.out(JSON.stringify(publicVals(ai),null,2))
            }
            show_status_1(accs, ndx+1)
        })
    }
}

/*      outcome/
 * Create a duplicate object that contains only the public values of the
 * given object (ignore functions and `_private` values)
 */
function publicVals(o) {
    let pv = {}
    for(let k in o) {
        if(!o.hasOwnProperty(k)) continue
        if(k.startsWith('_')) continue
        if(typeof o[k] === 'function') continue
        pv[k] = o[k]
    }
    return pv
}


function list(cfg, args, op) {
    luminate.list(cfg.wallet_dir, (err, accs, errs) => {
        if(err) op.err(err)
        else {
            for(let i = 0;i < accs.length;i++) {
                let name = accs[i].name
                let pub = accs[i].pub
                op.out(op.chalk`{bold ${name}} {gray ${pub}}`)
            }
            if(errs && errs.length && !cfg.asScript) {
                op.err(op.chalk`\n{red.bold Did not understand files:}`)
                for(let i = 0;i < errs.length;i++) {
                    op.err(op.chalk`  {underline ${errs[i]}}`)
                }
            }
        }
    })
}

function create(cfg, args, op) {
    let p = loadParams(args)
    let name = p._rest[0]
    if(!name) return err_no_name_1()

    if(p._rest.length > 1) return err_too_many_1()

    op.out(op.chalk`Creating account "{green.bold ${name}}"`)

    withPassword(cfg, (pw) => {
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
        }, (err,pw) => {
            if(err) cb()
            else cb(pw)
        })
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
