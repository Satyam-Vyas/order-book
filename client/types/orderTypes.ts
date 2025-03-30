export enum OrderOptions {
    BID = "bid",
    ASK = "ask"
}

export type Order = {
    id: string
    user: string
    price: number
    quantity: number
    timestamp: Date
}

export interface Trade {
    id: number;
    bid_user: string;
    ask_user: string;
    price: number;
    quantity: number;
    timestamp: Date;
    taker_side: "bid" | "ask" 
}

export type OrderBook = {
    bids: Order[] 
    asks: Order[] 
}

export type OrderContextType = {
    orderBook: OrderBook
    trades: Trade[]
    refreshOrderBook: () => Promise<boolean>
    refreshTradeHistory: () => Promise<boolean>
}

export type OrderType = 'bid' | 'ask';

export interface OrderRequest {
    type: OrderType;
    price: number;
    quantity: number;
    token: string;
}

export interface OrderResponse {
    success: boolean;
    orderId: string;
    message: string;
}