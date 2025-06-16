# zano-utils-js
Set of helpers and tools for JS developers that working with Zano
<!-- TOC -->
* [Zano Utils JS](#zano-utils-js)
  * [Blockchain Description](#blockchain-description)
  * [Functions](#functions)
    * [deocdeTransaction](#decodetransaction)
    * [generateAccount](#generateaccount)
    * [validateAccount](#validateaccount)
    * [generateAccountKeys](#generateaccountkeys)
    * [privateKeyToPublicKey](#privatekeytopublickey)
    * [getAccountBySecretSpendKey](#getaccountbysecretspendkey)
    * [getKeyPair](#getkeypair)
    * [getIntegratedAddress](#getintegratedaddress)
    * [createIntegratedAddress](#createintegratedaddress)
    * [getMasterAddress](#getmasteraddress)
    * [splitIntegratedAddress](#splitintegratedaddress)
    * [getKeysFromAddress](#getkeysfromaddress)
    * [generatePaymentId](#generatepaymentid)
    * [mnemonicToSeed](#mnemonictoseed)
    * [seedToMnemonic](#seedtomnemonic)
    
<!-- TOC -->

## Blockchain Description

- **Ticker**: Zano  
- **Network**: Zano  

---

## Functions

### `decodeTransaction`

#### Node Method Used:
- `get_tx_details`

#### Example Request:

```bash
curl -X POST \
-H "Content-Type: application/json" \
--data '{ "jsonrpc": "2.0", "method": "get_tx_details", "params": {"tx_hash": "77b09d759fefd512642f9a5e4e31ed0fefbaf1a8e602a2be94fc511ff982f7cf" }, "id": 1 }' \
"http://37.27.100.59:10500/json_rpc"
```

<details>
  <summary>Example response</summary>

```json
{
  "id": 1,
  "jsonrpc": "2.0",
  "result": {      
    "status": "OK",
    "tx_info": {
      "amount": 0,
      "blob": "AwIlEBqFoRgAAAAAABp....",
      "blob_size": 2017,
      "extra": [{
        "details_view": "",
        "short_view": "(encrypted)",
        "type": "payer"
      },{
        "details_view": "",
        "short_view": "631a0aa63dd0caa6473f8a136a155f54a05d1f2f8b5b92c5145383be2a696834",
        "type": "pub_key"
      },{
        "details_view": "0000",
        "short_view": "0000",
        "type": "FLAGS16"
      },{
        "details_view": "derivation_hash: 5fd099a9\nencrypted_key_derivation: 2fecfc1742ea69e8b25f76c5014bd2cb9ca249e2b717bbc6376e0196e450eccf",
        "short_view": "derivation_hash: 5fd099a9",
        "type": "crypto_checksum"
      },{
        "details_view": "ef40",
        "short_view": "ef40",
        "type": "derivation_hint"
      },{
        "details_view": "94c3",
        "short_view": "94c3",
        "type": "derivation_hint"
      },{
        "details_view": "fee = 0.01",
        "short_view": "fee = 0.01",
        "type": "zarcanum_tx_data_v1"
      }],
      "fee": 10000000000,
      "id": "fd93234ee26299d9bcd0c7ffd66cfd31f66c16b7cd28776ddb3113f77477a669",
      "ins": [{
        "amount": 0,
        "global_indexes": [1614213,1625091,1701687,1724120,1755061,1852550,1885364,1888520,1890757,1901665,1901797,1902935,1903361,1903474,1903878,1904042],
        "htlc_origin": "",
        "kimage_or_ms_id": "5eb5744c8fa2e2b44413323cc1b9bb6021c18218eb25f4c3a12c8ba5f8ca9e05",
        "multisig_count": 0
      },{
        "amount": 0,
        "global_indexes": [1415271,1478600,1553576,1658538,1872595,1899601,1901346,1901642,1902588,1903284,1903353,1903522,1903584,1903697,1903952,1903954],
        "htlc_origin": "",
        "kimage_or_ms_id": "e2a6d2a56c671fec431fa3025e8143ec2e9c14b1bdfc19936f6377c84abc0672",
        "multisig_count": 0
      }],
      "keeper_block": 3199720,
      "object_in_json": "ewogICJBR0dSRUdBVEVE....AgfQogICAgfQogIF0KfQ==",
      "outs": [{
        "amount": 0,
        "global_index": 1904095,
        "is_spent": false,
        "minimum_sigs": 0,
        "pub_keys": ["a08e213373e34988600db3168be88eff5a9e2da9972dcc12d6e51dc56a7b845b","23b5f778966dc4d8594549670a0335c8f639f18a39063606a9ebf1a826bb6a66","e22c32eb7fd87d8403d1516a5849966a1f8f4053eb56ae3a7048c3e5ffcaa0a2","a23fe6c894dc069ba92a252611027bcaae8c80d0848ce0e3357e05e61aa78914","5df242cb3fb59a87"]
      },{
        "amount": 0,
        "global_index": 1904096,
        "is_spent": false,
        "minimum_sigs": 0,
        "pub_keys": ["492d93dc0fb07d90e5d1ce9210b31fc1155206473d5d3f5136f7031ff6aad31e","6c24323a8e2690482cdd685956904168cb5fc8749f3be2df58f7d0aeb39f5252","bbaa2f259d5f6f5c1e0df43c9cbd7c061ac023f91ebb3fe22a5352115f642cec","d4ec19288fc18a81917c3328d45464bddfb04d5582690bc50062dac9dd963887","8dfdd23882a0a1ae"]
      }],
      "pub_key": "631a0aa63dd0caa6473f8a136a155f54a05d1f2f8b5b92c5145383be2a696834",
      "timestamp": 1749725356
    }
  }
}
```

</details>

---

### `decodeTransaction`

Decode a transaction object_in_json using the provided secret view key and either address or public spend key.
You can prodive integrated address or master address.

#### Import and usage

```ts
import { decodeTransaction } from '@zano-project/zano-utils-js';
import type { DecodeTransactionResult } from '@zano-project/zano-utils-js';

decodeTransaction(objectInJson, secretViewKey, address);
// or provide public spend key
decodeTransaction(objectInJson, secretViewKey, publicSpendKey);
```
#### Returned data decodeTransaction

```ts
type DecodeTransactionResult =
    | { ok: true; amount: string; paymentId?: string }
    | { ok: false; error: string }
```
---

### `generateAccount`

```typescript
import { generateAccount } from '@zano-project/zano-utils-js';
import type { AccountResult } from '@zano-project/zano-utils-js';

const account: AccountResult = generateAccount();
```

#### Returned data generateAccount

```ts
type AccountResult = AccountKeys & {
  address: string;
}

type AccountKeys = {
  secretSpendKey: string;
  secretViewKey: string;
  publicSpendKey: string;
  publicViewKey: string;
}
```
---

### `validateAccount`

```ts
import { validateAccount } from '@zano-project/zano-utils-js';

const validatedAccount: boolean = validateAccount(
'ZxC15vh38qHAZbfsUXTpxoiyeLhavbBzsQQk81fEwP4jYxN4qR8SEhMfXkRBpQw6vbbSEGpK2VPVPADnL6h3ZViL29Remh4oH',
'21dcd98fb9dc392aeabe1d5cfb90faf63840685762448bf49a48d58d0c70bf0b',
'2ff9e77456d0e65b50d80392a098cddf9032744bd876371fffe95476a92d8564',
'88609e3bc954fe8b5f1a5f0a7e7e44528835b62890de49000033b28898888d01',
'b35fb46128f7150ecff93e0eeee80a95ad9b13e3bfced7d3ff7a121f6748df0e',
);
```

#### validateAccount params

```ts
async function validateAccount(
  address: string,
  publicSpendKey: string,
  publicViewKey: string,
  secretSpendKey: string,
  secretViewKey: string,
): Promise<boolean> 
```
---

### `generateAccountKeys`

```ts
import { generateAccountKeys } from '@zano-project/zano-utils-js';
import type { AccountKeys } from '@zano-project/zano-utils-js';

const accountKeys: AccountKeys = generateAccountKeys();
```
#### Returned data generateAccountKeys

```ts
type AccountKeys = {
  secretSpendKey: string;
  secretViewKey: string;
  publicSpendKey: string;
  publicViewKey: string;
}
```
---

### `privateKeyToPublicKey`

```ts
import { privateKeyToPublicKey } from '@zano-project/zano-utils-js';

const publicKey: string = privateKeyToPublicKey('88609e3bc954fe8b5f1a5f0a7e7e44528835b62890de49000033b28898888d01');
```
---

### `getAccountBySecretSpendKey`

```ts
import { getAccountBySecretSpendKey } from '@zano-project/zano-utils-js';
import type { AccountKeys } from '@zano-project/zano-utils-js';

const accountKeys: AccountKeys = getAccountBySecretSpendKey('88609e3bc954fe8b5f1a5f0a7e7e44528835b62890de49000033b28898888d01');
```

#### Returned data getAccountBySecretSpendKey

```ts
type AccountKeys = {
  secretSpendKey: string;
  secretViewKey: string;
  publicSpendKey: string;
  publicViewKey: string;
}
```
---

### `getKeyPair`

```ts
import { getKeyPair } from '@zano-project/zano-utils-js';
import type { KeyPair } from '@zano-project/zano-utils-js';

const keypair: KeyPair = getKeyPair();
```

#### Returned data getKeyPair

```ts
type KeyPair = {
  rawSecretKey: string;
  secretKey: string;
  publicKey: string;
}
```
---

### `getIntegratedAddress`

The function accepts either the main master address or the integrated address as a parameter.

```ts
import { getIntegratedAddress } from '@zano-project/zano-utils-js';

const integratedAddress: string = getIntegratedAddress('ZxD5aoLDPTdcaRx4uCpyW4XiLfEXejepAVz8cSY2fwHNEiJNu6NmpBBDLGTJzCsUvn3acCVDVDPMV8yQXdPooAp338Se7AxeH');
```
---

### `createIntegratedAddress`

```ts
import { createIntegratedAddress } from '@zano-project/zano-utils-js';

const integratedAddress: string = createIntegratedAddress('ZxD5aoLDPTdcaRx4uCpyW4XiLfEXejepAVz8cSY2fwHNEiJNu6NmpBBDLGTJzCsUvn3acCVDVDPMV8yQXdPooAp338Se7AxeH', '49c925855b863a25');
```
---


### `getMasterAddress`

params:
1. spendPublicKey: string, 
2. viewPublicKey: string

```ts
import { getMasterAddress } from '@zano-project/zano-utils-js';

const integratedAddress: string = getMasterAddress('9f5e1fa93630d4b281b18bb67a3db79e9622fc703cc3ad4a453a82e0a36d51fa', 'a3f208c8f9ba49bab28eed62b35b0f6be0a297bcd85c2faa1eb1820527bcf7e3');
```
---

### `splitIntegratedAddress`
Descr: Extract paymentId and master address from integrated address 

params:
1. integratedAddress: string, 

```ts
import { splitIntegratedAddress } from '@zano-project/zano-utils-js';
import type { SplitedIntegratedAddress } from '@zano-project/zano-utils-js';

const integratedAddress: SplitedIntegratedAddress = splitIntegratedAddress('iZ2kFmwxRHoaRxm1ni8HnfUTkYuKbni8s4CE2Z4GgFfH99BJ6cnbAtJTgUnZjPj9CTCTKy1qqM9wPCTp92uBC7e47JPoHxGL5UU2D1tpQMg4');
```

#### Returned data splitIntegratedAddress

```ts
type SplitedIntegratedAddress = {
    masterAddress: string;
    paymentId: string;
}
```
---

### `getKeysFromAddress`
Descr: Extract public keys from master or integratedAddress

params:
1. address: string, 

```ts
import { getKeysFromAddress } from '@zano-project/zano-utils-js';
import type { ZarcanumAddressKeys } from '@zano-project/zano-utils-js';

const integratedAddress: ZarcanumAddressKeys = getKeysFromAddress('iZ2kFmwxRHoaRxm1ni8HnfUTkYuKbni8s4CE2Z4GgFfH99BJ6cnbAtJTgUnZjPj9CTCTKy1qqM9wPCTp92uBC7e47JPoHxGL5UU2D1tpQMg4');
```

#### Returned data getKeysFromAddress

```ts
type ZarcanumAddressKeys = {
    spendPublicKey: string;
    viewPublicKey: string;
};
```
---

### `generatePaymentId`
Descr: generate payment id for creating integrated address

```ts
import { generatePaymentId } from '@zano-project/zano-utils-js';

const paymentId: string = generatePaymentId();
```
---

### `mnemonicToSeed`

## Limitations

- **No support for password-protected seed phrases**: Currently, the library does not handle mnemonic phrases that are encrypted with a password.
- **No audit flag support**: The library does not yet support the audit flag feature.

 @param seedPhraseRaw - Raw seed phrase string (mnemonic) containing 25 or 26 words.

 @returns The secret spend key as a hex string, or `false` if parsing failed.

```ts
import { mnemonicToSeed } from '@zano-project/zano-utils-js';
import type { MnemonicToSeedResult } from '@zano-project/zano-utils-js';

const secretSpendKey: MnemonicToSeedResult = mnemonicToSeed('bridge passion scale vast speak mud murder own birthday flight always hair especially tickle crowd shatter tickle deserve hopefully bomb join plan darling aunt beneath give');
```

#### Returned data mnemonicToSeed

```ts
type MnemonicToSeedResult = string | false;
```
---

### `seedToMnemonic`

## Warning:
**Dont use secret spend for creating mnemonic**

**You need provide raw seed key, its key using for creating secret spend key and mnemonic**

## Limitations

- **No support for password-protected seed phrases**: Currently, the library does not handle mnemonic phrases that are encrypted with a password.
- **No audit flag support**: The library does not yet support the audit flag feature.

```ts
import { seedToMnemonic } from '@zano-project/zano-utils-js';
import type { SeedToMnemonicResult } from '@zano-project/zano-utils-js';

const randomBytes: string = getRandomBytes(64).toString('hex');

const seedPhrase: SeedToMnemonicResult = seedToMnemonic(randomBytes);
```

#### Returned data seedToMnemonic
```ts
type SeedToMnemonicResult = string;
```

<br>
<br>

# Supporting project/donations
---
ZANO @dev <br>
BTC bc1qpa8w8eaehlplfepmnzpd7v9j046899nktxnkxp <br>
BCH qqgq078vww5exd9kt3frx6krdyznmp80hcygzlgqzd <br>
ETH 0x206c52b78141498e74FF074301ea90888C40c178 <br> 
XMR 45gp9WTobeB5Km3kLQgVmPJkvm9rSmg4gdyHheXqXijXYMjUY48kLgL7QEz5Ar8z9vQioQ68WYDKsQsjAEonSeFX4UeLSiX