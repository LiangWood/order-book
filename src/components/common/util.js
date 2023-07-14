import { ORDERBOOK_LEVELS } from "../../constants";

export const formatNumber = (arg) => {
  return new Intl.NumberFormat("en-US").format(arg);
};

export const formatPrice = (arg) => {
  return arg.toLocaleString("en", {
    useGrouping: true,
    minimumFractionDigits: 1,
  });
};

export const roundToNearest = (value, interval) => {
  return Math.floor(value / interval) * interval;
};

export const groupByPrice = (levels) => {
  return levels
    .map((level, idx) => {
      const nextLevel = levels[idx + 1];
      const prevLevel = levels[idx - 1];

      if (nextLevel && level[0] === nextLevel[0]) {
        return [level[0], level[1] + nextLevel[1]];
      } else if (prevLevel && level[0] === prevLevel[0]) {
        return [];
      } else {
        return level;
      }
    })
    .filter((level) => level.length > 0);
};

export const compareDeltasIfUpdated = (prevLevels, currentLevels) =>
  currentLevels.map((arr1) => {
    const foundArr2 = prevLevels.find((arr2) => arr2[0] !== arr1[0]);
    if (foundArr2) {
      return [...arr1, "highlight"];
    }
    return arr1;
  });

export const getCorrectRowCount = (orders) => {
  return orders && orders.slice(0, ORDERBOOK_LEVELS);
};
