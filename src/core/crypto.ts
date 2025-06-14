import { randomBytes } from 'crypto';

import BN from 'bn.js';
import { curve } from 'elliptic';
import * as sha3 from 'js-sha3';
import createKeccakHash from 'keccak';


import { chacha8 } from './chacha8';
import {
  fffb4,
  fffb3,
  sqrtm1,
  fffb2,
  fffb1,
  A,
  ec,
} from './crypto-data';
import {
  encodeInt,
  decodePoint,
  reduceScalar,
  encodePoint,
  decodeScalar,
  squareRoot,
  decodeInt,
} from './helpers';
import RedBN from './interfaces';
import { serializeVarUint } from './serialize';
import { SpendKeypair } from './types';

const ADDRESS_CHECKSUM_SIZE = 8;
export const SCALAR_1DIV8: Buffer = (() => {
  const scalar: Buffer = Buffer.alloc(32);

  scalar.writeBigUInt64LE(BigInt('0x6106e529e2dc2f79'), 0);
  scalar.writeBigUInt64LE(BigInt('0x07d39db37d1cdad0'), 8);
  scalar.writeBigUInt64LE(BigInt('0x0'), 16);
  scalar.writeBigUInt64LE(BigInt('0x0600000000000000'), 24);

  return scalar;
})();
export const HASH_SIZE = 32;

export function getChecksum(buffer: Buffer): string {
  return sha3.keccak_256(buffer).substring(0, ADDRESS_CHECKSUM_SIZE);
}

export function getDerivationToScalar(txPubKey: string, secViewKey: string, outIndex: number): Buffer {
  const txPubKeyBuf: Buffer = Buffer.from(txPubKey, 'hex');
  const secViewKeyBuf: Buffer = Buffer.from(secViewKey, 'hex');

  const sharedSecret: Buffer = generateKeyDerivation(txPubKeyBuf, secViewKeyBuf);

  return derivationToScalar(sharedSecret, outIndex);
}

/*
  * out.concealing_point = (crypto::hash_helper_t::hs(CRYPTO_HDS_OUT_CONCEALING_POINT, h) * crypto::point_t(apa.view_public_key)).to_public_key(); // Q = 1/8 * Hs(domain_sep, Hs(8 * r * V, i) ) * 8 * V
  * https://github.com/hyle-team/zano/blob/2817090c8ac7639d6f697d00fc8bcba2b3681d90/src/currency_core/currency_format_utils.cpp#L1270
 */
export function calculateConcealingPoint(Hs: Buffer, pubViewKeyBuff: Buffer): Buffer {
  const scalar: BN = decodeScalar(Hs, 'Invalid sсalar');
  const P: curve.edwards.EdwardsPoint = decodePoint(pubViewKeyBuff, 'Invalid public key');
  const P2: curve.base.BasePoint = P.mul(scalar);
  return encodePoint(P2);
}

/*
  * out.blinded_asset_id = (crypto::c_scalar_1div8 * blinded_asset_id).to_public_key(); // T = 1/8 * (H_asset + s * X)
  * https://github.com/hyle-team/zano/blob/2817090c8ac7639d6f697d00fc8bcba2b3681d90/src/currency_core/currency_format_utils.cpp#L1278
 */
export function calculateBlindedAssetId(Hs: Buffer, assetId: Buffer, X: Buffer): Buffer {
  const assetIdCopy: Buffer = Buffer.from(assetId);
  const pointXCopy: Buffer = Buffer.from(X);

  const hsScalar: BN = decodeScalar(Hs, 'Invalid sсalar');
  const xP: curve.edwards.EdwardsPoint = decodePoint(pointXCopy, 'Invalid public key');
  const sxP: curve.base.BasePoint = xP.mul(hsScalar);

  const scalar1div8: BN = decodeScalar(SCALAR_1DIV8, 'Invalid sсalar');
  const assetPoint: curve.edwards.EdwardsPoint = decodePoint(assetIdCopy, 'Invalid public key');

  const pointT: curve.base.BasePoint = sxP.add(assetPoint);
  const blindedAssetIdPoint: curve.base.BasePoint = pointT.mul(scalar1div8);

  return encodePoint(blindedAssetIdPoint);
}

