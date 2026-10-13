import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';

interface MySharesItemProps {
  item: any;
  onPress: () => void;
}

const MySharesItem = ({ item: _item, onPress }: MySharesItemProps) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Text>MyShares Item</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
});

export default MySharesItem;
