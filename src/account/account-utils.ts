import { BRAINWALLET_DEFAULT_SEED_SIZE } from './constants';
import type {
  AccountKeys,
  AccountResult,
  KeyPair,
  SpendKeypair,
} from './types';
import { getKeysFromAddress, getMasterAddress } from '../address/address-utils';
import { ADDRESS_REGEX } from '../address/constants';
import type { ZarcanumAddressKeys } from '../address/types';
import {
  dependentKey,
  generateSeedKeys,
  generateSeedKeysWeb,
  secretKeyToPublicKey,
} from '../core/crypto';

function generateAccount(): AccountResult {
  const keys: AccountKeys = generateAccountKeys();

  if (!keys || !keys.secretSpendKey || !keys.publicSpendKey || !keys.secretViewKey || !keys.publicViewKey) {
    throw new Error('Invalid generated keys');
  }

  const address: string = getMasterAddress(keys.publicSpendKey, keys.publicViewKey);

  try {
    validateAccount(address, keys.publicSpendKey, keys.publicViewKey, keys.secretSpendKey, keys.secretViewKey);
  } catch (error) {
    console.error('Error validating address:', error);
    throw error.message;
  }

  return {
    address,
    ...keys,
  };
}

function validateAccount(
  address: string,
  publicSpendKey: string,
  publicViewKey: string,
  secretSpendKey: string,
  secretViewKey: string,
): boolean {

  if (!ADDRESS_REGEX.test(address)) {
    throw new Error('invalid address format');
  }

  const { spendPublicKey }: ZarcanumAddressKeys = getKeysFromAddress(address);

  if (spendPublicKey !== publicSpendKey) {
    throw new Error('invalid address keys');
  }

  const secretSpendKeyBuf: Buffer = Buffer.from(secretSpendKey, 'hex');
  const secViewKey: string = dependentKey(secretSpendKeyBuf);

  if (secViewKey !== secretViewKey) {
    throw new Error('invalid depend secret view key');
  }

  const secretViewKeyBuf: Buffer = Buffer.from(secretViewKey, 'hex');
  const pubViewKey: string = secretKeyToPublicKey(secretViewKeyBuf);

  if (pubViewKey !== publicViewKey) {
    throw new Error('pub view key from secret key no equal provided pub view key');
  }

  const pubSpendKey: string = secretKeyToPublicKey(secretSpendKeyBuf);

  if (pubSpendKey !== pubSpendKey) {
    throw new Error('pub spend key from secret key no equal provided pub spend key');
  }

  return true;
}

function generateAccountKeys(): AccountKeys {
  const {
    secretSpendKey,
    publicSpendKey,
  }: SpendKeypair = generateSeedKeys(BRAINWALLET_DEFAULT_SEED_SIZE);

  if (!secretSpendKey || !publicSpendKey) {
    throw new Error('Error generate seed keys');
  }

  const secretSpendKeyBuf: Buffer = Buffer.from(secretSpendKey, 'hex');
  const secretViewKey: string = dependentKey(secretSpendKeyBuf);

  if (!secretViewKey) {
    throw new Error('Error generate seed keys');
  }

  const secretViewKeyBuf: Buffer = Buffer.from(secretViewKey, 'hex');
  const publicViewKey: string = secretKeyToPublicKey(secretViewKeyBuf);

  return {
    secretSpendKey,
    publicSpendKey,
    secretViewKey,
    publicViewKey,
  };
}

function getAccountBySecretSpendKey(secretSpendKey: string): AccountKeys {
  if (secretSpendKey.length !== 64 || !/^([0-9a-fA-F]{2})+$/.test(secretSpendKey)) {
    throw new Error('Invalid secret spend key');
  }

  const secretSpendKeyBuf: Buffer = Buffer.from(secretSpendKey, 'hex');

  const secretViewKey: string = dependentKey(secretSpendKeyBuf);
  const publicSpendKey: string = secretKeyToPublicKey(secretSpendKeyBuf);

  if (!secretViewKey || !publicSpendKey) {
    throw new Error('Error generate seed keys');
  }

  const secretViewKeyBuf: Buffer = Buffer.from(secretViewKey, 'hex');
  const publicViewKey: string = secretKeyToPublicKey(secretViewKeyBuf);

  return {
    secretSpendKey,
    publicSpendKey,
    secretViewKey,
    publicViewKey,
  };
}

function privateKeyToPublicKey(secretKey: string): string {
  if (secretKey.length !== 64 || !/^([0-9a-fA-F]{2})+$/.test(secretKey)) {
    throw new Error('Invalid secret spend key');
  }

  const secretKeyBuf: Buffer = Buffer.from(secretKey, 'hex');
  const publicKey: string = secretKeyToPublicKey(secretKeyBuf);

  if (!publicKey) {
    throw new Error('Error generate seed keys');
  }

  return publicKey;
}

function getKeyPair(): KeyPair {
  const {
    seedKey,
    secretSpendKey,
    publicSpendKey,
  } = generateSeedKeysWeb(BRAINWALLET_DEFAULT_SEED_SIZE);

  return {
    rawSecretKey: seedKey,
    secretKey: secretSpendKey,
    publicKey: publicSpendKey,
  };
}

export {
  privateKeyToPublicKey,
  generateAccount,
  validateAccount,
  generateAccountKeys,
  getAccountBySecretSpendKey,
  getKeyPair,
};
