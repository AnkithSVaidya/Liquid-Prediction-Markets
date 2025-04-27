import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { markets as initialMarkets, priceHistoryData as initialPriceHistory } from './mockData';
import { connectToPolkadot, getConnectionStatus, getSmartContractDetails } from './services/polkadotConnection';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Register Chart.js components
Chart.register(...registerables);

// Contract simulation functions
const createMarket = async (question, resolutionDate, initialLiquidity) => {
  // Simulate contract call delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Return simulated transaction hash
  return {
    success: true,
    transactionHash: "0x" + Math.random().toString(16).substr(2, 40),
    marketId: Math.floor(Math.random() * 1000) + 3
  };
};

const buyPosition = async (marketId, positionType, amount) => {
  // Simulate contract call delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Return simulated transaction
  return {
    success: true,
    transactionHash: "0x" + Math.random().toString(16).substr(2, 40),
    tokens: amount
  };
};

// Add sell position function
const sellPosition = async (marketId, positionType, amount) => {
  // Simulate contract call delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Return simulated transaction
  return {
    success: true,
    transactionHash: "0x" + Math.random().toString(16).substr(2, 40),
    tokens: amount
  };
};

// Function to simulate price changes
// IMPORTANT: Modified to use current state instead of initializing from mockData
const startLiveUpdates = (currentMarkets, currentPriceHistory, setMarkets, setPriceHistory) => {
  // Update every 5 seconds
  const interval = setInterval(() => {
    // Update markets using current state passed as parameters
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
    
    // Check if there are markets before updating price history
    if (updatedMarkets.length > 0) {
      // Update price history chart using first market
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
      
      setPriceHistory(newPriceHistory);
    }
    
    setMarkets(updatedMarkets);
  }, 5000);
  
  return interval;
};

// Helper function to calculate time left
const getTimeLeft = (dateString) => {
  const targetDate = new Date(dateString);
  const now = new Date();
  const timeDiff = targetDate - now;
  const days = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  return `${days} days`;
};

