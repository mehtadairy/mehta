import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { styles as globalStyles, COLORS } from './invoiceStyles';

const localStyles = StyleSheet.create({
  card: {
    ...globalStyles.standardCard,
    width: '48%',
    minHeight: 110,
  },
});

interface CustomerCardProps {
  customer: {
    name: string;
    phone: string;
    email?: string;
    address: string;
  };
}

export const CustomerCard = ({ customer }: CustomerCardProps) => {
  const addressLines = customer.address.split('\n');

  return (
    <View style={localStyles.card}>
      <Text style={globalStyles.cardTitle}>BILL TO</Text>
      <Text style={globalStyles.cardValue}>{customer.name}</Text>
      <Text style={globalStyles.cardLabel}>Phone: {customer.phone}</Text>
      {customer.email && <Text style={globalStyles.cardLabel}>Email: {customer.email}</Text>}
      
      <View style={{ marginTop: 4 }}>
        {addressLines.map((line, idx) => (
          <Text key={idx} style={globalStyles.cardLabel}>{line}</Text>
        ))}
      </View>
    </View>
  );
};
