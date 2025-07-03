import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Watchlist {
  id: string;
  name: string;
  stocks: string[];
  createdAt: Date;
}

interface WatchlistContextType {
  watchlists: Watchlist[];
  currentWatchlist: string;
  setCurrentWatchlist: (id: string) => void;
  createWatchlist: (name: string) => Promise<string>;
  addToWatchlist: (symbol: string, watchlistId?: string) => void;
  removeFromWatchlist: (symbol: string, watchlistId?: string) => void;
  isInWatchlist: (symbol: string, watchlistId?: string) => boolean;
  toggleWatchlist: (symbol: string, watchlistId?: string) => void;
  deleteWatchlist: (watchlistId: string) => void;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(
  undefined
);

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [currentWatchlist, setCurrentWatchlist] = useState<string>('');

  useEffect(() => {
    loadWatchlists();
  }, []);

  const loadWatchlists = async () => {
  try {
    const saved = await AsyncStorage.getItem('watchlists');
    
    if (saved) {
      const parsed = JSON.parse(saved).map((w: any) => ({
        ...w,
        createdAt: new Date(w.createdAt)
      }));
      
      setWatchlists(parsed);
      if (parsed.length > 0) {
        setCurrentWatchlist(prev => prev || parsed[0].id);
      }
    } else {
      const defaultWatchlist: Watchlist = {
        id: 'default',
        name: 'My Watchlist',
        stocks: [],
        createdAt: new Date(),
      };
      const newWatchlists = [defaultWatchlist];
      await AsyncStorage.setItem('watchlists', JSON.stringify(newWatchlists));
      setWatchlists(newWatchlists);
      setCurrentWatchlist('default');
    }
  } catch (error) {
    console.error('Watchlist load error:', error);
    const defaultWatchlist: Watchlist = {
      id: 'default',
      name: 'My Watchlist',
      stocks: [],
      createdAt: new Date(),
    };
    setWatchlists([defaultWatchlist]);
    setCurrentWatchlist('default');
  }
};

  const saveWatchlists = async (newWatchlists: Watchlist[]) => {
    try {
      await AsyncStorage.setItem('watchlists', JSON.stringify(newWatchlists));
      setWatchlists(newWatchlists);
    } catch (error) {
      console.error('Failed to save watchlists:', error);
    }
  };

  const createWatchlist = async (name: string): Promise<string> => {
  const newWatchlist: Watchlist = {
    id: `watchlist_${Date.now()}`,
    name: name.trim(),
    stocks: [],
    createdAt: new Date(),
  };
  
  const newWatchlists = [...watchlists, newWatchlist];
  setWatchlists(newWatchlists);
  setCurrentWatchlist(newWatchlist.id); 
  
  try {
    await AsyncStorage.setItem('watchlists', JSON.stringify(newWatchlists));
    return newWatchlist.id;
  } catch (error) {
    setWatchlists(watchlists);
    setCurrentWatchlist(watchlists[0]?.id || '');
    console.error('Failed to save watchlist:', error);
    throw error;
  }
};

  const deleteWatchlist = async (watchlistId: string) => {
    if (watchlists.length <= 1) {
      console.warn('Cannot delete the last watchlist');
      return;
    }

    const newWatchlists = watchlists.filter((w) => w.id !== watchlistId);
    await saveWatchlists(newWatchlists);

    if (currentWatchlist === watchlistId && newWatchlists.length > 0) {
      setCurrentWatchlist(newWatchlists[0].id);
    }
  };

  const addToWatchlist = async (symbol: string, watchlistId?: string) => {
    const targetId = watchlistId || currentWatchlist;
    const newWatchlists = watchlists.map((w) =>
      w.id === targetId
        ? { ...w, stocks: [...w.stocks.filter((s) => s !== symbol), symbol] }
        : w
    );
    await saveWatchlists(newWatchlists);
  };

  const removeFromWatchlist = async (symbol: string, watchlistId?: string) => {
    const targetId = watchlistId || currentWatchlist;
    const newWatchlists = watchlists.map((w) =>
      w.id === targetId
        ? { ...w, stocks: w.stocks.filter((s) => s !== symbol) }
        : w
    );
    await saveWatchlists(newWatchlists);
  };

  const isInWatchlist = (symbol: string, watchlistId?: string): boolean => {
    if (!symbol) return false;
    const targetId = watchlistId || currentWatchlist;
    const watchlist = watchlists.find((w) => w.id === targetId);
    return watchlist?.stocks.includes(symbol) || false;
  };

  const toggleWatchlist = async (symbol: string, watchlistId?: string) => {
    if (isInWatchlist(symbol, watchlistId)) {
      await removeFromWatchlist(symbol, watchlistId);
    } else {
      await addToWatchlist(symbol, watchlistId);
    }
  };

  const value = {
    watchlists,
    currentWatchlist,
    setCurrentWatchlist,
    createWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    toggleWatchlist,
    deleteWatchlist,
  };

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (context === undefined) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
}
