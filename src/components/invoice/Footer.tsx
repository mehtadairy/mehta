import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { styles as globalStyles, COLORS } from './invoiceStyles';

const localStyles = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#FDFBF9',
    ...globalStyles.row,
    ...globalStyles.spaceBetween,
    ...globalStyles.alignCenter,
    paddingHorizontal: 35,
    borderTopWidth: 1,
    borderTopColor: '#EAE3D2',
  },
});

export const Footer = () => (
  <View style={localStyles.footer} fixed>
    <View>
      <Text style={[globalStyles.cardLabel, { color: '#4B5563', fontWeight: 600, fontSize: 9 }]}>Goods once sold are not returnable.</Text>
      <Text style={[globalStyles.cardLabel, { color: '#4B5563' }]}>Please keep this invoice. Support: +91 99132 52232</Text>
    </View>
    <View style={{ alignItems: 'flex-end' }}>
      <Text style={[globalStyles.cardLabel, { color: '#D97706', fontWeight: 700, fontSize: 9 }]}>Pure Ingredients.</Text>
      <Text style={[globalStyles.cardLabel, { color: '#D97706', fontWeight: 700, fontSize: 9 }]}>Best Quality.</Text>
      <Text style={[globalStyles.cardLabel, { color: '#D97706', fontWeight: 700, fontSize: 9 }]}>Timeless Taste.</Text>
    </View>
  </View>
);
