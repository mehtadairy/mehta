import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { styles as globalStyles, COLORS } from './invoiceStyles';
import { InvoiceItem } from './types';

const localStyles = StyleSheet.create({
  tableContainer: {
    marginTop: 20,
    ...globalStyles.container,
  },
  tableHeader: {
    ...globalStyles.row,
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderRadius: 4,
  },
  thText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  tableRow: {
    ...globalStyles.row,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    minHeight: 40,
  },
  tdText: {
    fontSize: 9,
    color: COLORS.textDark,
  },
  
  col1: { width: '8%', textAlign: 'center' },
  col2: { width: '40%', paddingRight: 10 },
  col3: { width: '12%', textAlign: 'center' },
  col4: { width: '10%', textAlign: 'center' },
  col5: { width: '15%', textAlign: 'right' },
  col6: { width: '15%', textAlign: 'right' },
  
  productImageRow: {
    ...globalStyles.row,
    ...globalStyles.alignCenter,
  },
  productThumbnail: {
    width: 60,
    height: 50,
    marginRight: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    objectFit: 'cover',
  },
  productName: {
    fontSize: 9,
    color: COLORS.textDark,
    fontWeight: 'bold',
  },
  productDesc: {
    fontSize: 8,
    color: COLORS.textLight,
    marginTop: 2,
  },
});

interface ProductTableProps {
  items: InvoiceItem[];
}

export const ProductTable = ({ items }: ProductTableProps) => (
  <View style={localStyles.tableContainer}>
    <View style={localStyles.tableHeader} fixed>
      <Text style={[localStyles.thText, localStyles.col1]}>#</Text>
      <Text style={[localStyles.thText, localStyles.col2, { textAlign: 'left' }]}>ITEM DESCRIPTION</Text>
      <Text style={[localStyles.thText, localStyles.col3]}>WEIGHT</Text>
      <Text style={[localStyles.thText, localStyles.col4]}>QTY</Text>
      <Text style={[localStyles.thText, localStyles.col5]}>RATE</Text>
      <Text style={[localStyles.thText, localStyles.col6]}>TOTAL</Text>
    </View>

    {items.map((item, idx) => (
      <View key={idx} style={localStyles.tableRow} wrap={false}>
        <Text style={[localStyles.tdText, localStyles.col1]}>{idx + 1}</Text>
        <View style={[localStyles.col2, localStyles.productImageRow]}>
          {item.image && <Image style={localStyles.productThumbnail} src={item.image} />}
          <View>
            <Text style={localStyles.productName}>{item.name}</Text>
            <Text style={localStyles.productDesc}>{item.subtitle || "Freshly Prepared • Since 1972"}</Text>
          </View>
        </View>
        <Text style={[localStyles.tdText, localStyles.col3]}>{item.weight}</Text>
        <Text style={[localStyles.tdText, localStyles.col4]}>{item.qty}</Text>
        <Text style={[localStyles.tdText, localStyles.col5]}>₹{Number(item.price).toFixed(2)}</Text>
        <Text style={[localStyles.tdText, localStyles.col6]}>₹{Number(item.total).toFixed(2)}</Text>
      </View>
    ))}
  </View>
);
