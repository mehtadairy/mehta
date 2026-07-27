import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Row,
  Column,
  Link
} from '@react-email/components';
import * as React from 'react';
import { BUSINESS } from '@/lib/businessConfig';

interface AdminOrderNotificationEmailProps {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress: string;
  totalAmount: string;
  paymentStatus: string;
  items: Array<{ name: string; quantity: number; price: string }>;
}

export const AdminOrderNotificationEmail = ({
  orderNumber = "12345",
  customerName = "Aryan Rathod",
  customerPhone = "9316688014",
  customerEmail = "aryan@email.com",
  deliveryAddress = "123 Street, City",
  totalAmount = "860",
  paymentStatus = "Paid",
  items = []
}: AdminOrderNotificationEmailProps) => {
  const previewText = `🚨 New Order Alert: #${orderNumber} from ${customerName}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>{BUSINESS.shortName} - Admin</Text>
          </Section>

          <Section style={contentSection}>
            <Heading style={heading}>🚨 New Order Received!</Heading>
            <Text style={text}>
              A new order has been placed by <strong>{customerName}</strong>.
            </Text>

            <Section style={detailsSection}>
              <Row style={detailRow}>
                <Column><Text style={detailsLabel}>Order ID:</Text></Column>
                <Column><Text style={detailsValue}>#{orderNumber}</Text></Column>
              </Row>
              <Row style={detailRow}>
                <Column><Text style={detailsLabel}>Total Amount:</Text></Column>
                <Column><Text style={detailsValueBold}>₹{totalAmount}</Text></Column>
              </Row>
              <Row style={detailRow}>
                <Column><Text style={detailsLabel}>Payment Status:</Text></Column>
                <Column><Text style={detailsValueBold}>{paymentStatus}</Text></Column>
              </Row>
            </Section>

            <Hr style={hr} />

            <Heading as="h3" style={subheading}>Customer Details</Heading>
            <Text style={text}><strong>Name:</strong> {customerName}</Text>
            <Text style={text}><strong>Phone:</strong> {customerPhone}</Text>
            <Text style={text}><strong>Email:</strong> {customerEmail}</Text>
            <Text style={text}><strong>Address:</strong><br/>{deliveryAddress}</Text>

            <Hr style={hr} />

            <Heading as="h3" style={subheading}>Items Ordered</Heading>
            <Section style={orderTable}>
              {items.map((item, idx) => (
                <Row key={idx} style={itemRow}>
                  <Column style={itemDetails}>
                    <Text style={itemName}>{item.name}</Text>
                    <Text style={itemQuantity}>Qty: {item.quantity}</Text>
                  </Column>
                  <Column style={itemPriceContainer}>
                    <Text style={itemPrice}>₹{item.price}</Text>
                  </Column>
                </Row>
              ))}
            </Section>
            
            <Section style={buttonContainer}>
              <Link href="https://mehtadairy.com/admin" style={primaryButton}>
                Open Admin Dashboard
              </Link>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default AdminOrderNotificationEmail;

// --- Styles ---
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  width: '100%',
  maxWidth: '600px',
};

const header = {
  backgroundColor: '#dc2626', // Red for admin alerts
  padding: '20px',
  textAlign: 'center' as const,
  borderRadius: '8px 8px 0 0',
};

const logoText = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
};

const contentSection = {
  backgroundColor: '#ffffff',
  padding: '30px',
  borderRadius: '0 0 8px 8px',
  border: '1px solid #e5e7eb',
  borderTop: 'none',
};

const heading = {
  fontSize: '22px',
  fontWeight: 'bold',
  color: '#111827',
  margin: '0 0 16px',
};

const subheading = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#374151',
  margin: '0 0 12px',
};

const text = {
  fontSize: '14px',
  lineHeight: '24px',
  color: '#4b5563',
  margin: '0 0 8px',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '20px 0',
};

const detailsSection = {
  backgroundColor: '#f3f4f6',
  padding: '16px',
  borderRadius: '6px',
  marginTop: '16px',
};

const detailRow = {
  marginBottom: '8px',
};

const detailsLabel = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0',
};

const detailsValue = {
  fontSize: '14px',
  color: '#111827',
  margin: '0',
  textAlign: 'right' as const,
};

const detailsValueBold = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#111827',
  margin: '0',
  textAlign: 'right' as const,
};

const orderTable = {
  width: '100%',
};

const itemRow = {
  marginBottom: '12px',
  borderBottom: '1px solid #f3f4f6',
  paddingBottom: '8px',
};

const itemDetails = {
  width: '80%',
};

const itemName = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#111827',
  margin: '0',
};

const itemQuantity = {
  fontSize: '12px',
  color: '#6b7280',
  margin: '4px 0 0',
};

const itemPriceContainer = {
  width: '20%',
  textAlign: 'right' as const,
};

const itemPrice = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#111827',
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  marginTop: '24px',
};

const primaryButton = {
  backgroundColor: '#111827',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '14px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};
