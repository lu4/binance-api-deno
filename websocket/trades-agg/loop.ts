import { Parser } from "../parser.ts";
import { listener } from "../listener.ts";

export interface TradeAggRaw {
    e: string;
    E: number;
    T: number;
    s: string;
    p: string;
    q: string;
    m: boolean;
    M: boolean;
    a: number;
    f: number;
    l: number;
}

export interface TradeAgg {
    eventType: string;
    eventTime: number;
    timestamp: number;
    symbol: string;
    price: string;
    quantity: string;
    isBuyerMaker: boolean;
    wasBestPrice: boolean;
    aggId: number;
    firstId: number;
    lastId: number;
}

let url = (base: string, symbol: string) => {
    return `${base}/${symbol.toLowerCase()}@aggTrade`;
}

let parser: Parser<TradeAgg> = (message: string) => {
    let m: TradeAggRaw = JSON.parse(message)

    return {
        eventType: m.e,
        eventTime: m.E,
        timestamp: m.T,
        symbol: m.s,
        price: m.p,
        quantity: m.q,
        isBuyerMaker: m.m,
        wasBestPrice: m.M,
        aggId: m.a,
        firstId: m.f,
        lastId: m.l,
    };
}

export function tradesAgg(domain: string, symbol: string) {
    return listener<TradeAgg>(url(domain, symbol), parser);
}