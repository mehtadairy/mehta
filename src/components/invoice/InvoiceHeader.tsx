import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { styles as globalStyles, COLORS } from './invoiceStyles';

const localStyles = StyleSheet.create({
  headerContainer: {
    ...globalStyles.row,
    ...globalStyles.spaceBetween,
    ...globalStyles.alignStart,
    ...globalStyles.container,
    paddingTop: 24,
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#EAE3D2',
    paddingBottom: 16,
  },
  logoContainer: {
    width: '33%',
    flexDirection: 'column',
  },
  logo: {
    width: 220,
    height: 55,
    objectFit: 'contain',
  },
  fallbackLogoText: {
    fontSize: 24,
    fontWeight: 700,
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  titleContainer: {
    width: '33%',
    alignItems: 'center',
    paddingTop: 4,
  },
  invoiceTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#111827',
    letterSpacing: 0.5,
  },
  metaContainer: {
    width: '33%',
    alignItems: 'flex-end',
    flexDirection: 'column',
  },
  metaRow: {
    ...globalStyles.row,
    marginBottom: 4,
    justifyContent: 'flex-end',
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: 600,
    color: '#111827',
    width: 60,
    textAlign: 'right',
  },
  metaValue: {
    fontSize: 9,
    fontWeight: 500,
    color: '#4B5563',
    width: 70,
    textAlign: 'right',
  },
});

interface InvoiceHeaderProps {
  invoiceNo: string;
  orderNo: string;
  date: string;
  logo?: string;
}

export const InvoiceHeader = ({ invoiceNo, orderNo, date, logo }: InvoiceHeaderProps) => (
  <View style={localStyles.headerContainer}>
    {/* Left: Logo */}
    <View style={localStyles.logoContainer}>
      {logo ? <Image style={localStyles.logo} src={logo} /> : <Text style={localStyles.fallbackLogoText}>Mehta Dairy</Text>}
    </View>

    {/* Center: Title */}
    <View style={localStyles.titleContainer}>
      <Text style={localStyles.invoiceTitle}>TAX INVOICE</Text>
    </View>

    {/* Right: Meta Details */}
    <View style={localStyles.metaContainer}>
      <View style={localStyles.metaRow}>
        <Text style={localStyles.metaLabel}>Invoice No:</Text>
        <Text style={localStyles.metaValue}>{invoiceNo}</Text>
      </View>
      <View style={localStyles.metaRow}>
        <Text style={localStyles.metaLabel}>Order No:</Text>
        <Text style={localStyles.metaValue}>{orderNo}</Text>
      </View>
      <View style={localStyles.metaRow}>
        <Text style={localStyles.metaLabel}>Date:</Text>
        <Text style={localStyles.metaValue}>{date}</Text>
      </View>
    </View>
  </View>
);
