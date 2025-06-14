import BN from 'bn.js';

/**
 * BN operations in a reduction context.
 */
declare class RedBN extends BN {
  /**
   * Convert back a number using a reduction context
   */
  fromRed(): BN;

  /**
   * modular addition
   */
  redAdd(b: RedBN): RedBN;

  /**
   * in-place modular addition
   */
  redIAdd(b: RedBN): RedBN;

  /**
   * modular subtraction
   */
  redSub(b: RedBN): RedBN;

  /**
   * in-place modular subtraction
   */
  redISub(b: RedBN): RedBN;

  /**
   * modular shift left
   */
  redShl(num: number): RedBN;

  /**
   * modular multiplication
   */
  redMul(b: RedBN): RedBN;

  /**
   * in-place modular multiplication
   */
  redIMul(b: RedBN): RedBN;

  /**
   * modular square
   */
  redSqr(): RedBN;

  /**
   * in-place modular square
   */
  redISqr(): RedBN;

  /**
   * modular square root
   */
  redSqrt(): RedBN;

  /**
   * modular inverse of the number
   */
  redInvm(): RedBN;

  /**
   * modular negation
   */
  redNeg(): RedBN;

  /**
   * modular exponentiation
   */
  redPow(b: BN): RedBN;
}

export default RedBN;
