import React from 'react';
import { InvoiceData } from '../invoice/types';
import { 
  UserIcon, PhoneIcon, MailIcon, LocationIcon, 
  StoreIcon, GlobeIcon, CheckCircleIcon, WhatsappIcon 
} from './Icons';

interface Props {
  invoice: InvoiceData;
}

export default function InvoiceTemplateHtml({ invoice }: Props) {
  const numberToWords = (num: number) => {
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
  };

  const isPaid = invoice.paymentStatus === 'PAID';
  const isPartial = invoice.paymentStatus === 'PARTIAL';
  const paymentBg = isPaid ? 'bg-green-600' : (isPartial ? 'bg-amber-500' : 'bg-red-600');
  
  const totalQty = invoice.items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <title>Invoice - {invoice.invoiceNo}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{__html: `
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  brand: '#d97706',
                  brandDark: '#b45309',
                  brandLight: '#fdfbf9',
                  textMain: '#111827',
                  textMuted: '#4b5563',
                  borderSoft: '#e5e7eb',
                },
                fontFamily: {
                  sans: ['Inter', 'sans-serif'],
                }
              }
            }
          }
        `}} />
        <style dangerouslySetInnerHTML={{__html: `
          html, body { 
            margin: 0; 
            padding: 0; 
            height: 100vh; 
            box-sizing: border-box;
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
            background-color: white; 
            font-size: 11px; 
            line-height: 1.4; 
          }
          @page { size: A4 portrait; margin: 0; }
          .a4-container {
            height: 100vh;
            display: flex;
            flex-direction: column;
            padding: 8mm 12mm;
            box-sizing: border-box;
          }
          .table-header { border-bottom: 2px solid #111827; border-top: 2px solid #111827; }
          .table-row { border-bottom: 1px solid #e5e7eb; }
          .avoid-break { break-inside: avoid; }
        `}} />
      </head>
      <body className="font-sans text-textMain antialiased">
        <div className="a4-container">
          {/* Top Accent Strip - inside container to avoid overflow */}
          <div className="absolute top-0 left-0 w-full h-2 bg-brand"></div>
          
          {/* HEADER */}
          <div className="flex justify-between items-start mb-6 border-b border-borderSoft pb-4">
            {/* Logo area */}
            <div className="flex flex-col">
              {invoice.logo ? (
                <img src={invoice.logo} alt="Mehta Dairy" className="w-56 object-contain" />
              ) : (
                <h1 className="text-4xl font-extrabold text-brand tracking-tight">Mehta Dairy</h1>
              )}
            </div>

            {/* Invoice Meta */}
            <div className="text-right flex flex-col justify-end">
              <h2 className="text-2xl font-bold text-textMain tracking-tight mb-2">TAX INVOICE</h2>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-textMuted justify-end">
                <span className="font-semibold text-textMain text-right">Invoice No:</span>
                <span className="text-right text-textMain font-medium">{invoice.invoiceNo}</span>
                <span className="font-semibold text-textMain text-right">Order No:</span>
                <span className="text-right font-medium">{invoice.orderNo}</span>
                <span className="font-semibold text-textMain text-right">Date:</span>
                <span className="text-right font-medium">{invoice.date}</span>
              </div>
            </div>
          </div>

          {/* CUSTOMER & SELLER BLOCK */}
          <div className="flex justify-between gap-6 mb-6">
            {/* Seller */}
            <div className="w-1/2 p-3 bg-brandLight border border-borderSoft rounded-md">
              <h3 className="text-[10px] font-bold text-textMuted uppercase tracking-wider mb-2">Sold By</h3>
              <p className="font-bold text-[13px] text-brandDark mb-1">Mehta Dairy & Sweet Mart</p>
              <div className="text-textMuted flex flex-col gap-0.5">
                <p>Taleti Rd, Navagadh, Jeshar</p>
                <p>Palitana, Gujarat - 364270</p>
                <div className="flex items-center gap-1.5 mt-1.5 text-textMain">
                  <PhoneIcon /> <span className="font-medium">+91 99132 52232</span>
                </div>
                <div className="flex items-center gap-1.5 text-textMain">
                  <GlobeIcon /> <span>www.mehtadairy.com</span>
                </div>
              </div>
            </div>

            {/* Buyer */}
            <div className="w-1/2 p-3 bg-brandLight border border-borderSoft rounded-md">
              <h3 className="text-[10px] font-bold text-textMuted uppercase tracking-wider mb-2">Bill To</h3>
              <p className="font-bold text-[13px] text-textMain mb-1">{invoice.customer.name}</p>
              <div className="text-textMuted flex flex-col gap-0.5">
                <p className="whitespace-pre-wrap leading-relaxed">{invoice.customer.address}</p>
                <div className="flex items-center gap-1.5 mt-1.5 text-textMain">
                  <PhoneIcon /> <span className="font-medium">+91 {invoice.customer.phone}</span>
                </div>
                {invoice.customer.email && (
                  <div className="flex items-center gap-1.5 text-textMain">
                    <MailIcon /> <span>{invoice.customer.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* PRODUCT TABLE */}
          <div className="mb-6 w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="table-header">
                  <th className="py-2 px-2 text-brand font-bold text-[10px] tracking-wider">PRODUCTS</th>
                  <th className="py-2 px-2 text-brand font-bold text-[10px] tracking-wider text-center">WEIGHT</th>
                  <th className="py-2 px-2 text-brand font-bold text-[10px] tracking-wider text-center">QTY</th>
                  <th className="py-2 px-2 text-brand font-bold text-[10px] tracking-wider text-right">PRICE</th>
                  <th className="py-2 px-2 text-brand font-bold text-[10px] tracking-wider text-right">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="table-row">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-3">
                        {item.image && (
                          <img src={item.image} className="w-10 h-10 object-cover rounded border border-gray-200 shadow-sm" />
                        )}
                        <div>
                          <p className="font-bold text-[12px] text-textMain">{item.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center text-textMuted">{item.weight}</td>
                    <td className="py-3 px-2 text-center font-bold text-textMain">{item.qty}</td>
                    <td className="py-3 px-2 text-right text-textMuted">₹{item.price.toFixed(2)}</td>
                    <td className="py-3 px-2 text-right font-bold text-textMain">₹{item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAYMENT & TOTALS */}
          <div className="flex justify-between items-start gap-8 mb-4 avoid-break">
            {/* Payment & QR */}
            <div className="w-1/2 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] uppercase font-bold text-textMuted tracking-wider">Payment Mode:</span>
                <span className="font-bold text-textMain uppercase">{invoice.paymentMethod}</span>
                <span className={`${paymentBg} text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wide inline-flex items-center gap-1 ml-2`}>
                  {isPaid && <CheckCircleIcon />}{invoice.paymentStatus}
                </span>
              </div>
              
              {invoice.qr && (
                <div className="flex items-start gap-3 mt-2">
                  <div className="p-1 border border-borderSoft rounded-md bg-white">
                    <img src={invoice.qr} className="w-[90px] h-[90px] mix-blend-multiply" />
                  </div>
                  <div className="flex flex-col justify-center text-[10px] text-textMuted mt-1 space-y-1">
                    <p className="flex items-center gap-1">▪ Scan to Reorder</p>
                    <p className="flex items-center gap-1">▪ Track Order</p>
                    <p className="flex items-center gap-1">▪ Download Invoice</p>
                    <p className="flex items-center gap-1">▪ Contact Support</p>
                  </div>
                </div>
              )}

              {/* GST details if needed */}
              {invoice.gst > 0 && (
                <div className="mt-4 text-[10px] text-textMuted">
                  <span className="font-semibold text-textMain">GSTIN:</span> 24ABCDE1234F1Z5 &nbsp;|&nbsp; 
                  <span className="font-semibold text-textMain"> State:</span> 24 (Gujarat) &nbsp;|&nbsp; 
                  <span className="font-semibold text-textMain"> HSN:</span> 17049090
                </div>
              )}
            </div>

            {/* Totals Block */}
            <div className="w-[45%] flex flex-col">
              <div className="flex justify-between py-1.5 text-[12px]">
                <span className="font-bold text-textMain">SUB TOTAL</span>
                <span className="font-bold">₹{invoice.subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between py-1.5 border-b border-borderSoft text-[12px]">
                <span className="text-textMuted uppercase font-semibold">Delivery Charges</span>
                <span className="text-textMuted">+ ₹{invoice.delivery.toFixed(2)}</span>
              </div>
              
              {invoice.discount > 0 && (
                <div className="flex justify-between py-1.5 border-b border-borderSoft text-[12px]">
                  <span className="text-textMuted uppercase font-semibold">Discount</span>
                  <span className="text-green-600">- ₹{invoice.discount.toFixed(2)}</span>
                </div>
              )}

              {invoice.gst > 0 && (
                <div className="flex justify-between py-1.5 border-b border-borderSoft text-[11px] text-textMuted">
                  <span>Includes GST (18%)</span>
                  <span>₹{invoice.gst.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between py-3 border-b-2 border-textMain mt-1">
                <span className="font-extrabold text-[15px] text-textMain">TOTAL</span>
                <span className="font-extrabold text-[15px] text-textMain">₹{invoice.grandTotal.toFixed(2)}</span>
              </div>
              
              <div className="text-right mt-2 text-[10px] text-textMuted italic">
                Amount in words: Rupees {numberToWords(Math.round(invoice.grandTotal))}
              </div>
            </div>
          </div>

          {/* ADDED SECTIONS: Delivery & Summary */}
          <div className="flex justify-between gap-6 mb-4 mt-2 avoid-break">
            <div className="w-1/2 bg-gray-50 p-3 rounded-md border border-gray-200">
              <h3 className="text-[10px] uppercase font-bold text-textMain tracking-wider mb-2">Delivery Details</h3>
              <div className="grid grid-cols-2 gap-y-1 text-[10px] text-textMuted">
                <span className="font-semibold text-textMain">Delivery Type:</span><span>Home Delivery</span>
                <span className="font-semibold text-textMain">Order Status:</span><span>Confirmed</span>
                <span className="font-semibold text-textMain">Delivery Date:</span><span>{invoice.date}</span>
                <span className="font-semibold text-textMain">Branch Name:</span><span>Palitana Main</span>
              </div>
            </div>
            <div className="w-1/2 bg-gray-50 p-3 rounded-md border border-gray-200">
              <h3 className="text-[10px] uppercase font-bold text-textMain tracking-wider mb-2">Order Summary</h3>
              <div className="grid grid-cols-2 gap-y-1 text-[10px] text-textMuted">
                <span className="font-semibold text-textMain">Number of Items:</span><span>{invoice.items.length} (Total Qty: {totalQty})</span>
                <span className="font-semibold text-textMain">Payment Method:</span><span>{invoice.paymentMethod}</span>
                <span className="font-semibold text-textMain">Delivery Charges:</span><span>₹{invoice.delivery.toFixed(2)}</span>
                <span className="font-semibold text-textMain">Coupon:</span><span>{invoice.discount > 0 ? 'Applied' : 'None'}</span>
              </div>
            </div>
          </div>

          {/* LARGE THANK YOU SECTION */}
          <div className="flex flex-col items-center justify-center my-4 avoid-break">
            <h2 className="text-xl font-bold text-brandDark mb-1">Thank you for your order!</h2>
            <p className="text-textMuted italic text-sm">Serving sweetness since 1972.</p>
          </div>

          {/* SPACER to push footer down */}
          <div className="flex-1"></div>

          {/* BOTTOM FOOTER SECTION (Avoid Break) */}
          <div className="avoid-break mt-4">
            {/* Terms and Verification */}
            <div className="flex justify-between items-start border-t border-borderSoft pt-3 pb-4">
              <div className="w-[60%]">
                <p className="font-bold text-[10px] text-textMain uppercase tracking-wider mb-1">Terms & Conditions</p>
                <ul className="list-disc pl-3 text-[10px] text-textMuted space-y-0.5">
                  <li>Goods once sold cannot be returned or exchanged.</li>
                  <li>In case of any discrepancies, please contact customer support within 24 hours.</li>
                  <li>Subject to Palitana jurisdiction only.</li>
                </ul>
              </div>
              
              <div className="text-right w-[40%] flex flex-col items-end">
                <p className="font-bold text-[10px] text-textMain uppercase tracking-wider mb-2">Invoice Verification</p>
                <div className="border border-green-200 bg-green-50 text-green-700 px-3 py-1.5 rounded-md text-[9px] font-bold">
                  Digitally Generated Invoice
                </div>
                <p className="text-[9px] text-textMuted mt-1">No Signature Required</p>
              </div>
            </div>

            {/* Contact Footer Bar */}
            <div className="bg-brandLight border border-borderSoft rounded flex justify-between items-center px-6 py-2.5">
              <div className="flex items-center gap-2 text-textMain font-medium text-[11px]">
                <PhoneIcon /> <span>+91 99132 52232</span>
              </div>
              <div className="w-[1px] h-4 bg-borderSoft"></div>
              <div className="flex items-center gap-2 text-textMain font-medium text-[11px]">
                <WhatsappIcon /> <span>WhatsApp Support</span>
              </div>
              <div className="w-[1px] h-4 bg-borderSoft"></div>
              <div className="flex items-center gap-2 text-textMain font-medium text-[11px]">
                <GlobeIcon /> <span>www.mehtadairy.com</span>
              </div>
            </div>
          </div>

        </div>
      </body>
    </html>
  );
}
