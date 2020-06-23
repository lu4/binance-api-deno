import { Order } from "./order.ts";
import { OrderOco } from "./order-oco.ts";
import { IndexedObject } from "../indexed-object.ts";
import { ApiError, ProxyError } from "./errors.ts";

import { hmac } from "https://denopkg.com/chiefbiiko/hmac/mod.ts";
import { Interval } from "../candle-interval.ts";

export enum WithdrawStatus {
    EmailSent,
    Cancelled,
    AwaitingApproval,
    Rejected,
    Processing,
    Failure,
    Completed
}

export interface DataStream {
    listenKey: string;
}

/**
 * Build query string for uri encoded url based on json object
 */
const makeQueryString = (obj: IndexedObject) => `?${makeQueryStringArgs(obj)}`;
const makeQueryStringArgs = (obj: IndexedObject) => obj
    ? `${Object.entries(obj).filter(([_, v]) => v !== undefined).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&')}`
    : '';

async function fetchJson<T>(url: string, opts?: RequestInit) {
    let response = await fetch(url, opts);

    // If response is ok, we can safely assume it is valid JSON
    if (response.ok) {
        let json = await response.json();

        return json as T;
    } else {
        // Errors might come from the API itself or the proxy Binance is using.
        // For API errors the response will be valid JSON, but for proxy errors
        // it will be HTML

        let error: Error;
        let responseText = await response.text()

        try {
            const json = JSON.parse(responseText)
            // The body was JSON parseable, assume it is an API response error
            error = new ApiError(json, json.code, json.msg, response, responseText);
        } catch (e) {
            // The body was not JSON parseable, assume it is proxy error
            error = new ProxyError(response, responseText);
        }

        throw error
    }
}
export class RestClient {
    public constructor(
        private apiKey: string,
        private apiSecret: string,
        private baseApiUrl: string = "https://api.binance.com",
        private futuresApiUrl: string = "https://fapi.binance.com",
    ) {

    }

    private sign(payload: IndexedObject) {
        return hmac('sha256', this.apiSecret, makeQueryString(payload).substr(1), 'utf8', 'hex')
    }

    public ping() {
        return fetchJson(
            this.baseApiUrl + '/api/v3/ping').then(response => true);
    }

    public time() {
        return fetchJson<{ serverTime: number }>(
            this.baseApiUrl + '/api/v3/time').then(r => r.serverTime);
    }
    public exchangeInfo() {
        return fetchJson(
            this.baseApiUrl + '/api/v3/exchangeInfo');
    }
    public book(symbol: string, limit: number = 100) {
        return fetchJson<{
            lastUpdateId: number, bids: [string, string][], asks: [string, string][]
        }>(
            this.baseApiUrl + '/api/v3/depth' + makeQueryString({ symbol, limit }));
    }
    public async aggTrades(symbol: string, query: {} | { fromId: string } | { startTime: number, endTime: number } = {}, limit: number = 500) {
        var response = await fetchJson<{
            a: number, p: string, q: string, f: number, l: number, T: number, m: boolean, M: boolean
        }[]>(
            this.baseApiUrl + '/api/v3/aggTrades' + makeQueryString({ symbol, ...query, limit }));

        return response.map(trade => ({
            aggId: trade.a,
            price: trade.p,
            quantity: trade.q,
            firstId: trade.f,
            lastId: trade.l,
            timestamp: trade.T,
            isBuyerMaker: trade.m,
            wasBestPrice: trade.M,
        }));
    }
    public async candles(symbol: string, interval: Interval, startTime?: number, endTime?: number, limit: number = 500) {
        var response = await fetchJson<{
            a: number, p: string, q: string, f: number, l: number, T: number, m: boolean, M: boolean
        }[]>(
            this.baseApiUrl + '/api/v3/klines' + makeQueryString({ symbol, interval, startTime, endTime, limit }));

        return response.map(trade => ({
            aggId: trade.a,
            price: trade.p,
            quantity: trade.q,
            firstId: trade.f,
            lastId: trade.l,
            timestamp: trade.T,
            isBuyerMaker: trade.m,
            wasBestPrice: trade.M,
        }));
    }
    public trades(symbol: string, limit: number = 500) {
        return fetchJson<{
            id: number;
            qty: string;
            time: number;
            price: string;
            quoteQty: string;
            isBestMatch: boolean;
            isBuyerMaker: boolean;
        }>(
            this.baseApiUrl + '/api/v3/depth' + makeQueryString({ symbol, limit }));
    }
    public tradesHistory(symbol: string, fromId?: number, limit: number = 500) {
        return fetchJson<{
            id: number;
            qty: string;
            time: number;
            price: string;
            quoteQty: string;
            isBestMatch: boolean;
            isBuyerMaker: boolean;
        }>(
            this.baseApiUrl + '/api/v3/historicalTrades' + makeQueryString({ symbol, fromId, limit }), {
            headers: {
                'X-MBX-APIKEY': this.apiKey
            }
        });
    }
    public dailyStats(symbol: string) {
        return fetchJson<{
            symbol: string;
            priceChange: string;
            priceChangePercent: string;
            weightedAvgPrice: string;
            prevClosePrice: string;
            lastPrice: string;
            lastQty: string;
            bidPrice: string;
            bidQty: string;
            askPrice: string;
            askQty: string;
            openPrice: string;
            highPrice: string;
            lowPrice: string;
            volume: string;
            quoteVolume: string;
            openTime: number;
            closeTime: number;
            firstId: number;
            lastId: number;
            count: number;
        }>(
            this.baseApiUrl + '/api/v3/ticker/24h' + makeQueryString({ symbol }));
    }

