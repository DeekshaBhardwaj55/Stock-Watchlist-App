import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useWatchlist } from '@/contexts/WatchlistContext';
import { alphaVantageAPI } from '@/services/api';
import { LineChart } from 'react-native-chart-kit';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { WatchlistModal } from '@/components/WatchlistModal';
import { ArrowLeft, Heart, TrendingUp, TrendingDown } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const screenWidth = Dimensions.get('window').width;

export default function StockScreen() {
  const { symbol } = useLocalSearchParams<{ symbol: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  
  const [stockData, setStockData] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWatchlistModal, setShowWatchlistModal] = useState(false);

  const fetchStockData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [quote, timeSeries] = await Promise.all([
        alphaVantageAPI.getQuote(symbol!),
        alphaVantageAPI.getIntradayData(symbol!)
      ]);

      setStockData({
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: quote['10. change percent'],
        volume: parseInt(quote['06. volume']),
        high: parseFloat(quote['03. high']),
        low: parseFloat(quote['04. low']),
        open: parseFloat(quote['02. open']),
        previousClose: parseFloat(quote['08. previous close']),
      });

      const timeSeriesData = timeSeries['Time Series (5min)'];
      const entries = Object.entries(timeSeriesData).slice(0, 50).reverse();
      
      const chartDataPoints = entries.map(([_, data]: [string, any]) => 
        parseFloat(data['4. close'])
      );

      setChartData({
        labels: entries.map((_, index) => index % 10 === 0 ? `${index}` : ''),
        datasets: [{
          data: chartDataPoints,
          strokeWidth: 2,
        }]
      });

    } catch (err) {
      setError('Failed to load stock data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (symbol) {
      fetchStockData();
    }
  }, [symbol]);

  const handleWatchlistToggle = () => {
    if (isInWatchlist(symbol!)) {
      toggleWatchlist(symbol!);
    } else {
      setShowWatchlistModal(true);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ErrorMessage message={error} onRetry={fetchStockData} />
      </SafeAreaView>
    );
  }

  const isPositive = stockData?.change >= 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surface }]}
          onPress={() => router.back()}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.watchlistButton, { backgroundColor: colors.surface }]}
          onPress={handleWatchlistToggle}>
          <Heart
            size={20}
            color={isInWatchlist(symbol!) ? colors.error : colors.text}
            fill={isInWatchlist(symbol!) ? colors.error : 'transparent'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.stockHeader}>
          <Text style={[styles.stockSymbol, { color: colors.text }]}>
            {stockData?.symbol}
          </Text>
          <Text style={[styles.stockPrice, { color: colors.text }]}>
            ${stockData?.price.toFixed(2)}
          </Text>
          <View style={styles.changeContainer}>
            {isPositive ? (
              <TrendingUp size={16} color={colors.success} />
            ) : (
              <TrendingDown size={16} color={colors.error} />
            )}
            <Text style={[styles.changeText, { color: isPositive ? colors.success : colors.error }]}>
              ${Math.abs(stockData?.change).toFixed(2)} ({stockData?.changePercent})
            </Text>
          </View>
        </View>

        {chartData && (
          <View style={styles.chartContainer}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>Price Chart</Text>
            <LineChart
              data={chartData}
              width={screenWidth - 40}
              height={220}
              chartConfig={{
                backgroundColor: colors.surface,
                backgroundGradientFrom: colors.surface,
                backgroundGradientTo: colors.surface,
                decimalPlaces: 2,
                color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                labelColor: (opacity = 1) => colors.textSecondary,
                style: {
                  borderRadius: 16
                },
                propsForDots: {
                  r: '0',
                },
              }}
              bezier
              style={styles.chart}
            />
          </View>
        )}

        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Open</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                ${stockData?.open.toFixed(2)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>High</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                ${stockData?.high.toFixed(2)}
              </Text>
            </View>
          </View>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Low</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                ${stockData?.low.toFixed(2)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Volume</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stockData?.volume.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <WatchlistModal
        visible={showWatchlistModal}
        onClose={() => setShowWatchlistModal(false)}
        onSelectWatchlist={(watchlistId) => {
          toggleWatchlist(symbol!, watchlistId);
          setShowWatchlistModal(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  watchlistButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  stockHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  stockSymbol: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  stockPrice: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  chartContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  chartTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 16,
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});