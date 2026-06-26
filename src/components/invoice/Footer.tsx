import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { styles as globalStyles, COLORS } from './invoiceStyles';

const localStyles = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: COLORS.lightBg,
    ...globalStyles.row,
    ...globalStyles.spaceBetween,
    ...globalStyles.alignCenter,
    paddingHorizontal: 35,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});

export const Footer = () => (
  <View style={localStyles.footer} fixed>
    <View>
      <Text style={globalStyles.cardLabel}>Goods once sold are not returnable.</Text>
      <Text style={globalStyles.cardLabel}>Please keep this invoice. Support: +91 99132 52232</Text>
    </View>
    <View style={{ alignItems: 'flex-end' }}>
      <Text style={[globalStyles.cardLabel, globalStyles.textPrimary, { fontWeight: 'bold' }]}>Pure Ingredients.</Text>
      <Text style={[globalStyles.cardLabel, globalStyles.textPrimary, { fontWeight: 'bold' }]}>Best Quality.</Text>
      <Text style={[globalStyles.cardLabel, globalStyles.textPrimary, { fontWeight: 'bold' }]}>Timeless Taste.</Text>
    </View>
  </View>
);
