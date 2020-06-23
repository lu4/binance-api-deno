export type OrderOcoBase = {
    side: 'BUY' | 'SELL'; // BUY,SELL

    price: number;
    symbol: string;
    quantity: number;
    stopPrice: number;

    stopClientOrderId?: string; // A unique Id for the stop loss/stop loss limit leg
    listClientOrderId?: string; // A unique Id for the entire orderList
    limitClientOrderId?: string; // A unique Id for the limit order

    newOrderRespType?: 'ACK' | 'RESULT' | 'FULL'; // Returns more complete info of the order. ACK, RESULT, or FULL

    recvWindow?: number; // The value cannot be greater than 60000
}

export type OrderOcoStopLimit = {
    stopLimitPrice: number; // If provided, stopLimitTimeInForce is required.
    stopLimitTimeInForce: 'GTC' | 'FOK' | 'IOC'; // FOK, GTC, IOC
}

export type OrderOcoIceberg = {
    limitIcebergQty: number; // Used to make the LIMIT_MAKER leg an iceberg order.
    stopIcebergQty: number; // Used with STOP_LOSS_LIMIT leg to make an iceberg order.
}

export type OrderOco = OrderOcoBase | (OrderOcoBase & OrderOcoStopLimit) | (OrderOcoBase & OrderOcoIceberg) | (OrderOcoBase & OrderOcoStopLimit & OrderOcoIceberg)