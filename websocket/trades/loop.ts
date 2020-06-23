import { Parser } from "../parser.ts";
import { listener } from "../listener.ts";

export interface TradeRaw {
    e: string;
    E: number;
    T: number;
    s: string;
    p: string;
    q: string;
    m: boolean;
    M: boolean;
    t: number;
    a: number;
    b: number;
}

export interface Trade {
    eventType: string;
    eventTime: number;
    tradeTime: number;
    symbol: string;
    price: string;
    quantity: string;
    isBuyerMaker: boolean;
    maker: boolean;
    tradeId: number;
    sellerOrderId: number;
    buyerOrderId: number;
}

let url = (base: string, symbol: string) => {
    return `${base}/${symbol.toLowerCase()}@trade`;
}

let parser: Parser<Trade> = (message: string) => {
    const trade: TradeRaw = JSON.parse(message)

    return {
        eventType: trade.e,
        eventTime: trade.E,
        tradeTime: trade.T,
        symbol: trade.s,
        price: trade.p,
        quantity: trade.q,
        isBuyerMaker: trade.m,
        maker: trade.M,
        tradeId: trade.t,
        sellerOrderId: trade.a,
        buyerOrderId: trade.b,
    };
}

export function trades(domain: string, symbol: string) {
    return listener<Trade>(url(domain, symbol), parser);
}