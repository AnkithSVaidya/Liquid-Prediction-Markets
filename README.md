# Liquid-Prediction-Markets


# Demo Video Link

https://www.loom.com/share/d7d73c47d5424b08b8d1a9d60adc5ab0?sid=0ac430bb-2f10-49e2-8577-0d7e706bc371

# Short Summary 
Liquid Prediction Markets enables real-time trading of probability-based assets on Polkadot, allowing positions to be bought and sold before events resolve.

#Full Project Description
Traditional prediction markets suffer from critical limitations that prevent widespread adoption. Once a user makes a prediction, they are locked into their position until the event resolves - sometimes months or years later. This creates illiquid markets where capital is inefficiently allocated, prices don't accurately reflect real-time sentiment, and users have no way to exit positions as new information emerges. Additionally, most platforms only support binary yes/no outcomes, ignoring the nuanced probabilities of real-world events.

# Solution
Liquid Prediction Markets transforms predictions into tradable financial instruments with dynamic pricing. Our platform allows users to:

1. Create customizable prediction markets with any question
2. Buy YES/NO positions at prices reflecting current probability estimates
3. Crucially, SELL positions at any time before resolution, unlocking capital and enabling profit-taking when sentiments change
4. Visualize real-time probability curves showing market movements
5. Participate in a more efficient price discovery mechanism

This creates a new financial primitive for risk management and forecasting, with applications across finance, insurance, governance, and sports betting.


# How Polkadot Was Used

Our Liquid Prediction Markets implementation specifically leverages Polkadot Asset Hub in the following ways:

1. Smart Contract Deployment: We deployed our custom PredictionMarket smart contract to Polkadot Asset Hub Westend, utilizing the platform's Solidity compatibility layer

2. UI Integration: Our frontend directly connects to the Polkadot network via the "Connect to Polkadot" functionality, displaying real-time blockchain connection status and contract information 

3. Transaction Processing: The platform uses Polkadot's transaction infrastructure for market creation, position buying, and position selling, leveraging MetaMask integration for seamless signing

4. Testnet Validation: We utilized Asset Hub Westend testnet for development, allowing us to validate the entire workflow without spending real DOT while maintaining identical functionality

5. Contract State Storage: Our market data, user positions, and transaction history are all persisted on Polkadot's state storage, providing decentralized and immutable record-keeping

# Technical Description. 
1. React.js for the frontend interface and dynamic visualizations
2. Chart.js for real-time probability visualizations
3. Polkadot.js API for blockchain interaction
4. Remix IDE for smart contract development and deployment
5. MetaMask for wallet connectivity and transaction signing
6. Bootstrap for responsive UI components
7. Solidity for smart contract development



# Polkadot Features Utilized
Liquid Prediction Markets takes advantage of several unique Polkadot features:

1. Polkadot Asset Hub's EVM compatibility allowed us to deploy Solidity contracts while benefiting from Polkadot's security model
2. The platform leverages Polkadot's efficient consensus mechanism, which has significantly lower environmental impact than proof-of-work chains
3. The multi-chain architecture enables future expansion to specialized parachains for specific market categories
4. Westend testnet provided a realistic environment for development without spending real DOT
5. Asset Hub's ability to handle custom tokens will enable specialized market-specific tokens in future iterations

Images
![Welcome Dashboard](images/welcome_dashboard.png)

![Polkadot Connection Successful](images/successfulconnection_polkadot.png)

![Contract Deployed Successfully](images/successful_deployment.png)

![MetaMask Contract Deployment](images/metamask_contractdeployment.png)

![Newly Created Market](images/newlycreated_market.png)

![Simulated Markets](images/simulated_markets.png)

![Trade Positions](images/trade_positions.png)

![Execute Sell Order](images/trade_positionsell.png)

![Transaction Details](images/transaction_details.png)

![Polkadot Transaction Successful](images/successfultransaction_polkadot.png)

![Live Price Chart](images/live_pricechart.png)

# Block Explorer link for deployed smart contract 
https://blockscout-asset-hub.parity-chains-scw.parity.io/address/0x8a0077f4C27C2084aD4Ac3BD9eA1EB0fBcCf0AD8

# Presentation link
https://www.canva.com/design/DAGl1T_AmiM/ND507YpXNufRTVSGrZfq7w/edit?utm_content=DAGl1T_AmiM&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton


# Setup & Installation
# Prerequisites

Node.js (v16+)
npm or yarn
MetaMask browser extension


# Installation

Clone the repository
git clone https://github.com/your-username/liquid-prediction-markets.git
cd liquid-prediction-markets

Install dependencies
npm install



# Usage

Connect to Polkadot

Click "Connect to Polkadot" button
Approve the connection in MetaMask


Create a Market

Fill in the question, resolution date, and initial liquidity
Click "Create Market" and confirm the transaction in MetaMask


Buy a Position

Select a market from the list
Choose YES or NO position
Enter the amount in DOT
Click "Buy Position" and confirm the transaction


Sell a Position

Select a market where you have a position
Choose the position type (YES/NO)
Enter the amount to sell
Click "Sell Position" and confirm the transaction

Start the development server
npm start
The application will be available at http://localhost:3000


# I understand that certain clean code practices have not been followed while coding for this project.
# I am an solo coder coding this project due to the time constraints I was not able to follow the best clean coding practices.


