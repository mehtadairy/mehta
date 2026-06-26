import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { styles as globalStyles, COLORS } from './invoiceStyles';

const localStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.lightBg,
    borderRadius: 4,
    padding: 16,
    marginHorizontal: 35,
    marginTop: 25,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
});

export const ThankYouSection = () => (
  <View style={localStyles.card} wrap={false}>
    <Text style={globalStyles.cardLabel}>Thank you for choosing</Text>
    <Text style={[globalStyles.textDark, { fontSize: 14, fontWeight: 'bold', marginVertical: 4 }]}>
      MEHTA DAIRY & SWEET MART
    </Text>
    <Text style={globalStyles.cardLabel}>Serving sweetness since 1972</Text>
  </View>
);
