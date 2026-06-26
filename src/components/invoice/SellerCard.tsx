import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { styles as globalStyles, COLORS } from './invoiceStyles';

const localStyles = StyleSheet.create({
  card: {
    ...globalStyles.standardCard,
    width: '48%',
    minHeight: 110,
    ...globalStyles.row,
    ...globalStyles.spaceBetween,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.goldenAccent,
    textAlign: 'right',
    marginTop: 20,
    opacity: 0.8,
  }
});

export const SellerCard = () => (
  <View style={localStyles.card}>
    <View>
      <Text style={globalStyles.cardTitle}>SOLD BY</Text>
      <Text style={globalStyles.cardValue}>Mehta Dairy & Sweet Mart</Text>
      <Text style={globalStyles.cardLabel}>Since 1972</Text>
      <Text style={globalStyles.cardLabel}>Taleti Rd, Navagadh, Jeshar,</Text>
      <Text style={globalStyles.cardLabel}>Palitana, Gujarat 364270</Text>
      <Text style={globalStyles.cardLabel}>+91 99132 52232</Text>
      <Text style={globalStyles.cardLabel}>www.mehtadairy.com</Text>
    </View>
    
    <View style={{ width: '30%' }}>
      <Text style={localStyles.badgeText}>50+{"\n"}YEARS OF{"\n"}TRUST</Text>
    </View>
  </View>
);
