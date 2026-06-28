import React from 'react';
import { Document, Page, View } from '@react-pdf/renderer';
import { styles as globalStyles } from './invoiceStyles';
import { InvoiceData } from './types';

// Components
import { InvoiceHeader } from './InvoiceHeader';
import { CustomerCard } from './CustomerCard';
import { SellerCard } from './SellerCard';
import { ProductTable } from './ProductTable';
import { PaymentCard } from './PaymentCard';
import { GSTCard } from './GSTCard';
import { TotalCard } from './TotalCard';
import { ThankYouSection } from './ThankYouSection';
import { ContactCards } from './ContactCards';
import { Footer } from './Footer';

interface InvoiceTemplateProps {
  invoice: InvoiceData;
}

const InvoiceTemplate = ({ invoice }: InvoiceTemplateProps) => {
  return (
    <Document>
      <Page size="A4" style={globalStyles.page}>
        <View style={globalStyles.topStrip} fixed />
        
        <InvoiceHeader 
          invoiceNo={invoice.invoiceNo} 
          orderNo={invoice.orderNo} 
          date={invoice.date} 
          logo={invoice.logo} 
        />
        
        <View style={[globalStyles.row, globalStyles.spaceBetween, globalStyles.container, { marginBottom: 24 }]}>
          <SellerCard />
          <CustomerCard customer={invoice.customer} />
        </View>
        
        <ProductTable items={invoice.items} />
        
        <View style={[globalStyles.row, globalStyles.spaceBetween, globalStyles.container, { marginTop: 32 }]} wrap={false}>
          <PaymentCard 
            method={invoice.paymentMethod} 
            status={invoice.paymentStatus} 
            date={invoice.date} 
            qr={invoice.qr}
            grandTotal={invoice.grandTotal}
          />
          <View style={{ width: '48%' }}>
            <TotalCard 
              subtotal={invoice.subtotal}
              delivery={invoice.delivery}
              discount={invoice.discount}
              gst={invoice.gst}
              grandTotal={invoice.grandTotal}
            />
          </View>
        </View>
        
        <ThankYouSection />
        
        <ContactCards />
        
        <Footer />
      </Page>
    </Document>
  );
};

export default InvoiceTemplate;
