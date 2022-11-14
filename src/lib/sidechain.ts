import BigNumber from 'bignumber.js';
import injectpromise from 'injectpromise';

import TronWeb from '..';
import Validator from '../paramValidator';
import type _CallbackT from '../utils/typing';
import type {IMethodSendOptions} from './contract';
import {HttpProvider} from './providers';
import type {ITransaction} from './transactionBuilder';
import type {ITransactionInfo, MakeSigned} from './trx';

// ! This file shows [almost] proper overloads for
// - methods accepting callback

export type IChainOptions = {
    mainGatewayAddress: string;
    sideGatewayAddress: string;
    sideChainId: string;
} & (
    | {fullHost: string}
    | {
          fullNode: HttpProvider | string;
          solidityNode: HttpProvider | string;
          eventServer?: HttpProvider | string;
      }
);

const INVALID_TX_MESSAGE = 'Invalid transaction provided';

export default class SideChain<T extends TronWeb> {
    mainchain: T;
    sidechain: TronWeb;
    isAddress: TronWeb['isAddress'];
    utils: TronWeb['utils'];
    injectPromise: injectpromise;
    validator: Validator;

    mainGatewayAddress!: string;
    sideGatewayAddress!: string;
    chainId!: string;

    constructor(
        sideOptions: IChainOptions,
        TronWebCls: typeof TronWeb,
        mainchain: T,
        privateKey: string,
    ) {
        this.mainchain = mainchain;
        const {mainGatewayAddress, sideGatewayAddress, sideChainId} =
            sideOptions;
        if ('fullHost' in sideOptions)
            this.sidechain = new TronWebCls(
                sideOptions.fullHost,
                sideOptions.fullHost,
                sideOptions.fullHost,
                privateKey,
            );
        else
            this.sidechain = new TronWebCls(
                sideOptions.fullNode,
                sideOptions.solidityNode,
                sideOptions.eventServer,
                privateKey,
            );
        this.isAddress = this.mainchain.isAddress;
        this.utils = this.mainchain.utils;
        this.setMainGatewayAddress(mainGatewayAddress);
        this.setSideGatewayAddress(sideGatewayAddress);
        this.setChainId(sideChainId);
        this.injectPromise = injectpromise(this);
        this.validator = new Validator(this.sidechain);

        const self = this;
        // @ts-ignore
        this.sidechain.trx.sign = (...args) => {
            // @ts-ignore
            return self.sign(...args);
        };
        // @ts-ignore
        this.sidechain.trx.multiSign = (...args) => {
            // @ts-ignore
            return self.multiSign(...args);
        };
    }

    // TODO: this and two next must be setters
    setMainGatewayAddress(mainGatewayAddress) {
        if (!this.isAddress(mainGatewayAddress))
            throw new Error('Invalid main gateway address provided');
        this.mainGatewayAddress = mainGatewayAddress;
    }

    setSideGatewayAddress(sideGatewayAddress) {
        if (!this.isAddress(sideGatewayAddress))
            throw new Error('Invalid side gateway address provided');
        this.sideGatewayAddress = sideGatewayAddress;
    }

    setChainId(sideChainId) {
        if (!this.utils.isString(sideChainId) || !sideChainId)
            throw new Error('Invalid side chainId provided');
        this.chainId = sideChainId;
    }

    signTransaction<T extends ITransaction>(
        priKeyBytes: string | Uint8Array | Buffer | number[],
        transaction: T,
    ): MakeSigned<T> {
        if (typeof priKeyBytes === 'string')
            priKeyBytes = this.utils.code.hexStr2byteArray(priKeyBytes);

        const chainIdByteArr = this.utils.code.hexStr2byteArray(this.chainId);

        const _byteArr = this.utils.code.hexStr2byteArray(transaction.txID);
        // We're doing this once only, so performance effect is low
        const byteArr = new Uint8Array([..._byteArr, ...chainIdByteArr]);
        const byteArrHash = this.sidechain.utils.ethersUtils.sha256(byteArr);

        // eslint-disable-next-line new-cap
        const signature = this.utils.crypto.ECKeySign(
            this.utils.code.hexStr2byteArray(byteArrHash.replace(/^0x/, '')),
            priKeyBytes,
        );

        if (Array.isArray(transaction.signature)) {
            if (!transaction.signature.includes(signature))
                transaction.signature.push(signature);
        } else {
            transaction.signature = [signature];
        }
        return transaction as MakeSigned<T>;
    }

    async multiSign(
        transaction: ITransaction,
        privateKey?: string,
        permissionId?: number,
        callback?: undefined,
    ): Promise<MakeSigned<ITransaction>>;
    async multiSign(
        transaction: ITransaction,
        privateKey: string | undefined,
        permissionId: number | undefined | null,
        callback?: _CallbackT<MakeSigned<ITransaction>>,
    ): Promise<void>;
    async multiSign(
        transaction: ITransaction,
        privateKey: string = this.sidechain.defaultPrivateKey,
        permissionId?: number,
        callback?: _CallbackT<MakeSigned<ITransaction>>,
    ): Promise<void | MakeSigned<ITransaction>> {
        if (!callback)
            return this.injectPromise(
                this.multiSign,
                transaction,
                privateKey,
                permissionId,
            );

        if (
            !this.utils.isObject(transaction) ||
            !transaction.raw_data ||
            !transaction.raw_data.contract
        )
            return callback(INVALID_TX_MESSAGE);

        if (
            !transaction.raw_data.contract[0].Permission_id &&
            permissionId &&
            permissionId > 0
        ) {
            // set permission id
            transaction.raw_data.contract[0].Permission_id = permissionId;

            // check if private key insides permission list
            const address = this.sidechain.address
                .toHex(this.sidechain.address.fromPrivateKey(privateKey))
                .toLowerCase();
            const signWeight = await this.sidechain.trx.getSignWeight(
                transaction,
                permissionId,
            );

            if (signWeight.result.code === 'PERMISSION_ERROR')
                return callback(signWeight.result.message);

            let foundKey = false;
            if (signWeight.permission)
                signWeight.permission.keys.map((key) => {
                    if (key.address === address) foundKey = true;
                });

            if (!foundKey)
                return callback(privateKey + ' has no permission to sign');

            if (
                signWeight.approved_list &&
                signWeight.approved_list.indexOf(address) !== -1
            )
                return callback(privateKey + ' already sign transaction');

            // reset transaction
            if (signWeight.transaction && signWeight.transaction.transaction) {
                transaction = signWeight.transaction.transaction;
                transaction.raw_data.contract[0].Permission_id = permissionId;
            } else {
                return callback(INVALID_TX_MESSAGE);
            }
        }
        // sign
        try {
            return callback(
                null,
                this.signTransaction(privateKey, transaction),
            );
        } catch (ex) {
            callback(ex);
        }
    }