    public prices(): Promise<{ "symbol": string, "price": string }[]>
    public prices(symbol: string): Promise<{ "symbol": string, "price": string }>
    public prices(symbol?: string): Promise<{ "symbol": string, "price": string }> | Promise<{ "symbol": string, "price": string }[]> {
        if (symbol) {
            return fetchJson<{ "symbol": string, "price": string }>(
                this.baseApiUrl + '/api/v3/ticker/price' + makeQueryString({ symbol }));
        } else {
            return fetchJson<{ "symbol": string, "price": string }[]>(
                this.baseApiUrl + '/api/v3/ticker/price');
        }
    }

    public avgPrice(symbol: string) {
        return fetchJson<{ mins: number, price: string }>('/api/v3/avgPrice' + makeQueryString({ symbol }));
    }
    public allBookTickers(): Promise<{ symbol: string; bidPrice: string; bidQty: string; askPrice: string; askQty: string }[]>;
    public allBookTickers(symbol: string): Promise<{ symbol: string; bidPrice: string; bidQty: string; askPrice: string; askQty: string }>;
    public allBookTickers(symbol?: string): Promise<{ symbol: string; bidPrice: string; bidQty: string; askPrice: string; askQty: string }[]> | Promise<{ symbol: string; bidPrice: string; bidQty: string; askPrice: string; askQty: string; }> {
        if (symbol) {
            return fetchJson<{ symbol: string; bidPrice: string; bidQty: string; askPrice: string; askQty: string }[]>(
                this.baseApiUrl + '/api/v3/ticker/bookTicker' + makeQueryString({ symbol }));
        } else {
            return fetchJson<{ symbol: string; bidPrice: string; bidQty: string; askPrice: string; askQty: string }[]>(
                this.baseApiUrl + '/api/v3/ticker/bookTicker');
        }
    }

    public order(order: Order, timestamp: number = Date.now()) {
        let payload = { ...order, timestamp };
        let signature = this.sign(payload);

        return fetchJson<{
            symbol: string;
            orderId: number;
            clientOrderId: string;
            transactTime: number;
            price: string;
            origQty: string;
            executedQty: string;
            status: string;
            timeInForce: string;
            type: string;
            side: string;
        }>(
            this.baseApiUrl + '/api/v3/order' + makeQueryString({ ...payload, signature }), {
            headers: { 'X-MBX-APIKEY': this.apiKey },
            method: 'POST'
        });
    }

