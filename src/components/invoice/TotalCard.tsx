import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { styles as globalStyles, COLORS } from './invoiceStyles';

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  totalRow: {
    ...globalStyles.row,
    ...globalStyles.spaceBetween,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FDFBF9',
    paddingBottom: 4,
  },
  grandTotalBox: {
    ...globalStyles.row,
    ...globalStyles.spaceBetween,
    ...globalStyles.alignCenter,
    borderTopWidth: 2,
    borderTopColor: '#EAE3D2',
    marginTop: 8,
    paddingTop: 12,
  },
  grandTotalLabel: {
    color: '#111827',
    fontSize: 14,
    fontWeight: 700,
  },
  grandTotalValue: {
    color: '#D97706',
    fontSize: 18,
    fontWeight: 700,
  },
  wordsText: {
    fontSize: 9,
    color: '#4B5563',
    fontWeight: 700,
    marginTop: 16,
  },
});

function numberToWords(num: number): string {
  if (num === 0) return "Zero";
  const a = ["", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ", "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const n = ("000000000" + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return "";
  let str = "";
  str += (Number(n[1]) != 0) ? (a[Number(n[1])] || b[n[1][0] as any] + " " + a[n[1][1] as any]) + "Crore " : "";
  str += (Number(n[2]) != 0) ? (a[Number(n[2])] || b[n[2][0] as any] + " " + a[n[2][1] as any]) + "Lakh " : "";
  str += (Number(n[3]) != 0) ? (a[Number(n[3])] || b[n[3][0] as any] + " " + a[n[3][1] as any]) + "Thousand " : "";
  str += (Number(n[4]) != 0) ? (a[Number(n[4])] || b[n[4][0] as any] + " " + a[n[4][1] as any]) + "Hundred " : "";
  str += (Number(n[5]) != 0) ? ((str != "") ? "and " : "") + (a[Number(n[5])] || b[n[5][0] as any] + " " + a[n[5][1] as any]) : "";
  return str.trim() + " Only";
}

interface TotalCardProps {
  subtotal: number;
  delivery: number;
  discount: number;
  gst: number;
  grandTotal: number;
}

export const TotalCard = ({ subtotal, delivery, discount, gst, grandTotal }: TotalCardProps) => (
  <View style={localStyles.container}>
    <View style={localStyles.totalRow}>
      <Text style={[globalStyles.cardLabel, { fontSize: 10 }]}>Subtotal</Text>
      <Text style={[globalStyles.cardLabel, { fontSize: 10, color: '#111827' }]}>₹{subtotal.toFixed(2)}</Text>
    </View>
    <View style={localStyles.totalRow}>
      <Text style={[globalStyles.cardLabel, { fontSize: 10 }]}>Delivery Charges</Text>
      <Text style={[globalStyles.cardLabel, { fontSize: 10, color: '#111827' }]}>₹{delivery.toFixed(2)}</Text>
    </View>
    {discount > 0 && (
      <View style={localStyles.totalRow}>
        <Text style={[globalStyles.cardLabel, { fontSize: 10 }]}>Discount</Text>
        <Text style={[globalStyles.cardLabel, { fontSize: 10, color: '#10A314' }]}>-₹{discount.toFixed(2)}</Text>
      </View>
    )}
    {gst > 0 && (
      <View style={localStyles.totalRow}>
        <Text style={[globalStyles.cardLabel, { fontSize: 10 }]}>GST Included (18%)</Text>
        <Text style={[globalStyles.cardLabel, { fontSize: 10, color: '#111827' }]}>₹{gst.toFixed(2)}</Text>
      </View>
    )}
    
    <View style={localStyles.grandTotalBox}>
      <Text style={localStyles.grandTotalLabel}>Grand Total</Text>
      <Text style={localStyles.grandTotalValue}>₹{grandTotal.toFixed(2)}</Text>
    </View>
  </View>
);
