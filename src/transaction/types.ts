import { TransactionObject, TransactionObjectV3 } from './types/transactions';

export interface TransactionUtils {
  getConcealingPoint(
    viewSecretKey: string,
    txPubKey: string,
    pubViewKey: string,
    outputIndex: number
  ): string;

  decodeAmount(
    viewSecretKey: string,
    txPubKey: string,
    encryptedAmount: string | number,
    outputIndex: number
  ): bigint;

  getStealthAddress(
    txPubKey: string,
    secViewKey: string,
    pubSpendKey: string,
    outIndex: number
  ): string;

  getNativeBlindedAsset(
    viewSecretKey: string,
    txPubKey: string,
    outputIndex: number
  ): string;

  generateKeyImage(
    txPubKey: string,
    secViewKey: string,
    pubSpendKey: string,
    outIndex: number,
    spendSecretKey: string
  ): string;

  decryptPaymentId(
    encryptedPaymentId: string,
    txPubKey: string,
    secViewKey: string
  ): string;

  parseObjectInJson(
    objectInJson: string
  ): TransactionObject | TransactionObjectV3 | null;
}
