import React from 'react';
import { InvoiceData } from '../invoice/types';
import { 
  UserIcon, PhoneIcon, MailIcon, LocationIcon, 
  StoreIcon, GlobeIcon, CheckCircleIcon, WhatsappIcon 
} from './Icons';

interface Props {
  invoice: InvoiceData;
}

export default function InvoicePrintable({ invoice }: Props) {
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
    <div className="bg-white min-h-screen text-[#111827] font-sans antialiased text-[11px] leading-relaxed w-full print:bg-transparent"
         style={{
           fontFamily: "'Inter', sans-serif"
         }}>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .avoid-break { break-inside: avoid; }
        }
      `}} />
      <div className="h-full flex flex-col p-[8mm_12mm] box-border relative mx-auto w-full max-w-4xl"
           style={{ minHeight: '297mm' }}>
        
        {/* Top Accent Strip */}
        <div className="absolute top-0 left-0 w-full h-2 bg-[#d97706]"></div>
        
        {/* HEADER */}
        <div className="flex justify-between items-start mb-6 border-b border-[#e5e7eb] pb-4 mt-2">
          {/* Logo area */}
          <div className="flex flex-col">
            {invoice.logo ? (
              <img src={invoice.logo} alt="Mehta Dairy" className="w-56 object-contain" />
            ) : (
              <h1 className="text-4xl font-extrabold text-[#d97706] tracking-tight">Mehta Dairy</h1>
            )}
          </div>

          {/* Invoice Meta */}
          <div className="text-right flex flex-col justify-end">
            <h2 className="text-2xl font-bold text-[#111827] tracking-tight mb-2">TAX INVOICE</h2>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-[#4b5563] justify-end">
              <span className="font-semibold text-[#111827] text-right">Invoice No:</span>
              <span className="text-right text-[#111827] font-medium">{invoice.invoiceNo}</span>
              <span className="font-semibold text-[#111827] text-right">Order No:</span>
              <span className="text-right font-medium">{invoice.orderNo}</span>
              <span className="font-semibold text-[#111827] text-right">Date:</span>
              <span className="text-right font-medium">{invoice.date}</span>
            </div>
          </div>
        </div>

        {/* CUSTOMER & SELLER BLOCK */}
        <div className="flex justify-between gap-6 mb-6">
          {/* Seller */}
          <div className="w-1/2 p-3 bg-[#fdfbf9] border border-[#e5e7eb] rounded-md">
            <h3 className="text-[10px] font-bold text-[#4b5563] uppercase tracking-wider mb-2">Sold By</h3>
            <p className="font-bold text-[13px] text-[#b45309] mb-1">Mehta Dairy & Sweet Mart</p>
            <div className="text-[#4b5563] flex flex-col gap-0.5">
              <p>Taleti Rd, Navagadh, Jeshar</p>
              <p>Palitana, Gujarat - 364270</p>
              <div className="flex items-center gap-1.5 mt-1.5 text-[#111827]">
                <PhoneIcon /> <span className="font-medium">+91 99132 52232</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#111827]">
                <GlobeIcon /> <span>www.mehtadairy.com</span>
              </div>
            </div>
          </div>

          {/* Buyer */}
          <div className="w-1/2 p-3 bg-[#fdfbf9] border border-[#e5e7eb] rounded-md">
            <h3 className="text-[10px] font-bold text-[#4b5563] uppercase tracking-wider mb-2">Bill To</h3>
            <p className="font-bold text-[13px] text-[#111827] mb-1">{invoice.customer.name}</p>
            <div className="text-[#4b5563] flex flex-col gap-0.5">
              <p className="whitespace-pre-wrap leading-relaxed">{invoice.customer.address}</p>
              <div className="flex items-center gap-1.5 mt-1.5 text-[#111827]">
                <PhoneIcon /> <span className="font-medium">+91 {invoice.customer.phone}</span>
              </div>
              {invoice.customer.email && (
                <div className="flex items-center gap-1.5 text-[#111827]">
                  <MailIcon /> <span>{invoice.customer.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ITEMS TABLE */}
        <div className="flex-grow">
          <table className="w-full text-left mb-6 border-collapse">
            <thead>
              <tr className="border-b-[2px] border-t-[2px] border-[#111827] text-[#4b5563] font-bold uppercase text-[10px]">
                <th className="py-2.5 px-2 w-[5%]">#</th>
                <th className="py-2.5 px-2 w-[45%]">Item Description</th>
                <th className="py-2.5 px-2 text-center w-[15%]">Weight</th>
                <th className="py-2.5 px-2 text-right w-[10%]">Qty</th>
                <th className="py-2.5 px-2 text-right w-[10%]">Rate</th>
                <th className="py-2.5 px-2 text-right w-[15%]">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => (
                <tr key={idx} className="border-b border-[#e5e7eb]">
                  <td className="py-3 px-2 text-[#4b5563] font-medium">{idx + 1}</td>
                  <td className="py-3 px-2">
                    <p className="font-bold text-[#111827] text-[12px]">{item.name}</p>
                    {item.subtitle && <p className="text-[#4b5563] text-[9.5px] mt-0.5">{item.subtitle}</p>}
                  </td>
                  <td className="py-3 px-2 text-center text-[#4b5563]">{item.weight}</td>
                  <td className="py-3 px-2 text-right font-medium text-[#111827]">{item.qty}</td>
                  <td className="py-3 px-2 text-right text-[#4b5563]">₹{item.price.toFixed(2)}</td>
                  <td className="py-3 px-2 text-right font-bold text-[#111827]">₹{item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FOOTER & TOTALS (Avoid break) */}
        <div className="avoid-break mt-auto">
          <div className="flex justify-between items-start pt-4 border-t border-[#e5e7eb]">
            {/* Left side info */}
            <div className="w-7/12 pr-6">
              <div className="mb-4 text-[10.5px]">
                <p className="font-bold text-[#4b5563] mb-1">Amount in Words:</p>
                <p className="text-[#111827] font-medium italic bg-[#fdfbf9] p-2 rounded border border-[#e5e7eb]">
                  Rupees {numberToWords(invoice.grandTotal)}
                </p>
              </div>

              {invoice.gst > 0 && (
                <div className="text-[#4b5563] text-[9.5px] mb-4">
                  <p>GST/Tax Amount Included: ₹{invoice.gst.toFixed(2)}</p>
                </div>
              )}

              <div className="flex items-center gap-4 text-[10px] text-[#4b5563] mb-4">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#111827]"></span>
                  <span>Keep Refrigerated</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#111827]"></span>
                  <span>Consume within 3 days</span>
                </div>
              </div>
            </div>

            {/* Right side totals */}
            <div className="w-5/12 bg-[#fdfbf9] p-4 rounded-lg border border-[#e5e7eb]">
              <div className="flex justify-between mb-2 pb-2 border-b border-[#e5e7eb] text-[#4b5563]">
                <span>Subtotal</span>
                <span className="font-medium text-[#111827]">₹{invoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2 text-[#4b5563]">
                <span>Total Items / Qty</span>
                <span className="font-medium text-[#111827]">{invoice.items.length} / {totalQty}</span>
              </div>
              <div className="flex justify-between mb-2 text-[#4b5563]">
                <span>Delivery Charge</span>
                <span className="font-medium text-[#111827]">₹{invoice.delivery.toFixed(2)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between mb-2 text-green-600 font-medium">
                  <span>Discount</span>
                  <span>-₹{invoice.discount.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between mt-3 pt-3 border-t-[2px] border-[#111827] text-[14px]">
                <span className="font-bold text-[#111827]">Grand Total</span>
                <span className="font-extrabold text-[#d97706]">₹{invoice.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-end mt-8 border-t-[2px] border-[#111827] pt-4">
            <div className="flex items-center gap-4">
              {invoice.qr && (
                <div className="p-1 border border-[#e5e7eb] rounded bg-white shrink-0">
                  <img src={invoice.qr} alt="QR Code" className="w-[60px] h-[60px]" />
                </div>
              )}
              <div>
                <h4 className="font-bold text-[#111827] text-[12px] flex items-center gap-1.5">
                  <CheckCircleIcon /> Thank you for your business!
                </h4>
                <p className="text-[#4b5563] text-[9.5px] mt-1 max-w-[200px]">Scan this QR code to quickly reorder these exact items.</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="mb-4">
                <p className="text-[#4b5563] text-[9.5px] uppercase tracking-wider font-bold mb-1">Payment Status</p>
                <span className={`inline-block px-3 py-1 rounded-sm text-white font-bold text-[10px] tracking-wide ${paymentBg}`}>
                  {invoice.paymentStatus}
                </span>
                <p className="text-[#4b5563] text-[9.5px] mt-1 font-medium">{invoice.paymentMethod}</p>
              </div>
              <div className="mt-8 border-t border-dashed border-[#4b5563] pt-1 inline-block min-w-[120px]">
                <p className="text-[#4b5563] text-[9px] font-bold text-center">Authorized Signatory</p>
              </div>
            </div>
          </div>
          <div className="text-center text-[9px] text-gray-400 mt-4 font-medium">
            This is a computer generated invoice and does not require a physical signature.
          </div>
        </div>
      </div>
    </div>
  );
}
