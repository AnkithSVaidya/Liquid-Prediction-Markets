#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod prediction_market {
    use ink::prelude::string::String;
    use ink::prelude::vec::Vec;
    use ink::storage::Mapping;

    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        MarketNotFound,
        NotAuthorized,
        InsufficientFunds,
        MarketAlreadyResolved,
        ZeroAmount,
        TransferFailed,
    }

    /// Main contract storage struct
    #[ink(storage)]
    pub struct PredictionMarket {
        // Market data: id -> Market
        markets: Mapping<u32, Market>,
        // User positions: (market_id, account) -> Position
        positions: Mapping<(u32, AccountId), Position>,
        // Market count for ID generation
        market_count: u32,
        // Contract owner
        owner: AccountId,
        // All market IDs for iteration
        market_ids: Vec<u32>,
    }

    /// Market data structure
    #[derive(scale::Encode, scale::Decode, Clone, Debug)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct Market {
        id: u32,
        question: String,
        creator: AccountId,
        yes_price: u32,          // Represented as percentage * 100 (e.g., 5000 = 50%)
        no_price: u32,           // Represented as percentage * 100 (e.g., 5000 = 50%)
        yes_pool: Balance,       // Total YES liquidity
        no_pool: Balance,        // Total NO liquidity
        resolved: bool,
        outcome: Option<bool>,
        creation_time: Timestamp,
        resolution_time: Option<Timestamp>,
    }

    /// Position data structure
    #[derive(scale::Encode, scale::Decode, Clone, Default, Debug)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct Position {
        yes_amount: Balance,
        no_amount: Balance,
        claimed: bool,
    }

    /// Market summary struct for easier frontend integration
    #[derive(scale::Encode, scale::Decode, Clone, Debug)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct MarketSummary {
        id: u32,
        question: String,
        yes_price: u32,
        no_price: u32,
        total_liquidity: Balance,
        resolved: bool,
        outcome: Option<bool>,
    }

    /// Events
    #[ink(event)]
    pub struct MarketCreated {
        #[ink(topic)]
        id: u32,
        #[ink(topic)]
        creator: AccountId,
        question: String,
    }

    #[ink(event)]
    pub struct PositionBought {
        #[ink(topic)]
        market_id: u32,
        #[ink(topic)]
        buyer: AccountId,
        is_yes: bool,
        amount: Balance,
    }

    #[ink(event)]
    pub struct MarketResolved {
        #[ink(topic)]
        market_id: u32,
        outcome: bool,
        #[ink(topic)]
        resolver: AccountId,
    }

    #[ink(event)]
    pub struct WinningsClaimed {
        #[ink(topic)]
        market_id: u32,
        #[ink(topic)]
        claimer: AccountId,
        amount: Balance,
    }

    impl PredictionMarket {
        /// Constructor initializes empty contract
        #[ink(constructor)]
        pub fn new() -> Self {
            Self {
                markets: Mapping::default(),
                positions: Mapping::default(),
                market_count: 0,
                owner: Self::env().caller(),
                market_ids: Vec::new(),
            }
        }

        /// Creates a new prediction market
        #[ink(message)]
        pub fn create_market(&mut self, question: String) -> Result<u32, Error> {
            let creator = self.env().caller();
            let now = self.env().block_timestamp();
            let id = self.market_count + 1;
            
            // Initialize with 50/50 odds
            let market = Market {
                id,
                question,
                creator,
                yes_price: 5000, // 50%
                no_price: 5000,  // 50%
                yes_pool: 0,
                no_pool: 0,
                resolved: false,
                outcome: None,
                creation_time: now,
                resolution_time: None,
            };
            
            // Store market
            self.markets.insert(id, &market);
            self.market_count = id;
            self.market_ids.push(id);
            
            // Emit event
            self.env().emit_event(MarketCreated {
                id,
                creator,
                question: market.question.clone(),
            });
            
            Ok(id)
        }

        /// Buy a YES or NO position in a market
        #[ink(message, payable)]
        pub fn buy_position(&mut self, market_id: u32, is_yes: bool) -> Result<(), Error> {
            let caller = self.env().caller();
            let amount = self.env().transferred_value();
            
            if amount == 0 {
                return Err(Error::ZeroAmount);
            }
            
            // Get market
            let mut market = self.markets.get(market_id).ok_or(Error::MarketNotFound)?;
            if market.resolved {
                return Err(Error::MarketAlreadyResolved);
            }
            
            // Get or create position
            let mut position = self.positions.get((market_id, caller)).unwrap_or_default();
            
            // Update position
            if is_yes {
                position.yes_amount += amount;
                market.yes_pool += amount;
            } else {
                position.no_amount += amount;
                market.no_pool += amount;
            }
            
            // Calculate new prices based on liquidity pools
            // Using a simplified Automated Market Maker formula
            let total_liquidity = market.yes_pool + market.no_pool;
            if total_liquidity > 0 {
                // Calculate probabilities based on pool ratios (constant product AMM)
                market.yes_price = ((market.yes_pool * 10000) / total_liquidity) as u32;
                market.no_price = 10000 - market.yes_price;
            }
            
            // Store updated data
            self.markets.insert(market_id, &market);
            self.positions.insert((market_id, caller), &position);
            
            // Emit event
            self.env().emit_event(PositionBought {
                market_id,
                buyer: caller,
                is_yes,
                amount,
            });
            
            Ok(())
        }

        /// Resolve a market with final outcome
        #[ink(message)]
        pub fn resolve_market(&mut self, market_id: u32, outcome: bool) -> Result<(), Error> {
            let caller = self.env().caller();
            let now = self.env().block_timestamp();
            
            // Get market
            let mut market = self.markets.get(market_id).ok_or(Error::MarketNotFound)?;
            
            // Check authorization
            if market.creator != caller && self.owner != caller {
                return Err(Error::NotAuthorized);
            }
            
            if market.resolved {
                return Err(Error::MarketAlreadyResolved);
            }
            
            // Set outcome
            market.resolved = true;
            market.outcome = Some(outcome);
            market.resolution_time = Some(now);
            
            self.markets.insert(market_id, &market);
            
            // Emit event
            self.env().emit_event(MarketResolved {
                market_id,
                outcome,
                resolver: caller,
            });
            
            Ok(())
        }
        
        /// Claim winnings from a resolved market
        #[ink(message)]
        pub fn claim_winnings(&mut self, market_id: u32) -> Result<Balance, Error> {
            let caller = self.env().caller();
            
            // Get market
            let market = self.markets.get(market_id).ok_or(Error::MarketNotFound)?;
            
            // Check if market is resolved
            if !market.resolved {
                return Err(Error::MarketNotFound);
            }
            
            let outcome = market.outcome.ok_or(Error::MarketNotFound)?;
            
            // Get position
            let mut position = self.positions.get((market_id, caller)).unwrap_or_default();
            
            // Check if already claimed
            if position.claimed {
                return Ok(0);
            }
            
            // Calculate winnings
            let winnings = if outcome {
                position.yes_amount
            } else {
                position.no_amount
            };
            
            if winnings == 0 {
                return Ok(0);
            }
            
            // Mark position as claimed
            position.claimed = true;
            self.positions.insert((market_id, caller), &position);
            
            // Transfer winnings
            if self.env().transfer(caller, winnings).is_err() {
                return Err(Error::TransferFailed);
            }
            
            // Emit event
            self.env().emit_event(WinningsClaimed {
                market_id,
                claimer: caller,
                amount: winnings,
            });
            
            Ok(winnings)
        }

        /// Get market data
        #[ink(message)]
        pub fn get_market(&self, market_id: u32) -> Option<Market> {
            self.markets.get(market_id)
        }

        /// Get user position
        #[ink(message)]
        pub fn get_position(&self, market_id: u32, user: AccountId) -> Position {
            self.positions.get((market_id, user)).unwrap_or_default()
        }

        /// Get market count
        #[ink(message)]
        pub fn get_market_count(&self) -> u32 {
            self.market_count
        }
        
        /// Get all market IDs
        #[ink(message)]
        pub fn get_all_market_ids(&self) -> Vec<u32> {
            self.market_ids.clone()
        }
        
        /// Get market summaries (paginated)
        #[ink(message)]
        pub fn get_market_summaries(&self, start: u32, limit: u32) -> Vec<MarketSummary> {
            let mut result = Vec::new();
            let end = (start + limit).min(self.market_ids.len() as u32);
            
            for i in start..end {
                if let Some(id) = self.market_ids.get(i as usize) {
                    if let Some(market) = self.markets.get(*id) {
                        result.push(MarketSummary {
                            id: market.id,
                            question: market.question,
                            yes_price: market.yes_price,
                            no_price: market.no_price,
                            total_liquidity: market.yes_pool + market.no_pool,
                            resolved: market.resolved,
                            outcome: market.outcome,
                        });
                    }
                }
            }
            
            result
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;
        use ink::env::{test, DefaultEnvironment};

        #[ink::test]
        fn create_market_works() {
            let mut market = PredictionMarket::new();
            let result = market.create_market("Will ETH price exceed $5,000 by June 2025?".into());
            assert!(result.is_ok());
            assert_eq!(result.unwrap(), 1);
            assert_eq!(market.get_market_count(), 1);
        }

        #[ink::test]
        fn buy_position_works() {
            let accounts = test::default_accounts::<DefaultEnvironment>();
            let mut market = PredictionMarket::new();
            
            // Create market
            let market_id = market.create_market("Test market".into()).unwrap();
            
            // Buy YES position
            test::set_caller::<DefaultEnvironment>(accounts.alice);
            test::set_value_transferred::<DefaultEnvironment>(100);
            let result = market.buy_position(market_id, true);
            assert!(result.is_ok());
            
            // Check position
            let position = market.get_position(market_id, accounts.alice);
            assert_eq!(position.yes_amount, 100);
            assert_eq!(position.no_amount, 0);
            
            // Check market data
            let market_data = market.get_market(market_id).unwrap();
            assert_eq!(market_data.yes_pool, 100);
            assert_eq!(market_data.no_pool, 0);
            assert_eq!(market_data.yes_price, 10000); // 100% since only YES pool has liquidity
        }

        #[ink::test]
        fn resolve_market_works() {
            let accounts = test::default_accounts::<DefaultEnvironment>();
            let mut market = PredictionMarket::new();
            
            // Create market
            let market_id = market.create_market("Test market".into()).unwrap();
            
            // Resolve market
            let result = market.resolve_market(market_id, true);
            assert!(result.is_ok());
            
            // Check market state
            let market_data = market.get_market(market_id).unwrap();
            assert!(market_data.resolved);
            assert_eq!(market_data.outcome, Some(true));
        }
        
        #[ink::test]
        fn claim_winnings_works() {
            let accounts = test::default_accounts::<DefaultEnvironment>();
            let mut market = PredictionMarket::new();
            
            // Create market
            let market_id = market.create_market("Test market".into()).unwrap();
            
            // Buy YES position
            test::set_caller::<DefaultEnvironment>(accounts.alice);
            test::set_value_transferred::<DefaultEnvironment>(100);
            market.buy_position(market_id, true).unwrap();
            
            // Buy NO position from another account
            test::set_caller::<DefaultEnvironment>(accounts.bob);
            test::set_value_transferred::<DefaultEnvironment>(100);
            market.buy_position(market_id, false).unwrap();
            
            // Resolve market as YES
            test::set_caller::<DefaultEnvironment>(accounts.eve); // Contract owner
            market.resolve_market(market_id, true).unwrap();
            
            // Claim winnings
            test::set_caller::<DefaultEnvironment>(accounts.alice);
            let winnings = market.claim_winnings(market_id).unwrap();
            assert_eq!(winnings, 100);
            
            // Bob should get nothing since YES won
            test::set_caller::<DefaultEnvironment>(accounts.bob);
            let winnings = market.claim_winnings(market_id).unwrap();
            assert_eq!(winnings, 0);
        }
        
        #[ink::test]
        fn market_summaries_work() {
            let mut market = PredictionMarket::new();
            
            // Create multiple markets
            market.create_market("Market 1".into()).unwrap();
            market.create_market("Market 2".into()).unwrap();
            market.create_market("Market 3".into()).unwrap();
            
            // Get summaries
            let summaries = market.get_market_summaries(0, 10);
            assert_eq!(summaries.len(), 3);
            assert_eq!(summaries[0].question, "Market 1");
            assert_eq!(summaries[1].question, "Market 2");
            assert_eq!(summaries[2].question, "Market 3");
            
            // Test pagination
            let summaries = market.get_market_summaries(1, 1);
            assert_eq!(summaries.len(), 1);
            assert_eq!(summaries[0].question, "Market 2");
        }
    }
}