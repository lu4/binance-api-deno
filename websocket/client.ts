import { trades } from "./trades/loop.ts";
import { tradesAgg } from "./trades-agg/loop.ts";

import { user } from "./user/loop.ts";
import { depth } from "./depth/loop.ts";
import { ticker } from "./ticker/loop.ts";
import { candles } from "./candles/loop.ts";
import { tickers } from "./tickers/loop.ts";
import { Interval } from "../candle-interval.ts";
import { RestClient } from "../rest/client.ts";

import { depthPartial, PartialDepthLevel } from "./depth-partial/loop.ts";

// const BASE = 'wss://stream.binance.com:9443/ws'
// const FUTURES = 'wss://fstream.binance.com/ws'

export class WebSocketClient {
    public constructor(public readonly domain: string = 'wss://stream.binance.com:9443/ws') {

    }

    public trades(symbol: string) {
        return trades(this.domain, symbol);
    }
    public tradesAgg(symbol: string) {
        return tradesAgg(this.domain, symbol);
    }
    public user(restClient: RestClient, keepAliveInterval: number = 30 * 60 * 1000) {
        return user(this.domain, restClient, keepAliveInterval)
    }
    public depth(symbol: string) {
        return depth(this.domain, symbol);
    }
    public ticker(symbol: string) {
        return ticker(this.domain, symbol);
    }
    public candles(symbol: string, interval: Interval) {
        return candles(this.domain, symbol, interval);
    }
    public tickers() {
        return tickers(this.domain);
    }
    public depthPartial(symbol: string, level: PartialDepthLevel = 10) {
        return depthPartial(this.domain, symbol, level);
    }
}