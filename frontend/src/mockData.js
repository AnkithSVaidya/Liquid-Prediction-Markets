export const markets = [
    {
      id: 1,
      question: "Will ETH price exceed $5,000 by June 2025?",
      yesPrice: 62,
      noPrice: 38,
      liquidity: "45,000 DOT",
      volume: "12,500 DOT",
      timeLeft: "23 days"
    },
    {
      id: 2,
      question: "Will the US Federal Reserve cut rates in July 2025?",
      yesPrice: 78,
      noPrice: 22,
      liquidity: "87,000 DOT",
      volume: "32,100 DOT",
      timeLeft: "45 days"
    }
  ];
  
  export const priceHistoryData = {
    labels: ['April 1', 'April 5', 'April 10', 'April 15', 'April 20', 'Today'],
    datasets: [
      {
        label: 'YES Price (%)',
        data: [50, 53, 58, 55, 60, 62],
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
        fill: true
      },
      {
        label: 'NO Price (%)',
        data: [50, 47, 42, 45, 40, 38],
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1,
        fill: true
      }
    ]
  };