// todo: crypto::point_t asset_id = blinded_asset_id - asset_id_blinding_mask * crypto::c_point_X; // H = T - s * X
// https://github.com/hyle-team/zano/blob/2817090c8ac7639d6f697d00fc8bcba2b3681d90/src/currency_core/currency_format_utils.cpp#L3289

/*
  * generate_key_derivation
  * https://github.com/hyle-team/zano/blob/2817090c8ac7639d6f697d00fc8bcba2b3681d90/src/crypto/crypto.cpp#L175
 */
export function generateKeyDerivation(txPubKey: Buffer, secKeyView: Buffer): Buffer {
  const s: BN = decodeScalar(secKeyView, 'Invalid secret key');
  const P: curve.edwards.EdwardsPoint = decodePoint(txPubKey, 'Invalid public key');
  const P2: curve.base.BasePoint = P.mul(s);
  // Multiplying the initial derivation by 8, adhering to specific cryptographic protocol requirements
  const P3: curve.base.BasePoint = P2.mul(new BN('8'));
  return encodePoint(P3);
}

/*
 * derive_public_key
 * https://github.com/hyle-team/zano/blob/2817090c8ac7639d6f697d00fc8bcba2b3681d90/src/crypto/crypto.cpp#L207
 */
export function derivePublicKey(
  derivation: Buffer,
  outIndex: number,
  pubSpendKeyBuf: Buffer,
): Buffer {
  const P1: curve.base.BasePoint = decodePoint(pubSpendKeyBuf, 'Invalid public key');
  const scalar: Buffer = derivationToScalar(derivation, outIndex);
  /*
   * Scalar multiplication of the base point with the derived scalar to get the intermediary public key
   * Hs(8 * r * V, i)G
  */
  const P: curve.base.BasePoint = ec.curve.g.mul(decodeInt(scalar));
  // Hs(8 * r * V, i)G + S
  const P2: curve.base.BasePoint = P.add(P1);
  return encodePoint(P2);
}

/*
 * derive_secret_key
 * https://github.com/hyle-team/zano/blob/2817090c8ac7639d6f697d00fc8bcba2b3681d90/src/crypto/crypto.cpp#L227
 */
export function deriveSecretKey(derivation: Buffer, outIndex: number, sec: Buffer): Buffer {
  const s: BN = decodeScalar(sec, 'Invalid secret key');
  const scalar: Buffer = derivationToScalar(derivation, outIndex);
  const key: BN = s
    .add(decodeInt(scalar))
    .umod(ec.curve.n);
  return encodeInt(key);
}

/*
  * derivation_to_scalar
  * https://github.com/hyle-team/zano/blob/2817090c8ac7639d6f697d00fc8bcba2b3681d90/src/crypto/crypto.cpp#L190
 */
export function derivationToScalar(derivation: Buffer, outIndex: number): Buffer {
  const data: Buffer = Buffer.concat([
    derivation,
    serializeVarUint(outIndex),
  ]);
  return hashToScalar(data);
}

export function fastHash(data: Buffer): Buffer {
  const hash: Buffer = createKeccakHash('keccak256').update(data).digest();
  return hash;
}

/*
 * https://github.com/hyle-team/zano/blob/2817090c8ac7639d6f697d00fc8bcba2b3681d90/src/crypto/crypto-sugar.h#L1386
 */
export function hs(str32: Buffer, h: Buffer): Buffer {
  const elements: Buffer[] = [str32, h];
  const data: Buffer = Buffer.concat(elements);
  return hashToScalar(data);
}

/*
 * hash_to_scalar
 * https://github.com/hyle-team/zano/blob/2817090c8ac7639d6f697d00fc8bcba2b3681d90/src/crypto/crypto.cpp#L115
 */
