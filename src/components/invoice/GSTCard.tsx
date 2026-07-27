import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { styles as globalStyles, COLORS } from './invoiceStyles';

const localStyles = StyleSheet.create({
  card: {
    ...globalStyles.standardCard,
    width: '25%',
  },
});

interface GSTCardProps {
  gstNumber?: string;
}

export const GSTCard = ({ gstNumber }: GSTCardProps) => {
  if (!gstNumber) return null;

  return (
    <View style={localStyles.card}>
      <Text style={globalStyles.cardTitle}>GST DETAILS</Text>
      <Text style={globalStyles.cardValue}>{gstNumber}</Text>
      <Text style={globalStyles.cardLabel}>State Code: 24 (Gujarat)</Text>
      <Text style={globalStyles.cardLabel}>HSN: 210690</Text>
    </View>
  );
};
