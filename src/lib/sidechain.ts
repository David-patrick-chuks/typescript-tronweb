import injectpromise from 'injectpromise';
import Validator from '../paramValidator';
import TronWeb from '..';
import {HttpProvider} from './providers';
import {ITransaction, ContractOptions} from './transactionBuilder';
import _CallbackT from '../utils/typing';

export interface IChainOptions {
    fullHost: string;
    fullNode: HttpProvider | string;
    solidityNode: HttpProvider | string;
    eventServer: HttpProvider | string;
    mainGatewayAddress: string;
    sideGatewayAddress: string;
    sideChainId: string;
}
export type IDepositTrc = any;
export type IMappingTrc = any;

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
        const {
            fullHost,
            fullNode,
            solidityNode,
            eventServer,
            mainGatewayAddress,
            sideGatewayAddress,
            sideChainId,
        } = sideOptions;
        this.sidechain = new TronWebCls(
            fullHost || fullNode,
            fullHost || solidityNode,
            fullHost || eventServer,
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

    // FIXME: this and two next must be setters
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

    signTransaction(
        priKeyBytes: string | number[],
        transaction: ITransaction,
    ): ITransaction {
        if (typeof priKeyBytes === 'string')
            priKeyBytes = this.utils.code.hexStr2byteArray(priKeyBytes);

        const chainIdByteArr = this.utils.code.hexStr2byteArray(this.chainId);

        const byteArr = this.utils.code
            .hexStr2byteArray(transaction.txID)
            .concat(chainIdByteArr);
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
        return transaction;
    }

    async multiSign(
        transaction: ITransaction,
        privateKey: string = this.sidechain.defaultPrivateKey,
        permissionId: number,
        callback?: _CallbackT<any>,
    ): Promise<void | ITransaction> {
        // if (this.utils.isFunction(permissionId)) {
        //     callback = permissionId;
        //     permissionId = 0;
        // }

        // if (this.utils.isFunction(privateKey)) {
        //     callback = privateKey;
        //     privateKey = this.mainchain.defaultPrivateKey;
        //     permissionId = 0;
        // }

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
            return callback('Invalid transaction provided');

        if (
            !transaction.raw_data.contract[0].Permission_id &&
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
                return callback('Invalid transaction provided');
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

    async sign(
        transaction: ITransaction,
        privateKey: string = this.sidechain.defaultPrivateKey,
        useTronHeader = true,
        multisig = false,
        callback?: _CallbackT<any>,
    ): Promise<void | ITransaction> {
        // if (this.utils.isFunction(multisig)) {
        //     callback = multisig;
        //     multisig = false;
        // }

        // if (this.utils.isFunction(useTronHeader)) {
        //     callback = useTronHeader;
        //     useTronHeader = true;
        //     multisig = false;
        // }

        // if (this.utils.isFunction(privateKey)) {
        //     callback = privateKey;
        //     privateKey = this.sidechain.defaultPrivateKey;
        //     useTronHeader = true;
        //     multisig = false;
        // }

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
                // FIXME: it's weird, .trx is an instance and signString is static
                // @ts-ignore
                const signatureHex = this.sidechain.trx.signString(
                    transaction,
                    privateKey,
                    useTronHeader,
                );
                return callback(null, signatureHex);
            } catch (ex) {
                callback(ex);
            }
        }

        if (!this.utils.isObject(transaction))
            return callback('Invalid transaction provided');

        if (!multisig && transaction.signature)
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
                this.signTransaction(privateKey, transaction),
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
        options: Record<string, unknown> = {},
        privateKey: string = this.mainchain.defaultPrivateKey,
        callback?: _CallbackT<any>,
    ): Promise<void | any> {
        // if (this.utils.isFunction(privateKey)) {
        //     callback = privateKey;
        //     privateKey = this.mainchain.defaultPrivateKey;
        // }
        // if (this.utils.isFunction(options)) {
        //     callback = options;
        //     options = {};
        // }
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
        options: Record<string, unknown> = {},
        privateKey: string = this.mainchain.defaultPrivateKey,
        callback?: _CallbackT<any>,
    ): Promise<void | any> {
        // if (this.utils.isFunction(privateKey)) {
        //     callback = privateKey;
        //     privateKey = this.mainchain.defaultPrivateKey;
        // }
        // if (this.utils.isFunction(options)) {
        //     callback = options;
        //     options = {};
        // }
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
        options: Record<string, unknown> = {},
        privateKey: string = this.mainchain.defaultPrivateKey,
        callback?: _CallbackT<IDepositTrc>,
    ): Promise<void | IDepositTrc> {
        // if (this.utils.isFunction(privateKey)) {
        //     callback = privateKey;
        //     privateKey = this.mainchain.defaultPrivateKey;
        // }
        // if (this.utils.isFunction(options)) {
        //     callback = options;
        //     options = {};
        // }
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
                    // FIXME: it's actually 1 case
                    case 'depositTRC20':
                        result = await contractInstance
                            .depositTRC20(contractAddress, num)
                            .send(options, privateKey);
                        break;
                    case 'depositTRC721':
                        result = await contractInstance
                            .depositTRC721(contractAddress, num)
                            .send(options, privateKey);
                        break;
                    case 'retryDeposit':
                        result = await contractInstance
                            .retryDeposit(num)
                            .send(options, privateKey);
                        break;
                    case 'retryMapping':
                        result = await contractInstance
                            .retryMapping(num)
                            .send(options, privateKey);
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
        options: Record<string, unknown> = {},
        privateKey: string = this.mainchain.defaultPrivateKey,
        callback?: _CallbackT<IDepositTrc>,
    ): Promise<void | IDepositTrc> {
        const functionSelector = 'approve';
        return this.depositTrc(
            functionSelector,
            num,
            0,
            feeLimit,
            contractAddress,
            options,
            privateKey,
            callback,
        );
    }

    async approveTrc721(
        id: number,
        feeLimit: number,
        contractAddress: string,
        options: Record<string, unknown> = {},
        privateKey: string = this.mainchain.defaultPrivateKey,
        callback?: _CallbackT<IDepositTrc>,
    ): Promise<void | IDepositTrc> {
        const functionSelector = 'approve';
        return this.depositTrc(
            functionSelector,
            id,
            0,
            feeLimit,
            contractAddress,
            options,
            privateKey,
            callback,
        );
    }

    async depositTrc20(
        num: number,
        depositFee: number,
        feeLimit: number,
        contractAddress: string,
        options: Record<string, unknown> = {},
        privateKey: string = this.mainchain.defaultPrivateKey,
        callback: _CallbackT<IDepositTrc>,
    ): Promise<void | IDepositTrc> {
        const functionSelector = 'depositTRC20';
        return this.depositTrc(
            functionSelector,
            num,
            depositFee,
            feeLimit,
            contractAddress,
            options,
            privateKey,
            callback,
        );
    }

    async depositTrc721(
        id: number,
        depositFee: number,
        feeLimit: number,
        contractAddress: string,
        options: Record<string, unknown> = {},
        privateKey: string = this.mainchain.defaultPrivateKey,
        callback?: _CallbackT<IDepositTrc>,
    ): Promise<void | IDepositTrc> {
        const functionSelector = 'depositTRC721';
        return this.depositTrc(
            functionSelector,
            id,
            depositFee,
            feeLimit,
            contractAddress,
            options,
            privateKey,
            callback,
        );
    }

    /**
     * mapping asset TRC20 or TRC721 to DAppChain
     */
    async mappingTrc(
        trxHash: string,
        mappingFee: number,
        feeLimit: number,
        functionSelector: string,
        options: Record<string, unknown> = {},
        privateKey: string = this.mainchain.defaultPrivateKey,
        callback?: _CallbackT<IMappingTrc>,
    ): Promise<void | IMappingTrc> {
        // if (this.utils.isFunction(privateKey)) {
        //     callback = privateKey;
        //     privateKey = this.mainchain.defaultPrivateKey;
        // }
        // if (this.utils.isFunction(options)) {
        //     callback = options;
        //     options = {};
        // }
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
        options: Record<string, unknown> = {},
        privateKey: string = this.mainchain.defaultPrivateKey,
        callback?: _CallbackT<IMappingTrc>,
    ): Promise<void | IMappingTrc> {
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

    async mappingTrc721(
        trxHash: string,
        mappingFee: number,
        feeLimit: number,
        options: Record<string, unknown> = {},
        privateKey: string = this.mainchain.defaultPrivateKey,
        callback?: _CallbackT<IMappingTrc>,
    ): Promise<void | IMappingTrc> {
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
    }

    /**
     * withdraw trx from sidechain to mainchain
     */
    async withdrawTrx(
        callValue: number,
        withdrawFee: number,
        feeLimit: number,
        options: Record<string, unknown> = {},
        privateKey: string = this.mainchain.defaultPrivateKey,
        callback?: _CallbackT<any>,
    ): Promise<void | any> {
        // if (this.utils.isFunction(privateKey)) {
        //     callback = privateKey;
        //     privateKey = this.mainchain.defaultPrivateKey;
        // }
        // if (this.utils.isFunction(options)) {
        //     callback = options;
        //     options = {};
        // }
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
        options: Record<string, unknown> = {},
        privateKey: string = this.mainchain.defaultPrivateKey,
        callback?: _CallbackT<any>,
    ): Promise<void | any> {
        // if (this.utils.isFunction(privateKey)) {
        //     callback = privateKey;
        //     privateKey = this.mainchain.defaultPrivateKey;
        // }
        // if (this.utils.isFunction(options)) {
        //     callback = options;
        //     options = {};
        // }
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
        options: ContractOptions & {
            shouldPollResponse?: boolean;
            rawResponse: boolean;
        },
        privateKey: string = this.mainchain.defaultPrivateKey,
        callback?: _CallbackT<any>,
    ): Promise<void | any> {
        // if (this.utils.isFunction(privateKey)) {
        //     callback = privateKey;
        //     privateKey = this.mainchain.defaultPrivateKey;
        // }
        // if (this.utils.isFunction(options)) {
        //     callback = options;
        //     options = {};
        // }
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
        const parameters = [
            {
                type: 'uint256',
                value: numOrId,
            },
        ];

        try {
            const address = privateKey
                ? this.sidechain.address.fromPrivateKey(privateKey)
                : this.sidechain.defaultAddress.base58;
            const transaction =
                await this.sidechain.transactionBuilder.triggerSmartContract(
                    contractAddress,
                    functionSelector,
                    options,
                    parameters,
                    this.sidechain.address.toHex(address),
                );
            if (!transaction.result || !transaction.result.result)
                return callback(
                    'Unknown error: ' +
                        JSON.stringify(transaction.transaction, null, 2),
                );

            const signedTransaction = await this.sidechain.trx.sign(
                transaction.transaction,
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
                    err.message = this.sidechain.toUtf8(broadcast.message);
                return callback(err);
            }

            if (!options.shouldPollResponse)
                return callback(null, signedTransaction.txID);

            const checkResult = async (index = 0) => {
                if (index === 20)
                    return callback({
                        error: 'Cannot find result in solidity node',
                        transaction: signedTransaction,
                    });

                const output = await this.sidechain.trx.getTransactionInfo(
                    signedTransaction.txID,
                );

                if (!Object.keys(output).length)
                    return setTimeout(() => {
                        checkResult(index + 1);
                    }, 3000);

                // FIXME: either documentation is lying to me or it's a mistake
                // @ts-ignore
                if (output.result && output.result === 'FAILED')
                    return callback({
                        // @ts-ignore
                        error: this.sidechain.toUtf8(output.resMessage),
                        transaction: signedTransaction,
                        output,
                    });

                if (!this.utils.hasProperty(output, 'contractResult'))
                    return callback({
                        error:
                            'Failed to execute: ' +
                            JSON.stringify(output, null, 2),
                        transaction: signedTransaction,
                        output,
                    });

                if (options.rawResponse) return callback(null, output);

                // FIXME: WTF? Undeclared symbol.
                // @ts-ignore
                let decoded = decodeOutput(
                    // @ts-ignore
                    this.outputs,
                    '0x' + output.contractResult[0],
                );

                if (decoded.length === 1) decoded = decoded[0];

                return callback(null, decoded);
            };

            checkResult();
        } catch (ex) {
            return callback(ex);
        }
    }

    async withdrawTrc20(
        num: number,
        withdrawFee: number,
        feeLimit: number,
        contractAddress: string,
        options: ContractOptions & {
            shouldPollResponse?: boolean;
            rawResponse: boolean;
        },
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
            callback,
        );
    }

    async withdrawTrc721(
        id: number,
        withdrawFee: number,
        feeLimit: number,
        contractAddress: string,
        options: ContractOptions & {
            shouldPollResponse?: boolean;
            rawResponse: boolean;
        },
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
            callback,
        );
    }

    async injectFund(
        num: number,
        feeLimit: number,
        options: Record<string, unknown>,
        privateKey: string = this.mainchain.defaultPrivateKey,
        callback?: _CallbackT<string>,
    ): Promise<void | string> {
        // if (this.utils.isFunction(privateKey)) {
        //     callback = privateKey;
        //     privateKey = this.mainchain.defaultPrivateKey;
        // }

        // if (this.utils.isFunction(options)) {
        //     callback = options;
        //     options = {};
        // }
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
        retryWithdrawFee: number,
        feeLimit: number,
        options: ContractOptions & {
            shouldPollResponse?: boolean;
            rawResponse: boolean;
        },
        privateKey: string = this.mainchain.defaultPrivateKey,
        callback?: _CallbackT<any>,
    ): Promise<void | any> {
        const functionSelector = 'retryWithdraw(uint256)';
        return this.withdrawTrc(
            functionSelector,
            nonce,
            retryWithdrawFee,
            feeLimit,
            this.sideGatewayAddress,
            options,
            privateKey,
            callback,
        );
    }

    async retryDeposit(
        nonce: number,
        retryDepositFee: number,
        feeLimit: number,
        options: Record<string, unknown> = {},
        privateKey: string = this.mainchain.defaultPrivateKey,
        callback?: _CallbackT<IDepositTrc>,
    ): Promise<void | IDepositTrc> {
        const functionSelector = 'retryDeposit';
        return this.depositTrc(
            functionSelector,
            nonce,
            retryDepositFee,
            feeLimit,
            this.mainGatewayAddress,
            options,
            privateKey,
            callback,
        );
    }

    async retryMapping(
        nonce: number,
        retryMappingFee: number,
        feeLimit: number,
        options: Record<string, unknown> = {},
        privateKey: string = this.mainchain.defaultPrivateKey,
        callback?: _CallbackT<IDepositTrc>,
    ): Promise<void | IDepositTrc> {
        const functionSelector = 'retryMapping';
        return this.depositTrc(
            functionSelector,
            nonce,
            retryMappingFee,
            feeLimit,
            this.mainGatewayAddress,
            options,
            privateKey,
            callback,
        );
    }
}
