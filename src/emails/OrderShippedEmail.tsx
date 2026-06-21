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
  Link,
  Row,
  Column,
} from '@react-email/components';
import * as React from 'react';

interface OrderShippedEmailProps {
  customerName: string;
  orderNumber: string;
  courierName: string;
  trackingNumber: string;
  trackingLink: string;
}

export const OrderShippedEmail = ({
  customerName = "Customer",
  orderNumber = "12345",
  courierName = "Delhivery",
  trackingNumber = "AWB123456789",
  trackingLink = "https://mehtadairy.com/tracking"
}: OrderShippedEmailProps) => {
  const previewText = `Your Order #${orderNumber} has been shipped!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>Mehta Dairy</Text>
          </Section>

          <Section style={contentSection}>
            <Heading style={heading}>Great news, {customerName}!</Heading>
            <Text style={text}>
              Your order <strong>#{orderNumber}</strong> has been shipped and is on its way to you.
            </Text>

            <Section style={trackingBox}>
              <Text style={trackingHeading}>Shipping Details</Text>
              <Row style={trackingRow}>
                <Column><Text style={trackingLabel}>Courier:</Text></Column>
                <Column><Text style={trackingValue}>{courierName}</Text></Column>
              </Row>
              <Row style={trackingRow}>
                <Column><Text style={trackingLabel}>Tracking ID:</Text></Column>
                <Column><Text style={trackingValueBold}>{trackingNumber}</Text></Column>
              </Row>
            </Section>

            <Section style={buttonContainer}>
              <Link href={trackingLink} style={primaryButton}>
                Track Your Order
              </Link>
            </Section>

            <Hr style={hr} />
            
            <Text style={text}>
              Please note that it might take up to 24 hours for the tracking link to become active.
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Mehta Dairy & Sweet Mart. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default OrderShippedEmail;

// --- Styles ---
const main = {
  backgroundColor: '#FAF6EE',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
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
  margin: '0 0 16px',
};

const text = {
  fontSize: '14px',
  lineHeight: '24px',
  color: '#555',
  margin: '0 0 16px',
};

const trackingBox = {
  backgroundColor: '#FAF6EE',
  padding: '20px',
  borderRadius: '8px',
  margin: '24px 0',
  border: '1px solid #EAE0D3',
};

const trackingHeading = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#4A2F1F',
  margin: '0 0 12px',
  textTransform: 'uppercase' as const,
};

const trackingRow = {
  marginBottom: '8px',
};

const trackingLabel = {
  fontSize: '14px',
  color: '#888',
  margin: '0',
};

const trackingValue = {
  fontSize: '14px',
  color: '#4A2F1F',
  margin: '0',
  textAlign: 'right' as const,
};

const trackingValueBold = {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#D97706',
  margin: '0',
  textAlign: 'right' as const,
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

const hr = {
  borderColor: '#EAE0D3',
  margin: '32px 0',
};

const footer = {
  padding: '30px 20px',
  textAlign: 'center' as const,
};

const footerText = {
  fontSize: '12px',
  color: '#999',
  lineHeight: '20px',
  margin: '0',
};
