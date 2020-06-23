import { listener } from "../listener.ts";

import { Parser } from "../parser.ts";
import { Interval } from "../../candle-interval.ts";

export interface Candle {
    symbol: string;
    eventType: string;
    eventTime: number;
    startTime: number;
    closeTime: number;
    firstTradeId: number;
    lastTradeId: number;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
    trades: number;
    interval: string;
    isFinal: boolean;
    quoteVolume: string;
    buyVolume: string;
    quoteBuyVolume: string;
};

let url = (base: string, symbol: string, interval: Interval) => {
    return `${base}/${symbol.toLowerCase()}@kline_${interval}`;
}

let parser: Parser<Candle> = (message: string) => {
    const { s: symbol, e: eventType, E: eventTime, k: tick } = JSON.parse(message)

    return {
        symbol,
        eventType,
        eventTime,

        startTime: tick.t,
        closeTime: tick.T,
        firstTradeId: tick.f,
        lastTradeId: tick.L,
        open: tick.o,
        high: tick.h,
        low: tick.l,
        close: tick.c,
        volume: tick.v,
        trades: tick.n,
        interval: tick.i,
        isFinal: tick.x,
        quoteVolume: tick.q,
        buyVolume: tick.V,
        quoteBuyVolume: tick.Q,
    };
}

export function candles(domain: string, symbol: string, interval: Interval) {
    return listener<Candle>(url(domain, symbol, interval), parser);
}