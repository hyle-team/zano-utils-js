import {
  ADDRESS_REGEX,
  BUFFER_ADDRESS_LENGTH,
  BUFFER_INTEGRATED_ADDRESS_LENGTH,
  CHECKSUM_LENGTH,
  FLAG_LENGTH,
  INTEGRATED_ADDRESS_REGEX,
  PUBLIC_KEY_REGEX,
  SPEND_KEY_LENGTH,
  TAG_LENGTH,
  VIEW_KEY_LENGTH,
} from './constants';
import {
  DecodeVoutResult,
  DecodeTransactionResult,
  ZarcanumAddressKeys,
} from './types';
import { isTransactionObjectV3, satoshiToZano } from './utils/functions';
import { base58Decode } from '../core/base58';
import { getChecksum, secretKeyToPublicKey } from '../core/crypto';
import {
  decodeAmount,
  decryptPaymentId,
  getConcealingPoint,
  getNativeBlindedAsset,
  getStealthAddress,
  parseObjectInJson,
} from '../transaction/transaction-utils';
import {
  AggregatedTxV3,
  TransactionObject,
  TransactionObjectV3,
  TxOutZarcanum,
  VoutEntry,
} from '../transaction/types/transactions';

export function decodeTransaction(
  objectInJson: string,
  secretViewKey: string,
  addressOrPublicSpendKey: string,
): DecodeTransactionResult {
  objectInJson = objectInJson.trim();
  secretViewKey = secretViewKey.trim();
  addressOrPublicSpendKey = addressOrPublicSpendKey.trim();

  let addressKeys: ZarcanumAddressKeys;

  if (ADDRESS_REGEX.test(addressOrPublicSpendKey)) {
    addressKeys = getKeysFromAddress(addressOrPublicSpendKey);
  } else if (PUBLIC_KEY_REGEX.test(addressOrPublicSpendKey)) {
    const secretViewKeyBuf: Buffer = Buffer.from(secretViewKey, 'hex');
    const publicViewKey: string = secretKeyToPublicKey(secretViewKeyBuf);
    addressKeys = {
      spendPublicKey: addressOrPublicSpendKey,
      viewPublicKey: publicViewKey,
    };
  } else {
    return { ok: false, error: 'Either address or valid publicSpendKey must be provided.' };
  }

  const tx: TransactionObject | TransactionObjectV3 | null = parseObjectInJson(objectInJson);

  if (!tx) {
    return { ok: false, error: 'Failed to parse transaction JSON.' };
  }

  if (!isTransactionObjectV3(tx)) {
    return { ok: false, error: 'Only V3 transactions are supported.' };
  }

  const aggregated: AggregatedTxV3 = tx.AGGREGATED;

  if (!aggregated.vin?.length || !aggregated.vout?.length) {
    return { ok: false, error: 'Invalid V3 transaction: missing vin or vout.' };
  }

  const validPubKey: string | undefined = aggregated.extra?.find(
    item => 'pub_key' in item && typeof item.pub_key === 'string' && item.pub_key.length > 0,
  )?.pub_key;

  if (!validPubKey) {
    return { ok: false, error: 'Public key not found in V3 transaction.' };
  }

  const extractedPaymentId: string | undefined = extractPaymentId(tx);
  const paymentId: string = decryptPaymentId(extractedPaymentId, validPubKey, secretViewKey);

  let totalAmount = BigInt(0);

  for (const [index, vout] of aggregated.vout.entries()) {
    if (!validateVoutEntryDataV3(vout)) {
      continue;
    }

    const result: DecodeVoutResult = decodeVoutEntryV3(
      vout,
      validPubKey,
      index,
      addressKeys,
      secretViewKey,
    );

    if (!result.ok) {
      continue;
    }

    totalAmount += result.amount;
  }

  return {
    ok: true,
    amount: satoshiToZano(totalAmount.toString()),
    ...(paymentId ? { paymentId } : { }),
  };
}

