import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { styles as globalStyles, COLORS } from './invoiceStyles';

const localStyles = StyleSheet.create({
  card: {
    ...globalStyles.standardCard,
    width: '40%',
  },
  pill: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
    marginTop: 6,
    marginBottom: 8,
  },
  pillText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
});

interface PaymentCardProps {
  method: string;
  status: "PAID" | "UNPAID" | "PARTIAL";
  date: string;
  qr?: string;
}

export const PaymentCard = ({ method, status, date, qr }: PaymentCardProps) => {
  let pillColor = COLORS.danger;
  if (status === 'PAID') pillColor = COLORS.success;
  else if (status === 'PARTIAL') pillColor = COLORS.warning;

  return (
    <View style={localStyles.card}>
      <Text style={globalStyles.cardTitle}>PAYMENT STATUS</Text>
      
      <View style={[localStyles.pill, { backgroundColor: pillColor }]}>
        <Text style={localStyles.pillText}>{status}</Text>
      </View>
      
      <Text style={globalStyles.cardLabel}>Method: {method}</Text>
      <Text style={globalStyles.cardLabel}>Date: {date}</Text>
      
      <View style={globalStyles.divider} />
      
      <View style={{ ...globalStyles.row, ...globalStyles.alignCenter, marginTop: 4 }}>
        {qr && <Image style={{ width: 80, height: 80, marginRight: 12 }} src={qr} />}
        <View>
          <Text style={globalStyles.cardLabel}>• Scan to Reorder</Text>
          <Text style={globalStyles.cardLabel}>• Track Order</Text>
          <Text style={globalStyles.cardLabel}>• View Online</Text>
        </View>
      </View>
    </View>
  );
};
