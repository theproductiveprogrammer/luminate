'use strict'

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
    return cfg;
}

function args2UserReq(cfg) {
    return () => didNotUnderstand(cmd)
}

function didNotUnderstand(cmd) {
    u.showMsg(`Did not understand: '${cmd}'`)
}
