import { createSlice, current } from "@reduxjs/toolkit";
import { ORDERBOOK_LEVELS } from "../../constants";

const initialState = {
  market: "",
  rawBids: [],
  rawAsks: [],
  bids: [],
  maxTotalBids: 0,
  asks: [],
  maxTotalAsks: 0,
  requestInProgressByBids: false,
  requestInProgressByAsks: false,
  lastPrice: 0,
};

const removePriceLevel = (price, levels) =>
  levels.filter((level) => level[0] !== price);

const updatePriceLevel = (updatedLevel, levels) => {
  return levels.map((level) => {
    if (level[0] === updatedLevel[0]) {
      level = updatedLevel;
    }
    return level;
  });
};

const levelExists = (deltaLevelPrice, currentLevels) =>
  currentLevels.some((level) => level[0] === deltaLevelPrice);

const addPriceLevel = (deltaLevel, levels) => {
  return [...levels, deltaLevel];
};

const applyDeltas = (currentLevels, orders) => {
  let updatedLevels = currentLevels;

  orders.forEach((deltaLevel) => {
    const deltaLevelPrice = deltaLevel[0];
    const deltaLevelSize = deltaLevel[1];
    if (+deltaLevelSize === 0 && updatedLevels.length > ORDERBOOK_LEVELS) {
      updatedLevels = removePriceLevel(deltaLevelPrice, updatedLevels);
    } else {
      if (levelExists(deltaLevelPrice, currentLevels)) {
        updatedLevels = updatePriceLevel(deltaLevel, updatedLevels);
      } else {
        updatedLevels = addPriceLevel(deltaLevel, updatedLevels);
        // if (updatedLevels.length < ORDERBOOK_LEVELS) {
        //   updatedLevels = addPriceLevel(deltaLevel, updatedLevels);
        // }
      }
    }
  });
  return updatedLevels;
};

const addTotalSums = (orders) => {
  const totalSums = [];
  return orders.map((order, idx) => {
    const size = +order[1];
    const updatedLevel = [...order];
    const totalSum = idx === 0 ? size : size + totalSums[idx - 1];
    updatedLevel[2] = totalSum;
    totalSums.push(totalSum);
    return updatedLevel;
  });
};

const addDepths = (orders, maxTotal) => {
  return orders.map((order) => {
    const calculatedTotal = order[2];
    const depth = (calculatedTotal / maxTotal) * 100;
    const updatedOrder = [...order];
    updatedOrder[3] = depth;
    return updatedOrder;
  });
};

const getMaxTotalSum = (orders) => {
  const totalSums = orders.map((order) => order[2]);
  return Math.max.apply(Math, totalSums);
};

const sortedAsks = (asks) =>
  asks.sort((a, b) =>
    Number(a[0]) < Number(b[0]) ? -1 : Number(a[0]) > Number(b[0]) ? 1 : 0
  );
const sortedBids = (bids) =>
  bids.sort((a, b) =>
    Number(a[0]) < Number(b[0]) ? 1 : Number(a[0]) > Number(b[0]) ? -1 : 0
  );

const updatedPriceProgress = (currentPrice, lastPrice) => {
  let status = {
    BUY: "BUY",
    SELL: "SELL",
    EQUAL: "EQUAL",
  };
  let updatedLastPrice = lastPrice;
  if (currentPrice > lastPrice[0]) {
    updatedLastPrice.status = status.BUY;
  } else if (currentPrice < lastPrice[0]) {
    updatedLastPrice.status = status.SELL;
  } else {
    updatedLastPrice.status = status.EQUAL;
  }

  return updatedLastPrice;
};

export const orderBookSlice = createSlice({
  name: "orderbook",
  initialState,
  reducers: {
    addBids: (state, { payload }) => {
      const updatedBids = addTotalSums(
        applyDeltas(current(state).bids, payload)
      );

      state.maxTotalBids = getMaxTotalSum(updatedBids);
      state.bids = addDepths(
        sortedBids(updatedBids),
        current(state).maxTotalBids
      );
    },
    addAsks: (state, { payload }) => {
      const updatedAsks = addTotalSums(
        applyDeltas(current(state).asks, payload)
      );

      state.maxTotalAsks = getMaxTotalSum(updatedAsks);
      state.asks = addDepths(
        sortedAsks(updatedAsks),
        current(state).maxTotalAsks
      );
    },
    addLastPrice: (state, { payload }) => {
      const updatedLastPrice = updatedPriceProgress(
        current(state).lastPrice,
        payload
      );
      state.lastPrice = updatedLastPrice;
    },
    addExistingState: (state, { payload }) => {
      const rawBids = sortedBids(payload.bids);
      const rawAsks = sortedAsks(payload.asks);
      const bids = addTotalSums(rawBids);
      const asks = addTotalSums(rawAsks);

      state.market = payload["symbol"];
      state.rawBids = rawBids;
      state.rawAsks = rawAsks;
      state.maxTotalBids = getMaxTotalSum(bids);
      state.maxTotalAsks = getMaxTotalSum(asks);
      state.bids = addDepths(bids, current(state).maxTotalBids);
      state.asks = addDepths(asks, current(state).maxTotalAsks);
    },
    clearOrdersState: (state) => {
      state.bids = [];
      state.asks = [];
      state.rawBids = [];
      state.rawAsks = [];
      state.maxTotalBids = 0;
      state.maxTotalAsks = 0;
    },
  },
});

export const {
  addBids,
  addAsks,
  addLastPrice,
  addExistingState,
  setGrouping,
  clearOrdersState,
} = orderBookSlice.actions;

export const selectBids = (state) => state.orderbook.bids;
export const selectAsks = (state) => state.orderbook.asks;
export const selectLastPrice = (state) => state.orderbook.lastPrice;

export default orderBookSlice.reducer;
