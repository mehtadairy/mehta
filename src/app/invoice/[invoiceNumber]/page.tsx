import { supabase } from '@/lib/supabaseClient';
import { notFound } from 'next/navigation';
import InvoicePrintable from '@/components/invoice-html/InvoicePrintable';
import InvoiceActionBar from './InvoiceActionBar';

// Note: To make this robust, we can map either from the \`orders\` table (if linked) 
// or from the \`invoices.metadata\` cache.
async function getInvoiceData(invoiceNumber: string) {
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, orders(*)')
    .eq('invoice_number', invoiceNumber)
    .single();

  if (!invoice) return null;

  const order = invoice.orders || invoice.metadata || {};
  
  // Format data for the template
  const items = order.order_items || invoice.metadata?.order_items || [];
  
  const mappedItems = items.map((item: any) => ({
    name: item.product_name || item.name,
    subtitle: item.subtitle || "Premium Quality Sweet",
    weight: item.weight || "Standard",
    qty: item.quantity || item.qty,
    price: Number(item.price),
    total: Number(item.price) * Number(item.quantity || item.qty)
  }));

  const addr = order.shipping_address || invoice.metadata?.shipping_address;
  let addressString = "Store Pickup";
  if (addr && addr.street) {
    addressString = `${addr.street}, ${addr.city}, ${addr.state} - ${addr.pincode}`;
  } else if (addr && typeof addr === 'string') {
    addressString = addr;
  }

  // Determine logo URL (if we want dynamic or static)
  // For client side, we can just use the public folder path
  const logoUrl = "/logo.png";
  
  const reorderUrl = `https://mehtadairy.com/reorder?id=${encodeURIComponent(invoice.invoice_number)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(reorderUrl)}&color=1F1E1C&bgcolor=ffffff`;

  const mappedInvoiceData = {
    invoiceNo: invoice.invoice_number,
    orderNo: order.order_number || invoice.order_id || "N/A",
    date: new Date(invoice.created_at).toLocaleDateString("en-GB", { day: 'numeric', month: 'long', year: 'numeric' }),
    customer: {
      name: order.user_name || invoice.metadata?.user_name || "Valued Customer",
      phone: String(order.user_phone || invoice.metadata?.user_phone || "N/A").replace(/^\+?91\s*/, "").trim(),
      email: order.user_email || invoice.metadata?.user_email || undefined,
      address: addressString,
    },
    items: mappedItems,
    subtotal: Number(order.subtotal || invoice.metadata?.subtotal || 0),
    delivery: Number(order.delivery_charge || invoice.metadata?.delivery_charge || 0),
    discount: Number(order.discount || invoice.metadata?.discount || 0),
    gst: (order.metadata?.gst_number || invoice.metadata?.metadata?.gst_number) ? Number(order.total || invoice.metadata?.total || 0) - (Number(order.total || invoice.metadata?.total || 0) / 1.18) : 0,
    grandTotal: Number(order.total || invoice.metadata?.total || 0),
    paymentMethod: order.payment_method || invoice.metadata?.payment_method || "Cash",
    paymentStatus: (order.payment_status || invoice.metadata?.payment_status || "COMPLETED").toUpperCase() as "PAID" | "UNPAID" | "PARTIAL",
    logo: logoUrl,
    qr: qrUrl
  };

  return mappedInvoiceData;
}

export default async function InvoicePage({ params }: { params: Promise<{ invoiceNumber: string }> }) {
  const { invoiceNumber } = await params;
  const invoiceData = await getInvoiceData(invoiceNumber);

  if (!invoiceData) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white flex flex-col items-center">
      <InvoiceActionBar invoiceNumber={invoiceData.invoiceNo} />
      <div className="w-full max-w-4xl bg-white shadow-xl print:shadow-none print:w-full print:max-w-none mt-8 mb-20 print:mt-0 print:mb-0">
        <InvoicePrintable invoice={invoiceData} />
      </div>
    </div>
  );
}
