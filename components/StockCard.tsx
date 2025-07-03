import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import { TrendingUp, TrendingDown } from 'lucide-react-native';

interface StockCardProps {
  stock: {
    ticker: string;
    price: string | number;
    change_amount: string | number;
    change_percentage: string;
    volume?: string | number;
  };
}

export function StockCard({ stock }: StockCardProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const price = typeof stock.price === 'string' ? parseFloat(stock.price) : stock.price;
  const change = typeof stock.change_amount === 'string' ? parseFloat(stock.change_amount) : stock.change_amount;
  const isPositive = change >= 0;

  const handlePress = () => {
    router.push(`/stock/${stock.ticker}`);
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={handlePress}
      activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={[styles.ticker, { color: colors.text }]} numberOfLines={1}>
          {stock.ticker}
        </Text>
        {isPositive ? (
          <TrendingUp size={16} color={colors.success} />
        ) : (
          <TrendingDown size={16} color={colors.error} />
        )}
      </View>
      
      <Text style={[styles.price, { color: colors.text }]}>
        ${price.toFixed(2)}
      </Text>
      
      <View style={styles.changeContainer}>
        <Text style={[styles.changeAmount, { color: isPositive ? colors.success : colors.error }]}>
          {isPositive ? '+' : ''}${Math.abs(change).toFixed(2)}
        </Text>
        <Text style={[styles.changePercent, { color: isPositive ? colors.success : colors.error }]}>
          {stock.change_percentage}
        </Text>
      </View>
      
      {stock.volume && (
        <Text style={[styles.volume, { color: colors.textSecondary }]}>
          Vol: {typeof stock.volume === 'string' ? parseInt(stock.volume).toLocaleString() : stock.volume.toLocaleString()}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticker: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
  },
  price: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  changeContainer: {
    marginBottom: 4,
  },
  changeAmount: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  changePercent: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  volume: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
});