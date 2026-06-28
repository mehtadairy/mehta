'use client';

import { Printer, Download, ArrowLeft, Package } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function InvoiceActionBar({ invoiceNumber }: { invoiceNumber: string }) {
  const router = useRouter();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full bg-white border-b border-gray-200 shadow-sm print:hidden sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-gray-900 flex items-center gap-2">
            <span className="text-gray-400 font-normal hidden sm:inline">Invoice</span>
            {invoiceNumber}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link 
            href={`/reorder?id=${encodeURIComponent(invoiceNumber)}`}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition-colors"
          >
            <Package className="w-4 h-4" />
            Track / Reorder
          </Link>
          
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-[#d97706] hover:bg-[#b45309] text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Save PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>

          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>

      </div>
    </div>
  );
}
