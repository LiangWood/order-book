import React, { useEffect, useState } from "react";
import DepthVisualizer from "../depthVisualizer/DepthVisualizer";
import { styled } from "styled-components";
import { formatNumber, formatPrice } from "../common/util";

const QbQuoteArea = styled.div`
  font-size: 0.8rem;
  font-weight: 700;
  text-align: center;
  display: flex;
  overflow-y: hidden;

  &.obQuoteArea---bid {
    flex-direction: column;

    .obQuoteArea__price {
      color: #00b15d;
    }
  }

  &.obQuoteArea---ask {
    flex-direction: column-reverse;

    .obQuoteArea__price {
      color: #ff5b5a;
    }
  }

  & .obQuoteArea__order {
    padding: 2px;
    display: flex;
    background-color: transparent;

    &.obQuoteArea__order--change {
      transition: background-color 1s linear;
      background-color: ${({ $orderType }) =>
        $orderType === "asks"
          ? "rgba(255, 91, 90, 0.5)"
          : "rgba(0, 177, 93, 0.5)"};
    }

    & .obQuoteArea__group {
      display: flex;
      justify-content: space-between;
      padding: 0 0 0 0.3rem;

      & .obQuoteArea__size {
      }
    }

    & .obQuoteArea__total {
      justify-content: flex-end;
      position: relative;
    }
  }

  & .obQuoteArea__order > * {
    display: flex;
    flex-basis: 50%;
    padding: 0 0.3rem;
  }
`;

const ObQuoteArea = ({ orders, type, orderType }) => {

  return (
    <QbQuoteArea
      $orderType={type}
      className={
        type === "asks"
          ? "obQuoteArea obQuoteArea---ask"
          : "obQuoteArea obQuoteArea---bid"
      }
    >
      {orders.map((order, i) => {
        const price = formatPrice(Number(order[0]));
        const size = formatNumber(Number(order[1]));
        const totalSize = formatNumber(order[2]);
        const depth = order[3];
        const requestStatus = order[4];

        return (
          <div
            className={`obQuoteArea__order ${
              requestStatus ? "obQuoteArea__order--change" : ""
            }`}
            key={i}
          >
            <div className="obQuoteArea__group">
              <div className="obQuoteArea__price">{price}</div>
              <div className="obQuoteArea__size">{size}</div>
            </div>
            <div className="obQuoteArea__total">
              {totalSize}
              <DepthVisualizer depth={depth} orderType={orderType} />
            </div>
          </div>
        );
      })}
    </QbQuoteArea>
  );
};
export default ObQuoteArea;
