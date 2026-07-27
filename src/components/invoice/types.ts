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