    public orderOco(order: OrderOco, timestamp: number = Date.now()) {
        let payload = { ...order, timestamp };
        let signature = this.sign(payload);

        return fetchJson<{
            orderListId: number;
            contingencyType: string;
            listStatusType: string;
            listOrderStatus: string;
            listClientOrderId: string;
            transactionTime: number;
            symbol: string;
            orders: {
                symbol: string;
                orderId: number;
                clientOrderId: string;
            }[];
            orderReports: {
                symbol: string;
                orderId: number;
                orderListId: number;
                clientOrderId: string;
                transactTime: any;
                price: string;
                origQty: string;
                executedQty: string;
                cummulativeQuoteQty: string;
                status: string;
                timeInForce: string;
                type: string;
                side: string;
                stopPrice: string;
            }[];
        }>(
            this.baseApiUrl + '/api/v3/order/oco' + makeQueryString({ ...payload, signature }), {
            headers: { 'X-MBX-APIKEY': this.apiKey },
            method: 'POST'
        });
    }

    public orderTest(order: Order, timestamp: number = Date.now()) {
        let payload = { ...order, timestamp };
        let signature = this.sign(payload);

        return fetchJson<void>(
            this.baseApiUrl + '/api/v3/order/test' + makeQueryString({ ...payload, signature }), {
            headers: { 'X-MBX-APIKEY': this.apiKey },
            method: 'POST'
        });
    }

    public getOrder(symbol: string, orderId: number, origClientOrderId?: string, recvWindow?: number, timestamp: number = Date.now()) {
        let payload = { symbol, orderId, origClientOrderId, recvWindow, timestamp };
        let signature = this.sign(payload);

        return fetchJson<{
            clientOrderId: string;
            cummulativeQuoteQty: string;
            executedQty: string;
            icebergQty: string;
            isWorking: boolean;
            orderId: number;
            origQty: string;
            price: string;
            side: string;
            status: string;
            stopPrice: string;
            symbol: string;
            time: number;
            timeInForce: string;
            type: string;
            updateTime: number;
        }>(
            this.baseApiUrl + '/api/v3/order' + makeQueryString({ ...payload, signature }), {
            headers: { 'X-MBX-APIKEY': this.apiKey },
            method: 'GET'
        });
    }

    public cancelOrder(symbol: string, orderId: number, origClientOrderId?: string, newClientOrderId?: string, recvWindow?: number, timestamp: number = Date.now()) {
        let payload = { symbol, orderId, origClientOrderId, newClientOrderId, recvWindow, timestamp };
        let signature = this.sign(payload);

        return fetchJson<{
            symbol: string;
            origClientOrderId: string;
            orderId: number;
            clientOrderId: string;
        }>(
            this.baseApiUrl + '/api/v3/order' + makeQueryString({ ...payload, signature }), {
            headers: { 'X-MBX-APIKEY': this.apiKey },
            method: 'DELETE'
        });
    }
    public cancelOpenOrders(symbol: string, timestamp: number = Date.now()) {
        let payload = { symbol, timestamp };
        let signature = this.sign(payload);

        return fetchJson<{
            symbol: string;
            origClientOrderId: string;
            orderId: number;
            clientOrderId: string;
        }[]>(
            this.baseApiUrl + '/api/v3/openOrders' + makeQueryString({ ...payload, signature }), {
            headers: { 'X-MBX-APIKEY': this.apiKey },
            method: 'DELETE'
        });
    }
    public openOrders(symbol: string, recvWindow?: number, timestamp: number = Date.now()) {
        let payload = { symbol, recvWindow, timestamp };
        let signature = this.sign(payload);

        return fetchJson<{
            symbol: string;
            orderId: number;
            clientOrderId: string;
            price: string;
            origQty: string;
            executedQty: string;
            status: string;
            timeInForce: string;
            type: string;
            side: string;
            stopPrice: string;
            icebergQty: string;
            time: number;
            isWorking: boolean;
        }[]>(
            this.baseApiUrl + '/api/v3/openOrders' + makeQueryString({ ...payload, signature }), {
            headers: { 'X-MBX-APIKEY': this.apiKey },
            method: 'GET'
        });
    }
    public allOrders(symbol: string, orderId: number, limit: number = 500, recvWindow?: number, timestamp: number = Date.now()) {
        let payload = { symbol, orderId, limit, recvWindow, timestamp };
        let signature = this.sign(payload);

        return fetchJson<{
            symbol: string;
            orderId: number;
            clientOrderId: string;
            price: string;
            origQty: string;
            executedQty: string;
            status: string;
            timeInForce: string;
            type: string;
            side: string;
            stopPrice: string;
            icebergQty: string;
            time: number;
            isWorking: boolean;
        }[]>(
            this.baseApiUrl + '/api/v3/allOrders' + makeQueryString({ ...payload, signature }), {
            headers: { 'X-MBX-APIKEY': this.apiKey },
            method: 'GET'
        });
    }