export function hashToScalar(data: Buffer): Buffer {
  const hash: Buffer = fastHash(data);
  return reduceScalar32(hash);
}

export function reduceScalar32(scalar: Buffer): Buffer {
  const num: BN = decodeInt(scalar);
  return encodeInt(num.umod(ec.curve.n));
}

/*
 * generate_key_image
 * https://github.com/hyle-team/zano/blob/2817090c8ac7639d6f697d00fc8bcba2b3681d90/src/crypto/crypto.cpp#L296
 */
export function calculateKeyImage(pub: Buffer, sec: Buffer): Buffer {
  const s: BN = decodeScalar(sec, 'Invalid secret key');
  const P1: curve.base.BasePoint = hashToEc(pub);
  const P2: curve.base.BasePoint = P1.mul(s);
  return encodePoint(P2);
}

/*
 * hash_to_ec
 * https://github.com/hyle-team/zano/blob/2817090c8ac7639d6f697d00fc8bcba2b3681d90/src/crypto/crypto.cpp#L286
 */
export function hashToEc(ephemeralPubKey: Buffer): curve.base.BasePoint {
  const hash: Buffer = fastHash(ephemeralPubKey);
  const P: curve.edwards.EdwardsPoint = hashToPoint(hash);
  return P.mul(new BN(8).toRed(ec.curve.red));
}

/*
 * ge_fromfe_frombytes_vartime
 * https://github.com/hyle-team/zano/blob/2817090c8ac7639d6f697d00fc8bcba2b3681d90/src/crypto/crypto-ops.c#L2209
 */
export function hashToPoint(hash: Buffer): curve.edwards.EdwardsPoint {
  const u: RedBN = decodeInt(hash).toRed(ec.curve.red);
  // v = 2 * u^2
  const v: RedBN = u.redMul(u).redMul(new BN(2).toRed(ec.curve.red));
  // w = 2 * u^2 + 1 = v + 1
  const w: RedBN = v.redAdd(new BN(1).toRed(ec.curve.red));
  // t = w^2 - 2 * A^2 * u^2 = w^2 - A^2 * v
  const t: RedBN = w.redMul(w).redSub(A.redMul(A).redMul(v));
  // x = sqrt( w / w^2 - 2 * A^2 * u^2 ) = sqrt( w / t )
  let x: RedBN = squareRoot(w, t);

  let negative = false;

  // check = w - x^2 * t
  let check: RedBN = w.redSub(x.redMul(x).redMul(t));

  if (!check.isZero()) {
    // check = w + x^2 * t
    check = w.redAdd(x.redMul(x).redMul(t));
    if (!check.isZero()) {
      negative = true;
    } else {
      // x = x * fe_fffb1
      x = x.redMul(fffb1);
    }
  } else {
    // x = x * fe_fffb2
    x = x.redMul(fffb2);
  }

  let odd: boolean;
  let r: RedBN;
  if (!negative) {
    odd = false;
    // r = -2 * A * u^2 = -1 * A * v
    r = A.redNeg().redMul(v);
    // x = x * u
    x = x.redMul(u);
  } else {
    odd = true;
    // r = -1 * A
    r = A.redNeg();
    // check = w - sqrtm1 * x^2 * t
    check = w.redSub(x.redMul(x).redMul(t).redMul(sqrtm1));
    if (!check.isZero()) {
      // check = w + sqrtm1 * x^2 * t
      check = w.redAdd(x.redMul(x).redMul(t).redMul(sqrtm1));
      if (!check.isZero()) {
        throw new TypeError('Invalid point');
      } else {
        x = x.redMul(fffb3);
      }
    } else {
      x = x.redMul(fffb4);
    }
  }

  if (x.isOdd() !== odd) {
    // x = -1 * x
    x = x.redNeg();
  }

  // z = r + w
  const z: RedBN = r.redAdd(w);
  // y = r - w
  const y: RedBN = r.redSub(w);
  // x = x * z
  x = x.redMul(z);

  return ec.curve.point(x, y, z);
}