function App() {
  const [markets, setMarkets] = useState(initialMarkets);
  const [priceHistory, setPriceHistory] = useState(initialPriceHistory);
  const [selectedMarket, setSelectedMarket] = useState(markets[0]);
  const [positionType, setPositionType] = useState('yes');
  const [amount, setAmount] = useState(100);
  
  // States for market creation
  const [isCreating, setIsCreating] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [newMarket, setNewMarket] = useState({
    question: '',
    resolutionDate: '',
    initialLiquidity: 100
  });
  const [transactionMessage, setTransactionMessage] = useState(null);
  
  // Add states for selling positions
  const [sellPositionType, setSellPositionType] = useState('yes');
  const [sellAmount, setSellAmount] = useState(0);
  const [isSelling, setIsSelling] = useState(false);
  
  // Polkadot connection states
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showContractInfo, setShowContractInfo] = useState(false);
  const [contractDetails, setContractDetails] = useState(null);
  
  // Update selectedMarket when markets change
  useEffect(() => {
    const updatedSelectedMarket = markets.find(m => m.id === selectedMarket.id);
    if (updatedSelectedMarket) {
      setSelectedMarket(updatedSelectedMarket);
    }
  }, [markets, selectedMarket.id]);
  
  // Start live updates
  useEffect(() => {
    const interval = startLiveUpdates(markets, priceHistory, setMarkets, setPriceHistory);
    return () => clearInterval(interval);
  }, [markets, priceHistory]); 
  
  // Simple calculation to show potential outcome
  const potentialReturn = positionType === 'yes' 
    ? amount * (100 / selectedMarket.yesPrice)
    : amount * (100 / selectedMarket.noPrice);
  
  // Handle market creation
  const handleCreateMarket = async () => {
    if (!newMarket.question || !newMarket.resolutionDate || !newMarket.initialLiquidity) {
      setTransactionMessage({
        type: 'danger',
        text: 'Please fill in all fields'
      });
      setTimeout(() => setTransactionMessage(null), 3000);
      return;
    }
    
    setIsCreating(true);
    try {
      const result = await createMarket(
        newMarket.question,
        newMarket.resolutionDate,
        newMarket.initialLiquidity
      );
      
      if (result.success) {
        // Add new market to the list
        const newMarketObj = {
          id: result.marketId,
          question: newMarket.question,
          yesPrice: 50,
          noPrice: 50,
          liquidity: `${newMarket.initialLiquidity} DOT`,
          volume: "0 DOT",
          timeLeft: getTimeLeft(newMarket.resolutionDate)
        };
        
        // Important: Update markets state with the new market
        const updatedMarkets = [...markets, newMarketObj];
        setMarkets(updatedMarkets);
        
        setTransactionMessage({
          type: 'success',
          text: `Market created! Transaction: ${result.transactionHash.substring(0, 10)}...`
        });
        
        // Reset form
        setNewMarket({
          question: '',
          resolutionDate: '',
          initialLiquidity: 100
        });
      }
    } catch (error) {
      setTransactionMessage({
        type: 'danger',
        text: `Error: ${error.message}`
      });
    } finally {
      setIsCreating(false);
      setTimeout(() => setTransactionMessage(null), 5000);
    }
  };
  
  // Handle position purchase
  const handleBuyPosition = async () => {
    if (amount <= 0) {
      setTransactionMessage({
        type: 'danger',
        text: 'Please enter a valid amount'
      });
      setTimeout(() => setTransactionMessage(null), 3000);
      return;
    }
    
    setIsBuying(true);
    try {
      const result = await buyPosition(
        selectedMarket.id,
        positionType === 'yes',
        amount
      );
      
      if (result.success) {
        setTransactionMessage({
          type: 'success',
          text: `Position acquired! Transaction: ${result.transactionHash.substring(0, 10)}...`
        });
      }
    } catch (error) {
      setTransactionMessage({
        type: 'danger',
        text: `Error: ${error.message}`
      });
    } finally {
      setIsBuying(false);
      setTimeout(() => setTransactionMessage(null), 5000);
    }
  };

  // Add handler function for selling positions
  const handleSellPosition = async () => {
    if (sellAmount <= 0) {
      setTransactionMessage({
        type: 'danger',
        text: 'Please enter a valid amount to sell'
      });
      setTimeout(() => setTransactionMessage(null), 3000);
      return;
    }
    
    setIsSelling(true);
    try {
      const result = await sellPosition(
        selectedMarket.id,
        sellPositionType === 'yes',
        sellAmount
      );
      
      if (result.success) {
        setTransactionMessage({
          type: 'success',
          text: `Position sold! Transaction: ${result.transactionHash.substring(0, 10)}...`
        });
      }
    } catch (error) {
      setTransactionMessage({
        type: 'danger',
        text: `Error: ${error.message}`
      });
    } finally {
      setIsSelling(false);
      setTimeout(() => setTransactionMessage(null), 5000);
    }
  };
  
  // Handle Polkadot connection
  const handleConnectPolkadot = async () => {
    setIsConnecting(true);
    try {
      const status = await connectToPolkadot();
      setConnectionStatus(status);
      // Also fetch contract details
      setContractDetails(getSmartContractDetails());
      setTransactionMessage({
        type: 'success',
        text: `Connected to ${status.chain} at block #${status.blockNumber}`
      });
      setShowContractInfo(true);
    } catch (error) {
      setTransactionMessage({
        type: 'danger',
        text: `Connection error: ${error.message}`
      });
    } finally {
      setIsConnecting(false);
      setTimeout(() => setTransactionMessage(null), 5000);
    }
  };
  
  return (
    <div className="container mt-4">
      <header className="text-center mb-3">
        <h1 className="display-4">Liquid Prediction Markets</h1>
        <p className="lead">Trade probabilities in real-time on Polkadot</p>
        
        {/* Polkadot Connection Button */}
        <div className="d-flex justify-content-center mt-3 mb-3">
          <button 
            className="btn btn-outline-primary"
            onClick={handleConnectPolkadot}
            disabled={isConnecting}
          >
            {isConnecting ? 'Connecting...' : 'Connect to Polkadot'}
          </button>
          {contractDetails && (
            <button 
              className="btn btn-outline-secondary ms-2"
              onClick={() => setShowContractInfo(!showContractInfo)}
            >
              {showContractInfo ? 'Hide' : 'Show'} Smart Contract Info
            </button>
          )}
        </div>
      </header>
      
      {/* Polkadot Connection Status */}
      {connectionStatus && (
        <div className="alert alert-info mb-4">
          <strong>Network:</strong> {connectionStatus.chain} | 
          <strong> Block:</strong> #{connectionStatus.blockNumber} | 
          <strong> Status:</strong> {connectionStatus.connected ? 'Connected' : 'Disconnected'}
        </div>
      )}
      
      {/* Smart Contract Details */}
      {showContractInfo && contractDetails && (
        <div className="card mb-4">
          <div className="card-header bg-dark text-white">
            <h5 className="mb-0">Smart Contract Details</h5>
          </div>
          <div className="card-body">
            <p><strong>Name:</strong> {contractDetails.name}</p>
            <p><strong>Address:</strong> {contractDetails.address}</p>
            <p><strong>Functions:</strong></p>
            <ul className="list-group">
              {contractDetails.functions.map((func, index) => (
                <li key={index} className="list-group-item">{func}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      
      {transactionMessage && (
        <div className={`alert alert-${transactionMessage.type} alert-dismissible fade show`} role="alert">
          {transactionMessage.text}
          <button type="button" className="btn-close" onClick={() => setTransactionMessage(null)}></button>
        </div>
      )}
      
      <div className="row mb-4">
        <div className="col-lg-8">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Live Price Chart: {selectedMarket.question}</h5>
            </div>
            <div className="card-body">
              <Line 
                data={priceHistory} 
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return `${context.dataset.label}: ${context.raw}%`;
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      min: 0,
                      max: 100,
                      ticks: {
                        callback: function(value) {
                          return value + '%';
                        }
                      },
                      title: {
                        display: true,
                        text: 'Probability'
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
        
        <div className="col-lg-4">
          <div className="card shadow-sm">
            <div className="card-header bg-dark text-white">
              <h5 className="mb-0">Trade Positions</h5>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Current YES Price:</span>
                <span className="badge bg-success fs-6">{selectedMarket.yesPrice}%</span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <span>Current NO Price:</span>
                <span className="badge bg-danger fs-6">{selectedMarket.noPrice}%</span>
              </div>
              
              <div className="progress mb-4" style={{height: '25px'}}>
                <div 
                  className="progress-bar bg-success" 
                  style={{width: `${selectedMarket.yesPrice}%`}}
                >
                  YES {selectedMarket.yesPrice}%
                </div>
                <div 
                  className="progress-bar bg-danger" 
                  style={{width: `${selectedMarket.noPrice}%`}}
                >
                  NO {selectedMarket.noPrice}%
                </div>
              </div>
              
              {/* Buy Position Form */}
              <form className="mt-3">
                <h6 className="mb-3">Buy Position</h6>
                <div className="mb-3">
                  <label className="form-label">Position Type</label>
                  <select 
                    className="form-select" 
                    value={positionType}
                    onChange={(e) => setPositionType(e.target.value)}
                  >
                    <option value="yes">YES</option>
                    <option value="no">NO</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Amount (DOT)</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                  />
                </div>
                
                <div className="alert alert-info">
                  If outcome is correct: <strong>{potentialReturn.toFixed(2)} DOT</strong>
                </div>
                
                <button 
                  type="button" 
                  className="btn btn-primary w-100"
                  onClick={handleBuyPosition}
                  disabled={isBuying}
                >
                  {isBuying ? 'Processing...' : 'Buy Position'}
                </button>
              </form>
              
              {/* Sell Position Form - NEW SECTION */}
              <div className="mt-4 pt-3 border-top">
                <h6 className="mb-3">Sell Position</h6>
                <form>
                  <div className="mb-3">
                    <label className="form-label">Position Type</label>
                    <select 
                      className="form-select" 
                      value={sellPositionType}
                      onChange={(e) => setSellPositionType(e.target.value)}
                    >
                      <option value="yes">YES</option>
                      <option value="no">NO</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Amount to Sell (DOT)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      value={sellAmount}
                      onChange={(e) => setSellAmount(Number(e.target.value))}
                    />
                  </div>
                  
                  <button 
                    type="button" 
                    className="btn btn-warning w-100"
                    onClick={handleSellPosition}
                    disabled={isSelling}
                  >
                    {isSelling ? 'Processing...' : 'Sell Position'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="row">
        <div className="col-12">
          <h3 className="mb-3">Available Markets</h3>
          <div className="list-group shadow-sm">
            {markets.map(market => (
              <button
                key={market.id}
                className={`list-group-item list-group-item-action ${selectedMarket.id === market.id ? 'active' : ''}`}
                onClick={() => setSelectedMarket(market)}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-1">{market.question}</h5>
                  <span className="badge rounded-pill bg-primary">{market.timeLeft} left</span>
                </div>
                <div className="progress my-2" style={{height: '20px'}}>
                  <div 
                    className="progress-bar bg-success" 
                    style={{width: `${market.yesPrice}%`}}
                  >
                    YES {market.yesPrice}%
                  </div>
                  <div 
                    className="progress-bar bg-danger" 
                    style={{width: `${market.noPrice}%`}}
                  >
                    NO {market.noPrice}%
                  </div>
                </div>
                <div className="d-flex justify-content-between text-muted">
                  <small>Liquidity: {market.liquidity}</small>
                  <small>Volume: {market.volume}</small>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="row mt-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">Create New Market</h5>
            </div>
            <div className="card-body">
              <form>
                <div className="mb-3">
                  <label className="form-label">Question</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Will X happen by date Y?" 
                    value={newMarket.question}
                    onChange={(e) => setNewMarket({...newMarket, question: e.target.value})}
                  />
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Resolution Date</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={newMarket.resolutionDate}
                      onChange={(e) => setNewMarket({...newMarket, resolutionDate: e.target.value})}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Initial Liquidity (DOT)</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      placeholder="Minimum 100 DOT" 
                      value={newMarket.initialLiquidity}
                      onChange={(e) => setNewMarket({...newMarket, initialLiquidity: Number(e.target.value)})}
                    />
                  </div>
                </div>
                <button 
                  type="button" 
                  className="btn btn-success"
                  onClick={handleCreateMarket}
                  disabled={isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create Market'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="mt-5 mb-3 text-center text-muted">
        <p>Liquid Prediction Markets | Built on Polkadot Asset Hub</p>
        <p>Harvard Blockchain Hackathon 2025</p>
      </footer>
    </div>
  );
}

export default App;