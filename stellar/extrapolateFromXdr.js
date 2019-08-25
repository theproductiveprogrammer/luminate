// This code originally taken from the Stellar Laboratory
//      https://github.com/stellar/laboratory/blob/076f1f83c2f771aa7c8f9dd7d4e5f8c57b52180f/src/utilities/extrapolateFromXdr.js
// by Stellar Development Foundation under Apache-2.0.

// This turns a base64 encoded xdr object with it's type, and turns it into an
// object with more detailed information

// Values can be one of three types:
// - undefined
// - string: string values that appear as just plain text
// - object: typed values always with a type and value `{type: 'code', value: 'Foo();'}`

const StellarSdk = require('stellar-sdk')
const _ = require('lodash')

let xdr = StellarSdk.xdr
let StrKey = StellarSdk.StrKey
let Keypair = StellarSdk.Keypair
let Operation = StellarSdk.Operation

function extrapolateFromXdr(input, type) {
  let xdrObject
  try {
    xdrObject = xdr[type].fromXDR(input, 'base64')
  } catch(error) {
    throw new Error('Input XDR could not be parsed')
  }


  let r = {}
  convertNormal(xdrObject, r)
  return r
}

function convertObject(object, name, r) {
  if (_.isArray(object)) {
    r[name] = convertArray(object)
  } else if (!hasChildren(object)) {
    r[name] =  getValue(object, name)
  } else if (object.switch) {
    r[name] = {
      type: object.switch().name
    }
    convertArm(object, name, r)
  } else {
    r[name] = {}
    convertNormal(object, r[name])
  }
}

function convertArray(object) {
  let arr = []
  for (var i = 0; i < object.length; i++) {
    convertObject(object[i], i, arr)
  }
  return arr
}

function convertArm(object, name, r) {
  if (_.isString(object.arm())) {
    r[name] = {
      type: object.switch().name
    }
    convertObject(object[object.arm()](), object.arm(), r[name])
  } else {
    r[name] = object.switch().name
  }
}

function convertNormal(object, r) {
  _(object).functionsIn().without('toXDR').value().forEach(function(name) {
    convertObject(object[name](), name, r)
  })
}

function hasChildren(object) {
  // string
  if (_.isString(object)) {
    return false
  }
  // node buffer
  if (object && Buffer.isBuffer(object)) {
    return false
  }
  var functions = _.functionsIn(object)
  if (functions.length == 0) {
    return false
  }
  // int64
  if (_.includes(functions, 'getLowBits') && _.includes(functions, 'getHighBits')) {
    return false
  }
  return true
}

const amountFields = ['amount', 'startingBalance', 'sendMax', 'destAmount', 'limit']

function getValue(object, name) {
  if (_.includes(amountFields, name)) {
    return {
      type: 'amount',
      value: Operation._fromXDRAmount(object),
    }
  }

  if (name === 'hint') {
    // strkey encoding is using base32 encoding. Encoded public key consists of:
    //
    //  * 1 byte version byte (0x30 encoded as `G`)
    //  * 32 bytes public key
    //  * 2 bytes checksum
    //
    // Because base32 symbols are 5-bit, more than one symbol is needed to represent a single byte.
    // Signature Hint is the last 4 bytes of the public key. So we need to try to show as many 5-bit
    // chunks as possible included between bytes 30 and 33 (included).
    //
    // byte 1: ##### ###
    // byte 2:          ## ##### #
    // byte 3:                    #### ####
    // byte 4:                             # ##### ##
    // byte 5:                                       ### #####  <---------- 40 bits / full alignment
    // byte 6:                                                ##### ###
    // byte 7:                                                         ## ##### #
    //
    // .....
    //
    // byte 26: ##### ###
    // byte 27:          ## ##### #
    // byte 28:                    #### ####                    full b32 symbols
    // byte 29:                             # ##### ##    |--------------------------|
    // byte 30:                                       ### 48###                      |
    // byte 31:                  Signature Hint start |        49### 50#             |    Signature Hint end
    // byte 32:                                                         ## 51### 5   |    |
    // byte 33:                                                                   2### 53##
    // byte 34:                                                                            # 54### 55
    // byte 35:                                                                                      ### 56###
    //
    let hintBytes = Buffer.from(object, 'base64')
    let partialPublicKey = Buffer.concat([Buffer.alloc(28).fill(0), hintBytes])
    let keypair = new Keypair({type: 'ed25519', publicKey: partialPublicKey})
    let partialPublicKeyString =
      'G'+
      (Buffer.alloc(46).fill('_').toString())+
      keypair.publicKey().substr(47, 5)+
      (Buffer.alloc(4).fill('_').toString())
    return {type: 'code', value: partialPublicKeyString}
  }

  if (name === 'ed25519') {
    var address = StrKey.encodeEd25519PublicKey(object)
    return {type: 'code', value: address}
  }

  if (name === 'assetCode' || name === 'assetCode4' || name === 'assetCode12') {
    return object.toString()
  }


  if (object && Buffer.isBuffer(object)) {
    return {type: 'code', /*raw: object,*/ value: Buffer.from(object).toString('base64')}
  }

  if (typeof object === 'undefined') {
    return
  }

  // getValue is a leaf in the recursive xdr extrapolating function meaning that
  // whatever this function returns will be in the final result as-is.
  // Therefore, we want them in string format so that it displayable in React.
  // One example of why we need this is that UnsignedHyper values won't get
  // displayed unless we convert it to a string.
  if (typeof object.toString === 'function') {
    return object.toString()
  }

  throw new Error('Internal laboratory bug: Encountered value type in XDR viewer that does not have a toString method')
}

module.exports = extrapolateFromXdr
