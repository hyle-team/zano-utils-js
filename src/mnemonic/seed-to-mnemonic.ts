import { phrases } from './consts/phrases';
import { NUMWORDS } from './mnemonic-to-seed';
import type { SeedToMnemonicResult } from './types';
import { fastHash } from '../core/crypto';

export const wordsArray: string[] = phrases.map(p => p.phrase);

const WALLET_BRAIN_DATE_OFFSET = 1543622400;
const WALLET_BRAIN_DATE_QUANTUM = 604800;
const WALLET_BRAIN_DATE_MAX_WEEKS_COUNT = 800;
const CHECKSUM_MAX = NUMWORDS >> 1;

export function seedToMnemonic(keysSeedHex: string): SeedToMnemonicResult {
  if (!keysSeedHex) {
    throw new Error('Invalid seed hex');
  }

  const keysSeedBinary: Buffer = Buffer.from(keysSeedHex, 'hex');
  const mnemonic: string = binaryToText(keysSeedBinary);

  const timestamp: number = Math.floor(Date.now() / 1000);
  const creationTimestampWord: string = getWordFromTimestamp(timestamp, false);

  const timestampFromWord: number = getTimestampFromWord(creationTimestampWord, false);

  const hashWithTimestamp: Buffer = Buffer.from(fastHash(keysSeedBinary));
  hashWithTimestamp.writeBigUInt64LE(BigInt(timestampFromWord), 0);

  const checksumHash: Buffer = fastHash(hashWithTimestamp);
  const checksumValue: number = Number(checksumHash.readBigUInt64LE(0) % BigInt(CHECKSUM_MAX + 1)) || 0;

  const auditableFlag = 0;
  const checksumWord: string = wordByNum((checksumValue << 1) | (auditableFlag & 1));

  return `${mnemonic} ${creationTimestampWord} ${checksumWord}`;
}

function wordByNum(index: number): string {
  return phrases[index]?.phrase ?? '';
}

function numByWord(word: string): number {
  const entry = phrases.find(p => p.phrase === word);
  if (!entry) {
    throw new Error(`Unable to find word "${word}" in mnemonic dictionary`);
  }
  return entry.value;
}

function binaryToText(binary: Buffer): string {
  if (binary.length % 4 !== 0) {
    throw new Error('Invalid binary data size for mnemonic encoding');
  }

  const words: string[] = [];

  for (let i = 0; i < binary.length; i += 4) {
    const val: number = binary.readUInt32LE(i);

    const w1: number = val % NUMWORDS;
    const w2: number = (Math.floor(val / NUMWORDS) + w1) % NUMWORDS;
    const w3: number = (Math.floor(val / (NUMWORDS * NUMWORDS)) + w2) % NUMWORDS;

    words.push(wordsArray[w1], wordsArray[w2], wordsArray[w3]);
  }

  return words.join(' ');
}
function getWordFromTimestamp(timestamp: number, usePassword: boolean): string {
  const dateOffset: number = Math.max(timestamp - WALLET_BRAIN_DATE_OFFSET, 0);
  let weeksCount = Math.trunc(dateOffset / WALLET_BRAIN_DATE_QUANTUM);
  console.log(weeksCount);

  if (weeksCount >= WALLET_BRAIN_DATE_MAX_WEEKS_COUNT) {
    throw new Error('SEED PHRASE needs to be extended or refactored');
  }

  if (usePassword) {
    weeksCount += WALLET_BRAIN_DATE_MAX_WEEKS_COUNT;
  }

  if (weeksCount > 0xffffffff) {
    throw new Error(`Value too large for uint32: ${weeksCount}`);
  }

  return wordByNum(weeksCount);
}

export function getTimestampFromWord(word: string, passwordUsed: boolean): number {
  let weeks = numByWord(word);

  if (weeks >= WALLET_BRAIN_DATE_MAX_WEEKS_COUNT) {
    weeks -= WALLET_BRAIN_DATE_MAX_WEEKS_COUNT;
    passwordUsed = true;
  } else {
    passwordUsed = false;
  }

  return weeks * WALLET_BRAIN_DATE_QUANTUM + WALLET_BRAIN_DATE_OFFSET;
}
