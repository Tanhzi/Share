import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface MySharesItemProps {
  item: any;
  onPress: () => void;
}

const MySharesItem = ({ item, onPress }: MySharesItemProps) => {
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
