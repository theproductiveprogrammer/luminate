'use strict'
const fs = require('fs')
const path = require('path')
const util = require('util')

module.exports = {
    showMsg: showMsg,
    showErr: showErr,
    showObj: showObj,
    ensureExists: ensureExists,
    withIndent: withIndent,
    publicVals: publicVals,
    setDbgOn: setDbgOn,
}

/*      understand/
 * If debug is on show a lot of detail about objects in the message.
 * Otherwise just show them as strings.
 */
let DEBUG = false
function setDbgOn() { DEBUG = true }

/*      problem/
 * We would like to indent some of the output to 'section it' and make
 * it more readable
 *
 *      way/
 * We provide a 'withIndent' function that sets a global indent for all
 * `showMsg/showErr` calls
 */
let NDNT = 0
function withIndent(cb) {
    NDNT++
    cb()
    NDNT--
}

/*      outcome/
 * Add the current indent to every line
 */
function addNDNT(txt) {
    if(!NDNT) return txt
    let ndnt = ""
    for(let i = 0;i < NDNT;i++) {
        ndnt += '\t'
    }
    txt = txt.replace(/[\n\r]+/g, (m) => `${m}\t`)
    return `${ndnt}${txt}`
}

/*      outcome/
 * Log the given message/object with the current `NDNT` (indent)
 */
function showMsg(msg) {
    msg = toStr(msg)
    msg = addNDNT(msg)
    console.log(msg)
}

function showObj(o) {
    let m = util.inspect(o, {depth:null})
    m = addNDNT(m)
    console.log(m)
}

/*      outcome/
 * Show error log of the given message/object
 */
function showErr(err) {
    err = toStr(err)
    err = addNDNT(err)
    console.error(err)
}

/*      outcome/
 * Return a string representation of the object (with error stack if
 * present).
 */
function toStr(obj) {
    if(DEBUG) {
        if(typeof obj === "string") return obj
        let m = util.inspect(obj, {depth:null})
        if(obj.stack) m += obj.stack
        return m
    } else {
        return ""+obj
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
