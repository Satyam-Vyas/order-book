import axios from "axios";
import type { OrderBook, OrderResponse, Trade, OrderType, OrderRequest } from "@/types/orderTypes";
import { formatErrorResponse, isAuthenticated } from "./auth";

const TRADING_API_BASE_URL = process.env.NEXT_PUBLIC_TRADING_API_BASE_URL;

const tradingApiClient = axios.create({
  baseURL: TRADING_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const handleApiError = (error: any): OrderResponse => {
  console.log("API Error:", error);
  return {
    success: false,
    orderId: "",
    message: JSON.stringify(formatErrorResponse(error)),
  };
};

/**
 * Submit a new order to the backend
 */
export async function submitOrder(order: OrderRequest): Promise<OrderResponse> {
  try {

    if(!TRADING_API_BASE_URL) {
      throw new Error("Trading API base URL is not set");
    }

    const isAuth = await isAuthenticated();
    if (!isAuth) {
        throw new Error("User not authenticated, order could not be submitted");
    }
    const response = await tradingApiClient.post("/orders/", {
      order_type: order.type.toUpperCase(),
      price: order.price.toString(),
      quantity: order.quantity.toString(),
    }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
    });

    return {
      success: true,
      orderId: response.data.id?.toString() || "",
      message: "Order placed successfully",
    };
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Fetch the latest order book data
 */
export async function fetchOrderBook(): Promise<OrderBook | null> {
  try {

    if(!TRADING_API_BASE_URL) {
      throw new Error("Trading API base URL is not set");
    }

    const isAuth = await isAuthenticated();
    if (!isAuth) {
        throw new Error("User not authenticated, orders could not be fetched");
    }

    const response = await tradingApiClient.get("/orderbook/", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
    });

    return {
      bids: response.data.bids.map((bid: any) => ({
        ...bid,
        price: parseFloat(bid.price),
        quantity: parseFloat(bid.quantity),
      })),
      asks: response.data.asks.map((ask: any) => ({
        ...ask,
        price: parseFloat(ask.price),
        quantity: parseFloat(ask.quantity),
      })),
    };
  } catch (error) {
    console.log("Error fetching order book:", error);
    return null;
  }
}

/**
 * Fetch the latest trade history (last 24h)
 */
export async function fetchTradeHistory(): Promise<Trade[] | null> {
  try {

    if(!TRADING_API_BASE_URL) {
      throw new Error("Trading API base URL is not set");
    }

    const isAuth = await isAuthenticated();
    if (!isAuth) {
        throw new Error("User not authenticated, trades could not be fetched");
    }

    const response = await tradingApiClient.get("/trades/", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access_token")}`,
      },
    });

    return response.data.map((trade: any) => ({
      id: trade.id,
      bid_user: trade.bid_user,
      ask_user: trade.ask_user,
      price: parseFloat(trade.price),
      quantity: parseFloat(trade.quantity),
      timestamp: new Date(trade.timestamp),
      taker_side: trade.taker_side.toLowerCase() as OrderType,
    }));
  } catch (error) {
    console.log("Error fetching recent trades:", error);
    return null;
  }
}

export const formatNumber = (num: number, decimals: number = 2): string => {
    return num.toFixed(decimals);
};