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
        
        <View style={[globalStyles.row, globalStyles.spaceBetween, globalStyles.container]}>
          <CustomerCard customer={invoice.customer} />
          <SellerCard />
        </View>
        
        <ProductTable items={invoice.items} />
        
        <View style={[globalStyles.row, globalStyles.spaceBetween, globalStyles.container, { marginTop: 20 }]} wrap={false}>
          <View style={[globalStyles.row, globalStyles.spaceBetween, { width: '52%' }]}>
            <PaymentCard 
              method={invoice.paymentMethod} 
              status={invoice.paymentStatus} 
              date={invoice.date} 
              qr={invoice.qr} 
            />
            {invoice.gst > 0 && <GSTCard gstNumber="24XXXXXXXXXXX" />}
          </View>
          <View style={{ width: '45%' }}>
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
