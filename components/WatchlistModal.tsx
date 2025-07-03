import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useWatchlist } from '@/contexts/WatchlistContext';
import { X, Plus, Heart, Trash2 } from 'lucide-react-native';

interface WatchlistModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectWatchlist: (watchlistId: string) => void;
}

export function WatchlistModal({ visible, onClose, onSelectWatchlist }: WatchlistModalProps) {
  const { colors } = useTheme();
 const { 
  watchlists, 
  createWatchlist, 
  deleteWatchlist,
  currentWatchlist,
  setCurrentWatchlist  
} = useWatchlist();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

 const handleCreateWatchlist = async () => {
  if (!newWatchlistName.trim()) {
    Alert.alert('Error', 'Please enter a watchlist name');
    return;
  }

  setIsCreating(true);
  try {
    const id = await createWatchlist(newWatchlistName.trim());
    setCurrentWatchlist(id);  
    setNewWatchlistName('');
    setShowCreateForm(false);
  } catch (error) {
    Alert.alert('Error', 'Failed to create watchlist');
  } finally {
    setIsCreating(false);
  }
};
  const handleDeleteWatchlist = (watchlistId: string) => {
    if (watchlists.length <= 1) {
      Alert.alert('Cannot Delete', 'You must have at least one watchlist');
      return;
    }

    Alert.alert(
      'Delete Watchlist',
      'Are you sure you want to delete this watchlist? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteWatchlist(watchlistId)
        }
      ]
    );
  };

  const resetForm = () => {
    setShowCreateForm(false);
    setNewWatchlistName('');
    setIsCreating(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Add to Watchlist</Text>
            <TouchableOpacity onPress={handleClose}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {watchlists.map(watchlist => (
              <View key={watchlist.id} style={[styles.watchlistItem, { borderBottomColor: colors.border }]}>
                <TouchableOpacity
                  style={styles.watchlistContent}
                  onPress={() => onSelectWatchlist(watchlist.id)}>
                  <Heart size={20} color={colors.primary} />
                  <View style={styles.watchlistInfo}>
                    <Text style={[styles.watchlistName, { color: colors.text }]}>
                      {watchlist.name}
                    </Text>
                    <Text style={[styles.stockCount, { color: colors.textSecondary }]}>
                      {watchlist.stocks.length} stock{watchlist.stocks.length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </TouchableOpacity>
                {watchlists.length > 1 && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteWatchlist(watchlist.id)}>
                    <Trash2 size={18} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {showCreateForm ? (
              <View style={styles.createForm}>
                <Text style={[styles.formTitle, { color: colors.text }]}>Create New Watchlist</Text>
                <TextInput
                  style={[styles.input, { 
                    backgroundColor: colors.background, 
                    color: colors.text, 
                    borderColor: colors.border 
                  }]}
                  placeholder="Enter watchlist name"
                  placeholderTextColor={colors.textSecondary}
                  value={newWatchlistName}
                  onChangeText={setNewWatchlistName}
                  autoFocus
                  maxLength={50}
                />
                <View style={styles.formActions}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
                    onPress={resetForm}
                    disabled={isCreating}>
                    <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.createButton, { 
                      backgroundColor: colors.primary,
                      opacity: isCreating ? 0.6 : 1
                    }]}
                    onPress={handleCreateWatchlist}
                    disabled={isCreating || !newWatchlistName.trim()}>
                    <Text style={styles.createButtonText}>
                      {isCreating ? 'Creating...' : 'Create'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.addButton, { borderColor: colors.border }]}
                onPress={() => setShowCreateForm(true)}>
                <Plus size={20} color={colors.primary} />
                <Text style={[styles.addButtonText, { color: colors.primary }]}>
                  Create New Watchlist
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 0,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
  },
  content: {
    padding: 20,
  },
  watchlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  watchlistContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  watchlistInfo: {
    flex: 1,
  },
  watchlistName: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginBottom: 2,
  },
  stockCount: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: 'dashed',
    marginTop: 16,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  createForm: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  formTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  input: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 16,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  createButton: {
   
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
});