    async sign<T extends string | ITransaction>(
        transaction: T,
        privateKey?: string,
        useTronHeader?: boolean,
        multisig?: boolean,
        callback?: undefined,
    ): Promise<MakeSigned<T>>;
    async sign<T extends string | ITransaction>(
        transaction: T,
        privateKey: string,
        useTronHeader: boolean,
        multisig: boolean,
        callback: _CallbackT<MakeSigned<T>>,
    ): Promise<void>;
    async sign<T extends string | ITransaction>(
        transaction: T,
        privateKey: string = this.sidechain.defaultPrivateKey,
        useTronHeader = true,
        multisig = false,
        callback?: _CallbackT<MakeSigned<T>>,
    ): Promise<void | MakeSigned<T>> {
        if (!callback)
            return this.injectPromise(
                this.sign,
                transaction,
                privateKey,
                useTronHeader,
                multisig,
            );

        // Message signing
        if (this.utils.isString(transaction)) {
            if (!this.utils.isHex(transaction))
                return callback('Expected hex message input');

            try {
                const signatureHex = this.sidechain.trx.signString(
                    transaction,
                    privateKey,
                    useTronHeader,
                );
                return callback(null, signatureHex as MakeSigned<T>);
            } catch (ex) {
                callback(ex);
            }
            return;
        }

        if (!this.utils.isObject(transaction))
            return callback(INVALID_TX_MESSAGE);

        if (!multisig && (transaction as ITransaction).signature)
            return callback('Transaction is already signed');

        try {
            if (!multisig) {
                const address = this.sidechain.address
                    .toHex(this.sidechain.address.fromPrivateKey(privateKey))
                    .toLowerCase();
                if (
                    address !==
                    this.sidechain.address.toHex(
                        transaction.raw_data.contract[0].parameter.value
                            .owner_address,
                    )
                )
                    return callback(
                        'Private key does not match address in transaction',
                    );
            }
            return callback(
                null,
                this.signTransaction(privateKey, transaction) as MakeSigned<T>,
            );
        } catch (ex) {
            callback(ex);
        }
    }

    /**
     * deposit asset to sidechain
     */
    async depositTrx(
        callValue: number,
        depositFee: number,
        feeLimit: number,
        options?: IMethodSendOptions & {shouldPollResponse?: false},
        privateKey?: string,
        callback?: undefined,
    ): Promise<string>;
    async depositTrx(
        callValue: number,
        depositFee: number,
        feeLimit: number,
        options: undefined | (IMethodSendOptions & {shouldPollResponse: false}),
        privateKey: string | undefined,
        callback: _CallbackT<string>,
    ): Promise<void>;

