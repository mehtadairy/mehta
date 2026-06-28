import React from 'react';
import { View, Text, StyleSheet, Svg, Path, Circle } from '@react-pdf/renderer';
import { styles as globalStyles, COLORS } from './invoiceStyles';

const localStyles = StyleSheet.create({
  card: {
    ...globalStyles.standardCard,
    width: '48%',
    minHeight: 110,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  icon: {
    width: 10,
    height: 10,
    marginRight: 4,
    color: COLORS.textDark,
  }
});

export const SellerCard = () => (
  <View style={localStyles.card}>
    <Text style={globalStyles.cardTitle}>SOLD BY</Text>
    <Text style={[globalStyles.cardValue, { color: '#b45309', fontSize: 11 }]}>Mehta Dairy & Sweet Mart</Text>
    
    <View style={{ marginTop: 2 }}>
      <Text style={globalStyles.cardLabel}>Taleti Rd, Navagadh, Jeshar,</Text>
      <Text style={globalStyles.cardLabel}>Palitana, Gujarat - 364270</Text>
    </View>

    <View style={localStyles.iconRow}>
      <Svg viewBox="0 0 24 24" style={localStyles.icon}>
        <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </Svg>
      <Text style={[globalStyles.cardLabel, { marginBottom: 0, color: COLORS.textDark }]}>+91 99132 52232</Text>
    </View>

    <View style={[localStyles.iconRow, { marginTop: 2 }]}>
      <Svg viewBox="0 0 24 24" style={localStyles.icon}>
        <Circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M2 12h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </Svg>
      <Text style={[globalStyles.cardLabel, { marginBottom: 0, color: COLORS.textDark }]}>www.mehtadairy.com</Text>
    </View>

    <View style={[localStyles.iconRow, { marginTop: 2 }]}>
      <Svg viewBox="0 0 24 24" style={localStyles.icon}>
        <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </Svg>
      <Text style={[globalStyles.cardLabel, { marginBottom: 0, color: COLORS.textDark }]}>support@mehtadairy.com</Text>
    </View>
  </View>
);
