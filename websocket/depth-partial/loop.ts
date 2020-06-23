import { Parser } from "../parser.ts";
import { listener } from "../listener.ts";

export interface PartialDepthRaw {
    lastUpdateId: number;
    bids: [string, string][];
    asks: [string, string][];
}

export interface PartialDepth {
    lastUpdateId: number;

    bids: { depth: string, quantity: string }[];
    asks: { depth: string, quantity: string }[];
}

export type PartialDepthLevel = 5 | 10 | 20;

interface ListenerOptions {
    symbol: string;
    level: PartialDepthLevel;
}

let url = (base: string, symbol: string, level: PartialDepthLevel) => {
    return `${base}/${symbol.toLowerCase()}@depth${level}`;
}

let parser: Parser<PartialDepth, ListenerOptions> = (message: string, options: ListenerOptions) => {
    let depthRaw: PartialDepthRaw = JSON.parse(message);

    return {
        level: options.level,
        symbol: options.symbol,
        lastUpdateId: depthRaw.lastUpdateId,
        asks: depthRaw.asks.map(x => ({ depth: x[0], quantity: x[1] })),
        bids: depthRaw.bids.map(x => ({ depth: x[0], quantity: x[1] })),
    }
}

export function depthPartial(domain: string, symbol: string, level: PartialDepthLevel) {
    return listener<PartialDepth, ListenerOptions>(url(domain, symbol, level), parser, { symbol, level })
}