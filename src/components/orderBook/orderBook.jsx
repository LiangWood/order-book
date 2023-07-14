import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useWebSocket } from "react-use-websocket/dist/lib/use-websocket";
import { ReactComponent as LastPriceIcon } from "../../assets/IconArrowDown.svg";
import ObQuoteArea from "../obQuoteArea/obQuoteArea";
import "./orderBook.style.scss";
import {
  addAsks,
  addBids,
  addExistingState,
  addLastPrice,
  selectAsks,
  selectBids,
  selectLastPrice,
} from "./orderBookSlice";
import { styled } from "styled-components";
import { formatPrice, getCorrectRowCount } from "../common/util";

const ObLastPriceArea = styled.div`
  flex-basis: auto;
  height: 2em;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ $lastPrice }) =>
    $lastPrice.side === "BUY"
      ? "rgba(16, 186, 104, 0.12)"
      : $lastPrice.side === "SELL"
      ? "rgba(255, 90, 90, 0.12)"
      : "rgba(134, 152, 170, 0.12)"};

  .ob__lastPrice {
    font-weight: 600;
    display: flex;
    align-items: center;
    color: ${({ $lastPrice }) =>
      $lastPrice.side === "BUY"
        ? "#00b15d"
        : $lastPrice.side === "SELL"
        ? "#FF5B5A"
        : "#F0F4F8"};

    .ob__lastPriceIcon {
      width: 1rem;
      height: 1rem;
      transform: ${({ $lastPrice }) =>
        $lastPrice.side === "BUY" ? "rotate(180deg)" : "rotate(0deg)"};
    }
  }
`;

const WSS_FEED_URL = "wss://ws.btse.com/ws/oss/futures";
const WSS_LAST_URL = "wss://ws.btse.com/ws/futures";
const LAST_PRICE_TOPIC = "tradeHistoryApi:BTCPFC";

const orderType = {
  bids: "bids",
  asks: "asks",
};

let currentAsks = [];
let currentBids = [];

const OrderBook = ({ productId }) => {
  const sBids = useSelector(selectBids);
  const sAsks = useSelector(selectAsks);
  const sLastPrice = useSelector(selectLastPrice);

  const dispatch = useDispatch();

  const ws_feed = useWebSocket(WSS_FEED_URL, {
    onOpen: () => console.log("WebSocket feed connection opened."),
    onClose: () => console.log("WebSocket feed connection closed."),
    shouldReconnect: (closeEvent) => true,
    onMessage: (event) => processFeed(event),
  });
  const ws_lastPrice = useWebSocket(WSS_LAST_URL, {
    onOpen: () => console.log("WebSocket lastPrice connection opened."),
    onClose: () => console.log("WebSocket lastPrice connection closed."),
    shouldReconnect: (closeEvent) => true,
    onMessage: (event) => processLastPrice(event),
  });

  const processFeed = (event) => {
    const response = JSON.parse(event.data)?.data;
    if (response?.type === "snapshot") {
      dispatch(addExistingState(response));
    } else if (response?.type === "delta") {
      process(response);
    } else {
      console.error();
    }
  };

  const processLastPrice = (event) => {
    const response = JSON.parse(event.data);
    if (response?.topic === "tradeHistoryApi") {
      process(response.data[0]);
    }
  };

  useEffect(() => {
    const connectFeed = (product) => {
      const unSubscribeMessage = {
        event: "unsubscribe",
        args: [product],
      };
      ws_feed.sendJsonMessage(unSubscribeMessage);

      const subscribeMessage = {
        op: "subscribe",
        args: [product],
      };
      ws_feed.sendJsonMessage(subscribeMessage);
    };

    const connectLastPrice = (topic) => {
      const subscribeMessage = {
        op: "subscribe",
        args: [topic],
      };
      ws_lastPrice.sendJsonMessage(subscribeMessage);
    };

    connectFeed(productId);
    connectLastPrice(LAST_PRICE_TOPIC);

    // setTimeout(() => {
    //   ws_feed.getWebSocket()?.close();
    //   ws_lastPrice.getWebSocket()?.close();
    // }, 6000);

    return () => {
      ws_feed.getWebSocket()?.close();
      ws_lastPrice.getWebSocket()?.close();
    };
  }, [
    ws_feed.sendJsonMessage,
    ws_feed.getWebSocket,
    ws_lastPrice.sendJsonMessage,
    ws_lastPrice.getWebSocket,
  ]);

  const process = (data) => {
    if (data?.bids?.length > 0) {
      currentBids = [...currentBids, ...data.bids];
      dispatch(addBids(currentBids));
      currentBids = [];
      //   if (currentAsks.length > ORDERBOOK_LEVELS) {
      //     dispatch(addBids(currentBids));
      //     currentBids = [];
      //   }
    } else if (data?.asks?.length > 0) {
      currentAsks = [...currentAsks, ...data.asks];
      dispatch(addAsks(currentAsks));
      currentAsks = [];
      //   if (currentBids.length > ORDERBOOK_LEVELS) {
      //     dispatch(addAsks(currentBids));
      //     currentAsks = [];
      //   }
    } else {
      dispatch(addLastPrice(data));
    }
  };

  return (
    <div className="Ob">
      <div className="Ob__header">
        <div className="Ob__header__title">Order Book</div>
        <div className="Ob__header__quoteTable">
          <div>Price(USD)</div>
          <div>Size</div>
          <div>Total</div>
        </div>
      </div>
      <ObQuoteArea
        type="asks"
        orders={getCorrectRowCount(sAsks)}
        orderType={orderType.asks}
        productId={productId}
      />
      <ObLastPriceArea $lastPrice={sLastPrice}>
        {sLastPrice ? (
          <div className="ob__lastPrice">
            {formatPrice(sLastPrice.price)}
            {sLastPrice.side !== "BUY" && sLastPrice.side !== "SELL" ? null : (
              <LastPriceIcon className="ob__lastPriceIcon" />
            )}
          </div>
        ) : null}
      </ObLastPriceArea>

      <ObQuoteArea
        type="bids"
        orders={getCorrectRowCount(sBids)}
        orderType={orderType.bids}
        productId={productId}
      />
    </div>
  );
};

export default OrderBook;
