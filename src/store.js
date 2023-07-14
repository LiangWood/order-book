import { configureStore } from "@reduxjs/toolkit";
import orderbookReducer from "./components/orderBook/orderBookSlice";

export const store = configureStore({
  reducer: {
    orderbook: orderbookReducer,
  },
});