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
      <Text style={[globalStyles.cardLabel, { color: '#4B5563', fontWeight: 'bold', fontSize: 9 }]}>Thank you!</Text>
      <Text style={[globalStyles.cardLabel, { color: '#4B5563' }]}>support@mehtadairy.com • +91 99132 52232</Text>
    </View>
    <View style={{ alignItems: 'flex-end' }}>
      <Text style={[globalStyles.cardLabel, { color: '#D97706', fontWeight: 'bold', fontSize: 9 }]}>www.mehtadairy.com</Text>
      <Text style={[globalStyles.cardLabel, { color: '#4B5563' }]}>Pure Ingredients. Timeless Taste.</Text>
    </View>
  </View>
);
