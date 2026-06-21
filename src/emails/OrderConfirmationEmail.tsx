import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Row,
  Column,
} from '@react-email/components';
import * as React from 'react';

interface OrderConfirmationEmailProps {
  customerName: string;
  orderNumber: string;
  totalAmount: string;
  shippingAmount: string;
  subtotalAmount: string;
  paymentMethod: string;
  deliveryAddress: string;
  items: Array<{ name: string; quantity: number; price: string; image?: string; weight?: string }>;
}

export const OrderConfirmationEmail = ({
  customerName = "Customer",
  orderNumber = "12345",
  totalAmount = "860",
  shippingAmount = "0",
  subtotalAmount = "860",
  paymentMethod = "Online Payment",
  deliveryAddress = "123 Street, City",
  items = []
}: OrderConfirmationEmailProps) => {
  const previewText = `Your Mehta Dairy Order #${orderNumber} is confirmed!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>Mehta Dairy</Text>
            <Text style={tagline}>CRAFTING PREMIUM SWEETS SINCE 1952</Text>
          </Section>

          <Section style={contentSection}>
            <Heading style={heading}>Order Confirmed</Heading>
            <Text style={text}>Dear {customerName},</Text>
            <Text style={text}>
              Thank you for shopping with us! We have received your order <strong>#{orderNumber}</strong> and are currently processing it.
            </Text>

            <Hr style={hr} />

            <Heading as="h3" style={subheading}>Order Details</Heading>
            <Section style={orderTable}>
              {items.map((item, idx) => (
                <Row key={idx} style={itemRow}>
                  <Column style={itemDetails}>
                    <Text style={itemName}>{item.name} {item.weight && `(${item.weight})`}</Text>
                    <Text style={itemQuantity}>Qty: {item.quantity}</Text>
                  </Column>
                  <Column style={itemPriceContainer}>
                    <Text style={itemPrice}>₹{item.price}</Text>
                  </Column>
                </Row>
              ))}
            </Section>

            <Hr style={hr} />

            <Section style={summarySection}>
              <Row>
                <Column><Text style={summaryLabel}>Subtotal:</Text></Column>
                <Column><Text style={summaryValue}>₹{subtotalAmount}</Text></Column>
              </Row>
              <Row>
                <Column><Text style={summaryLabel}>Shipping:</Text></Column>
                <Column><Text style={summaryValue}>₹{shippingAmount}</Text></Column>
              </Row>
              <Row>
                <Column><Text style={summaryLabelBold}>Total:</Text></Column>
                <Column><Text style={summaryValueBold}>₹{totalAmount}</Text></Column>
              </Row>
            </Section>

            <Hr style={hr} />

            <Section style={detailsSection}>
              <Row>
                <Column>
                  <Text style={detailsLabel}>Delivery Address:</Text>
                  <Text style={detailsValue}>{deliveryAddress}</Text>
                </Column>
                <Column>
                  <Text style={detailsLabel}>Payment Method:</Text>
                  <Text style={detailsValue}>{paymentMethod}</Text>
                </Column>
              </Row>
            </Section>

            <Section style={buttonContainer}>
              <Link href="https://mehtadairy.com/tracking" style={primaryButton}>
                Track Your Order
              </Link>
            </Section>
            
            <Section style={buttonContainer}>
              <Link href="https://wa.me/919999999999?text=Hello Mehta Dairy, I need help with my order #${orderNumber}" style={whatsappButton}>
                Chat with us on WhatsApp
              </Link>
            </Section>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              If you have any questions, reply to this email or contact our support team.
            </Text>
            <Text style={footerText}>
              © {new Date().getFullYear()} Mehta Dairy & Sweet Mart. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default OrderConfirmationEmail;

// --- Styles ---
const main = {
  backgroundColor: '#FAF6EE',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  width: '100%',
  maxWidth: '600px',
};

const header = {
  backgroundColor: '#4A2F1F',
  padding: '30px 20px',
  textAlign: 'center' as const,
  borderRadius: '12px 12px 0 0',
};

const logoText = {
  color: '#FAF6EE',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
  fontFamily: 'serif',
};

const tagline = {
  color: '#C9A227',
  fontSize: '10px',
  letterSpacing: '2px',
  margin: '8px 0 0',
  fontWeight: 'bold',
};

const contentSection = {
  backgroundColor: '#ffffff',
  padding: '40px',
  borderRadius: '0 0 12px 12px',
  border: '1px solid #EAE0D3',
  borderTop: 'none',
};

const heading = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#4A2F1F',
  margin: '0 0 20px',
};

const subheading = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#4A2F1F',
  margin: '0 0 16px',
};

const text = {
  fontSize: '14px',
  lineHeight: '24px',
  color: '#555',
  margin: '0 0 16px',
};

const hr = {
  borderColor: '#EAE0D3',
  margin: '24px 0',
};

const orderTable = {
  width: '100%',
};

const itemRow = {
  marginBottom: '12px',
};

const itemDetails = {
  width: '75%',
};

const itemName = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#4A2F1F',
  margin: '0',
};

const itemQuantity = {
  fontSize: '12px',
  color: '#888',
  margin: '4px 0 0',
};

const itemPriceContainer = {
  width: '25%',
  textAlign: 'right' as const,
};

const itemPrice = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#D97706',
  margin: '0',
};

const summarySection = {
  width: '100%',
};

const summaryLabel = {
  fontSize: '14px',
  color: '#888',
  margin: '0 0 8px',
};

const summaryValue = {
  fontSize: '14px',
  color: '#4A2F1F',
  margin: '0 0 8px',
  textAlign: 'right' as const,
};

const summaryLabelBold = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#4A2F1F',
  margin: '8px 0 0',
};

const summaryValueBold = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#D97706',
  margin: '8px 0 0',
  textAlign: 'right' as const,
};

const detailsSection = {
  width: '100%',
  backgroundColor: '#FAF6EE',
  padding: '16px',
  borderRadius: '8px',
};

const detailsLabel = {
  fontSize: '12px',
  fontWeight: 'bold',
  color: '#888',
  margin: '0 0 4px',
  textTransform: 'uppercase' as const,
};

const detailsValue = {
  fontSize: '14px',
  color: '#4A2F1F',
  margin: '0',
  lineHeight: '20px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  marginTop: '24px',
};

const primaryButton = {
  backgroundColor: '#D97706',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '14px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 24px',
  width: '100%',
  boxSizing: 'border-box' as const,
};

const whatsappButton = {
  backgroundColor: '#25D366',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '14px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 24px',
  width: '100%',
  boxSizing: 'border-box' as const,
};

const footer = {
  padding: '30px 20px',
  textAlign: 'center' as const,
};

const footerText = {
  fontSize: '12px',
  color: '#999',
  lineHeight: '20px',
  margin: '0 0 8px',
};
