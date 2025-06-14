
import { DecodeTransactionResult } from '../src/decode/types';
import { objectInJson } from './fixtures';
import { decodeTransaction } from '../src/decode/decode-service';
import { createIntegratedAddress } from '../src/address/address-utils';

describe(
    'Should be decode transaction and return amount and paymentId',
    () => {
        const secretViewKey = '81ef6415b815f675991585ebba71c8c4663a08893fd93ee149c48e797a2fdf09';
        const publicSpendKey = '6be99667faa6b693fbcd808f94b8243540198c9cbb0b564f267f885d227804a2';

        const integratedAddress = 'iZ285wzfsbjXYEgZVuDeFy74GFtYDFbvrFSJpL6TJQ3Z1mxZaKQLZsJHyVuCH4pQSr3rQunoH7cE4bjJSWmJqWSnKu6rPqXZ8HB1VxSHXVZR';
        const address = 'ZxCdxeu7oYRXYEgZVuDeFy74GFtYDFbvrFSJpL6TJQ3Z1mxZaKQLZsJHyVuCH4pQSr3rQunoH7cE4bjJSWmJqWSn1yGLxsfJH';

        it('checking the correctness of the result', () => {
            const result: DecodeTransactionResult = decodeTransaction(objectInJson, secretViewKey, publicSpendKey);

            if (result.ok) {
                const { ok, amount, paymentId } = result;
                expect({ ok, amount, paymentId }).toEqual({
                    ok: true,
                    amount: '0.0005',
                    paymentId: '49c925855b863a25'
                });
            }
        });

        it('checking the correctness of the result using address param', () => {
            const result: DecodeTransactionResult = decodeTransaction(objectInJson, secretViewKey, address);

            if (result.ok) {
                const { ok, amount, paymentId } = result;
                expect({ ok, amount, paymentId }).toEqual({
                    ok: true,
                    amount: '0.0005',
                    paymentId: '49c925855b863a25'
                });
            }
        });

        it('returned paymentId should be correct', () => {
            const result: DecodeTransactionResult = decodeTransaction(objectInJson, secretViewKey, publicSpendKey);

            if (result.ok) {
                const { paymentId } = result;
                const receivedIntegratedAddress: string = createIntegratedAddress(address, paymentId);
                expect(integratedAddress).toEqual(receivedIntegratedAddress);
            }
        });
    },
);
