import { Transaction as TxTransaction } from '@ethereumjs/tx';
import {
  arrToBufArr,
  bufferToHex,
  ecsign,
  isValidPrivate,
  privateToPublic,
  publicToAddress,
  stripHexPrefix,
  toBuffer,
} from '@ethereumjs/util';
import {
  concatSig,
  decrypt,
  getEncryptionPublicKey,
  normalize,
  personalSign,
  signTypedData,
  SignTypedDataVersion,
} from '@metamask/eth-sig-util';
import {
  add0x,
  Eip1024EncryptedData,
  Hex,
  Keyring,
  SignedTransaction,
  Transaction,
} from '@metamask/utils';
import { keccak256 } from 'ethereum-cryptography/keccak';
import { EventEmitter } from 'events';
import randomBytes from 'randombytes';

const _TYPE = 'Simple Key Pair';

/**
 * Temporary doc.
 *
 * @returns {Buffer} PrivateKey here.
 */
function generateKey(): Buffer {
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

export default class SimpleKeyring
  extends EventEmitter
  implements Keyring<string[]>
{
  private wallets: { privateKey: Buffer; publicKey: Buffer }[];

  public type: string;

  constructor(options: string[] = []) {
    super();
    this.type = _TYPE;
    this.wallets = [];
    this.deserialize(options);
  }

  async serialize() {
    return this.wallets.map((a) => a.privateKey.toString('hex'));
  }

  async deserialize(privateKeys: string[] = []) {
    this.wallets = privateKeys.map((hexPrivateKey) => {
      const strippedHexPrivateKey = stripHexPrefix(hexPrivateKey);
      const privateKey = Buffer.from(strippedHexPrivateKey, 'hex');
      const publicKey = privateToPublic(privateKey);
      return { privateKey, publicKey };
    });
  }

  async addAccounts(numAccounts = 1) {
    const newWallets = [];
    for (let i = 0; i < numAccounts; i++) {
      const privateKey = generateKey();
      const publicKey = privateToPublic(privateKey);
      newWallets.push({ privateKey, publicKey });
    }
    this.wallets = this.wallets.concat(newWallets);
    const hexWallets = newWallets.map(({ publicKey }) =>
      add0x(bufferToHex(publicToAddress(publicKey))),
    );
    return hexWallets;
  }

  async getAccounts() {
    return this.wallets.map(({ publicKey }) =>
      add0x(bufferToHex(publicToAddress(publicKey))),
    );
  }

  // tx is an instance of the ethereumjs-transaction class.
  async signTransaction(
    address: Hex,
    tx: Transaction,
    options = { withAppKeyOrigin: '' },
  ) {
    const privKey = this.getPrivateKeyFor(address, options);
    const signedTx = (tx as unknown as TxTransaction).sign(privKey);
    // Newer versions of Ethereumjs-tx are immutable and return a new tx object
    return signedTx === undefined
      ? (tx as SignedTransaction)
      : (signedTx as unknown as SignedTransaction);
  }

  // For eth_sign, we need to sign arbitrary data:
  async signMessage(
    address: any,
    data: string,
    opts = { withAppKeyOrigin: '' },
  ) {
    const message = stripHexPrefix(data);
    const privKey = this.getPrivateKeyFor(address, opts);
    const msgSig = ecsign(Buffer.from(message, 'hex'), privKey);
    const rawMsgSig = concatSig(toBuffer(msgSig.v), msgSig.r, msgSig.s);
    return rawMsgSig;
  }

  // For personal_sign, we need to prefix the message:
  async signPersonalMessage(
    address: any,
    msgHex: any,
    opts = { withAppKeyOrigin: '' },
  ) {
    const privKey = this.getPrivateKeyFor(address, opts);
    // const privateKey = Buffer.from(privKey, 'hex');
    return personalSign({ privateKey: privKey, data: msgHex });
  }

  // For eth_decryptMessage:
  async decryptMessage(withAccount: Hex, encryptedData: Eip1024EncryptedData) {
    const wallet = this.getWalletForAccount(withAccount);
    const privateKey = wallet.privateKey.toString('hex');
    return decrypt({ privateKey, encryptedData });
  }

  // personal_signTypedData, signs data along with the schema
  async signTypedData(
    address: Hex,
    typedData: any,
    opts: Record<string, string> = { version: SignTypedDataVersion.V1 },
  ) {
    // Treat invalid versions as "V1"
    const version = Object.keys(SignTypedDataVersion).includes(
      opts.version || '',
    )
      ? (opts.version as SignTypedDataVersion)
      : SignTypedDataVersion.V1;

    const privateKey = this.getPrivateKeyFor(address, opts);
    return signTypedData({ privateKey, data: typedData, version });
  }

  // get public key for nacl
  async getEncryptionPublicKey(withAccount: Hex, opts: Record<string, string>) {
    const privKey = this.getPrivateKeyFor(withAccount, opts);
    const publicKey = getEncryptionPublicKey(privKey.toString('hex'));
    return publicKey;
  }

  private getPrivateKeyFor(
    address: Hex,
    opts: Record<string, string> = { withAppKeyOrigin: '' },
  ) {
    if (!address) {
      throw new Error('Must specify address.');
    }
    const wallet = this.getWalletForAccount(address, opts);
    return wallet.privateKey;
  }

  // returns an address specific to an app
  async getAppKeyAddress(address: Hex, origin: string) {
    if (!origin || typeof origin !== 'string') {
      throw new Error(`'origin' must be a non-empty string`);
    }
    const wallet = this.getWalletForAccount(address, {
      withAppKeyOrigin: origin,
    });
    const appKeyAddress = add0x(bufferToHex(publicToAddress(wallet.publicKey)));
    return appKeyAddress;
  }

  // exportAccount should return a hex-encoded private key:
  async exportAccount(address: any, opts = { withAppKeyOrigin: '' }) {
    const wallet = this.getWalletForAccount(address, opts);
    return wallet.privateKey.toString('hex');
  }

  removeAccount(address: string) {
    if (
      !this.wallets
        .map(({ publicKey }) =>
          bufferToHex(publicToAddress(publicKey)).toLowerCase(),
        )
        .includes(address.toLowerCase())
    ) {
      throw new Error(`Address ${address} not found in this keyring`);
    }

    this.wallets = this.wallets.filter(
      ({ publicKey }) =>
        bufferToHex(publicToAddress(publicKey)).toLowerCase() !==
        address.toLowerCase(),
    );
  }

  private getWalletForAccount(
    account: string | number,
    opts: Record<string, string> = {},
  ) {
    const address = normalize(account);
    let wallet = this.wallets.find(
      ({ publicKey }) => bufferToHex(publicToAddress(publicKey)) === address,
    );
    if (!wallet) {
      throw new Error('Simple Keyring - Unable to find matching address.');
    }

    if (opts.withAppKeyOrigin) {
      const { privateKey } = wallet;
      const appKeyOriginBuffer = Buffer.from(opts.withAppKeyOrigin, 'utf8');
      const appKeyBuffer = Buffer.concat([privateKey, appKeyOriginBuffer]);
      const appKeyPrivateKey = arrToBufArr(keccak256(appKeyBuffer));
      const appKeyPublicKey = privateToPublic(appKeyPrivateKey);
      wallet = { privateKey: appKeyPrivateKey, publicKey: appKeyPublicKey };
    }

    return wallet;
  }
}

// export class SimpleKeyringClass implements KeyringClass<string[]> {
//   type: string = _TYPE;

//   new(options: string[]): Keyring<string[]> {
//     return new SimpleKeyring(options);
//   }

// }
