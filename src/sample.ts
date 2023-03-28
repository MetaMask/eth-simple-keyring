import SimpleKeyring from '.';

const keyring = new SimpleKeyring();

let accounts: Record<string, string>[] = [];

keyring // eslint-disable-line @typescript-eslint/no-floating-promises
  .addAccounts(37)
  .then(async (newAddresses) => {
    accounts = newAddresses.map((address) => {
      return { address };
    });
    return keyring.serialize();
  })
  .then((privateKeys) => {
    privateKeys.forEach((privateKey, index) => {
      accounts[index]!.privateKey = privateKey; // eslint-disable-line @typescript-eslint/no-non-null-assertion
    });
  })
  .then(() => {
    const jsonAccounts = JSON.stringify(accounts, null, 2);
    console.log(jsonAccounts);
  });
