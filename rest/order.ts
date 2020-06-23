// Based on: https://github.com/binance-exchange/binance-api-node
// ----------------
// LIMIT_MAKER are LIMIT orders that will be rejected if they would immediately match and trade as a taker.
// STOP_LOSS and TAKE_PROFIT will execute a MARKET order when the stopPrice is reached.
// Any LIMIT or LIMIT_MAKER type order can be made an iceberg order by sending an icebergQty.
// Any order with an icebergQty MUST have timeInForce set to GTC.
// ----------------
// 
// Type below restricts possible field combinations to values acceptable by binance api

export type BaseOrder = {
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    recvWindow?: number;
    newOrderRespType?: 'ACK' | 'RESULT' | 'FULL';
    newClientOrderId?: string;
}

export type MarketOrder = BaseOrder & {
    type: 'MARKET';
    timeInForce: 'GTC' | 'FOK' | 'IOC'; // GTC for 'LIMIT', 'STOP_LOSS_LIMIT', 'TAKE_PROFIT_LIMIT'
};

export type StopLossOrder = BaseOrder & {
    type: 'TAKE_PROFIT';
    stopPrice: number;
    timeInForce: 'GTC' | 'FOK' | 'IOC'; // GTC for 'LIMIT', 'STOP_LOSS_LIMIT', 'TAKE_PROFIT_LIMIT'
}

export type TakeProfitOrder = BaseOrder & {
    type: 'TAKE_PROFIT';
    stopPrice: number;
    timeInForce: 'GTC' | 'FOK' | 'IOC'; // GTC for 'LIMIT', 'STOP_LOSS_LIMIT', 'TAKE_PROFIT_LIMIT'
}

export type PricedOrder = BaseOrder & {
    price: number;
}

export type LimitOrder = PricedOrder & {
    type: 'LIMIT'
    timeInForce: 'GTC' | 'FOK' | 'IOC'; // GTC for 'LIMIT', 'STOP_LOSS_LIMIT', 'TAKE_PROFIT_LIMIT'
} | {
    type: 'LIMIT'
    icebergQty: number; // <=========
    timeInForce: 'GTC'; // <=========
}
export type LimitMakerOrder = PricedOrder & {
    type: 'LIMIT_MAKER'
    timeInForce: 'GTC' | 'FOK' | 'IOC'; // GTC for 'LIMIT', 'STOP_LOSS_LIMIT', 'TAKE_PROFIT_LIMIT'
} | {
    type: 'LIMIT_MAKER'
    icebergQty: number; // <=========
    timeInForce: 'GTC'; // <=========
};

export type StopLossLimitOrder = PricedOrder & {
    type: 'STOP_LOSS_LIMIT';
    stopPrice: number;
    timeInForce: 'GTC' | 'FOK' | 'IOC'; // GTC for 'LIMIT', 'STOP_LOSS_LIMIT', 'TAKE_PROFIT_LIMIT'
}

export type TakeProfitLimitOrder = PricedOrder & {
    type: 'TAKE_PROFIT_LIMIT';
    stopPrice: number;
    timeInForce: 'GTC' | 'FOK' | 'IOC'; // GTC for 'LIMIT', 'STOP_LOSS_LIMIT', 'TAKE_PROFIT_LIMIT'
}

export type Order = MarketOrder | StopLossOrder | TakeProfitOrder | LimitOrder | LimitMakerOrder | StopLossLimitOrder | TakeProfitLimitOrder;

