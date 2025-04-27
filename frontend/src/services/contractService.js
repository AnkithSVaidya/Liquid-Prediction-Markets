import { BN } from '@polkadot/util';
import { connectApi, getContract } from './polkadotConnection';

// Contract address - will be set after deployment
let contractAddress = '';
let isLocal = true;

export const setContractSettings = (address, local = true) => {
  contractAddress = address;
  isLocal = local;
};

// Helper for gas estimation
const estimateGas = async (api, contract, message, account, ...params) => {
  const options = { storageDepositLimit: null };
  
  // Estimate gas
  const { gasRequired } = await contract.query[message](
    account.address,
    options,
    ...params
  );
  
  // Add some buffer
  const gasLimit = api.registry.createType('WeightV2', {
    refTime: gasRequired.refTime.mul(new BN(1.2)),
    proofSize: gasRequired.proofSize.mul(new BN(1.2)),
  });
  
  return { gasLimit, storageDepositLimit: options.storageDepositLimit };
};

// Create a market
export const createMarket = async (account, question) => {
  try {
    const api = await connectApi(isLocal);
    const contract = getContract(api, contractAddress);
    
    // Estimate gas
    const { gasLimit, storageDepositLimit } = await estimateGas(
      api, contract, 'createMarket', account, question
    );
    
    // Send transaction
    return new Promise((resolve, reject) => {
      contract.tx
        .createMarket({ gasLimit, storageDepositLimit }, question)
        .signAndSend(account.address, { signer: account.signer }, (result) => {
          if (result.status.isInBlock || result.status.isFinalized) {
            // Parse events to get market ID
            const event = result.events.find(
              event => event.event.method === 'MarketCreated'
            );
            
            if (event) {
              const [marketId] = event.event.data;
              resolve({
                success: true,
                marketId: marketId.toNumber(),
                transactionHash: result.txHash.toHex()
              });
            } else {
              resolve({
                success: true,
                transactionHash: result.txHash.toHex()
              });
            }
          }
          
          if (result.isError) {
            reject(new Error('Transaction failed'));
          }
        })
        .catch(error => {
          reject(error);
        });
    });
  } catch (error) {
    console.error('Failed to create market:', error);
    throw error;
  }
};

// Buy position
export const buyPosition = async (account, marketId, isYes, amount) => {
  try {
    const api = await connectApi(isLocal);
    const contract = getContract(api, contractAddress);
    
    // Estimate gas
    const { gasLimit, storageDepositLimit } = await estimateGas(
      api, contract, 'buyPosition', account, marketId, isYes
    );
    
    // Convert amount to proper format
    const value = api.createType('Balance', amount);
    
    // Send transaction
    return new Promise((resolve, reject) => {
      contract.tx
        .buyPosition({ gasLimit, storageDepositLimit, value }, marketId, isYes)
        .signAndSend(account.address, { signer: account.signer }, (result) => {
          if (result.status.isInBlock || result.status.isFinalized) {
            resolve({
              success: true,
              transactionHash: result.txHash.toHex()
            });
          }
          
          if (result.isError) {
            reject(new Error('Transaction failed'));
          }
        })
        .catch(error => {
          reject(error);
        });
    });
  } catch (error) {
    console.error('Failed to buy position:', error);
    throw error;
  }
};

// Get market data
export const getMarket = async (marketId) => {
  try {
    const api = await connectApi(isLocal);
    const contract = getContract(api, contractAddress);
    
    const { result, output } = await contract.query.getMarket(
      contractAddress,
      { gasLimit: null },
      marketId
    );
    
    if (result.isOk && output) {
      const market = output.toJSON();
      return {
        id: market.id,
        question: market.question,
        yesPrice: market.yes_price / 100, // Convert from percentage * 100
        noPrice: market.no_price / 100,
        resolved: market.resolved,
        outcome: market.outcome,
        liquidity: market.liquidity
      };
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get market:', error);
    throw error;
  }
};

// Get market count
export const getMarketCount = async () => {
  try {
    const api = await connectApi(isLocal);
    const contract = getContract(api, contractAddress);
    
    const { result, output } = await contract.query.getMarketCount(
      contractAddress,
      { gasLimit: null }
    );
    
    if (result.isOk && output) {
      return output.toNumber();
    }
    
    return 0;
  } catch (error) {
    console.error('Failed to get market count:', error);
    return 0;
  }
};

// For simulation mode when contract isn't deployed yet
export const simulateCreateMarket = async (question) => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  return {
    success: true,
    marketId: Math.floor(Math.random() * 1000) + 1,
    transactionHash: "0x" + Math.random().toString(16).substr(2, 40)
  };
};

export const simulateBuyPosition = async (marketId, isYes, amount) => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  return {
    success: true,
    transactionHash: "0x" + Math.random().toString(16).substr(2, 40)
  };
};