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

  async serialize () {
    return this.wallets.map(w => w.getPrivateKey().toString('hex'))
  }

  async deserialize (privateKeys = []) {
    this.wallets = privateKeys.map((privateKey) => {
      const stripped = ethUtil.stripHexPrefix(privateKey)
      const buffer = new Buffer(stripped, 'hex')
      const wallet = Wallet.fromPrivateKey(buffer)
      return wallet
    })
  }

  async addAccounts (n = 1) {
    var newWallets = []
    for (var i = 0; i < n; i++) {
      newWallets.push(Wallet.generate())
    }
    this.wallets = this.wallets.concat(newWallets)
    return newWallets.map(w => ethUtil.bufferToHex(w.getAddress()))
  }

  async getAccounts () {
    return this.wallets.map(w => ethUtil.bufferToHex(w.getAddress()))
  }

  // tx is an instance of the ethereumjs-transaction class.
  async signTransaction (address, tx) {
    const privKey = this._getPrivateKeyFor(address);
    tx.sign(privKey)
    return tx
  }

  // For eth_sign, we need to sign arbitrary data:
  async signMessage (address, data) {
    const message = ethUtil.stripHexPrefix(data)
    const privKey = this._getPrivateKeyFor(address);
    var msgSig = ethUtil.ecsign(new Buffer(message, 'hex'), privKey)
    return ethUtil.bufferToHex(sigUtil.concatSig(msgSig.v, msgSig.r, msgSig.s))
  }

  // For eth_sign, we need to sign transactions:
  async newGethSignMessage (withAccount, msgHex) {
    const privKey = this._getPrivateKeyFor(withAccount);
    const msgBuffer = ethUtil.toBuffer(msgHex)
    const msgHash = ethUtil.hashPersonalMessage(msgBuffer)
    const msgSig = ethUtil.ecsign(msgHash, privKey)
    return ethUtil.bufferToHex(sigUtil.concatSig(msgSig.v, msgSig.r, msgSig.s))
  }

  // For personal_sign, we need to prefix the message:
  async signPersonalMessage (address, msgHex) {
    const privKey = this._getPrivateKeyFor(address);
    const privKeyBuffer = new Buffer(privKey, 'hex')
    return sigUtil.personalSign(privKeyBuffer, { data: msgHex })
  }

  // For eth_decryptMessage:
  async decryptMessage (withAccount, encryptedData) {
    const wallet = this._getWalletForAccount(withAccount)
    const privKey = ethUtil.stripHexPrefix(wallet.getPrivateKey())
    return sigUtil.decrypt(encryptedData, privKey)
  }

  // personal_signTypedData, signs data along with the schema
  async signTypedData (withAccount, typedData, opts = { version: 'V1' }) {
    switch (opts.version) {
      case 'V3':
        return this.signTypedData_v3(withAccount, typedData, opts);
      case 'V4':
        return this.signTypedData_v4(withAccount, typedData, opts);
      case 'V1':
      default:
        return this.signTypedData_v1(withAccount, typedData, opts);
    }
  }

  // personal_signTypedData, signs data along with the schema
  async signTypedData_v1 (withAccount, typedData) {
    const privKey = this._getPrivateKeyFor(withAccount);
    return sigUtil.signTypedDataLegacy(privKey, { data: typedData })
  }

  // personal_signTypedData, signs data along with the schema
  async signTypedData_v3 (withAccount, typedData) {
    const privKey = this._getPrivateKeyFor(withAccount);
    return sigUtil.signTypedData(privKey, { data: typedData })
  }

  // personal_signTypedData, signs data along with the schema
  async signTypedData_v4 (withAccount, typedData) {
    const privKey = this._getPrivateKeyFor(withAccount);
    return sigUtil.signTypedData_v4(privKey, { data: typedData })
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
  async exportAccount (address) {
    const wallet = this._getWalletForAccount(address)
    return wallet.getPrivateKey().toString('hex')
  }

  async removeAccount (address) {
    if(!this.wallets.map(w => ethUtil.bufferToHex(w.getAddress()).toLowerCase()).includes(address.toLowerCase())){
      throw new Error(`Address ${address} not found in this keyring`)
    }
    this.wallets = this.wallets.filter( w => ethUtil.bufferToHex(w.getAddress()).toLowerCase() !== address.toLowerCase())
  }

  /* PRIVATE METHODS */

  _getPrivateKeyFor (address) {
    if (!address) {
      throw new Error('Must specify address.');
    }
    const wallet = this._getWalletForAccount(address)
    const privKey = ethUtil.toBuffer(wallet.getPrivateKey())
    return privKey;
  }

  _getWalletForAccount (account) {
    const address = sigUtil.normalize(account)
    let wallet = this.wallets.find(w => ethUtil.bufferToHex(w.getAddress()) === address)
    if (!wallet) throw new Error('Simple Keyring - Unable to find matching address.')
    return wallet
  }

}

SimpleKeyring.type = type
module.exports = SimpleKeyring
