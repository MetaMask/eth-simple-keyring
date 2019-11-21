const ethUtil = require('ethereumjs-util')
const randomBytes = require('randombytes')


// ====== ethereumjs-wallet drop-in replacement ===============================
// Issue:    https://github.com/MetaMask/eth-simple-keyring/issues/21
//
// 1st pass: (done) refactoring, 1:1 transfer of TS-code to JS here
//           methods & logic are kept "as is"
//
// 2nd pass: (todo) refine, rename (similar to hdkey/eth-hdkey, this would be eth-key)
//
class Wallet {

  constructor(privateKey_, publicKey_ = undefined) {

    if (privateKey_ && publicKey_) {
      throw new Error('Cannot supply both a private and a public key to the constructor')
    }

    if (privateKey_ && !ethUtil.isValidPrivate(privateKey_)) {
      throw new Error('Private key does not satisfy the curve requirements (ie. it is invalid)')
    }

    if (publicKey_ && !ethUtil.isValidPublic(publicKey_)) {
      throw new Error('Invalid public key')
    }

    this.publicKey = publicKey_;//new Buffer(publicKey_, 'hex');
    this.privateKey = privateKey_;//new Buffer(privateKey_, 'hex');

  }

  static fromPrivateKey(privateKey) {
    return new Wallet(privateKey);
  }

  // keeping "icapDirect = false" for api-compatibility, could be removed later
  static generate(icapDirect = false) {
    return new Wallet(randomBytes(32))
  }

  keyExists(k) {
    return k !== undefined && k !== null
  }

  privKey() {
    if (!this.keyExists(this.privateKey)) {
      throw new Error('This is a public key only wallet')
    }
  
    // next line is to keep metamask-controller-test.js working.
    this._privKey = this.privateKey;
    // remove above line after correcting the test

    return this.privateKey
  }
  getPrivateKey() {
    return this.privKey();
  }

  pubKey() {
    if (!this.keyExists(this.publicKey)) {
      this.publicKey = ethUtil.privateToPublic(this.privateKey)
    }

    // next line is to keep metamask-controller-test.js working.
    this._pubKey = this.publicKey;
    // remove above line after correcting the test

    return this.publicKey
  }
  getAddress() {
    return ethUtil.publicToAddress(this.pubKey())
  }
  
}



module.exports = Wallet