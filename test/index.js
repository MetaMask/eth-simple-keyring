const assert = require('assert')
const ethUtil = require('ethereumjs-util')
const sigUtil = require('eth-sig-util')
const SimpleKeyring = require('../')
const EthereumTx = require('ethereumjs-tx').Transaction
const { expect } = require('chai')

const TYPE_STR = 'Simple Key Pair'

// Sample account:
const testAccount = {
  key: '0xb8a9c05beeedb25df85f8d641538cbffedf67216048de9c678ee26260eb91952',
  address: '0x01560cd3bac62cc6d7e6380600d9317363400896',
}

describe('simple-keyring', () => {

  let keyring
  beforeEach(() => {
    keyring = new SimpleKeyring()
  })

  describe('Keyring.type', () => {
    it('is a class property that returns the type string.', () => {
      const type = SimpleKeyring.type
      assert.equal(type, TYPE_STR)
    })
  })

  describe('#type', () => {
    it('returns the correct value', () => {
      const type = keyring.type
      assert.equal(type, TYPE_STR)
    })
  })

  describe('#serialize empty wallets.', () => {
    it('serializes an empty array', async () => {
      const output = await keyring.serialize()
      assert.deepEqual(output, [])
    })
  })

  describe('#deserialize a private key', () => {
    it('serializes what it deserializes', async () => {
      await keyring.deserialize([testAccount.key])
      assert.equal(keyring.wallets.length, 1, 'has one wallet')
      const serialized = await keyring.serialize()
      assert.equal(serialized[0], ethUtil.stripHexPrefix(testAccount.key))
      const accounts = await keyring.getAccounts()
      assert.deepEqual(accounts, [testAccount.address], 'accounts match expected')
    })
  })

  describe('#constructor with a private key', () => {
    it('has the correct addresses', async () => {
      const keyring = new SimpleKeyring([testAccount.key])
      const accounts = await keyring.getAccounts()
      assert.deepEqual(accounts, [testAccount.address], 'accounts match expected')
    })
  })

  describe('#signTransaction', () => {
    const address = '0x9858e7d8b79fc3e6d989636721584498926da38a'
    const privateKey = '0x7dd98753d7b4394095de7d176c58128e2ed6ee600abe97c9f6d9fd65015d9b18'

    it('returns a signed tx object', async () => {
      await keyring.deserialize([ privateKey ])

      const txParams = {
        from: address,
        nonce: '0x00',
        gasPrice: '0x09184e72a000',
        gasLimit: '0x2710',
        to: address,
        value: '0x1000',
      }
      const tx = new EthereumTx(txParams)

      const signed = await keyring.signTransaction(address, tx)
      assert.ok(signed.raw, 'has a raw signature')
    })
  })

  describe('#signMessage', () => {
    const address = '0x9858e7d8b79fc3e6d989636721584498926da38a'
    const message = '0x879a053d4800c6354e76c7985a865d2922c82fb5b3f4577b2fe08b998954f2e0'
    const privateKey = '0x7dd98753d7b4394095de7d176c58128e2ed6ee600abe97c9f6d9fd65015d9b18'
    const expectedResult = '0x28fcb6768e5110144a55b2e6ce9d1ea5a58103033632d272d2b5cf506906f7941a00b539383fd872109633d8c71c404e13dba87bc84166ee31b0e36061a69e161c'

    it('passes the dennis test', async () => {
      await keyring.deserialize([ privateKey ])
      const result = await keyring.signMessage(address, message)
      assert.equal(result, expectedResult)
    })

    it('reliably can decode messages it signs', async () => {
      const message = 'hello there!'
      const msgHashHex = ethUtil.bufferToHex(ethUtil.sha3(message))

      await keyring.deserialize([ privateKey ])
      await keyring.addAccounts(9)
      const addresses = await keyring.getAccounts()
      const signatures = await Promise.all(addresses.map(async (address) => {
        return await keyring.signMessage(address, msgHashHex)
      }))
      signatures.forEach((sgn, index) => {
        const address = addresses[index]

        const r = ethUtil.toBuffer(sgn.slice(0,66))
        const s = ethUtil.toBuffer('0x' + sgn.slice(66,130))
        const v = ethUtil.bufferToInt(ethUtil.toBuffer('0x' + sgn.slice(130,132)))
        const m = ethUtil.toBuffer(msgHashHex)
        const pub = ethUtil.ecrecover(m, v, r, s)
        const adr = '0x' + ethUtil.pubToAddress(pub).toString('hex')

        assert.equal(adr, address, 'recovers address from signature correctly')
      })
    })
  })

  describe('#addAccounts', () => {
    describe('with no arguments', () => {
      it('creates a single wallet', async () => {
        await keyring.addAccounts()
        assert.equal(keyring.wallets.length, 1)
      })
    })

    describe('with a numeric argument', () => {
      it('creates that number of wallets', async () => {
        await keyring.addAccounts(3)
        assert.equal(keyring.wallets.length, 3)
      })
    })
  })

  describe('#getAccounts', () => {
    it('calls getAddress on each wallet', async () => {

      // Push a mock wallet
      const desiredOutput = '0x18a3462427bcc9133bb46e88bcbe39cd7ef0e761'
      keyring.wallets.push({
        getAddress() {
          return ethUtil.toBuffer(desiredOutput)
        }
      })

      const output = await keyring.getAccounts()
      assert.equal(output[0], desiredOutput)
      assert.equal(output.length, 1)
    })
  })

  describe('#removeAccount', () => {
    describe('if the account exists', () => {
      it('should remove that account', async () => {
        await keyring.addAccounts()
        const addresses = await keyring.getAccounts()
        keyring.removeAccount(addresses[0])
        const addressesAfterRemoval = await keyring.getAccounts()
        assert.equal(addressesAfterRemoval.length, addresses.length -1)
      })
    })

    describe('if the account does not exist', () => {
      it('should throw an error', (done) => {
        const unexistingAccount = '0x0000000000000000000000000000000000000000'
        expect(_ => {
           keyring.removeAccount(unexistingAccount)
        }).to.throw(`Address ${unexistingAccount} not found in this keyring`)
        done()
      })
    })
  })

  describe('#signPersonalMessage', () => {
    it('returns the expected value', async () => {
      const address = '0xbe93f9bacbcffc8ee6663f2647917ed7a20a57bb'
      const privateKey = new Buffer('6969696969696969696969696969696969696969696969696969696969696969', 'hex')
      const privKeyHex = ethUtil.bufferToHex(privateKey)
      const message = '0x68656c6c6f20776f726c64'
      const signature = '0xce909e8ea6851bc36c007a0072d0524b07a3ff8d4e623aca4c71ca8e57250c4d0a3fc38fa8fbaaa81ead4b9f6bd03356b6f8bf18bccad167d78891636e1d69561b'

      await keyring.deserialize([privKeyHex])
      const sig = await keyring.signPersonalMessage(address, message)
      assert.equal(sig, signature, 'signature matches')

      const restored = sigUtil.recoverPersonalSignature({
        data: message,
        sig,
      })

      assert.equal(restored, address, 'recovered address')
    })
  })

  describe('#signTypedData', () => {
    const address = '0x29c76e6ad8f28bb1004902578fb108c507be341b'
    const privKeyHex = '0x4af1bceebf7f3634ec3cff8a2c38e51178d5d4ce585c52d6043e5e2cc3418bb0'

    it('returns the expected value', async () => {
      const expectedSignature = '0x24367b495e5d9f1fabc6e66abaaf0f3e5fe6fd984d5870a72523a1add3f3efdd41005bceba75e7c3ee96c233a5c7b4fe5642a58966eb46de25f111f541b272b31b'

      const typedData = {
        types: {
          EIP712Domain: []
        },
        domain: {},
        primaryType: 'EIP712Domain',
        message: {}
      }

      await keyring.deserialize([privKeyHex])
      const sig = await keyring.signTypedData(address, typedData)
      assert.equal(sig, expectedSignature, 'signature matches')
      const restored = sigUtil.recoverTypedSignature({ data: typedData, sig: sig })
      assert.equal(restored, address, 'recovered address')
    })
  })
  
  describe('#decryptMessage', () => {
    it('returns the expected value', async () => {
      const address = '0xbe93f9bacbcffc8ee6663f2647917ed7a20a57bb'
      const privateKey = new Buffer('6969696969696969696969696969696969696969696969696969696969696969', 'hex')
      const privKeyHex = ethUtil.bufferToHex(privateKey)
      const message = 'Hello world!'
      const encryptedMessage = sigUtil.encrypt(sigUtil.getEncryptionPublicKey(privateKey), {'data': message}, 'x25519-xsalsa20-poly1305')

      await keyring.deserialize([privKeyHex])
      const decryptedMessage = await keyring.decryptMessage(address, encryptedMessage)
      assert.equal(message, decryptedMessage, 'signature matches')
    })
  })

  describe('#encryptionPublicKey', () => {
    it('returns the expected value', async () => {
      const address = '0xbe93f9bacbcffc8ee6663f2647917ed7a20a57bb'
      const privateKey = new Buffer('6969696969696969696969696969696969696969696969696969696969696969', 'hex')
      const publicKey = 'GxuMqoE2oHsZzcQtv/WMNB3gCH2P6uzynuwO1P0MM1U='
      const privKeyHex = ethUtil.bufferToHex(privateKey)
      await keyring.deserialize([privKeyHex])
      const encryptionPublicKey = await keyring.getEncryptionPublicKey(address, privateKey)
      assert.equal(publicKey, encryptionPublicKey, 'public keys matches')
    })
  })
  
  describe('#signTypedData_v4 signature verification', () => {
    const privKeyHex = 'c85ef7d79691fe79573b1a7064c19c1a9819ebdbd1faaab1a8ec92344438aaf4'
    const expectedSig = '0x65cbd956f2fae28a601bebc9b906cea0191744bd4c4247bcd27cd08f8eb6b71c78efdf7a31dc9abee78f492292721f362d296cf86b4538e07b51303b67f749061b'

    it('returns the expected value', async () => {
      const typedData = {"data":{"types":{"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}],"Person":[{"name":"name","type":"string"},{"name":"wallets","type":"address[]"}],"Mail":[{"name":"from","type":"Person"},{"name":"to","type":"Person[]"},{"name":"contents","type":"string"}],"Group":[{"name":"name","type":"string"},{"name":"members","type":"Person[]"}]},"domain":{"name":"Ether Mail","version":"1","chainId":1,"verifyingContract":"0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"},"primaryType":"Mail","message":{"from":{"name":"Cow","wallets":["0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826","0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF"]},"to":[{"name":"Bob","wallets":["0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB","0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57","0xB0B0b0b0b0b0B000000000000000000000000000"]}],"contents":"Hello, Bob!"}}}

      await keyring.deserialize([privKeyHex])

      const addresses = await keyring.getAccounts()
      const address = addresses[0]

      const sig = await keyring.signTypedData_v4(address, typedData.data)
      assert.equal(sig, expectedSig, 'verified signature')
      const signedData = Object.create(typedData)
      signedData.sig = sig
      const restored = sigUtil.recoverTypedSignature_v4(signedData)
      assert.equal(restored, address, 'recovered address')
    })
  })


  describe('getAppKeyAddress', function () {
    it('should return a public address custom to the provided app key origin', async function () {
      const address = testAccount.address
      const keyring = new SimpleKeyring([testAccount.key])

      const appKeyAddress = await keyring.getAppKeyAddress(address, 'someapp.origin.io')

      assert.notEqual(address, appKeyAddress)
      assert(ethUtil.isValidAddress(appKeyAddress))
    })

    it('should return different addresses when provided different app key origins', async function () {
      const address = testAccount.address
      const keyring = new SimpleKeyring([testAccount.key])

      const appKeyAddress1 = await keyring.getAppKeyAddress(address, 'someapp.origin.io')

      assert(ethUtil.isValidAddress(appKeyAddress1))

      const appKeyAddress2 = await keyring.getAppKeyAddress(address, 'anotherapp.origin.io')

      assert(ethUtil.isValidAddress(appKeyAddress2))

      assert.notEqual(appKeyAddress1, appKeyAddress2)
    })

    it('should return the same address when called multiple times with the same params', async function () {
      const address = testAccount.address
      const keyring = new SimpleKeyring([testAccount.key])

      const appKeyAddress1 = await keyring.getAppKeyAddress(address, 'someapp.origin.io')

      assert(ethUtil.isValidAddress(appKeyAddress1))

      const appKeyAddress2 = await keyring.getAppKeyAddress(address, 'someapp.origin.io')

      assert(ethUtil.isValidAddress(appKeyAddress2))

      assert.equal(appKeyAddress1, appKeyAddress2)
    })
  })

  describe('signing methods withAppKeyOrigin option', function () {
    it('should signPersonalMessage with the expected key when passed a withAppKeyOrigin', async function () {
      const address = testAccount.address
      const message = '0x68656c6c6f20776f726c64'

      const privateKeyHex = '4fbe006f0e9c2374f53eb1aef1b6970d20206c61ea05ad9591ef42176eb842c0'
      const privateKeyBuffer = new Buffer(privateKeyHex, 'hex')
      const expectedSig = sigUtil.personalSign(privateKeyBuffer, { data: message })

      const keyring = new SimpleKeyring([testAccount.key])
      const sig = await keyring.signPersonalMessage(address, message, {
        withAppKeyOrigin: 'someapp.origin.io',
      })

      assert.equal(expectedSig, sig, 'sign with app key generated private key')
    })

    it('should signTypedData_v3 with the expected key when passed a withAppKeyOrigin', async function () {
      const address = testAccount.address
      const typedData = {
        types: {
          EIP712Domain: []
        },
        domain: {},
        primaryType: 'EIP712Domain',
        message: {}
      }

      const privateKeyHex = '4fbe006f0e9c2374f53eb1aef1b6970d20206c61ea05ad9591ef42176eb842c0'
      const privateKeyBuffer = new Buffer(privateKeyHex, 'hex')
      const expectedSig = sigUtil.signTypedData(privateKeyBuffer, { data: typedData })

      const keyring = new SimpleKeyring([testAccount.key])
      const sig = await keyring.signTypedData_v3(address, typedData, {
        withAppKeyOrigin: 'someapp.origin.io',
      })

      assert.equal(expectedSig, sig, 'sign with app key generated private key')
    })
  })
})
