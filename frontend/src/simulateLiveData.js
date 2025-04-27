import { markets, priceHistoryData } from './mockData';

// Function to simulate price changes
export const startLiveUpdates = (currentMarkets, currentPriceHistory, setMarkets, setPriceHistory) => {
  // Update every 5 seconds
  const interval = setInterval(() => {
    // Update markets using the current state
    const updatedMarkets = currentMarkets.map(market => {
      // Random small change to yes price (between -2 and +2)
      const yesChange = Math.floor(Math.random() * 5) - 2;
      let newYesPrice = market.yesPrice + yesChange;
      
      // Ensure prices stay within bounds
      newYesPrice = Math.max(5, Math.min(95, newYesPrice));
      const newNoPrice = 100 - newYesPrice;
      
      return {
        ...market,
        yesPrice: newYesPrice,
        noPrice: newNoPrice
      };
    });
    
    // Update price history chart based on current state
    const newPriceHistory = {
      ...currentPriceHistory,
      labels: [...currentPriceHistory.labels.slice(1), 'Now'],
      datasets: [
        {
          ...currentPriceHistory.datasets[0],
          data: [...currentPriceHistory.datasets[0].data.slice(1), updatedMarkets[0].yesPrice]
        },
        {
          ...currentPriceHistory.datasets[1],
          data: [...currentPriceHistory.datasets[1].data.slice(1), updatedMarkets[0].noPrice]
        }
      ]
    };
    
    setMarkets(updatedMarkets);
    setPriceHistory(newPriceHistory);
  }, 5000);
  
  return interval;
};