export function generateChaCha8Key(pass: Buffer): Buffer {
  const hash: Buffer = fastHash(pass);
  if (hash.length !== HASH_SIZE) {
    throw new Error('Size of hash must be at least that of chacha8_key');
  }
  return hash;
}

export function chachaCrypt(paymentId: Buffer, derivation: Buffer): Buffer {
  const key: Buffer = generateChaCha8Key(Buffer.from(derivation));
  const iv: Uint8Array = new Uint8Array(Buffer.alloc(12).fill(0));
  const decryptedBuff: Uint8Array = chacha8(key, iv, paymentId);

  return Buffer.from(decryptedBuff);
}

/*
 * keys_from_default
 * https://github.com/hyle-team/zano/blob/2817090c8ac7639d6f697d00fc8bcba2b3681d90/src/crypto/crypto.cpp#L88
 */
export function keysFromDefault(aPart: Buffer, keysSeedBinarySize: number): SpendKeypair {
  // aPart == 32 bytes
  const tmp: Buffer = Buffer.alloc(64).fill(0);

  if (!(tmp.length >= keysSeedBinarySize)) {
    throw new Error('size mismatch');
  }

  tmp.set(aPart);

  const hash: Buffer = fastHash(tmp.subarray(0, 32));
  hash.copy(tmp, 32);

  const scalar: BN = decodeInt(tmp);

  const reducedScalarBuff: Buffer = Buffer.alloc(32);

  const reducedScalar: BN = reduceScalar(scalar, ec.curve.n);
  // for working in web building, without to Buffer
  reducedScalarBuff.set(reducedScalar.toArrayLike(Buffer, 'le', 32));

  const basePoint: curve.base.BasePoint = ec.curve.g;
  const secretKey: Buffer = reducedScalarBuff.subarray(0, 32);

  const s: BN = decodeScalar(secretKey);

  const P2: curve.base.BasePoint = basePoint.mul(s);

  return {
    publicSpendKey: encodePoint(P2).toString('hex'),
    secretSpendKey: Buffer.from(secretKey).toString('hex'),
  };
}

/*
 * generate_seed_keys
 * https://github.com/hyle-team/zano/blob/2817090c8ac7639d6f697d00fc8bcba2b3681d90/src/crypto/crypto.cpp#L108
 */
export function generateSeedKeys(keysSeedBinarySize: number): SpendKeypair {
  const keysSeedBinary: Buffer = getRandomBytes(keysSeedBinarySize);

  const {
    secretSpendKey,
    publicSpendKey,
  } = keysFromDefault(keysSeedBinary, keysSeedBinarySize);

  return {
    secretSpendKey,
    publicSpendKey,
  };
}

export function generateSeedKeysWeb(size: number): SpendKeypair {
  const seed: Buffer = getRandomBytes(size);

  const {
    secretSpendKey,
    publicSpendKey,
  } = keysFromDefault(seed, size);

  return {
    seedKey: seed.toString('hex'),
    secretSpendKey,
    publicSpendKey,
  };
}

export function getRandomBytes(numBytes: number): Buffer {
  const array: Uint8Array = new Uint8Array(numBytes);
  return typeof window !== 'undefined' && window.crypto?.getRandomValues(array)
    ? Buffer.from(array)
    : randomBytes(numBytes);
}

/*
 * dependent_key
 * https://github.com/hyle-team/zano/blob/2817090c8ac7639d6f697d00fc8bcba2b3681d90/src/crypto/crypto.cpp#L129
 */
export function dependentKey(secretSpendKey: Buffer): string {
  if (secretSpendKey.length !== 32) {
    throw new Error('Invalid secret spend key');
  }
  const secretViewKey: Buffer = hashToScalar(secretSpendKey);
  return secretViewKey.toString('hex');
}

/*
 * secret_key_to_public_key
 * https://github.com/hyle-team/zano/blob/2817090c8ac7639d6f697d00fc8bcba2b3681d90/src/crypto/crypto.cpp#L165
 */
