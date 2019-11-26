const EventEmitter = require('events').EventEmitter
const Wallet = require('ethereumjs-wallet')
const ethUtil = require('ethereumjs-util')
const type = 'Simple Key Pair'
const sigUtil = require('eth-sig-util')

class SimpleKeyring extends EventEmitter {

  /* PUBLIC METHODS */

  constructor (opts) {
    super()
    this.type = type
    this.wallets = []
    this.deserialize(opts)
  }

  serialize () {
    return Promise.resolve(this.wallets.map(w => w.getPrivateKey().toString('hex')))
  }

  deserialize (privateKeys = []) {
    return new Promise((resolve, reject) => {
      try {
        this.wallets = privateKeys.map((privateKey) => {
          const stripped = ethUtil.stripHexPrefix(privateKey)
          const buffer = new Buffer(stripped, 'hex')
          const wallet = Wallet.fromPrivateKey(buffer)
          return wallet
        })
      } catch (e) {
        reject(e)
      }
      resolve()
    })
  }

  addAccounts (n = 1) {
    var newWallets = []
    for (var i = 0; i < n; i++) {
      newWallets.push(Wallet.generate())
    }
    this.wallets = this.wallets.concat(newWallets)
    const hexWallets = newWallets.map(w => ethUtil.bufferToHex(w.getAddress()))
    return Promise.resolve(hexWallets)
  }

  getAccounts () {
    return Promise.resolve(this.wallets.map(w => ethUtil.bufferToHex(w.getAddress())))
  }

  // tx is an instance of the ethereumjs-transaction class.
  signTransaction (address, tx) {
    const privKey = this.getPrivateKeyFor(address);
    tx.sign(privKey)
    return Promise.resolve(tx)
  }

  // For eth_sign, we need to sign arbitrary data:
  signMessage (address, data) {
    const message = ethUtil.stripHexPrefix(data)
    const privKey = this.getPrivateKeyFor(address);
    var msgSig = ethUtil.ecsign(new Buffer(message, 'hex'), privKey)
    var rawMsgSig = ethUtil.bufferToHex(sigUtil.concatSig(msgSig.v, msgSig.r, msgSig.s))
    return Promise.resolve(rawMsgSig)
  }

  // For eth_sign, we need to sign transactions:
  newGethSignMessage (withAccount, msgHex) {
    const privKey = this.getPrivateKeyFor(withAccount);
    const msgBuffer = ethUtil.toBuffer(msgHex)
    const msgHash = ethUtil.hashPersonalMessage(msgBuffer)
    const msgSig = ethUtil.ecsign(msgHash, privKey)
    const rawMsgSig = ethUtil.bufferToHex(sigUtil.concatSig(msgSig.v, msgSig.r, msgSig.s))
    return Promise.resolve(rawMsgSig)
  }

  // For personal_sign, we need to prefix the message:
  signPersonalMessage (address, msgHex) {
    const privKey = this.getPrivateKeyFor(address);
    const privKeyBuffer = new Buffer(privKey, 'hex')
    const sig = sigUtil.personalSign(privKeyBuffer, { data: msgHex })
    return Promise.resolve(sig)
  }

  // For eth_decryptMessage:
  decryptMessage (withAccount, encryptedData) {
    const wallet = this._getWalletForAccount(withAccount)
    const privKey = ethUtil.stripHexPrefix(wallet.getPrivateKey())
    const privKeyBuffer = new Buffer(privKey, 'hex')
    const sig = sigUtil.decrypt(encryptedData, privKey)
    return Promise.resolve(sig)
  }

  // personal_signTypedData, signs data along with the schema
  signTypedData (withAccount, typedData, opts = { version: 'V1' }) {
    switch (opts.version) {
      case 'V1':
        return this.signTypedData_v1(withAccount, typedData);
      case 'V3':
        return this.signTypedData_v3(withAccount, typedData);
      case 'V4':
        return this.signTypedData_v4(withAccount, typedData);
      default:
        return this.signTypedData_v1(withAccount, typedData);
    }
  }

  // personal_signTypedData, signs data along with the schema
  signTypedData_v1 (withAccount, typedData) {
    const privKey = this.getPrivateKeyFor(withAccount);
    const sig = sigUtil.signTypedDataLegacy(privKey, { data: typedData })
    return Promise.resolve(sig)
  }

  // personal_signTypedData, signs data along with the schema
  signTypedData_v3 (withAccount, typedData) {
    const privKey = this.getPrivateKeyFor(withAccount);
    const sig = sigUtil.signTypedData(privKey, { data: typedData })
    return Promise.resolve(sig)
  }

  // personal_signTypedData, signs data along with the schema
  signTypedData_v4 (withAccount, typedData) {
    const privKey = this.getPrivateKeyFor(withAccount);
    const sig = sigUtil.signTypedData_v4(privKey, { data: typedData })
    return Promise.resolve(sig)
  }

  getPrivateKeyFor (address) {
    if (!address) {
      throw new Error('Must specify address.');
    }
    const wallet = this._getWalletForAccount(address)
    const privKey = ethUtil.toBuffer(wallet.getPrivateKey())
    return privKey;
  }

  async getAppKey (address, origin) {
    if (
      !origin ||
      typeof origin !== 'string'
    ) {
      throw new Error(`'origin' must be a non-empty string`)
    }

    const wallet = this._getWalletForAccount(address)
    const privKey = wallet.getPrivateKey()
    const appKeyOriginBuffer = Buffer.from(origin, 'utf8')
    const appKeyBuffer = Buffer.concat([privKey, appKeyOriginBuffer])
    const appKeyPrivKey = ethUtil.keccak(appKeyBuffer, 256)
    return appKeyPrivKey
  }

  async getAppKeyAddress (address, origin) {
    const key = await this.getAppKey(address, origin)
    const wallet = Wallet.fromPrivateKey(key)
    const appKeyAddress = wallet.getAddress()
    return ethUtil.bufferToHex(appKeyAddress)
  }

  // exportAccount should return a hex-encoded private key:
  exportAccount (address) {
    const wallet = this._getWalletForAccount(address)
    return Promise.resolve(wallet.getPrivateKey().toString('hex'))
  }

  async removeAccount (address) {
    if(!this.wallets.map(w => ethUtil.bufferToHex(w.getAddress()).toLowerCase()).includes(address.toLowerCase())){
      throw new Error(`Address ${address} not found in this keyring`)
    }
    this.wallets = this.wallets.filter( w => ethUtil.bufferToHex(w.getAddress()).toLowerCase() !== address.toLowerCase())
  }

  /* PRIVATE METHODS */

  _getWalletForAccount (account) {
    const address = sigUtil.normalize(account)
    let wallet = this.wallets.find(w => ethUtil.bufferToHex(w.getAddress()) === address)
    if (!wallet) throw new Error('Simple Keyring - Unable to find matching address.')
    return wallet
  }

}

SimpleKeyring.type = type
module.exports = SimpleKeyring
