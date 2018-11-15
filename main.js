'use strict'

/*      understand/
 * We use the Twelve-Factor App methodology to separate our
 * configuration from our code. Towards that end we take a lot of
 * configuration paramters from the environment. `dotenv` allows us to
 * additionally use a `.env` file for simplifying setting these
 * variables
 */
require('dotenv').config()

/*      section/
 * Import all the things!
 */
const chalk = require('chalk')

/*      section/
 * Our modules
 */
const showhelp = require('./help')
const showinfo = require('./info')
const cmds = require('./cmds')

/*      understand/
 * We export the `main` function that runs `luminate` as a command line
 * program
 */
module.exports = main

function main() {
    const cfg = getConfiguration()
    const op = setupOutput(cfg)
    const user_request = args2UserReq(cfg)
    user_request(cfg, op)
}

/*      outcome/
 * Gets the configuration from environment variables.
 * Note that we only set the wallet password IF we are running "as a
 * script".
 *
 * See also `dotenv`.
 */
function getConfiguration() {
    let cfg = {}

    if(process.env.LM__NO_COLOR) cfg.noColor = true
    if(process.env.LM__AS_SCRIPT) cfg.asScript = true

    if(cfg.asScript && process.env.LM__WALLET_PASSWORD) {
        cfg.wallet_pw = process.env.LM__WALLET_PASSWORD
    }
    if(process.env.LM__WALLET_FOLDER) {
        cfg.wallet_dir = process.env.LM__WALLET_FOLDER
    } else {
        cfg.wallet_dir = './.wallet'
    }

    if(process.env.LM__HORIZON == 'TEST') {
        cfg.horizon = 'test'
    } else {
        cfg.horizon = 'live'
    }

    return cfg
}

/*      outcome/
 * Set up input and output functions as well as formatting and any other
 * parameters
 */
function setupOutput(cfg) {
    let op = {
        out: console.log,
        err: console.error,
        chalk: setup_chalk_1(),
        istty: process.stdout.isTTY,
        rows: process.stdout.rows,
        cols: process.stdout.columns,
    }
    process.stdout.on('resize', () => {
        op.rows = process.stdout.rows
        op.cols = process.stdout.columns
    })

    op.out = paged_generator_1(op)

    return op

    /*      outcome/
     * Show paged output
     */
    function paged_generator_1(op) {
        if(!op.istty) return console.log
        return function(txt) {
            let lines = txt.split('\n')
            let rows = op.rows - 5 // Keep a buffer for multi-line prompts and overflows
            if(lines.length < rows) {
                return console.log(txt)
            } else {
                show_lines_from_1(0)
            }

            function show_lines_from_1(ndx) {
                console.log(lines.slice(ndx,ndx+rows).join('\n'))
                if(lines.length >= ndx+rows) {
                    wait_for_keypress_1(() => show_lines_from_1(ndx+rows))
                } else {
                    process.exit()
                }
            }

            function wait_for_keypress_1(cb) {
                process.stdin.setRawMode(true)
                process.stdin.once('data', (d) => {
                    let key = d.toString()
                    if(key == "Q" || key == "q") process.exit()
                    process.stdin.setRawMode(false)
                    cb()
                })
            }
        }
    }

    /*      problem/
     * The `chalk` package automatically detects if the terminal supports
     * colors and turns them off if it doesn't. However there are situations
     * where the user would like to switch off coloring for some reason and
     * we also would not like to have colors if we are part of a script.
     *
     *      way/
     * If we are configured to be in a script or the user has turned off
     * colors we disable chalk coloring. Otherwise we let `chalk` decide if
     * it can show colors and let it proceed.
     */
    function setup_chalk_1() {
        if(cfg.noColor || cfg.asScript) chalk.enabled = false
        return chalk
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
function args2UserReq(cfg, op) {
    const argmap = [
        { rx: /^create$/, fn: cmds.create },
        { rx: /^activate$/, fn: cmds.activate },
        { rx: /^list$/, fn: cmds.list },
        { rx: /^status$/, fn: cmds.status },
        { rx: /^pay$/, fn: cmds.pay },
        { rx: /^import$/, fn: cmds.importSecret },
        { rx: /^export$/, fn: cmds.exportSecret },
        { rx: /^list-assets$/, fn: cmds.listAssets },
        { rx: /^set-trustline$/, fn: cmds.setTrustline },
        { rx: /^revoke-trustline$/, fn: cmds.revokeTrustline },
        { rx: /^set-flags$/, fn: cmds.setFlags },
        { rx: /^clear-flags$/, fn: cmds.clearFlags },
        { rx: /^allow-trust$/, fn: cmds.allowTrust },
        { rx: /^remove-trust$/, fn: cmds.removeTrust },
        { rx: /^add-signer$/, fn: cmds.addSigner },
        { rx: /^remove-signer$/, fn: cmds.removeSigner },
        { rx: /^set-weights$/, fn: cmds.setWeights },
        { rx: /^set-master-weight$/, fn: cmds.setMasterWeight },
        { rx: /^(version|ver|-v|-ver|--version|--ver)$/, fn: showinfo },
        { rx: /^(-h|--help|help)$/, fn: showhelp },
    ];

    process.argv.shift()
    process.argv.shift()

    let cmd = process.argv[0]
    if(!cmd) return with_args_1(showhelp)

    process.argv.shift()
    for(let i = 0;i < argmap.length;i++) {
        if(cmd.match(argmap[i].rx)) {
            return with_args_1(argmap[i].fn)
        }
    }
    return with_args_1(did_not_understand_1)

    function with_args_1(fn) {
        return (cfg, op) => fn(cfg, process.argv, op, cmd)
    }

    function did_not_understand_1(cfg, args, op, cmd) {
        op.out(op.chalk`{blue Did not understand:} '{gray ${cmd}}'`)
    }
}

