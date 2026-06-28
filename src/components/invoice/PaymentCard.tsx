import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { styles as globalStyles, COLORS } from './invoiceStyles';

const localStyles = StyleSheet.create({
  card: {
    width: '48%',
    paddingRight: 10,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: '#4B5563',
    marginBottom: 4,
  },
  amountInWords: {
    fontSize: 10,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 16,
  },
  noteText: {
    fontSize: 9,
    color: '#4B5563',
    marginBottom: 2,
  }
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

interface PaymentCardProps {
  method: string;
  status: "PAID" | "UNPAID" | "PARTIAL";
  date: string;
  qr?: string;
  grandTotal: number;
}

export const PaymentCard = ({ method, status, date, qr, grandTotal }: PaymentCardProps) => {
  return (
    <View style={localStyles.card}>
      <Text style={localStyles.sectionTitle}>Amount in Words:</Text>
      <Text style={localStyles.amountInWords}>Rupees {numberToWords(Math.round(grandTotal))}</Text>
      
      {qr && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <Image style={{ width: 60, height: 60, marginRight: 12 }} src={qr} />
          <View>
            <Text style={localStyles.noteText}>• Scan to Reorder</Text>
            <Text style={localStyles.noteText}>• Track Order</Text>
            <Text style={localStyles.noteText}>• View Online</Text>
          </View>
        </View>
      )}
    </View>
  );
};
