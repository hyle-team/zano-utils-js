import Big from 'big.js';

import type { TransactionObject, TransactionObjectV3 } from '../../transaction/types/transactions';


export function timestampMsToDate(timestampMs: number): Date {
  return new Date(timestampMs * 1000);
}

export function satoshiToZano(satoshiAmount: string): string {
  const satoshi: Big = new Big(satoshiAmount);
  if (satoshi.lt(0)) {
    throw new Error('The number of satoshi cannot be negative');
  } else if (satoshi.eq(0)) {
    return '0';
  }

  satoshi.e -= 12;
  return satoshi.toFixed();
}

export function isTransactionObjectV3(tx: TransactionObject | TransactionObjectV3): tx is TransactionObjectV3 {
  return (tx as TransactionObjectV3).AGGREGATED?.version === '3';
}

/**
 * Safely parses a string to a number using Big.js.
 * Returns null if the value is invalid or too large for a JS number.
 */
export function parseBigAmountToNumber(str: string): number | null {
  try {
    const big: Big = new Big(str);
    const num = Number(big.toString());

    if (!Number.isFinite(num)) {
      console.error('Value too large for JS number:', str);
      return null;
    }

    return num;
  } catch (e) {
    console.error('Invalid numeric string format:', str);
    return null;
  }
}
