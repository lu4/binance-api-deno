import { Parser } from "../parser.ts";
import { listener } from "../listener.ts";

export interface TickerRaw {
    e: string;
    E: number;
    s: string;
    p: string;
    P: string;
    w: string;
    x: string;
    c: string;
    Q: string;
    b: string;
    B: string;
    a: string;
    A: string;
    o: string;
    h: string;
    l: string;
    v: string;
    q: string;
    O: number;
    C: number;
    F: number;
    L: number;
    n: number;
}

export interface Ticker {
    eventType: string;
    eventTime: number;
    symbol: string;
    priceChange: string;
    priceChangePercent: string;
    weightedAvg: string;
    prevDayClose: string;
    curDayClose: string;
    closeTradeQuantity: string;
    bestBid: string;
    bestBidQnt: string;
    bestAsk: string;
    bestAskQnt: string;
    open: string;
    high: string;
    low: string;
    volume: string;
    volumeQuote: string;
    openTime: number;
    closeTime: number;
    firstTradeId: number;
    lastTradeId: number;
    totalTrades: number;
}

let url = (base: string, symbol: string) => {
    return `${base}/${symbol.toLowerCase()}@ticker`;
}

let parser: Parser<Ticker> = (message: string) => {
    let m: TickerRaw = JSON.parse(message);

    return {
        eventType: m.e,
        eventTime: m.E,
        symbol: m.s,
        priceChange: m.p,
        priceChangePercent: m.P,
        weightedAvg: m.w,
        prevDayClose: m.x,
        curDayClose: m.c,
        closeTradeQuantity: m.Q,
        bestBid: m.b,
        bestBidQnt: m.B,
        bestAsk: m.a,
        bestAskQnt: m.A,
        open: m.o,
        high: m.h,
        low: m.l,
        volume: m.v,
        volumeQuote: m.q,
        openTime: m.O,
        closeTime: m.C,
        firstTradeId: m.F,
        lastTradeId: m.L,
        totalTrades: m.n,
    };
}

export function ticker(domain: string, symbol: string) {
    return listener<Ticker>(url(domain, symbol), parser);
}