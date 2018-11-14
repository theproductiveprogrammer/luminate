'use strict'
const crypto = require('crypto')
const nacl = require('tweetnacl')
const naclUtil = require('tweetnacl-util')

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

/*      outcome/
 * We use the standard `pbkdf2()` function with the given salt to
 * generate a password key.
 */
function password2key(salt, password, cb) {
    crypto.pbkdf2(password, salt, 100000, nacl.secretbox.keyLength, 'sha512', cb)
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

