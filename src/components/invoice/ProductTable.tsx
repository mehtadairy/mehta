import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { styles as globalStyles, COLORS } from './invoiceStyles';
import { InvoiceItem } from './types';

const localStyles = StyleSheet.create({
  tableContainer: {
    marginTop: 16,
    ...globalStyles.container,
    position: 'relative',
  },
  watermarkContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1,
  },
  watermarkText: {
    color: '#D97706',
    fontSize: 60,
    fontWeight: 700,
    opacity: 0.05,
    transform: 'rotate(-30deg)',
  },
  tableHeader: {
    ...globalStyles.row,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#111827',
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  thText: {
    color: '#4B5563',
    fontSize: 9,
    fontWeight: 700,
    textTransform: 'uppercase',
  },
  tableRow: {
    ...globalStyles.row,
    borderBottomWidth: 1,
    borderBottomColor: '#EAE3D2',
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'flex-start',
    minHeight: 40,
  },
  tdText: {
    fontSize: 9,
    color: '#4B5563',
    fontWeight: 500,
  },
  
  col1: { width: '5%', textAlign: 'left' },
  col2: { width: '45%', paddingRight: 10 },
  col3: { width: '15%', textAlign: 'center' },
  col4: { width: '10%', textAlign: 'right' },
  col5: { width: '10%', textAlign: 'right' },
  col6: { width: '15%', textAlign: 'right' },
  
  productImageRow: {
    ...globalStyles.row,
    ...globalStyles.alignStart,
  },
  productName: {
    fontSize: 10,
    color: '#111827',
    fontWeight: 700,
  },
  productDesc: {
    fontSize: 8,
    color: '#4B5563',
    marginTop: 2,
  },
});

interface ProductTableProps {
  items: InvoiceItem[];
}

export const ProductTable = ({ items }: ProductTableProps) => (
  <View style={localStyles.tableContainer}>
    {/* WATERMARK */}
    <View style={localStyles.watermarkContainer} fixed>
      <Text style={localStyles.watermarkText}>Mehta Dairy</Text>
    </View>

    <View style={localStyles.tableHeader} fixed>
      <Text style={[localStyles.thText, localStyles.col1]}>#</Text>
      <Text style={[localStyles.thText, localStyles.col2, { textAlign: 'left' }]}>ITEM DESCRIPTION</Text>
      <Text style={[localStyles.thText, localStyles.col3]}>WEIGHT</Text>
      <Text style={[localStyles.thText, localStyles.col4]}>QTY</Text>
      <Text style={[localStyles.thText, localStyles.col5]}>RATE</Text>
      <Text style={[localStyles.thText, localStyles.col6]}>AMOUNT</Text>
    </View>

    {items.map((item, idx) => (
      <View key={idx} style={localStyles.tableRow} wrap={false}>
        <Text style={[localStyles.tdText, localStyles.col1]}>{idx + 1}</Text>
        <View style={[localStyles.col2, localStyles.productImageRow]}>
          <View>
            <Text style={localStyles.productName}>{item.name}</Text>
            {item.subtitle && <Text style={localStyles.productDesc}>{item.subtitle}</Text>}
          </View>
        </View>
        <Text style={[localStyles.tdText, localStyles.col3]}>{item.weight}</Text>
        <Text style={[localStyles.tdText, localStyles.col4, { color: '#111827', fontWeight: 600 }]}>{item.qty}</Text>
        <Text style={[localStyles.tdText, localStyles.col5]}>₹{Number(item.price).toFixed(2)}</Text>
        <Text style={[localStyles.tdText, localStyles.col6, { color: '#111827', fontWeight: 700 }]}>₹{Number(item.total).toFixed(2)}</Text>
      </View>
    ))}
  </View>
);
