'use strict'
const nacl = require('tweetnacl')
const naclUtil = require('tweetnacl-util')
const scrypt = require('scrypt')

/*      understand/
 * This module contains crytography functions wrappers to make it easier
 * to use `nacl`.
 */
module.exports = {
    password2key: password2key,
    createNonce: createNonce,
    createSalt: createSalt,
    encrypt: encrypt,
    decrypt: decrypt,
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
    if(!password) return cb(`Password not provided`)
    scrypt.hash(password, latestScryptOptions, nacl.secretbox.keyLength, salt, cb)
}

function createNonce() {
    return naclUtil.encodeBase64(nacl.randomBytes(nacl.secretbox.nonceLength))
}

function createSalt() {
    return naclUtil.encodeBase64(nacl.randomBytes(32))
}

/*      outcome/
 * Encrypt the given string using the given nonce and return a
 * javascript-safe string.
 */
function encrypt(str, nonce, password) {
    let v = naclUtil.decodeUTF8(str)
    let n = naclUtil.decodeBase64(nonce)
    return naclUtil.encodeBase64(nacl.secretbox(v, n, password))
}

/*      outcome/
 * Decrypt the given string using the given password and nonce (return
 * `false` if decoding fails).
 */
function decrypt(enc, nonce, password) {
    let v = naclUtil.decodeBase64(enc)
    let n = naclUtil.decodeBase64(nonce)
    let dec = nacl.secretbox.open(v, n, password)
    if(!dec) return false
    else return naclUtil.encodeUTF8(dec)
}

