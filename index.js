const { EventEmitter } = require('events');
const {
  isValidPrivate,
  stripHexPrefix,
  privateToPublic,
  bufferToHex,
  publicToAddress,
  ecsign,
  arrToBufArr,
} = require('@ethereumjs/util');
const randomBytes = require('randombytes');
const { keccak256 } = require('ethereum-cryptography/keccak');
const { Address } = require('micro-eth-signer');

const type = 'Simple Key Pair';
const {
  concatSig,
  decrypt,
  getEncryptionPublicKey,
  normalize,
  personalSign,
  signTypedData,
  SignTypedDataVersion,
} = require('@metamask/eth-sig-util');

function generateKey() {
  const privateKey = randomBytes(32);
  // I don't think this is possible, but this validation was here previously,
  // so it has been preserved just in case.
  // istanbul ignore next
  if (!isValidPrivate(privateKey)) {
    throw new Error(
      'Private key does not satisfy the curve requirements (ie. it is invalid)',
    );
  }
  return privateKey;
}

class SimpleKeyring extends EventEmitter {
  constructor(opts) {
    super();
    this.type = type;
    this._wallets = [];
    this.deserialize(opts);
  }

  async serialize() {
    return this._wallets.map(({ privateKey }) => privateKey.toString('hex'));
  }

  async deserialize(privateKeys = []) {
    this._wallets = privateKeys.map((hexPrivateKey) => {
      const strippedHexPrivateKey = stripHexPrefix(hexPrivateKey);
      const privateKey = Buffer.from(strippedHexPrivateKey, 'hex');
      const publicKey = privateToPublic(privateKey);
      return { privateKey, publicKey };
    });
  }

  async addAccounts(n = 1) {
    const newWallets = [];
    for (let i = 0; i < n; i++) {
      const privateKey = generateKey();
      const publicKey = privateToPublic(privateKey);
      newWallets.push({ privateKey, publicKey });
    }
    this._wallets = this._wallets.concat(newWallets);
    const hexWallets = newWallets.map(({ publicKey }) =>
      bufferToHex(publicToAddress(publicKey)),
    );
    return hexWallets;
  }

  async getAccounts() {
    return this._wallets.map(({ publicKey }) =>
      bufferToHex(publicToAddress(publicKey)),
    );
  }

  // tx is an instance of the ethereumjs-transaction class.
  async signTransaction(address, tx, opts = {}) {
    const privKey = this._getPrivateKeyFor(address, opts);
    const signedTx = tx.sign(privKey);
    // Newer versions of Ethereumjs-tx are immutable and return a new tx object
    return signedTx === undefined ? tx : signedTx;
  }

  // For eth_sign, we need to sign arbitrary data:
  async signMessage(address, data, opts = {}) {
    const message = stripHexPrefix(data);
    const privKey = this._getPrivateKeyFor(address, opts);
    const msgSig = ecsign(Buffer.from(message, 'hex'), privKey);
    const rawMsgSig = concatSig(msgSig.v, msgSig.r, msgSig.s);
    return rawMsgSig;
  }

  // For personal_sign, we need to prefix the message:
  async signPersonalMessage(address, msgHex, opts = {}) {
    const privKey = this._getPrivateKeyFor(address, opts);
    const privateKey = Buffer.from(privKey, 'hex');
    const sig = personalSign({ privateKey, data: msgHex });
    return sig;
  }

  // For eth_decryptMessage:
  async decryptMessage(withAccount, encryptedData) {
    const wallet = this._getWalletForAccount(withAccount);
    const { privateKey } = wallet;
    const sig = decrypt({ privateKey, encryptedData });
    return sig;
  }

  // personal_signTypedData, signs data along with the schema
  async signTypedData(
    withAccount,
    typedData,
    opts = { version: SignTypedDataVersion.V1 },
  ) {
    // Treat invalid versions as "V1"
    const version = Object.keys(SignTypedDataVersion).includes(opts.version)
      ? opts.version
      : SignTypedDataVersion.V1;

    const privateKey = this._getPrivateKeyFor(withAccount, opts);
    return signTypedData({ privateKey, data: typedData, version });
  }

  // get public key for nacl
  async getEncryptionPublicKey(withAccount, opts = {}) {
    const privKey = this._getPrivateKeyFor(withAccount, opts);
    const publicKey = getEncryptionPublicKey(privKey);
    return publicKey;
  }

  _getPrivateKeyFor(address, opts = {}) {
    if (!address) {
      throw new Error('Must specify address.');
    }
    const wallet = this._getWalletForAccount(address, opts);
    return wallet.privateKey;
  }

  // returns an address specific to an app
  async getAppKeyAddress(address, origin) {
    if (!origin || typeof origin !== 'string') {
      throw new Error(`'origin' must be a non-empty string`);
    }
    const wallet = this._getWalletForAccount(address, {
      withAppKeyOrigin: origin,
    });
    const appKeyAddress = normalize(
      publicToAddress(wallet.publicKey).toString('hex'),
    );
    return appKeyAddress;
  }

  // exportAccount should return a hex-encoded private key:
  async exportAccount(address, opts = {}) {
    const wallet = this._getWalletForAccount(address, opts);
    return wallet.privateKey.toString('hex');
  }

  removeAccount(address) {
    if (
      !this._wallets
        .map(({ publicKey }) =>
          bufferToHex(publicToAddress(publicKey)).toLowerCase(),
        )
        .includes(address.toLowerCase())
    ) {
      throw new Error(`Address ${address} not found in this keyring`);
    }

    this._wallets = this._wallets.filter(
      ({ publicKey }) =>
        bufferToHex(publicToAddress(publicKey)).toLowerCase() !==
        address.toLowerCase(),
    );
  }

  /**
   * @private
   */
  _getWalletForAccount(account, opts = {}) {
    const address = normalize(account);
    let wallet = this._wallets.find(
      ({ publicKey }) =>
        bufferToHex(publicToAddress(publicKey)) === address ||
        Address.fromPublicKey(publicKey).toLowerCase() === address,
    );

    if (!wallet) {
      throw new Error('Simple Keyring - Unable to find matching address.');
    }

    if (opts.withAppKeyOrigin) {
      const { privateKey } = wallet;
      const appKeyOriginBuffer = Buffer.from(opts.withAppKeyOrigin, 'utf8');
      const appKeyBuffer = Buffer.concat([privateKey, appKeyOriginBuffer]);
      const appKeyPrivateKey = arrToBufArr(keccak256(appKeyBuffer, 256));
      const appKeyPublicKey = privateToPublic(appKeyPrivateKey);
      wallet = { privateKey: appKeyPrivateKey, publicKey: appKeyPublicKey };
    }

    return wallet;
  }
}

SimpleKeyring.type = type;
module.exports = SimpleKeyring;
