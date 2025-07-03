import AsyncStorage from '@react-native-async-storage/async-storage';

const API_KEY = process.env.EXPO_PUBLIC_ALPHA_VANTAGE_API_KEY;
const BASE_URL = 'https://www.alphavantage.co/query';

interface CacheEntry {
  data: any;
  timestamp: number;
}

class AlphaVantageAPI {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; 
  private readonly RATE_LIMIT_DELAY = 12000; 
  private lastRequestTime = 0;

  private get isValidApiKey(): boolean {
    return !!API_KEY && 
           API_KEY !== 'demo' && 
           API_KEY !== 'YOUR_ALPHA_VANTAGE_API_KEY' && 
           API_KEY.length > 10;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async makeRequest(params: Record<string, string>): Promise<any> {
    const cacheKey = JSON.stringify(params);
    
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    if (!this.isValidApiKey) {  
      console.warn('No valid Alpha Vantage API key found. Using mock data. Please set EXPO_PUBLIC_ALPHA_VANTAGE_API_KEY in your .env file.');
      return this.getMockDataForSymbol(params.symbol || 'AAPL');
    }

    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
      await this.delay(this.RATE_LIMIT_DELAY - timeSinceLastRequest);
    }

    const queryParams = new URLSearchParams({
      ...params,
      apikey: API_KEY!,
    });

    try {
      const response = await fetch(`${BASE_URL}?${queryParams}`);
      const data = await response.json();

      if (data['Error Message']) {
        console.error('Alpha Vantage API Error:', data['Error Message']);
        throw new Error(data['Error Message']);
      }

      if (data['Note']) {
        console.warn('API rate limit exceeded. Using mock data.');
        return this.getMockDataForSymbol(params.symbol || 'AAPL');
      }

      if (data['Information']) {
        console.warn('API call frequency limit reached. Using mock data.');
        return this.getMockDataForSymbol(params.symbol || 'AAPL');
      }

      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });

