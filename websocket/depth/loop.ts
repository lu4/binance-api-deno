import { Parser } from "../parser.ts";
import { listener } from "../listener.ts";

export interface DepthRaw {
    s: string;
    e: string;
    E: number;
    U: number;
    u: number;
    b: [string, string][];
    a: [string, string][];
}

export interface Depth {
    symbol: string;

    eventType: string;
    eventTime: number;

    firstUpdateId: number;
    finalUpdateId: number;

    bidDepth: { price: string, quantity: string }[];
    askDepth: { price: string, quantity: string }[];
}

let url = (base: string, symbol: string) => {
    return `${base}/${symbol.toLowerCase()}@depth`;
}

let parser: Parser<Depth> = (message: string) => {
    let json: DepthRaw = JSON.parse(message);

    return {
        symbol: json.s,
        eventType: json.e,
        eventTime: json.E,
        firstUpdateId: json.U,
        finalUpdateId: json.u,
        bidDepth: json.b.map(x => ({ price: x[0], quantity: x[1] })),
        askDepth: json.a.map(x => ({ price: x[0], quantity: x[1] })),
    }
}

export function depth(domain: string, symbol: string) {
    return listener<Depth>(url(domain, symbol), parser);
}