export type TransactionObjectV3 = {
    AGGREGATED: AggregatedTxV3;
    attachment: AttachmentEntry[];
    signatures: SignatureEntry[];
};

export type AggregatedTxV3 = {
    version: '3';
    vin: VinDataV3[];
    extra: ExtraEntry[];
    vout: VoutEntry[];
    hardfork_id: string;
};

export type VinDataV3 = {
    txin_zc_input: TxinZcInputDataV3;
};

export type TxinZcInputDataV3 = {
    key_offsets: KeyOffsetData[];
    k_image: string;
    etc_details: unknown[];
};

export type KeyOffsetData = {
    uint64_t: string;
};

export type ExtraEntry = {
    receiver2?: Receiver2;
    pub_key?: string;
    etc_tx_flags16?: {
        v: string;
    };
    checksum?: Checksum;
    derivation_hint?: {
        msg: string;
    };
    zarcanum_tx_data_v1?: {
        fee: string;
    };
    extra_attach_info?: ExtraAttachInfo;
};

export type Receiver2 = {
    acc_addr: {
        spend_public_key: string;
        view_public_key: string;
        flags: string;
    };
};

export type Checksum = {
    encrypted_key_derivation: string;
    derivation_hash: string;
};

export type ExtraAttachInfo = {
    sz: string;
    hsh: string;
    cnt: string;
};

export type VoutEntry = {
    tx_out_zarcanum: TxOutZarcanum;
};

export type TxOutZarcanum = {
    stealth_address: string;
    concealing_point: string;
    amount_commitment: string;
    blinded_asset_id: string;
    encrypted_amount: string;
    mix_attr: string;
};

export type AttachmentEntry = {
    attachment: {
        service_id: string;
        instruction: string;
        body: string;
        security: unknown[];
        flags: string;
    };
};

export type SignatureEntry = {
    ZC_sig: ZcSignature;
};

export type ZcSignature = {
    pseudo_out_amount_commitment: string;
    pseudo_out_blinded_asset_id: string;
    clsags_ggx: ClsagsGgx;
};

export type ClsagsGgx = {
    c: string;
    '(std::vector<scalar_t>&)(r_g)': string[];
    '(std::vector<scalar_t>&)(r_x)': string[];
};