      this.lastRequestTime = Date.now();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      console.warn('Falling back to mock data due to API error');
      return this.getMockDataForSymbol(params.symbol || 'AAPL');
    }
  }


  private getMockDataForSymbol(symbol: string): any {
    const mockQuotes: Record<string, any> = {
      'AAPL': {
        'Global Quote': {
          '01. symbol': 'AAPL',
          '02. open': '150.00',
          '03. high': '155.25',
          '04. low': '148.50',
          '05. price': '152.75',
          '06. volume': '45632100',
          '07. latest trading day': '2024-01-15',
          '08. previous close': '149.50',
          '09. change': '3.25',
          '10. change percent': '2.17%'
        }
      },
      'GOOGL': {
        'Global Quote': {
          '01. symbol': 'GOOGL',
          '02. open': '2700.00',
          '03. high': '2780.50',
          '04. low': '2695.25',
          '05. price': '2750.80',
          '06. volume': '1234567',
          '07. latest trading day': '2024-01-15',
          '08. previous close': '2625.50',
          '09. change': '125.30',
          '10. change percent': '4.77%'
        }
      },
      'MSFT': {
        'Global Quote': {
          '01. symbol': 'MSFT',
          '02. open': '300.00',
          '03. high': '308.75',
          '04. low': '298.50',
          '05. price': '305.90',
          '06. volume': '2345678',
          '07. latest trading day': '2024-01-15',
          '08. previous close': '293.45',
          '09. change': '12.45',
          '10. change percent': '4.24%'
        }
      },
      'TSLA': {
        'Global Quote': {
          '01. symbol': 'TSLA',
          '02. open': '860.00',
          '03. high': '895.50',
          '04. low': '855.25',
          '05. price': '892.15',
          '06. volume': '8765432',
          '07. latest trading day': '2024-01-15',
          '08. previous close': '857.95',
          '09. change': '34.20',
          '10. change percent': '3.99%'
        }
      },
      'AMZN': {
        'Global Quote': {
          '01. symbol': 'AMZN',
          '02. open': '3200.00',
          '03. high': '3260.75',
          '04. low': '3185.50',
          '05. price': '3245.67',
          '06. volume': '1876543',
          '07. latest trading day': '2024-01-15',
          '08. previous close': '3156.55',
          '09. change': '89.12',
          '10. change percent': '2.82%'
        }
      },
      'NVDA': {
        'Global Quote': {
          '01. symbol': 'NVDA',
          '02. open': '240.00',
          '03. high': '248.90',
          '04. low': '238.75',
          '05. price': '245.80',
          '06. volume': '5432109',
          '07. latest trading day': '2024-01-15',
          '08. previous close': '236.90',
          '09. change': '8.90',
          '10. change percent': '3.76%'
        }
      },
      'META': {
        'Global Quote': {
          '01. symbol': 'META',
          '02. open': '340.00',
          '03. high': '342.50',
          '04. low': '320.25',
          '05. price': '325.40',
          '06. volume': '3456789',
          '07. latest trading day': '2024-01-15',
          '08. previous close': '341.00',
          '09. change': '-15.60',
          '10. change percent': '-4.57%'
        }
      },
      'NFLX': {
        'Global Quote': {
          '01. symbol': 'NFLX',
          '02. open': '395.00',
          '03. high': '398.75',
          '04. low': '380.50',
          '05. price': '385.20',
          '06. volume': '2109876',
          '07. latest trading day': '2024-01-15',
          '08. previous close': '397.50',
          '09. change': '-12.30',
          '10. change percent': '-3.10%'
        }
      }
    };

    return mockQuotes[symbol] || mockQuotes['AAPL'];
  }

  async getTopGainersLosers(): Promise<any> {
    if (this.isValidApiKey) {
    }
    return this.getMockTopGainersLosers();
  }

  private getMockTopGainersLosers(): any {
    return {
      top_gainers: [
        {
          ticker: 'AAPL',
          price: '152.75',
          change_amount: '3.25',
          change_percentage: '2.17%',
          volume: '45632100'
        },
        {
          ticker: 'GOOGL',
          price: '2750.80',
          change_amount: '125.30',
          change_percentage: '4.77%',
          volume: '1234567'
        },
        {
          ticker: 'MSFT',
          price: '305.90',
          change_amount: '12.45',
          change_percentage: '4.24%',
          volume: '2345678'
        },
        {
          ticker: 'TSLA',
          price: '892.15',
          change_amount: '34.20',
          change_percentage: '3.99%',
          volume: '8765432'
        },
        {
          ticker: 'AMZN',
          price: '3245.67',
          change_amount: '89.12',
          change_percentage: '2.82%',
          volume: '1876543'
        },
        {
          ticker: 'NVDA',
          price: '245.80',
          change_amount: '8.90',
          change_percentage: '3.76%',
          volume: '5432109'
        }
      ],
      top_losers: [
        {
          ticker: 'META',
          price: '325.40',
          change_amount: '-15.60',
          change_percentage: '-4.57%',
          volume: '3456789'
        },
        {
          ticker: 'NFLX',
          price: '385.20',
          change_amount: '-12.30',
          change_percentage: '-3.10%',
          volume: '2109876'
        },
        {
          ticker: 'PYPL',
          price: '98.75',
          change_amount: '-4.25',
          change_percentage: '-4.13%',
          volume: '6543210'
        },
        {
          ticker: 'SNAP',
          price: '45.80',
          change_amount: '-2.10',
          change_percentage: '-4.39%',
          volume: '7654321'
        },
        {
          ticker: 'UBER',
          price: '52.30',
          change_amount: '-1.85',
          change_percentage: '-3.42%',
          volume: '4321098'
        },
        {
          ticker: 'LYFT',
          price: '28.90',
          change_amount: '-1.20',
          change_percentage: '-3.98%',
          volume: '3210987'
        }
      ]
    };
  }

  async getQuote(symbol: string): Promise<any> {
    const response = await this.makeRequest({
      function: 'GLOBAL_QUOTE',
      symbol: symbol,
    });
    
    return response['Global Quote'] || response;
  }

  async getIntradayData(symbol: string, interval: string = '5min'): Promise<any> {
    if (!this.isValidApiKey) {
      console.warn('Using mock intraday data (no valid API key)');
      return this.getMockIntradayData(symbol);
    }

    try {
      const response = await this.makeRequest({
        function: 'TIME_SERIES_INTRADAY',
        symbol: symbol,
        interval: interval,
        outputsize: 'compact'
      });

      if (response[`Time Series (${interval})`]) {
        return response;
      } else {
        console.warn('No intraday data received, using mock data');
        return this.getMockIntradayData(symbol);
      }
    } catch (error) {
      console.error('Failed to fetch intraday data:', error);
      return this.getMockIntradayData(symbol);
    }
  }

  private getMockIntradayData(symbol: string): any {
    const mockIntradayData = {
      'Meta Data': {
        '1. Information': 'Intraday (5min) open, high, low, close prices and volume',
        '2. Symbol': symbol,
        '3. Last Refreshed': new Date().toISOString().slice(0, 19).replace('T', ' '),
        '4. Interval': '5min',
        '5. Output Size': 'Compact',
        '6. Time Zone': 'US/Eastern'
      },
      'Time Series (5min)': this.generateMockIntradayData()
    };

    return mockIntradayData;
  }

  private generateMockIntradayData(): Record<string, any> {
    const data: Record<string, any> = {};
    const basePrice = 150;
    const now = new Date();
    
    for (let i = 0; i < 50; i++) {
      const time = new Date(now.getTime() - (i * 5 * 60 * 1000));
      const timeString = time.toISOString().slice(0, 19).replace('T', ' ');
      
      const variation = (Math.random() - 0.5) * 10;
      const price = basePrice + variation;
      const open = price + (Math.random() - 0.5) * 2;
      const high = Math.max(open, price) + Math.random() * 2;
      const low = Math.min(open, price) - Math.random() * 2;
      const volume = Math.floor(Math.random() * 1000000) + 100000;
      
      data[timeString] = {
        '1. open': open.toFixed(2),
        '2. high': high.toFixed(2),
        '3. low': low.toFixed(2),
        '4. close': price.toFixed(2),
        '5. volume': volume.toString()
      };
    }
    
    return data;
  }

  async searchSymbol(keywords: string): Promise<any> {
    if (!this.isValidApiKey) {
      console.warn('Using mock search results (no valid API key)');
      return this.getMockSearchResults(keywords);
    }

    try {
      const response = await this.makeRequest({
        function: 'SYMBOL_SEARCH',
        keywords: keywords
      });

      if (response['bestMatches']) {
        return response;
      } else {
        return this.getMockSearchResults(keywords);
      }
    } catch (error) {
      console.error('Search failed:', error);
      return this.getMockSearchResults(keywords);
    }
  }

  private getMockSearchResults(keywords: string): any {
    return {
      'bestMatches': [
        {
          '1. symbol': keywords.toUpperCase(),
          '2. name': `${keywords.toUpperCase()} Inc.`,
          '3. type': 'Equity',
          '4. region': 'United States',
          '5. marketOpen': '09:30',
          '6. marketClose': '16:00',
          '7. timezone': 'UTC-04',
          '8. currency': 'USD',
          '9. matchScore': '1.0000'
        }
      ]
    };
  }
}

export const alphaVantageAPI = new AlphaVantageAPI();