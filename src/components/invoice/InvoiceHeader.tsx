import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { styles as globalStyles, COLORS } from './invoiceStyles';

const localStyles = StyleSheet.create({
  headerContainer: {
    ...globalStyles.row,
    ...globalStyles.spaceBetween,
    ...globalStyles.alignStart,
    ...globalStyles.container,
    paddingTop: 20,
    marginBottom: 20,
  },
  logoContainer: {
    width: 250,
  },
  logo: {
    width: 240,
    height: 60,
    objectFit: 'contain',
  },
  sloganText: {
    color: COLORS.goldenAccent,
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 4,
    textAlign: 'center',
    width: 240,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 10,
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textDark,
    letterSpacing: 1.5,
  },
  titleLine: {
    width: 90,
    height: 1,
    backgroundColor: COLORS.goldenAccent,
    marginVertical: 4,
  },
  metaContainer: {
    width: 160,
    alignItems: 'flex-end',
    paddingTop: 8,
  },
  metaRow: {
    ...globalStyles.row,
    marginBottom: 4,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textDark,
    width: 70,
  },
  metaValue: {
    fontSize: 10,
    color: COLORS.textDark,
    width: 90,
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
    {/* Left: Logo & Slogan */}
    <View style={localStyles.logoContainer}>
      {logo && <Image style={localStyles.logo} src={logo} />}
      <Text style={localStyles.sloganText}>50+ YEARS OF TRUST & PURITY</Text>
    </View>

    {/* Center: Title */}
    <View style={localStyles.titleContainer}>
      <View style={localStyles.titleLine} />
      <Text style={localStyles.invoiceTitle}>TAX INVOICE</Text>
      <View style={localStyles.titleLine} />
    </View>

    {/* Right: Meta Details */}
    <View style={localStyles.metaContainer}>
      <View style={localStyles.metaRow}>
        <Text style={localStyles.metaLabel}>Invoice No.</Text>
        <Text style={localStyles.metaValue}>: {invoiceNo}</Text>
      </View>
      <View style={localStyles.metaRow}>
        <Text style={localStyles.metaLabel}>Order No.</Text>
        <Text style={localStyles.metaValue}>: {orderNo}</Text>
      </View>
      <View style={localStyles.metaRow}>
        <Text style={localStyles.metaLabel}>Invoice Date</Text>
        <Text style={localStyles.metaValue}>: {date}</Text>
      </View>
    </View>
  </View>
);
