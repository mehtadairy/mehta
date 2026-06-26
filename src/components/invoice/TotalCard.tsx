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
    marginBottom: 6,
  },
  grandTotalBox: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginTop: 4,
    alignItems: 'center',
  },
  grandTotalLabel: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  grandTotalValue: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: 'bold',
  },
  wordsText: {
    fontSize: 7,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 6,
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
      <Text style={globalStyles.cardLabel}>Subtotal</Text>
      <Text style={globalStyles.cardLabel}>₹{subtotal.toFixed(2)}</Text>
    </View>
    <View style={localStyles.totalRow}>
      <Text style={globalStyles.cardLabel}>Delivery Charges</Text>
      <Text style={globalStyles.cardLabel}>₹{delivery.toFixed(2)}</Text>
    </View>
    <View style={localStyles.totalRow}>
      <Text style={globalStyles.cardLabel}>Discount</Text>
      <Text style={globalStyles.cardLabel}>-₹{discount.toFixed(2)}</Text>
    </View>
    {gst > 0 && (
      <View style={localStyles.totalRow}>
        <Text style={globalStyles.cardLabel}>GST Included (18%)</Text>
        <Text style={globalStyles.cardLabel}>₹{gst.toFixed(2)}</Text>
      </View>
    )}
    
    <View style={localStyles.grandTotalBox}>
      <Text style={localStyles.grandTotalLabel}>GRAND TOTAL</Text>
      <Text style={localStyles.grandTotalValue}>₹{grandTotal.toFixed(2)}</Text>
    </View>
    <Text style={localStyles.wordsText}>Rupees {numberToWords(Math.round(grandTotal))}</Text>
  </View>
);
