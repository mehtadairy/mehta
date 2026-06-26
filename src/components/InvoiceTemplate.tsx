import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

/**
 * Premium Mehta Dairy Invoice Template
 * Replace the `InvoiceData` interface with your project's types
 * and wire the fields to your existing invoice service.
 */

export interface InvoiceItem {
  name: string;
  subtitle?: string;
  image?: string;
  weight: string;
  qty: number;
  price: number;
  total: number;
}

export interface InvoiceData {
  invoiceNo: string;
  orderNo: string;
  date: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
    address: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  delivery: number;
  discount: number;
  gst: number;
  grandTotal: number;
  paymentMethod: string;
  paymentStatus: "PAID" | "UNPAID" | "PARTIAL";
  logo?: string;
  qr?: string;
}

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: "Helvetica", backgroundColor: "#fff" },
  topBar: { height: 8, backgroundColor: "#d97706", marginBottom: 16 },
  row: { flexDirection: "row" },
  between: { justifyContent: "space-between", alignItems: "center" },
  header: { marginBottom: 18 },
  logo: { width: 170, height: 55, objectFit: "contain" },
  title: { fontSize: 24, fontWeight: "bold", color: "#3b2a1a" },
  card: { border: "1 solid #f0d5b0", borderRadius: 8, padding: 12, flex: 1, marginRight: 8 },
  cardLast: { border: "1 solid #f0d5b0", borderRadius: 8, padding: 12, flex: 1 },
  sectionTitle: { fontSize: 11, fontWeight: "bold", color: "#d97706", marginBottom: 6 },
  tableHead: { backgroundColor: "#d97706", color: "#fff", padding: 8, fontWeight: "bold" },
  cell: { padding: 8, borderBottom: "1 solid #ececec" },
  totalBox: { marginTop: 18, border: "1 solid #f0d5b0", borderRadius: 8 },
  totalHeader: { backgroundColor: "#d97706", color: "#fff", padding: 12, fontSize: 18, fontWeight: "bold" },
  footer: { marginTop: 24, textAlign: "center", fontSize: 10, color: "#555" }
});

export default function InvoiceTemplate({ invoice }: { invoice: InvoiceData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.topBar} />
        <View style={[styles.row, styles.between, styles.header]}>
          <View>
            {invoice.logo && <Image src={invoice.logo} style={styles.logo} />}
            <Text>Since 1972 • 50+ Years of Trust</Text>
          </View>
          <Text style={styles.title}>TAX INVOICE</Text>
          <View>
            <Text>Invoice: {invoice.invoiceNo}</Text>
            <Text>Order: {invoice.orderNo}</Text>
            <Text>Date: {invoice.date}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>BILL TO</Text>
            <Text>{invoice.customer.name}</Text>
            <Text>{invoice.customer.phone}</Text>
            <Text>{invoice.customer.email}</Text>
            <Text>{invoice.customer.address}</Text>
          </View>
          <View style={styles.cardLast}>
            <Text style={styles.sectionTitle}>SOLD BY</Text>
            <Text>Mehta Dairy & Sweet Mart</Text>
            <Text>Since 1972</Text>
            <Text>Taleti Rd, Navagadh, Jeshar</Text>
            <Text>Palitana, Gujarat 364270</Text>
            <Text>+91 99132 52232</Text>
            <Text>www.mehtadairy.com</Text>
          </View>
        </View>

        <View style={{ marginTop: 16 }}>
          <View style={[styles.row, styles.tableHead]}>
            <Text style={{ width: "40%" }}>Item</Text>
            <Text style={{ width: "15%" }}>Weight</Text>
            <Text style={{ width: "10%" }}>Qty</Text>
            <Text style={{ width: "15%" }}>Rate</Text>
            <Text style={{ width: "20%" }}>Total</Text>
          </View>

          {invoice.items.map((item, i) => (
            <View key={i} style={styles.row}>
              <View style={[styles.cell, { width: "40%" }]}>
                <Text>{item.name}</Text>
                {item.subtitle && <Text>{item.subtitle}</Text>}
              </View>
              <Text style={[styles.cell, { width: "15%" }]}>{item.weight}</Text>
              <Text style={[styles.cell, { width: "10%" }]}>{item.qty}</Text>
              <Text style={[styles.cell, { width: "15%" }]}>₹{item.price.toFixed(2)}</Text>
              <Text style={[styles.cell, { width: "20%" }]}>₹{item.total.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalBox}>
          <Text>Subtotal: ₹{invoice.subtotal.toFixed(2)}</Text>
          <Text>Delivery: ₹{invoice.delivery.toFixed(2)}</Text>
          <Text>Discount: ₹{invoice.discount.toFixed(2)}</Text>
          <Text>GST: ₹{invoice.gst.toFixed(2)}</Text>
          <View style={styles.totalHeader}>
            <Text>GRAND TOTAL ₹{invoice.grandTotal.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Thank you for choosing Mehta Dairy & Sweet Mart</Text>
          <Text>📞 +91 99132 52232 • 🌐 www.mehtadairy.com • 📍 Palitana, Gujarat</Text>
        </View>
      </Page>
    </Document>
  );
}
