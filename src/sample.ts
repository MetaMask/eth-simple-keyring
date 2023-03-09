import SimpleKeyring from '.';

const keyring = new SimpleKeyring();

let accounts: Record<string, string>[] = [];

keyring
  .addAccounts(37)
  .then((newAddresses) => {
    accounts = newAddresses.map((address) => {
      return { address };
    });
    return keyring.serialize();
  })
  .then((privateKeys) => {
    privateKeys.forEach((privateKey, index) => {
      accounts[index]!.privateKey = privateKey;
    });
  })
  .then(() => {
    const jsonAccounts = JSON.stringify(accounts, null, 2);
    console.log(jsonAccounts);
  });