    public allOrdersOCO(query: {} | { startTime: number } | { endTime: number, fromId: number } = {}, limit: number = 500, recvWindow?: number, timestamp: number = Date.now()) {
        let payload = { ...query, limit, recvWindow, timestamp };
        let signature = this.sign(payload);

        return fetchJson<{
            orderListId: number;
            contingencyType: string;
            listStatusType: string;
            listOrderStatus: string;
            listClientOrderId: string;
            transactionTime: any;
            symbol: string;
            orders: {
                symbol: string;
                orderId: number;
                clientOrderId: string;
            }[];
        }>(
            this.baseApiUrl + '/api/v3/allOrderList' + makeQueryString({ ...payload, signature }), {
            headers: { 'X-MBX-APIKEY': this.apiKey },
            method: 'GET'
        });
    }
    public accountInfo(recvWindow?: number, timestamp: number = Date.now()) {
        let payload = { recvWindow, timestamp };
        let signature = this.sign(payload);

        return fetchJson<{
            makerCommission: number;
            takerCommission: number;
            buyerCommission: number;
            sellerCommission: number;
            canTrade: boolean;
            canWithdraw: boolean;
            canDeposit: boolean;
            balances: {
                asset: string;
                free: string;
                locked: string;
            }[];
        }>(
            this.baseApiUrl + '/api/v3/account' + makeQueryString({ ...payload, signature }), {
            headers: { 'X-MBX-APIKEY': this.apiKey },
            method: 'GET'
        });
    }
    public myTrades(symbol: string, fromId?: number, limit: number = 500, recvWindow?: number, timestamp: number = Date.now()) {
        let payload = { symbol, limit, fromId, recvWindow, timestamp };
        let signature = this.sign(payload);

        return fetchJson<{
            id: number;
            orderId: number;
            price: string;
            qty: string;
            commission: string;
            commissionAsset: string;
            time: number;
            isBuyer: boolean;
            isMaker: boolean;
            isBestMatch: boolean;
        }[]>(
            this.baseApiUrl + '/api/v3/myTrades' + makeQueryString({ ...payload, signature }), {
            headers: { 'X-MBX-APIKEY': this.apiKey },
            method: 'GET'
        });
    }
    public withdraw(asset: string, address: string, amount: number, name?: string, recvWindow?: number, timestamp: number = Date.now()) {
        let payload = { asset, address, amount, name, recvWindow, timestamp };
        let signature = this.sign(payload);

        return fetchJson<any>(
            this.baseApiUrl + '/wapi/v3/withdraw.html' + makeQueryString({ ...payload, signature }), {
            headers: { 'X-MBX-APIKEY': this.apiKey },
            method: 'POST'
        });
    }
    public withdrawHistory(asset?: string, status?: number, startTime?: number, endTime?: number, recvWindow?: number, timestamp: number = Date.now()) {
        let payload = { asset, status, startTime, endTime, recvWindow, timestamp };
        let signature = this.sign(payload);

        return fetchJson<any>(
            this.baseApiUrl + '/wapi/v3/withdrawHistory.html' + makeQueryString({ ...payload, signature }), {
            headers: { 'X-MBX-APIKEY': this.apiKey },
            method: 'GET'
        });
    }
    public depositHistory(args: object, timestamp: number = Date.now()) {
        let payload = { ...args, timestamp };
        let signature = this.sign(payload);

        return fetchJson<any>(
            this.baseApiUrl + '/wapi/v3/depositHistory.html' + makeQueryString({ ...payload, signature }), {
            headers: { 'X-MBX-APIKEY': this.apiKey },
            method: 'GET'
        });
    }
    public depositAddress(asset: string, timestamp: number = Date.now()) {
        let payload = { asset, timestamp };
        let signature = this.sign(payload);

        return fetchJson<any>(
            this.baseApiUrl + '/wapi/v3/depositAddress.html' + makeQueryString({ ...payload, signature }), {
            headers: { 'X-MBX-APIKEY': this.apiKey },
            method: 'GET'
        });
    }
    public tradeFee(args: object, timestamp: number = Date.now()) {
        let payload = { ...args, timestamp };
        let signature = this.sign(payload);

        return fetchJson<any>(
            this.baseApiUrl + '/wapi/v3/tradeFee.html' + makeQueryString({ ...payload, signature }), {
            headers: { 'X-MBX-APIKEY': this.apiKey },
            method: 'GET'
        });
    }
    public assetDetail(args: object, timestamp: number = Date.now()) {
        let payload = { ...args, timestamp };
        let signature = this.sign(payload);

        return fetchJson<any>(
            this.baseApiUrl + '/wapi/v3/assetDetail.html' + makeQueryString({ ...payload, signature }), {
            headers: { 'X-MBX-APIKEY': this.apiKey },
            method: 'GET'
        });
    }
    public getDataStream() {
        return fetchJson<DataStream>(
            this.baseApiUrl + '/api/v3/userDataStream', {
            headers: { 'X-MBX-APIKEY': this.apiKey },
            method: 'POST'
        });
    }
    public keepDataStream(dataStream: DataStream) {
        return fetchJson<void>(
            this.baseApiUrl + '/api/v3/userDataStream' + makeQueryString(dataStream), {
            headers: { 'X-MBX-APIKEY': this.apiKey },
            method: 'PUT'
        });
    }
    public closeDataStream(dataStream: DataStream) {
        return fetchJson<void>(
            this.baseApiUrl + '/api/v3/userDataStream' + makeQueryString(dataStream), {
            headers: { 'X-MBX-APIKEY': this.apiKey },
            method: 'DELETE'
        });
    }
    public marginGetDataStream() {
        return fetchJson<DataStream>(
            this.baseApiUrl + '/sapi/v1/userDataStream', {
            headers: { 'X-MBX-APIKEY': this.apiKey },
            method: 'POST'
        });
    }
    public marginKeepDataStream(dataStream: DataStream) {
        return fetchJson<void>(
            this.baseApiUrl + '/sapi/v1/userDataStream' + makeQueryString(dataStream), {
            headers: { 'X-MBX-APIKEY': this.apiKey },
            method: 'PUT'
        });
    }
    public marginCloseDataStream(dataStream: DataStream) {
        return fetchJson<void>(
            this.baseApiUrl + '/sapi/v1/userDataStream' + makeQueryString(dataStream), {
            headers: { 'X-MBX-APIKEY': this.apiKey },
            method: 'DELETE'
        });
    }
    public futuresGetDataStream() {
        return fetchJson<DataStream>(
            this.futuresApiUrl + '/fapi/v1/listenKey', {
            headers: { 'X-MBX-APIKEY': this.apiKey },
            method: 'POST'
        });
    }
    public futuresKeepDataStream(dataStream: DataStream) {
        return fetchJson<void>(
            this.futuresApiUrl + '/fapi/v1/listenKey' + makeQueryString(dataStream), {
            headers: { 'X-MBX-APIKEY': this.apiKey },
            method: 'PUT'
        });
    }
    public futuresCloseDataStream(dataStream: DataStream) {
        return fetchJson<void>(
            this.futuresApiUrl + '/fapi/v1/listenKey' + makeQueryString(dataStream), {
            headers: { 'X-MBX-APIKEY': this.apiKey },
            method: 'DELETE'
        });
    }

