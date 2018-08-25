'use strict'
const fs = require('fs')
const path = require('path')
const util = require('util')

module.exports = {
    showMsg: showMsg,
    showErr: showErr,
    ensureExists: ensureExists,
}

/*      outcome/
 * Log the given message/object with the current `NDNT` (indent)
 */
function showMsg(msg) {
    msg = toStr(msg)
    console.log(msg)
}

/*      outcome/
 * Show error log of the given message/object
 */
function showErr(err) {
    err = toStr(err)
    console.error(err)
}

/*      outcome/
 * Return a string representation of the object (with error stack if
 * present).
 */
function toStr(obj) {
    if(typeof obj === "string") return obj;
    var m = util.inspect(obj, {depth:null});
    if(obj.stack) m += obj.stack;
    return m;
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

