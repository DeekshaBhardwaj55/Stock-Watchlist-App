import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useWatchlist } from '@/contexts/WatchlistContext';
import { StockCard } from '@/components/StockCard';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { alphaVantageAPI } from '@/services/api';
import { Heart, ChevronDown } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

type StockData = {
  ticker: string;
  price: string;
  change_amount: string;
  change_percentage: string;
  volume: string;
};

export default function WatchlistScreen() {
  const { colors } = useTheme();
  const { watchlists, currentWatchlist, setCurrentWatchlist } = useWatchlist();
  const [stocks, setStocks] = useState<StockData[]>([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showWatchlistPicker, setShowWatchlistPicker] = useState(false);
  const router = useRouter();

  const fetchWatchlistData = async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);

      const currentList = watchlists.find(w => w.id === currentWatchlist);
      if (!currentList || currentList.stocks.length === 0) {
        setStocks([]);
        return;
      }

      const stockData = await Promise.all(
        currentList.stocks.map(async (symbol) => {
          try {
            const quote = await alphaVantageAPI.getQuote(symbol);
            return {
              ticker: symbol,
              price: quote['05. price'],
              change_amount: quote['09. change'],
              change_percentage: quote['10. change percent'],
              volume: quote['06. volume'],
            };
          } catch (err) {
            console.error(`Failed to fetch data for ${symbol}:`, err);
            return null;
          }
        })
      );

      const filtered = stockData.filter(
        (item): item is StockData => item !== null && item !== undefined
      );

      setStocks(filtered);
    } catch (err) {
      console.error('Failed to load watchlist data:', err);
      setError('Failed to load watchlist data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (currentWatchlist && watchlists.length > 0) {
      fetchWatchlistData();
    }
  }, [currentWatchlist, watchlists]);

  const currentWatchlistData = watchlists.find(w => w.id === currentWatchlist);

  const handleWatchlistSelect = (watchlistId: string) => {
    setCurrentWatchlist(watchlistId);
    setShowWatchlistPicker(false);
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
        <ErrorMessage message={error} onRetry={() => fetchWatchlistData()} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Watchlist</Text>
        {watchlists.length > 1 && (
          <TouchableOpacity
            style={[styles.switchButton, { backgroundColor: colors.surface }]}
            onPress={() => setShowWatchlistPicker(!showWatchlistPicker)}>
            <Text style={[styles.switchButtonText, { color: colors.text }]}>
              {currentWatchlistData?.name || 'Select Watchlist'}
            </Text>
            <ChevronDown size={16} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>

      {showWatchlistPicker && watchlists.length > 1 && (
        <View style={[styles.watchlistPicker, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {watchlists.map(watchlist => (
            <TouchableOpacity
              key={watchlist.id}
              style={[
                styles.watchlistOption,
                { borderBottomColor: colors.border },
                watchlist.id === currentWatchlist && { backgroundColor: colors.primary + '20' }
              ]}
              onPress={() => handleWatchlistSelect(watchlist.id)}>
              <Text style={[styles.watchlistOptionText, { color: colors.text }]}>
                {watchlist.name}
              </Text>
              <Text style={[styles.watchlistStockCount, { color: colors.textSecondary }]}>
                {watchlist.stocks.length} stocks
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!currentWatchlistData || currentWatchlistData.stocks.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your watchlist is empty"
          subtitle="Add stocks to your watchlist to track their performance"
          actionText="Browse Stocks"
          onAction={() => router.push('/(tabs)')}
        />
      ) : (
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchWatchlistData(true)}
              tintColor={colors.primary}
            />
          }>
          <View style={styles.stockGrid}>
            {stocks.map((stock, index) => (
              <StockCard key={`${stock.ticker}-${index}`} stock={stock} />
            ))}
          </View>
        </ScrollView>
      )}
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
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  switchButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  watchlistPicker: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  watchlistOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  watchlistOptionText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  watchlistStockCount: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  scrollView: {
    flex: 1,
  },
  stockGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
});