export function secretKeyToPublicKey(secretViewKey: Buffer): string {
  const s: BN = decodeScalar(secretViewKey, 'Invalid secret key');
  const basePoint: curve.base.BasePoint = ec.curve.g;
  const P2: curve.base.BasePoint = basePoint.mul(s);
  return encodePoint(P2).toString('hex');
}

/*
 * generate_signature
 * https://github.com/hyle-team/zano/blob/2817090c8ac7639d6f697d00fc8bcba2b3681d90/src/crypto/crypto.cpp#L241
 */
export function generateSignature(message: Buffer, privateKey: Buffer, pubKey: Buffer): string {
  const h: Buffer = fastHash(message);
  const s: BN = decodeScalar(privateKey);
  const publicKey: string = secretKeyToPublicKey(privateKey);
  const pubKeyBuf: Buffer = Buffer.from(publicKey, 'hex');

  if (!pubKeyBuf.equals(pubKey)) {
    throw new RangeError('Incorrect public key');
  }

  while (true) {
    const k: BN = decodeInt(getRandomScalar(randomBytes(32), 32));
    const K: curve.base.BasePoint = ec.curve.g.mul(k);

    const buf = {
      h: h,
      key: pubKeyBuf,
      comm: encodePoint(K),
    };

    const bufForHash: Buffer = Buffer.concat([buf.h, buf.key, buf.comm]);
    const hashFromBuffer: Buffer = hashToScalar(bufForHash);

    const c: BN = decodeInt(hashFromBuffer);

    if (c.isZero()) {
      continue;
    }

    const r: BN = k
      .sub(s.mul(c))
      .umod(ec.curve.n);

    if (r.isZero()) {
      continue;
    }

    const encodedC: Buffer = c.toArrayLike(Buffer, 'le', 32);
    const encodedR: Buffer = r.toArrayLike(Buffer, 'le', 32);

    return encodedR.toString('hex') + encodedC.toString('hex');
  }
}

/*
 * check_signature
 * https://github.com/hyle-team/zano/blob/2817090c8ac7639d6f697d00fc8bcba2b3681d90/src/crypto/crypto.cpp#L265
 */
export function checkSignature(
  message: Buffer,
  publicKey: Buffer,
  signature: { r: Buffer; c: Buffer },
): boolean {
  try {
    const r: BN = decodeScalar(signature.r);
    const c: BN = decodeScalar(signature.c);
    const P: curve.edwards.EdwardsPoint = decodePoint(publicKey);
    const h: Buffer = fastHash(message);
    const B: curve.base.BasePoint = ec.curve.g;

    const R: curve.base.BasePoint = P.mul(c).add(B.mul(r));
    const bufComm: Buffer = encodePoint(R);

    const buf = {
      h,
      key: publicKey,
      comm: bufComm,
    };

    const bufForHash: Buffer = Buffer.concat([buf.h, buf.key, buf.comm]);
    const hashFromBuffer: Buffer = hashToScalar(bufForHash);

    const calculatedC: BN = decodeInt(hashFromBuffer);

    return calculatedC.eq(c);

  } catch (error) {
    console.error('Error during signature verification:', error.message);
    return false;
  }
}

function getRandomScalar(aPart: Buffer, keysSeedBinarySize: number) {
  // aPart == 32 bytes
  const tmp: Buffer = Buffer.alloc(64).fill(0);

  if (!(tmp.length >= keysSeedBinarySize)) {
    throw new Error('size mismatch');
  }

  tmp.set(aPart);

  const hash: Buffer = fastHash(tmp.subarray(0, 32));
  hash.copy(tmp, 32);

  const scalar: BN = decodeInt(tmp);

  const reducedScalarBuff: Buffer = Buffer.alloc(32);

  const reducedScalar: BN = reduceScalar(scalar, ec.curve.n);
  // for working in web building, without to Buffer
  reducedScalarBuff.set(reducedScalar.toArrayLike(Buffer, 'le', 32));

  const secretKey: Buffer = reducedScalarBuff.subarray(0, 32);

  return secretKey;
}
