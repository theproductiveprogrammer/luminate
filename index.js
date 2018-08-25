'use strict'
const u = require('./util')


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
    if(!cmd) return showHelp(argmap)

    process.argv.shift()
    for(let i = 0;i < argmap.length;i++) {
        if(cmd.match(argmap[i].rx)) {
            return () => argmap[i].fn(cfg, process.argv)
        }
    }
    return () => didNotUnderstand(cmd)
}

function didNotUnderstand(cmd) {
    u.showMsg(`Did not understand: '${cmd}'`)
}

function keypairCmd(cfg, cmd) {
    if(cmd == "new") return newKeypair(cfg)
    if(cmd == "list") return listKeypairs(cfg)
    didNotUnderstand(cmd)
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
