export type AccountKeys = {
  secretSpendKey: string;
  secretViewKey: string;
  publicSpendKey: string;
  publicViewKey: string;
}

export type AccountResult = AccountKeys & {
  address: string;
}

export type SpendKeypair = {
  seedKey?: string;
  secretSpendKey: string;
  publicSpendKey: string;
}

export type KeyPair = {
  rawSecretKey: string;
  secretKey: string;
  publicKey: string;
}
