// This simulates smart contract functions for demo purposes

export const createMarket = async (question, resolutionDate, initialLiquidity) => {
  // Simulate contract call delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Return simulated transaction hash
  return {
    success: true,
    transactionHash: "0x" + Math.random().toString(16).substr(2, 40),
    marketId: Math.floor(Math.random() * 1000) + 3
  };
};
  
export const buyPosition = async (marketId, positionType, amount) => {
  // Simulate contract call delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Return simulated transaction
  return {
    success: true,
    transactionHash: "0x" + Math.random().toString(16).substr(2, 40),
    tokens: positionType === 'yes' ? amount : amount
  };
};


// Add sell position function
export const sellPosition = async (marketId, isYes, amount) => {
  // Simulate contract call delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Return simulated transaction
  return {
    success: true,
    transactionHash: "0x" + Math.random().toString(16).substr(2, 40)
  };
};