    // ----------------------------

    public marginAllOrders(args: object, timestamp: number = Date.now()) {
        let payload = { ...args, timestamp };
        let signature = this.sign(payload);

        return fetchJson<any>(
            this.baseApiUrl + '/sapi/v1/margin/allOrders' + makeQueryString({ ...payload, signature }), {
            headers: { 'X-MBX-APIKEY': this.apiKey },
            method: 'GET'
        });
    }
    public marginOrder(args: object, timestamp: number = Date.now()) {
        let payload = { ...args, timestamp };
        let signature = this.sign(payload);

        return fetchJson<any>(
            this.baseApiUrl + '/sapi/v1/margin/order' + makeQueryString({ ...payload, signature }), {
            headers: { 'X-MBX-APIKEY': this.apiKey },
            method: 'GET'
        });
    }
    public marginCancelOrder(args: object, timestamp: number = Date.now()) {
        let payload = { ...args, timestamp };
        let signature = this.sign(payload);

        return fetchJson<any>(
            this.baseApiUrl + '/sapi/v1/margin/order' + makeQueryString({ ...payload, signature }), {
            headers: { 'X-MBX-APIKEY': this.apiKey },
            method: 'DELETE'
        });
    }
    public marginOpenOrders(args: object, timestamp: number = Date.now()) {
        let payload = { ...args, timestamp };
        let signature = this.sign(payload);

        return fetchJson<any>(
            this.baseApiUrl + '/sapi/v1/margin/openOrders' + makeQueryString({ ...payload, signature }), {
            headers: { 'X-MBX-APIKEY': this.apiKey },
            method: 'GET'
        });
    }
    public marginAccountInfo(args: object, timestamp: number = Date.now()) {
        let payload = { ...args, timestamp };
        let signature = this.sign(payload);

        return fetchJson<any>(
            this.baseApiUrl + '/sapi/v1/margin/account' + makeQueryString({ ...payload, signature }), {
            headers: { 'X-MBX-APIKEY': this.apiKey },
            method: 'GET'
        });
    }
    public marginMyTrades(args: object, timestamp: number = Date.now()) {
        let payload = { ...args, timestamp };
        let signature = this.sign(payload);

        return fetchJson<any>(
            this.baseApiUrl + '/sapi/v1/margin/myTrades' + makeQueryString({ ...payload, signature }), {
            headers: { 'X-MBX-APIKEY': this.apiKey },
            method: 'GET'
        });
    }
    public futuresPing() {
        return fetchJson(
            this.futuresApiUrl + '/fapi/v1/ping').then(() => true);
    }
    public futuresTime() {
        return fetchJson<{ serverTime: number }>(
            this.futuresApiUrl + '/fapi/v1/time').then(r => r.serverTime);
    }
    public futuresExchangeInfo() {
        return fetchJson(
            this.futuresApiUrl + '/fapi/v1/exchangeInfo');
    }
    public futuresBook(args: object, timestamp: number = Date.now()) {
        let payload = { ...args, timestamp };
        let signature = this.sign(payload);

        return fetchJson<any>(
            this.futuresApiUrl + '/fapi/v1/depth' + makeQueryString({ ...payload, signature }), {
            headers: { 'X-MBX-APIKEY': this.apiKey },
            method: 'GET'
        });
    }
    public futuresAggTrades(args: object, timestamp: number = Date.now()) {
        let payload = { ...args, timestamp };
        let signature = this.sign(payload);

        return fetchJson<any>(
            this.futuresApiUrl + '/fapi/v1/aggTrades' + makeQueryString({ ...payload, signature }), {
            headers: { 'X-MBX-APIKEY': this.apiKey },
            method: 'GET'
        });
    }
    public futuresMarkPrice(args: object, timestamp: number = Date.now()) {
        let payload = { ...args, timestamp };
        let signature = this.sign(payload);

        return fetchJson<any>(
            this.futuresApiUrl + '/fapi/v1/premiumIndex' + makeQueryString({ ...payload, signature }), {
            headers: { 'X-MBX-APIKEY': this.apiKey },
            method: 'GET'
        });
    }
    public futuresAllForceOrders(args: object, timestamp: number = Date.now()) {
        let payload = { ...args, timestamp };
        let signature = this.sign(payload);

        return fetchJson<any>(
            this.futuresApiUrl + '/fapi/v1/allForceOrders' + makeQueryString({ ...payload, signature }), {
            headers: { 'X-MBX-APIKEY': this.apiKey },
            method: 'GET'
        });
    }
    public futuresCandles(args: object, timestamp: number = Date.now()) {
        let payload = { ...args, timestamp };
        let signature = this.sign(payload);

        return fetchJson<any>(
            this.futuresApiUrl + '/fapi/v1/klines' + makeQueryString({ ...payload, signature }), {
            headers: { 'X-MBX-APIKEY': this.apiKey },
            method: 'GET'
        });
    }
    public futuresTrades(args: object, timestamp: number = Date.now()) {
        let payload = { ...args, timestamp };
        let signature = this.sign(payload);

        return fetchJson<any>(
            this.futuresApiUrl + '/fapi/v1/trades' + makeQueryString({ ...payload, signature }), {
            headers: { 'X-MBX-APIKEY': this.apiKey },
            method: 'GET'
        });
    }
    public futuresDailyStats(args: object, timestamp: number = Date.now()) {
        let payload = { ...args, timestamp };
        let signature = this.sign(payload);

        return fetchJson<any>(
            this.futuresApiUrl + '/fapi/v1/ticker/24hr' + makeQueryString({ ...payload, signature }), {
            headers: { 'X-MBX-APIKEY': this.apiKey },
            method: 'GET'
        });
    }
    public futuresPrices() {
        return fetchJson<any>(
            this.futuresApiUrl + '/fapi/v1/ticker/price');
    }
    public futuresAllBookTickers() {
        return fetchJson<any>(
            this.futuresApiUrl + '/fapi/v1/ticker/bookTicker');
    }
    public futuresFundingRate(args: object, timestamp: number = Date.now()) {
        let payload = { ...args, timestamp };
        let signature = this.sign(payload);

        return fetchJson<any>(
            this.futuresApiUrl + '/fapi/v1/fundingRate' + makeQueryString({ ...payload, signature }), {
            headers: { 'X-MBX-APIKEY': this.apiKey },
            method: 'GET'
        });
    }
    public futuresOrder(args: object, timestamp: number = Date.now()) {
        let payload = { ...args, timestamp };
        let signature = this.sign(payload);

        return fetchJson<any>(
            this.futuresApiUrl + '/fapi/v1/order' + makeQueryString({ ...payload, signature }), {
            headers: { 'X-MBX-APIKEY': this.apiKey },
            method: 'GET'
        });
    }
    public futuresCancelOrder(args: object, timestamp: number = Date.now()) {
        let payload = { ...args, timestamp };
        let signature = this.sign(payload);

        return fetchJson<any>(
            this.futuresApiUrl + '/fapi/v1/order' + makeQueryString({ ...payload, signature }), {
            headers: { 'X-MBX-APIKEY': this.apiKey },
            method: 'DELETE'
        });
    }
    public futuresOpenOrders(args: object, timestamp: number = Date.now()) {
        let payload = { ...args, timestamp };
        let signature = this.sign(payload);

        return fetchJson<any>(
            this.futuresApiUrl + '/fapi/v1/openOrders' + makeQueryString({ ...payload, signature }), {
            headers: { 'X-MBX-APIKEY': this.apiKey },
            method: 'GET'
        });
    }
    public futuresPositionRisk(args: object, timestamp: number = Date.now()) {
        let payload = { ...args, timestamp };
        let signature = this.sign(payload);

        return fetchJson<any>(
            this.futuresApiUrl + '/fapi/v1/positionRisk' + makeQueryString({ ...payload, signature }), {
            headers: { 'X-MBX-APIKEY': this.apiKey },
            method: 'GET'
        });
    }
}