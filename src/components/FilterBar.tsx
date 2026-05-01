import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { COLORS } from '../constants/appColors';

interface FilterBarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  filters: string[];
  showFilter: boolean;
  onToggleFilter: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  activeFilter,
  onFilterChange,
  filters,
  showFilter,
  onToggleFilter,
}) => {
  return (
    <>
      <View style={styles.listHeader}>
        <View>
          <Text style={styles.sectionTitle}>NEARBY DOCUMENTS</Text>
          <Text style={styles.subTitle}>
            Found {filters.length} items nearby
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.iconBtn,
            showFilter && { backgroundColor: COLORS.primary },
          ]}
          onPress={onToggleFilter}>
          <Text style={styles.iconBtnText}>📋</Text>
        </TouchableOpacity>
      </View>

      {showFilter && (
        <View style={styles.filterBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filters.map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterChip,
                  activeFilter === type && styles.filterChipActive,
                ]}
                onPress={() => onFilterChange(type)}>
                <Text
                  style={[
                    styles.filterText,
                    activeFilter === type && styles.filterTextActive,
                  ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  subTitle: { fontSize: 12, color: COLORS.slate400, marginTop: 2 },
  iconBtn: {
    padding: 8,
    borderRadius: 50,
    backgroundColor: '#f1f5f9',
  },
  iconBtnText: {
    fontSize: 16,
  },
  filterBar: { marginBottom: 16 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: { backgroundColor: COLORS.text, borderColor: COLORS.text },
  filterText: { fontSize: 12, fontWeight: 'bold', color: COLORS.slate400 },
  filterTextActive: { color: '#fff' },
});
