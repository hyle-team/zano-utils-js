export type ZarcanumAddressKeys = {
    spendPublicKey: string;
    viewPublicKey: string;
};
export type DecodeTransactionResult =
    | { ok: true; amount: string; paymentId?: string }
    | { ok: false; error: string }

export type DecodeVoutResult =
    | { ok: true; amount: bigint }
    | { ok: false; error: string }