    async depositTrx(
        callValue: number,
        depositFee: number,
        feeLimit: number,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse: true;
        },
        privateKey?: string,
        callback?: undefined,
    ): Promise<ITransactionInfo>;
    async depositTrx(
        callValue: number,
        depositFee: number,
        feeLimit: number,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse: true;
        },
        privateKey: string | undefined,
        callback: _CallbackT<ITransactionInfo>,
    ): Promise<void>;

    async depositTrx(
        callValue: number,
        depositFee: number,
        feeLimit: number,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID: true;
        },
        privateKey?: string,
        callback?: undefined,
    ): Promise<[string, BigNumber]>;
    async depositTrx(
        callValue: number,
        depositFee: number,
        feeLimit: number,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID: true;
        },
        privateKey: string | undefined,
        callback: _CallbackT<[string, BigNumber]>,
    ): Promise<void>;

    async depositTrx(
        callValue: number,
        depositFee: number,
        feeLimit: number,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID?: false;
        },
        privateKey?: string,
        callback?: undefined,
    ): Promise<BigNumber>;
    async depositTrx(
        callValue: number,
        depositFee: number,
        feeLimit: number,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID?: false;
        },
        privateKey: string | undefined,
        callback: _CallbackT<BigNumber>,
    ): Promise<void>;

    async depositTrx(
        callValue: number,
        depositFee: number,
        feeLimit: number,
        options?: IMethodSendOptions,
        privateKey?: string,
        callback?: _CallbackT<BigNumber>,
    ): Promise<BigNumber>;
    async depositTrx(
        callValue: number,
        depositFee: number,
        feeLimit: number,
        options: IMethodSendOptions = {},
        privateKey: string = this.mainchain.defaultPrivateKey,
        callback?: _CallbackT<any>,
    ): Promise<void | any> {
        if (!callback)
            return this.injectPromise(
                this.depositTrx,
                callValue,
                depositFee,
                feeLimit,
                options,
                privateKey,
            );

        if (
            this.validator.notValid(
                [
                    {
                        name: 'callValue',
                        type: 'integer',
                        value: callValue,
                        gte: 0,
                    },
                    {
                        name: 'depositFee',
                        type: 'integer',
                        value: depositFee,
                        gte: 0,
                    },
                    {
                        name: 'feeLimit',
                        type: 'integer',
                        value: feeLimit,
                        gte: 0,
                    },
                ],
                callback,
            )
        )
            return;

        options = {
            callValue: Number(callValue) + Number(depositFee),
            feeLimit,
            ...options,
        };
        try {
            const contractInstance = await this.mainchain
                .contract()
                .at(this.mainGatewayAddress);
            const result = await contractInstance
                .depositTRX()
                .send(options, privateKey);
            return callback(null, result);
        } catch (ex) {
            return callback(ex);
        }
    }

    async depositTrc10(
        tokenId: number,
        tokenValue: number,
        depositFee: number,
        feeLimit: number,
        options?: IMethodSendOptions & {shouldPollResponse?: false},
        privateKey?: string,
        callback?: undefined,
    ): Promise<string>;
    async depositTrc10(
        tokenId: number,
        tokenValue: number,
        depositFee: number,
        feeLimit: number,
        options: undefined | (IMethodSendOptions & {shouldPollResponse: false}),
        privateKey: string | undefined,
        callback: _CallbackT<string>,
    ): Promise<void>;

    async depositTrc10(
        tokenId: number,
        tokenValue: number,
        depositFee: number,
        feeLimit: number,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse: true;
        },
        privateKey?: string,
        callback?: undefined,
    ): Promise<ITransactionInfo>;
    async depositTrc10(
        tokenId: number,
        tokenValue: number,
        depositFee: number,
        feeLimit: number,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse: true;
        },
        privateKey: string | undefined,
        callback: _CallbackT<ITransactionInfo>,
    ): Promise<void>;

    async depositTrc10(
        tokenId: number,
        tokenValue: number,
        depositFee: number,
        feeLimit: number,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID: true;
        },
        privateKey?: string,
        callback?: undefined,
    ): Promise<[string, BigNumber]>;
    async depositTrc10(
        tokenId: number,
        tokenValue: number,
        depositFee: number,
        feeLimit: number,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID: true;
        },
        privateKey: string | undefined,
        callback: _CallbackT<[string, BigNumber]>,
    ): Promise<void>;

    async depositTrc10(
        tokenId: number,
        tokenValue: number,
        depositFee: number,
        feeLimit: number,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID?: false;
        },
        privateKey?: string,
        callback?: undefined,
    ): Promise<BigNumber>;
    async depositTrc10(
        tokenId: number,
        tokenValue: number,
        depositFee: number,
        feeLimit: number,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID?: false;
        },
        privateKey: string | undefined,
        callback: _CallbackT<BigNumber>,
    ): Promise<void>;

    async depositTrc10(
        tokenId: number,
        tokenValue: number,
        depositFee: number,
        feeLimit: number,
        options?: IMethodSendOptions,
        privateKey?: string,
        callback?: _CallbackT<BigNumber>,
    ): Promise<BigNumber>;
    async depositTrc10(
        tokenId: number,
        tokenValue: number,
        depositFee: number,
        feeLimit: number,
        options: IMethodSendOptions = {},
        privateKey: string = this.mainchain.defaultPrivateKey,
        callback?: _CallbackT<any>,
    ): Promise<void | any> {
        if (!callback)
            return this.injectPromise(
                this.depositTrc10,
                tokenId,
                tokenValue,
                depositFee,
                feeLimit,
                options,
                privateKey,
            );

        if (
            this.validator.notValid(
                [
                    {
                        name: 'tokenValue',
                        type: 'integer',
                        value: tokenValue,
                        gte: 0,
                    },
                    {
                        name: 'depositFee',
                        type: 'integer',
                        value: depositFee,
                        gte: 0,
                    },
                    {
                        name: 'feeLimit',
                        type: 'integer',
                        value: feeLimit,
                        gte: 0,
                    },
                    {
                        name: 'tokenId',
                        type: 'integer',
                        value: tokenId,
                        gte: 0,
                    },
                ],
                callback,
            )
        )
            return;

        options = {
            tokenId,
            tokenValue,
            feeLimit,
            ...options,
            callValue: depositFee,
        };
        try {
            const contractInstance = await this.mainchain
                .contract()
                .at(this.mainGatewayAddress);
            const result = await contractInstance
                .depositTRC10(tokenId, tokenValue)
                .send(options, privateKey);
            callback(null, result);
        } catch (ex) {
            return callback(ex);
        }
    }

    async depositTrc(
        functionSelector: string,
        num: number,
        fee: number,
        feeLimit: number,
        contractAddress: string,
        options?: IMethodSendOptions & {shouldPollResponse?: false},
        privateKey?: string,
        callback?: undefined,
    ): Promise<string>;
    async depositTrc(
        functionSelector: string,
        num: number,
        fee: number,
        feeLimit: number,
        contractAddress: string,
        options: undefined | (IMethodSendOptions & {shouldPollResponse: false}),
        privateKey: string | undefined,
        callback: _CallbackT<string>,
    ): Promise<void>;

    async depositTrc(
        functionSelector: string,
        num: number,
        fee: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse: true;
        },
        privateKey?: string,
        callback?: undefined,
    ): Promise<ITransactionInfo>;
    async depositTrc(
        functionSelector: string,
        num: number,
        fee: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse: true;
        },
        privateKey: string | undefined,
        callback: _CallbackT<ITransactionInfo>,
    ): Promise<void>;

    async depositTrc(
        functionSelector: string,
        num: number,
        fee: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID: true;
        },
        privateKey?: string,
        callback?: undefined,
    ): Promise<[string, BigNumber]>;
    async depositTrc(
        functionSelector: string,
        num: number,
        fee: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID: true;
        },
        privateKey: string | undefined,
        callback: _CallbackT<[string, BigNumber]>,
    ): Promise<void>;

    async depositTrc(
        functionSelector: string,
        num: number,
        fee: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID?: false;
        },
        privateKey?: string,
        callback?: undefined,
    ): Promise<BigNumber>;
    async depositTrc(
        functionSelector: string,
        num: number,
        fee: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID?: false;
        },
        privateKey: string | undefined,
        callback: _CallbackT<BigNumber>,
    ): Promise<void>;

    async depositTrc(
        functionSelector: string,
        num: number,
        fee: number,
        feeLimit: number,
        contractAddress: string,
        options?: IMethodSendOptions,
        privateKey?: string,
        callback?: _CallbackT<BigNumber>,
    ): Promise<BigNumber>;
    async depositTrc(
        functionSelector: string,
        num: number,
        fee: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions = {},
        privateKey: string = this.mainchain.defaultPrivateKey,
        callback?: _CallbackT<any>,
    ): Promise<void | any> {
        if (!callback)
            return this.injectPromise(
                this.depositTrc,
                functionSelector,
                num,
                fee,
                feeLimit,
                contractAddress,
                options,
                privateKey,
            );

        if (
            this.validator.notValid(
                [
                    {
                        name: 'functionSelector',
                        type: 'not-empty-string',
                        value: functionSelector,
                    },
                    {
                        name: 'num',
                        type: 'integer',
                        value: num,
                        gte: 0,
                    },
                    {
                        name: 'fee',
                        type: 'integer',
                        value: fee,
                        gte: 0,
                    },
                    {
                        name: 'feeLimit',
                        type: 'integer',
                        value: feeLimit,
                        gte: 0,
                    },
                    {
                        name: 'contractAddress',
                        type: 'address',
                        value: contractAddress,
                    },
                ],
                callback,
            )
        )
            return;

        options = {
            feeLimit,
            ...options,
            callValue: fee,
            tokenId: '',
            tokenValue: 0,
        };
        try {
            let result = null;
            if (functionSelector === 'approve') {
                const approveInstance = await this.mainchain
                    .contract()
                    .at(contractAddress);
                result = await approveInstance
                    .approve(this.mainGatewayAddress, num)
                    .send(options, privateKey);
            } else {
                const contractInstance = await this.mainchain
                    .contract()
                    .at(this.mainGatewayAddress);
                switch (functionSelector) {
                    case 'depositTRC20':
                    case 'depositTRC721':
                        result = await contractInstance[functionSelector](
                            contractAddress,
                            num,
                        ).send(options, privateKey);
                        break;
                    case 'retryDeposit':
                    case 'retryMapping':
                        result = await contractInstance[functionSelector](
                            num,
                        ).send(options, privateKey);
                        break;
                    default:
                        break;
                }
            }
            callback(null, result);
        } catch (ex) {
            return callback(ex);
        }
    }

    async approveTrc20(
        num: number,
        feeLimit: number,
        contractAddress: string,
        options?: IMethodSendOptions & {shouldPollResponse?: false},
        privateKey?: string,
        callback?: undefined,
    ): Promise<string>;
    async approveTrc20(
        num: number,
        feeLimit: number,
        contractAddress: string,
        options: undefined | (IMethodSendOptions & {shouldPollResponse: false}),
        privateKey: string | undefined,
        callback: _CallbackT<string>,
    ): Promise<void>;

    async approveTrc20(
        num: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse: true;
        },
        privateKey?: string,
        callback?: undefined,
    ): Promise<ITransactionInfo>;
    async approveTrc20(
        num: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse: true;
        },
        privateKey: string | undefined,
        callback: _CallbackT<ITransactionInfo>,
    ): Promise<void>;

    async approveTrc20(
        num: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID: true;
        },
        privateKey?: string,
        callback?: undefined,
    ): Promise<[string, BigNumber]>;
    async approveTrc20(
        num: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID: true;
        },
        privateKey: string | undefined,
        callback: _CallbackT<[string, BigNumber]>,
    ): Promise<void>;

    async approveTrc20(
        num: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID?: false;
        },
        privateKey?: string,
        callback?: undefined,
    ): Promise<BigNumber>;
    async approveTrc20(
        num: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID?: false;
        },
        privateKey: string | undefined,
        callback: _CallbackT<BigNumber>,
    ): Promise<void>;

    async approveTrc20(
        num: number,
        feeLimit: number,
        contractAddress: string,
        options?: IMethodSendOptions,
        privateKey?: string,
        callback?: _CallbackT<BigNumber>,
    ): Promise<BigNumber>;
    async approveTrc20(
        num: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions = {},
        privateKey: string = this.mainchain.defaultPrivateKey,
        callback?: _CallbackT<any>,
    ): Promise<void | any> {
        const functionSelector = 'approve';
        return this.depositTrc(
            functionSelector,
            num,
            0,
            feeLimit,
            contractAddress,
            options,
            privateKey,
            callback as any,
        );
    }

    async approveTrc721(
        num: number,
        feeLimit: number,
        contractAddress: string,
        options?: IMethodSendOptions & {shouldPollResponse?: false},
        privateKey?: string,
        callback?: undefined,
    ): Promise<string>;
    async approveTrc721(
        num: number,
        feeLimit: number,
        contractAddress: string,
        options: undefined | (IMethodSendOptions & {shouldPollResponse: false}),
        privateKey: string | undefined,
        callback: _CallbackT<string>,
    ): Promise<void>;

    async approveTrc721(
        num: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse: true;
        },
        privateKey?: string,
        callback?: undefined,
    ): Promise<ITransactionInfo>;
    async approveTrc721(
        num: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse: true;
        },
        privateKey: string | undefined,
        callback: _CallbackT<ITransactionInfo>,
    ): Promise<void>;

    async approveTrc721(
        num: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID: true;
        },
        privateKey?: string,
        callback?: undefined,
    ): Promise<[string, BigNumber]>;
    async approveTrc721(
        num: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID: true;
        },
        privateKey: string | undefined,
        callback: _CallbackT<[string, BigNumber]>,
    ): Promise<void>;

    async approveTrc721(
        num: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID?: false;
        },
        privateKey?: string,
        callback?: undefined,
    ): Promise<BigNumber>;
    async approveTrc721(
        num: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID?: false;
        },
        privateKey: string | undefined,
        callback: _CallbackT<BigNumber>,
    ): Promise<void>;

    async approveTrc721(
        num: number,
        feeLimit: number,
        contractAddress: string,
        options?: IMethodSendOptions,
        privateKey?: string,
        callback?: _CallbackT<BigNumber>,
    ): Promise<BigNumber>;
    async approveTrc721(
        id: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions = {},
        privateKey: string = this.mainchain.defaultPrivateKey,
        callback?: _CallbackT<any>,
    ): Promise<void | any> {
        const functionSelector = 'approve';
        return this.depositTrc(
            functionSelector,
            id,
            0,
            feeLimit,
            contractAddress,
            options,
            privateKey,
            callback as any,
        );
    }

    async depositTrc20(
        num: number,
        depositFee: number,
        feeLimit: number,
        contractAddress: string,
        options?: IMethodSendOptions & {shouldPollResponse?: false},
        privateKey?: string,
        callback?: undefined,
    ): Promise<string>;
    async depositTrc20(
        num: number,
        depositFee: number,
        feeLimit: number,
        contractAddress: string,
        options: undefined | (IMethodSendOptions & {shouldPollResponse: false}),
        privateKey: string | undefined,
        callback: _CallbackT<string>,
    ): Promise<void>;

    async depositTrc20(
        num: number,
        depositFee: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse: true;
        },
        privateKey?: string,
        callback?: undefined,
    ): Promise<ITransactionInfo>;
    async depositTrc20(
        num: number,
        depositFee: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse: true;
        },
        privateKey: string | undefined,
        callback: _CallbackT<ITransactionInfo>,
    ): Promise<void>;

    async depositTrc20(
        num: number,
        depositFee: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID: true;
        },
        privateKey?: string,
        callback?: undefined,
    ): Promise<[string, BigNumber]>;
    async depositTrc20(
        num: number,
        depositFee: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID: true;
        },
        privateKey: string | undefined,
        callback: _CallbackT<[string, BigNumber]>,
    ): Promise<void>;

    async depositTrc20(
        num: number,
        depositFee: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID?: false;
        },
        privateKey?: string,
        callback?: undefined,
    ): Promise<BigNumber>;
    async depositTrc20(
        num: number,
        depositFee: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID?: false;
        },
        privateKey: string | undefined,
        callback: _CallbackT<BigNumber>,
    ): Promise<void>;

    async depositTrc20(
        num: number,
        depositFee: number,
        feeLimit: number,
        contractAddress: string,
        options?: IMethodSendOptions,
        privateKey?: string,
        callback?: _CallbackT<BigNumber>,
    ): Promise<BigNumber>;
    async depositTrc20(
        num: number,
        depositFee: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions = {},
        privateKey: string = this.mainchain.defaultPrivateKey,
        callback?: _CallbackT<any>,
    ): Promise<void | any> {
        const functionSelector = 'depositTRC20';
        return this.depositTrc(
            functionSelector,
            num,
            depositFee,
            feeLimit,
            contractAddress,
            options,
            privateKey,
            callback as any,
        );
    }

    depositTrc721: this['depositTrc20'] = async (
        id: number,
        depositFee: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions = {},
        privateKey: string = this.mainchain.defaultPrivateKey,
        callback?: _CallbackT<any>,
    ): Promise<void | any> => {
        const functionSelector = 'depositTRC721';
        return this.depositTrc(
            functionSelector,
            id,
            depositFee,
            feeLimit,
            contractAddress,
            options,
            privateKey,
            callback as any,
        );
    };

    /**
     * mapping asset TRC20 or TRC721 to DAppChain
     */
    async mappingTrc(
        trxHash: string,
        mappingFee: number,
        feeLimit: number,
        functionSelector: string,
        options?: IMethodSendOptions & {shouldPollResponse?: false},
        privateKey?: string,
        callback?: undefined,
    ): Promise<string>;
    async mappingTrc(
        trxHash: string,
        mappingFee: number,
        feeLimit: number,
        functionSelector: string,
        options: undefined | (IMethodSendOptions & {shouldPollResponse: false}),
        privateKey: string | undefined,
        callback: _CallbackT<string>,
    ): Promise<void>;

    async mappingTrc(
        trxHash: string,
        mappingFee: number,
        feeLimit: number,
        functionSelector: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse: true;
        },
        privateKey?: string,
        callback?: undefined,
    ): Promise<ITransactionInfo>;
    async mappingTrc(
        trxHash: string,
        mappingFee: number,
        feeLimit: number,
        functionSelector: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse: true;
        },
        privateKey: string | undefined,
        callback: _CallbackT<ITransactionInfo>,
    ): Promise<void>;

    async mappingTrc(
        trxHash: string,
        mappingFee: number,
        feeLimit: number,
        functionSelector: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID: true;
        },
        privateKey?: string,
        callback?: undefined,
    ): Promise<[string, BigNumber]>;
    async mappingTrc(
        trxHash: string,
        mappingFee: number,
        feeLimit: number,
        functionSelector: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID: true;
        },
        privateKey: string | undefined,
        callback: _CallbackT<[string, BigNumber]>,
    ): Promise<void>;

    async mappingTrc(
        trxHash: string,
        mappingFee: number,
        feeLimit: number,
        functionSelector: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID?: false;
        },
        privateKey?: string,
        callback?: undefined,
    ): Promise<BigNumber>;
    async mappingTrc(
        trxHash: string,
        mappingFee: number,
        feeLimit: number,
        functionSelector: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID?: false;
        },
        privateKey: string | undefined,
        callback: _CallbackT<BigNumber>,
    ): Promise<void>;

    async mappingTrc(
        trxHash: string,
        mappingFee: number,
        feeLimit: number,
        functionSelector: string,
        options?: IMethodSendOptions,
        privateKey?: string,
        callback?: _CallbackT<BigNumber>,
    ): Promise<BigNumber>;
    async mappingTrc(
        trxHash: string,
        mappingFee: number,
        feeLimit: number,
        functionSelector: string,
        options: IMethodSendOptions = {},
        privateKey: string = this.mainchain.defaultPrivateKey,
        callback?: _CallbackT<any>,
    ): Promise<void | any> {
        if (!callback)
            return this.injectPromise(
                this.mappingTrc,
                trxHash,
                mappingFee,
                feeLimit,
                functionSelector,
                options,
                privateKey,
            );

        if (
            this.validator.notValid(
                [
                    {
                        name: 'trxHash',
                        type: 'not-empty-string',
                        value: trxHash,
                    },
                    {
                        name: 'mappingFee',
                        type: 'integer',
                        value: mappingFee,
                        gte: 0,
                    },
                    {
                        name: 'feeLimit',
                        type: 'integer',
                        value: feeLimit,
                        gte: 0,
                    },
                ],
                callback,
            )
        )
            return;

        trxHash = trxHash.startsWith('0x') ? trxHash : '0x' + trxHash;
        options = {
            feeLimit,
            ...options,
            callValue: mappingFee,
        };
        try {
            const contractInstance = await this.mainchain
                .contract()
                .at(this.mainGatewayAddress);
            let result = null;
            if (functionSelector === 'mappingTRC20')
                result = await contractInstance
                    .mappingTRC20(trxHash)
                    .send(options, privateKey);
            else if (functionSelector === 'mappingTRC721')
                result = await contractInstance
                    .mappingTRC721(trxHash)
                    .send(options, privateKey);
            else callback(new Error('type must be trc20 or trc721'));

            callback(null, result);
        } catch (ex) {
            return callback(ex);
        }
    }

    async mappingTrc20(
        trxHash: string,
        mappingFee: number,
        feeLimit: number,
        options?: IMethodSendOptions & {shouldPollResponse?: false},
        privateKey?: string,
        callback?: undefined,
    ): Promise<string>;
    async mappingTrc20(
        trxHash: string,
        mappingFee: number,
        feeLimit: number,
        options: undefined | (IMethodSendOptions & {shouldPollResponse: false}),
        privateKey: string | undefined,
        callback: _CallbackT<string>,
    ): Promise<void>;

    async mappingTrc20(
        trxHash: string,
        mappingFee: number,
        feeLimit: number,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse: true;
        },
        privateKey?: string,
        callback?: undefined,
    ): Promise<ITransactionInfo>;
    async mappingTrc20(
        trxHash: string,
        mappingFee: number,
        feeLimit: number,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse: true;
        },
        privateKey: string | undefined,
        callback: _CallbackT<ITransactionInfo>,
    ): Promise<void>;

    async mappingTrc20(
        trxHash: string,
        mappingFee: number,
        feeLimit: number,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID: true;
        },
        privateKey?: string,
        callback?: undefined,
    ): Promise<[string, BigNumber]>;
    async mappingTrc20(
        trxHash: string,
        mappingFee: number,
        feeLimit: number,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID: true;
        },
        privateKey: string | undefined,
        callback: _CallbackT<[string, BigNumber]>,
    ): Promise<void>;

    async mappingTrc20(
        trxHash: string,
        mappingFee: number,
        feeLimit: number,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID?: false;
        },
        privateKey?: string,
        callback?: undefined,
    ): Promise<BigNumber>;
    async mappingTrc20(
        trxHash: string,
        mappingFee: number,
        feeLimit: number,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID?: false;
        },
        privateKey: string | undefined,
        callback: _CallbackT<BigNumber>,
    ): Promise<void>;

    async mappingTrc20(
        trxHash: string,
        mappingFee: number,
        feeLimit: number,
        options?: IMethodSendOptions,
        privateKey?: string,
        callback?: _CallbackT<BigNumber>,
    ): Promise<BigNumber>;
    async mappingTrc20(
        trxHash: string,
        mappingFee: number,
        feeLimit: number,
        options: IMethodSendOptions = {},
        privateKey: string = this.mainchain.defaultPrivateKey,
        callback?: _CallbackT<any>,
    ): Promise<void | any> {
        const functionSelector = 'mappingTRC20';
        return this.mappingTrc(
            trxHash,
            mappingFee,
            feeLimit,
            functionSelector,
            options,
            privateKey,
            callback,
        );
    }

    mappingTrc721: this['mappingTrc20'] = async (
        trxHash: string,
        mappingFee: number,
        feeLimit: number,
        options: IMethodSendOptions = {},
        privateKey: string = this.mainchain.defaultPrivateKey,
        callback?: _CallbackT<any>,
    ): Promise<void | any> => {
        const functionSelector = 'mappingTRC721';
        return this.mappingTrc(
            trxHash,
            mappingFee,
            feeLimit,
            functionSelector,
            options,
            privateKey,
            callback,
        );
    };

    /**
     * withdraw trx from sidechain to mainchain
     */
    async withdrawTrx(
        callValue: number,
        withdrawFee: number,
        feeLimit: number,
        options?: IMethodSendOptions & {shouldPollResponse?: false},
        privateKey?: string,
        callback?: undefined,
    ): Promise<string>;
    async withdrawTrx(
        callValue: number,
        withdrawFee: number,
        feeLimit: number,
        options: undefined | (IMethodSendOptions & {shouldPollResponse: false}),
        privateKey: string | undefined,
        callback: _CallbackT<string>,
    ): Promise<void>;

    async withdrawTrx(
        callValue: number,
        withdrawFee: number,
        feeLimit: number,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse: true;
        },
        privateKey?: string,
        callback?: undefined,
    ): Promise<ITransactionInfo>;
    async withdrawTrx(
        callValue: number,
        withdrawFee: number,
        feeLimit: number,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse: true;
        },
        privateKey: string | undefined,
        callback: _CallbackT<ITransactionInfo>,
    ): Promise<void>;

    async withdrawTrx(
        callValue: number,
        withdrawFee: number,
        feeLimit: number,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID: true;
        },
        privateKey?: string,
        callback?: undefined,
    ): Promise<[string, BigNumber]>;
    async withdrawTrx(
        callValue: number,
        withdrawFee: number,
        feeLimit: number,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID: true;
        },
        privateKey: string | undefined,
        callback: _CallbackT<[string, BigNumber]>,
    ): Promise<void>;

    async withdrawTrx(
        callValue: number,
        withdrawFee: number,
        feeLimit: number,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID?: false;
        },
        privateKey?: string,
        callback?: undefined,
    ): Promise<BigNumber>;
    async withdrawTrx(
        callValue: number,
        withdrawFee: number,
        feeLimit: number,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID?: false;
        },
        privateKey: string | undefined,
        callback: _CallbackT<BigNumber>,
    ): Promise<void>;

    async withdrawTrx(
        callValue: number,
        withdrawFee: number,
        feeLimit: number,
        options?: IMethodSendOptions,
        privateKey?: string,
        callback?: _CallbackT<BigNumber>,
    ): Promise<BigNumber>;
    async withdrawTrx(
        callValue: number,
        withdrawFee: number,
        feeLimit: number,
        options: IMethodSendOptions = {},
        privateKey: string = this.mainchain.defaultPrivateKey,
        callback?: _CallbackT<any>,
    ): Promise<void | any> {
        if (!callback)
            return this.injectPromise(
                this.withdrawTrx,
                callValue,
                withdrawFee,
                feeLimit,
                options,
                privateKey,
            );

        if (
            this.validator.notValid(
                [
                    {
                        name: 'callValue',
                        type: 'integer',
                        value: callValue,
                        gte: 0,
                    },
                    {
                        name: 'withdrawFee',
                        type: 'integer',
                        value: withdrawFee,
                        gte: 0,
                    },
                    {
                        name: 'feeLimit',
                        type: 'integer',
                        value: feeLimit,
                        gte: 0,
                    },
                ],
                callback,
            )
        )
            return;

        options = {
            callValue: Number(callValue) + Number(withdrawFee),
            feeLimit,
            ...options,
        };
        try {
            const contractInstance = await this.sidechain
                .contract()
                .at(this.sideGatewayAddress);
            const result = await contractInstance
                .withdrawTRX()
                .send(options, privateKey);
            return callback(null, result);
        } catch (ex) {
            return callback(ex);
        }
    }

    async withdrawTrc10(
        tokenId: number,
        tokenValue: number,
        withdrawFee: number,
        feeLimit: number,
        options?: IMethodSendOptions & {shouldPollResponse?: false},
        privateKey?: string,
        callback?: undefined,
    ): Promise<string>;
    async withdrawTrc10(
        tokenId: number,
        tokenValue: number,
        withdrawFee: number,
        feeLimit: number,
        options: undefined | (IMethodSendOptions & {shouldPollResponse: false}),
        privateKey: string | undefined,
        callback: _CallbackT<string>,
    ): Promise<void>;

    async withdrawTrc10(
        tokenId: number,
        tokenValue: number,
        withdrawFee: number,
        feeLimit: number,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse: true;
        },
        privateKey?: string,
        callback?: undefined,
    ): Promise<ITransactionInfo>;
    async withdrawTrc10(
        tokenId: number,
        tokenValue: number,
        withdrawFee: number,
        feeLimit: number,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse: true;
        },
        privateKey: string | undefined,
        callback: _CallbackT<ITransactionInfo>,
    ): Promise<void>;

    async withdrawTrc10(
        tokenId: number,
        tokenValue: number,
        withdrawFee: number,
        feeLimit: number,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID: true;
        },
        privateKey?: string,
        callback?: undefined,
    ): Promise<[string, BigNumber]>;
    async withdrawTrc10(
        tokenId: number,
        tokenValue: number,
        withdrawFee: number,
        feeLimit: number,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID: true;
        },
        privateKey: string | undefined,
        callback: _CallbackT<[string, BigNumber]>,
    ): Promise<void>;

    async withdrawTrc10(
        tokenId: number,
        tokenValue: number,
        withdrawFee: number,
        feeLimit: number,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID?: false;
        },
        privateKey?: string,
        callback?: undefined,
    ): Promise<BigNumber>;
    async withdrawTrc10(
        tokenId: number,
        tokenValue: number,
        withdrawFee: number,
        feeLimit: number,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID?: false;
        },
        privateKey: string | undefined,
        callback: _CallbackT<BigNumber>,
    ): Promise<void>;

    async withdrawTrc10(
        tokenId: number,
        tokenValue: number,
        withdrawFee: number,
        feeLimit: number,
        options?: IMethodSendOptions,
        privateKey?: string,
        callback?: _CallbackT<BigNumber>,
    ): Promise<BigNumber>;
    async withdrawTrc10(
        tokenId: number,
        tokenValue: number,
        withdrawFee: number,
        feeLimit: number,
        options: IMethodSendOptions = {},
        privateKey: string = this.mainchain.defaultPrivateKey,
        callback?: _CallbackT<any>,
    ): Promise<void | any> {
        if (!callback)
            return this.injectPromise(
                this.withdrawTrc10,
                tokenId,
                tokenValue,
                withdrawFee,
                feeLimit,
                options,
                privateKey,
            );

        if (
            this.validator.notValid(
                [
                    {
                        name: 'tokenId',
                        type: 'integer',
                        value: tokenId,
                        gte: 0,
                    },
                    {
                        name: 'tokenValue',
                        type: 'integer',
                        value: tokenValue,
                        gte: 0,
                    },
                    {
                        name: 'withdrawFee',
                        type: 'integer',
                        value: withdrawFee,
                        gte: 0,
                    },
                    {
                        name: 'feeLimit',
                        type: 'integer',
                        value: feeLimit,
                        gte: 0,
                    },
                ],
                callback,
            )
        )
            return;

        options = {
            tokenValue,
            tokenId,
            callValue: withdrawFee,
            feeLimit,
            ...options,
        };
        try {
            const contractInstance = await this.sidechain
                .contract()
                .at(this.sideGatewayAddress);
            const result = await contractInstance
                .withdrawTRC10(tokenId, tokenValue)
                .send(options, privateKey);
            return callback(null, result);
        } catch (ex) {
            return callback(ex);
        }
    }

    async withdrawTrc(
        functionSelector: string,
        numOrId: number,
        withdrawFee: number,
        feeLimit: number,
        contractAddress: string,
        options?: IMethodSendOptions & {shouldPollResponse?: false},
        privateKey?: string,
        callback?: undefined,
    ): Promise<string>;
    async withdrawTrc(
        functionSelector: string,
        numOrId: number,
        withdrawFee: number,
        feeLimit: number,
        contractAddress: string,
        options: undefined | (IMethodSendOptions & {shouldPollResponse: false}),
        privateKey: string | undefined,
        callback: _CallbackT<string>,
    ): Promise<void>;

    async withdrawTrc(
        functionSelector: string,
        numOrId: number,
        withdrawFee: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse: true;
        },
        privateKey?: string,
        callback?: undefined,
    ): Promise<ITransactionInfo>;
    async withdrawTrc(
        functionSelector: string,
        numOrId: number,
        withdrawFee: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse: true;
        },
        privateKey: string | undefined,
        callback: _CallbackT<ITransactionInfo>,
    ): Promise<void>;

    async withdrawTrc(
        functionSelector: string,
        numOrId: number,
        withdrawFee: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID: true;
        },
        privateKey?: string,
        callback?: undefined,
    ): Promise<[string, BigNumber]>;
    async withdrawTrc(
        functionSelector: string,
        numOrId: number,
        withdrawFee: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID: true;
        },
        privateKey: string | undefined,
        callback: _CallbackT<[string, BigNumber]>,
    ): Promise<void>;

    async withdrawTrc(
        functionSelector: string,
        numOrId: number,
        withdrawFee: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID?: false;
        },
        privateKey?: string,
        callback?: undefined,
    ): Promise<BigNumber>;
    async withdrawTrc(
        functionSelector: string,
        numOrId: number,
        withdrawFee: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID?: false;
        },
        privateKey: string | undefined,
        callback: _CallbackT<BigNumber>,
    ): Promise<void>;

    async withdrawTrc(
        functionSelector: string,
        numOrId: number,
        withdrawFee: number,
        feeLimit: number,
        contractAddress: string,
        options?: IMethodSendOptions,
        privateKey?: string,
        callback?: _CallbackT<BigNumber>,
    ): Promise<BigNumber>;
    async withdrawTrc(
        functionSelector: string,
        numOrId: number,
        withdrawFee: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions = {},
        privateKey: string = this.mainchain.defaultPrivateKey,
        callback?: _CallbackT<any>,
    ): Promise<void | any> {
        if (!callback)
            return this.injectPromise(
                this.withdrawTrc,
                functionSelector,
                numOrId,
                withdrawFee,
                feeLimit,
                contractAddress,
                options,
                privateKey,
            );

        if (
            this.validator.notValid(
                [
                    {
                        name: 'functionSelector',
                        type: 'not-empty-string',
                        value: functionSelector,
                    },
                    {
                        name: 'numOrId',
                        type: 'integer',
                        value: numOrId,
                        gte: 0,
                    },
                    {
                        name: 'withdrawFee',
                        type: 'integer',
                        value: withdrawFee,
                        gte: 0,
                    },
                    {
                        name: 'feeLimit',
                        type: 'integer',
                        value: feeLimit,
                        gte: 0,
                    },
                    {
                        name: 'contractAddress',
                        type: 'address',
                        value: contractAddress,
                    },
                ],
                callback,
            )
        )
            return;

        options = {
            feeLimit,
            ...options,
            callValue: withdrawFee,
        };

        const contract = this.sidechain.contract(
            [
                {
                    name: functionSelector.split('(')[0],
                    type: 'function',
                    stateMutability: 'nonpayable',
                    inputs: [{type: 'uint256', name: ''}],
                    outputs: [],
                },
            ],
            contractAddress,
        );
        const method = contract.methods[functionSelector];
        return (await method(numOrId).send(
            options,
            privateKey,
            callback,
        )) as void;
    }

    async withdrawTrc20(
        numOrId: number,
        withdrawFee: number,
        feeLimit: number,
        contractAddress: string,
        options?: IMethodSendOptions & {shouldPollResponse?: false},
        privateKey?: string,
        callback?: undefined,
    ): Promise<string>;
    async withdrawTrc20(
        numOrId: number,
        withdrawFee: number,
        feeLimit: number,
        contractAddress: string,
        options: undefined | (IMethodSendOptions & {shouldPollResponse: false}),
        privateKey: string | undefined,
        callback: _CallbackT<string>,
    ): Promise<void>;

    async withdrawTrc20(
        numOrId: number,
        withdrawFee: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse: true;
        },
        privateKey?: string,
        callback?: undefined,
    ): Promise<ITransactionInfo>;
    async withdrawTrc20(
        numOrId: number,
        withdrawFee: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse: true;
        },
        privateKey: string | undefined,
        callback: _CallbackT<ITransactionInfo>,
    ): Promise<void>;

    async withdrawTrc20(
        numOrId: number,
        withdrawFee: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID: true;
        },
        privateKey?: string,
        callback?: undefined,
    ): Promise<[string, BigNumber]>;
    async withdrawTrc20(
        numOrId: number,
        withdrawFee: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID: true;
        },
        privateKey: string | undefined,
        callback: _CallbackT<[string, BigNumber]>,
    ): Promise<void>;

    async withdrawTrc20(
        numOrId: number,
        withdrawFee: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID?: false;
        },
        privateKey?: string,
        callback?: undefined,
    ): Promise<BigNumber>;
    async withdrawTrc20(
        numOrId: number,
        withdrawFee: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID?: false;
        },
        privateKey: string | undefined,
        callback: _CallbackT<BigNumber>,
    ): Promise<void>;

    async withdrawTrc20(
        numOrId: number,
        withdrawFee: number,
        feeLimit: number,
        contractAddress: string,
        options?: IMethodSendOptions,
        privateKey?: string,
        callback?: _CallbackT<BigNumber>,
    ): Promise<BigNumber>;
    async withdrawTrc20(
        num: number,
        withdrawFee: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions = {},
        privateKey: string = this.mainchain.defaultPrivateKey,
        callback?: _CallbackT<any>,
    ): Promise<void | any> {
        return this.withdrawTrc(
            'withdrawal(uint256)',
            num,
            withdrawFee,
            feeLimit,
            contractAddress,
            options,
            privateKey,
            callback as any,
        );
    }

    async withdrawTrc721(
        numOrId: number,
        withdrawFee: number,
        feeLimit: number,
        contractAddress: string,
        options?: IMethodSendOptions & {shouldPollResponse?: false},
        privateKey?: string,
        callback?: undefined,
    ): Promise<string>;
    async withdrawTrc721(
        numOrId: number,
        withdrawFee: number,
        feeLimit: number,
        contractAddress: string,
        options: undefined | (IMethodSendOptions & {shouldPollResponse: false}),
        privateKey: string | undefined,
        callback: _CallbackT<string>,
    ): Promise<void>;

    async withdrawTrc721(
        numOrId: number,
        withdrawFee: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse: true;
        },
        privateKey?: string,
        callback?: undefined,
    ): Promise<ITransactionInfo>;
    async withdrawTrc721(
        numOrId: number,
        withdrawFee: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse: true;
        },
        privateKey: string | undefined,
        callback: _CallbackT<ITransactionInfo>,
    ): Promise<void>;

    async withdrawTrc721(
        numOrId: number,
        withdrawFee: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID: true;
        },
        privateKey?: string,
        callback?: undefined,
    ): Promise<[string, BigNumber]>;
    async withdrawTrc721(
        numOrId: number,
        withdrawFee: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID: true;
        },
        privateKey: string | undefined,
        callback: _CallbackT<[string, BigNumber]>,
    ): Promise<void>;

    async withdrawTrc721(
        numOrId: number,
        withdrawFee: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID?: false;
        },
        privateKey?: string,
        callback?: undefined,
    ): Promise<BigNumber>;
    async withdrawTrc721(
        numOrId: number,
        withdrawFee: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID?: false;
        },
        privateKey: string | undefined,
        callback: _CallbackT<BigNumber>,
    ): Promise<void>;

    async withdrawTrc721(
        numOrId: number,
        withdrawFee: number,
        feeLimit: number,
        contractAddress: string,
        options?: IMethodSendOptions,
        privateKey?: string,
        callback?: _CallbackT<BigNumber>,
    ): Promise<BigNumber>;
    async withdrawTrc721(
        id: number,
        withdrawFee: number,
        feeLimit: number,
        contractAddress: string,
        options: IMethodSendOptions = {},
        privateKey: string = this.mainchain.defaultPrivateKey,
        callback?: _CallbackT<any>,
    ): Promise<void | any> {
        return this.withdrawTrc(
            'withdrawal(uint256)',
            id,
            withdrawFee,
            feeLimit,
            contractAddress,
            options,
            privateKey,
            callback as any,
        );
    }

    async injectFund(
        num: number,
        feeLimit: number,
        options?: unknown,
        privateKey?: string,
        callback?: undefined,
    ): Promise<string>;
    async injectFund(
        num: number,
        feeLimit: number,
        options: unknown,
        privateKey: string,
        callback: _CallbackT<string>,
    ): Promise<void>;
    async injectFund(
        num: number,
        feeLimit: number,
        options: unknown = 'UNUSED (LEGACY?) ARGUMENT',
        privateKey: string = this.mainchain.defaultPrivateKey,
        callback?: _CallbackT<string>,
    ): Promise<void | string> {
        if (!callback)
            return this.injectPromise(
                this.injectFund,
                num,
                feeLimit,
                options,
                privateKey,
            );

        if (
            this.validator.notValid(
                [
                    {
                        name: 'num',
                        type: 'integer',
                        value: num,
                        gte: 0,
                    },
                    {
                        name: 'feeLimit',
                        type: 'integer',
                        value: feeLimit,
                        gte: 0,
                    },
                ],
                callback,
            )
        )
            return;

        try {
            const address = this.sidechain.address.fromPrivateKey(privateKey);
            const hexAddress = this.sidechain.address.toHex(address);
            const transaction = await this.sidechain.fullNode.request(
                '/wallet/fundinject',
                {
                    owner_address: hexAddress,
                    amount: num,
                },
                'post',
            );

            const signedTransaction = await this.sidechain.trx.sign(
                transaction,
                privateKey,
            );

            if (!signedTransaction.signature) {
                if (!privateKey)
                    return callback('Transaction was not signed properly');

                return callback('Invalid private key provided');
            }

            const broadcast = await this.sidechain.trx.sendRawTransaction(
                signedTransaction,
            );
            if (broadcast.code) {
                const err = {
                    error: broadcast.code,
                    message: broadcast.code,
                };
                if (broadcast.message)
                    err.message = this.mainchain.toUtf8(broadcast.message);
                return callback(err);
            }
            return callback(null, signedTransaction.txID);
        } catch (ex) {
            return callback(ex);
        }
    }

    async retryWithdraw(
        nonce: number,
        retryFee: number,
        feeLimit: number,
        options?: IMethodSendOptions & {shouldPollResponse?: false},
        privateKey?: string,
        callback?: undefined,
    ): Promise<string>;
    async retryWithdraw(
        nonce: number,
        retryFee: number,
        feeLimit: number,
        options: undefined | (IMethodSendOptions & {shouldPollResponse: false}),
        privateKey: string | undefined,
        callback: _CallbackT<string>,
    ): Promise<void>;

    async retryWithdraw(
        nonce: number,
        retryFee: number,
        feeLimit: number,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse: true;
        },
        privateKey?: string,
        callback?: undefined,
    ): Promise<ITransactionInfo>;
    async retryWithdraw(
        nonce: number,
        retryFee: number,
        feeLimit: number,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse: true;
        },
        privateKey: string | undefined,
        callback: _CallbackT<ITransactionInfo>,
    ): Promise<void>;

    async retryWithdraw(
        nonce: number,
        retryFee: number,
        feeLimit: number,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID: true;
        },
        privateKey?: string,
        callback?: undefined,
    ): Promise<[string, BigNumber]>;
    async retryWithdraw(
        nonce: number,
        retryFee: number,
        feeLimit: number,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID: true;
        },
        privateKey: string | undefined,
        callback: _CallbackT<[string, BigNumber]>,
    ): Promise<void>;

    async retryWithdraw(
        nonce: number,
        retryFee: number,
        feeLimit: number,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID?: false;
        },
        privateKey?: string,
        callback?: undefined,
    ): Promise<BigNumber>;
    async retryWithdraw(
        nonce: number,
        retryFee: number,
        feeLimit: number,
        options: IMethodSendOptions & {
            shouldPollResponse: true;
            rawResponse?: false;
            keepTxID?: false;
        },
        privateKey: string | undefined,
        callback: _CallbackT<BigNumber>,
    ): Promise<void>;

    async retryWithdraw(
        nonce: number,
        retryFee: number,
        feeLimit: number,
        options?: IMethodSendOptions,
        privateKey?: string,
        callback?: _CallbackT<BigNumber>,
    ): Promise<BigNumber>;
    async retryWithdraw(
        nonce: number,
        retryFee: number,
        feeLimit: number,
        options: IMethodSendOptions = {},
        privateKey: string = this.mainchain.defaultPrivateKey,
        callback?: _CallbackT<any>,
    ): Promise<void | any> {
        const functionSelector = 'retryWithdraw(uint256)';
        return this.withdrawTrc(
            functionSelector,
            nonce,
            retryFee,
            feeLimit,
            this.sideGatewayAddress,
            options,
            privateKey,
            callback as any,
        );
    }

    retryDeposit: this['retryWithdraw'] = async (
        nonce: number,
        retryFee: number,
        feeLimit: number,
        options: IMethodSendOptions = {},
        privateKey: string = this.mainchain.defaultPrivateKey,
        callback?: _CallbackT<any>,
    ): Promise<void | any> => {
        const functionSelector = 'retryDeposit';
        return this.depositTrc(
            functionSelector,
            nonce,
            retryFee,
            feeLimit,
            this.mainGatewayAddress,
            options,
            privateKey,
            callback as any,
        );
    };

    retryMapping: this['retryWithdraw'] = async (
        nonce: number,
        retryFee: number,
        feeLimit: number,
        options: IMethodSendOptions = {},
        privateKey: string = this.mainchain.defaultPrivateKey,
        callback?: _CallbackT<any>,
    ): Promise<void | any> => {
        const functionSelector = 'retryMapping';
        return this.depositTrc(
            functionSelector,
            nonce,
            retryFee,
            feeLimit,
            this.mainGatewayAddress,
            options,
            privateKey,
            callback as any,
        );
    };
}
