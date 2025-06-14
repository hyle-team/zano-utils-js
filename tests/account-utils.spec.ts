import { validateAccount, generateAccount, privateKeyToPublicKey, AccountKeys, getAccountBySecretSpendKey } from '../src';
import { ADDRESS_REGEX } from '../src/address/constants';
import * as crypto from '../src/core/crypto';

describe('generate account', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates unpredictable address', () => {
    expect(generateAccount()).toMatchObject({
      address: expect.stringMatching(ADDRESS_REGEX),
      secretSpendKey: expect.stringMatching(/^([0-9a-fA-F]{2})+$/),
      publicSpendKey: expect.stringMatching(/^([0-9a-fA-F]{2})+$/),
      publicViewKey: expect.stringMatching(/^([0-9a-fA-F]{2})+$/),
      secretViewKey: expect.stringMatching(/^([0-9a-fA-F]{2})+$/),
    });
  });

  it('generate known account', () => {
    jest.spyOn(crypto, 'generateSeedKeys').mockReturnValueOnce({
      secretSpendKey: '6c225665aadb81ebce41bd94cbc78250aaf62f2636819b1cdcf47d4cbcd2b00d',
      publicSpendKey: '0c27ece0fb489b344915d12745a89f9b6cb307c384286be12ae9311942aa89db',
    });

    expect(generateAccount()).toMatchObject({
      address: 'ZxBpGz8qdG3SxgBYFKJqxjThPZpjqW1ouK3ZsyZnZCUqQ4Ndc9PiqkdJuEicMXPPSW5JidxK5bye7UYc1hkTHhxc1w4temC2A',
      secretSpendKey: '6c225665aadb81ebce41bd94cbc78250aaf62f2636819b1cdcf47d4cbcd2b00d',
      publicSpendKey: '0c27ece0fb489b344915d12745a89f9b6cb307c384286be12ae9311942aa89db',
    });
  });
});

describe('address validation', () => {
  const address = 'ZxDFpn4k7xVYyc9VZ3LphrJbkpc46xfREace5bme1aXiMzKPAHA8jsTWcHSXhv9AdodSaoGXK9Mg7bk3ec4FkQrj357fZPWZX';
  const secretSpendKey = '80b3e96a3eb765332b0fd3e44e0fefa58747a70025bf91aa4a7b758ab6f5590d';
  const publicSpendKey = 'b3eee2376f32bf2bfb5cf9c023f569380c84ac8c64ddc8f7c109730dc8e97d7a';
  const secretViewKey = '3e75ffee51eb21b1d6404ddcab5b3aaa49edbfe225e9a893d87074aacae46b09';
  const publicViewKey = 'fa9c2811c53eb1044490e931f92ad9ddf317220df08ccfb5b83eccfdbd38f135';

  const secretSpendKey2 = '9ed57f071db00695b18ea396d0f85ce18178b35643c038f09255edc326c4a502';
  const publicSpendKey2 = 'd651f305d40bcbe27ced0ef48253623ec31da3a28130d08ddf6686179e418ff4';
  const publicViewKey2 = '2b3e2bac27a3992b3f93285b1d08476a5723afdf3aa6961770ad7e7544325831';

  it('created address should be valid', () => {
    expect(validateAccount(address, publicSpendKey, publicViewKey, secretSpendKey, secretViewKey))
      .toBe(true);
  });

  it('should throw on empty input', () => {
    expect(() => validateAccount('', '', '', '', '')).toThrow('invalid address format');
  });

  it('should throw on invalid address keys', () => {
    expect(() => validateAccount(address, '', '', '', '')).toThrow('invalid address keys');
  });

  it('should throw on invalid dependent secret view key', () => {
    expect(() =>
      validateAccount(address, publicSpendKey, publicViewKey, secretSpendKey2, secretViewKey)
    ).toThrow('invalid depend secret view key');
  });

  it('should throw on mismatched public spend key', () => {
    expect(() =>
      validateAccount(address, publicSpendKey2, publicViewKey, secretSpendKey, secretViewKey)
    ).toThrow('invalid address keys');
  });

  it('should throw on missing secret view key', () => {
    expect(() =>
      validateAccount(address, publicSpendKey2, publicViewKey, secretSpendKey, '')
    ).toThrow('invalid address keys');
  });

  it('should throw on empty dependent secret view key', () => {
    expect(() =>
      validateAccount(address, publicSpendKey, publicViewKey, secretSpendKey, '')
    ).toThrow('invalid depend secret view key');
  });

  it('should throw on mismatched public view key', () => {
    expect(() =>
      validateAccount(address, publicSpendKey, publicViewKey2, secretSpendKey, secretViewKey)
    ).toThrow('pub view key from secret key no equal provided pub view key');
  });
});

describe('private key to public key', () => {
  const secretSpendKey = '80b3e96a3eb765332b0fd3e44e0fefa58747a70025bf91aa4a7b758ab6f5590d';
  const publicSpendKey = 'b3eee2376f32bf2bfb5cf9c023f569380c84ac8c64ddc8f7c109730dc8e97d7a';

  it('should derive the correct public key from a given secret key', () => {
    const actualPublicKey: string = privateKeyToPublicKey(secretSpendKey);
    expect(actualPublicKey).toBe(publicSpendKey);
  });

  it('should throw an error for an invalid secret key (non-hex string)', () => {
    const invalidKey = 'zzzz-not-a-hex-key';
    expect(() => privateKeyToPublicKey(invalidKey)).toThrow('Invalid secret spend key');
  });

  it('should throw an error for a too short key', () => {
    const shortKey = 'deadbeef';
    expect(() => privateKeyToPublicKey(shortKey)).toThrow('Invalid secret spend key');
  });

  it('should throw an error for an empty string', () => {
    expect(() => privateKeyToPublicKey('')).toThrow('Invalid secret spend key');
  });
});

describe('get account by secret spend key', () => {
  it('created account should be equal mock', () => {
    const secretSpendKeyMock = '80b3e96a3eb765332b0fd3e44e0fefa58747a70025bf91aa4a7b758ab6f5590d';
    const publicSpendKeyMock = 'b3eee2376f32bf2bfb5cf9c023f569380c84ac8c64ddc8f7c109730dc8e97d7a';
    const secretViewKeyMock = '3e75ffee51eb21b1d6404ddcab5b3aaa49edbfe225e9a893d87074aacae46b09';
    const publicViewKeyMock = 'fa9c2811c53eb1044490e931f92ad9ddf317220df08ccfb5b83eccfdbd38f135';

    const accountKeys: AccountKeys = getAccountBySecretSpendKey(secretSpendKeyMock);
    const { secretSpendKey, secretViewKey, publicSpendKey, publicViewKey } = accountKeys;

    expect({ secretSpendKey, secretViewKey, publicSpendKey, publicViewKey }).toEqual({
      secretSpendKey: secretSpendKeyMock,
      secretViewKey: secretViewKeyMock,
      publicSpendKey: publicSpendKeyMock,
      publicViewKey: publicViewKeyMock
    });
  });
});
