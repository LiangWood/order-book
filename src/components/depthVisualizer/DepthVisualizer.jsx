const DepthVisualizerColors = {
  BIDS: "rgba(16, 186, 104, 0.12)",
  ASKS: "rgba(255, 90, 90, 0.12)",
};

const DepthVisualizer = ({ depth, orderType }) => {
  return (
    <div
      data-testid="depth-visualizer"
      style={{
        backgroundColor: `${
          orderType === "bids"
            ? DepthVisualizerColors.BIDS
            : DepthVisualizerColors.ASKS
        }`,
        height: "1.250em",
        width: `${depth}%`,
        position: "absolute",
        top: 0,
        left: `${100 - depth}%`,
        zIndex: 1,
      }}
    />
  );
};
export default DepthVisualizer;