function decodeVoutEntryV3(
  vout: VoutEntry,
  validPubKey: string,
  index: number,
  addressKeys: ZarcanumAddressKeys,
  secretViewKey: string,
): DecodeVoutResult {
  if (!vout || !vout.tx_out_zarcanum) {
    return { ok: false, error: 'Missing tx_out_zarcanum in vout.' };
  }

  const stealthAddress: string = getStealthAddress(
    validPubKey,
    secretViewKey,
    addressKeys.spendPublicKey,
    index,
  );

  const concealingPoint: string = getConcealingPoint(
    secretViewKey,
    validPubKey,
    addressKeys.viewPublicKey,
    index,
  );

  const blindedAssetId: string = getNativeBlindedAsset(
    secretViewKey,
    validPubKey,
    index,
  );

  const out: TxOutZarcanum = vout.tx_out_zarcanum;

  if (
    stealthAddress !== out.stealth_address ||
    concealingPoint !== out.concealing_point ||
    blindedAssetId !== out.blinded_asset_id
  ) {
    return { ok: false, error: 'Output does not belong to this address (mismatch).' };
  }

  const decryptedAmount: bigint = decodeAmount(
    secretViewKey,
    validPubKey,
    out.encrypted_amount,
    index,
  );

  if (!decryptedAmount || typeof decryptedAmount !== 'bigint') {
    return { ok: false, error: 'Failed to decrypt amount.' };
  }

  return { ok: true, amount: decryptedAmount };
}

function getKeysFromAddress(address: string): ZarcanumAddressKeys {
  if (!ADDRESS_REGEX.test(address) && !INTEGRATED_ADDRESS_REGEX.test(address)) {
    throw new Error('Invalid address format');
  }

  const buf: Buffer = base58Decode(address);

  if (buf.length !== BUFFER_ADDRESS_LENGTH && buf.length !== BUFFER_INTEGRATED_ADDRESS_LENGTH) {
    throw new Error('Invalid buffer address length');
  }

  const addressWithoutChecksum: Buffer = Buffer.from(buf.buffer, 0, buf.length - CHECKSUM_LENGTH);
  const checksum: string = Buffer.from(buf.buffer, buf.length - CHECKSUM_LENGTH).toString('hex');

  if (checksum !== getChecksum(addressWithoutChecksum)) {
    throw new Error('Invalid address checksum');
  }

  const spendPublicKey: string = Buffer.from(
    buf.buffer,
    TAG_LENGTH + FLAG_LENGTH,
    SPEND_KEY_LENGTH,
  ).toString('hex');

  const viewPublicKey: string = Buffer.from(
    buf.buffer,
    TAG_LENGTH + FLAG_LENGTH + SPEND_KEY_LENGTH,
    VIEW_KEY_LENGTH,
  ).toString('hex');

  if (!spendPublicKey || spendPublicKey.length !== SPEND_KEY_LENGTH * 2 ||
    !viewPublicKey || viewPublicKey.length !== VIEW_KEY_LENGTH * 2) {
    throw new Error('Invalid key format in the address.');
  }

  return {
    spendPublicKey,
    viewPublicKey,
  };
}

function validateVoutEntryDataV3(vout: VoutEntry): boolean {
  if (!vout || !vout.tx_out_zarcanum) {
    return false;
  }

  const {
    stealth_address,
    concealing_point,
    amount_commitment,
    blinded_asset_id,
    encrypted_amount,
    mix_attr,
  } = vout.tx_out_zarcanum;

  return (
    typeof stealth_address === 'string' &&
    typeof concealing_point === 'string' &&
    typeof amount_commitment === 'string' &&
    typeof blinded_asset_id === 'string' &&
    typeof encrypted_amount === 'string' &&
    typeof mix_attr === 'string'
  );
}

function extractPaymentId(tx: TransactionObjectV3): string | null {
  const body: string = tx?.attachment?.[0]?.attachment?.body;
  if (typeof body !== 'string') {
    return null;
  }

  const match: RegExpMatchArray = /\b[a-fA-F0-9]{16}\b/.exec(body);
  return match ? match[0] : null;
}
