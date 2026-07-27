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
} from '@react-email/components';
import * as React from 'react';
import { BUSINESS } from '@/lib/businessConfig';

interface PaymentReceivedEmailProps {
  customerName: string;
  orderNumber: string;
  amount: string;
}

export const PaymentReceivedEmail = ({
  customerName = "Customer",
  orderNumber = "12345",
  amount = "860"
}: PaymentReceivedEmailProps) => {
  const previewText = `Payment received for Order #${orderNumber}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logoText}>{BUSINESS.name}</Text>
          </Section>

          <Section style={contentSection}>
            <Heading style={heading}>Payment Successful!</Heading>
            <Text style={text}>Hi {customerName},</Text>
            <Text style={text}>
              We have successfully received your payment of <strong>₹{amount}</strong> for order <strong>#{orderNumber}</strong>.
            </Text>
            <Text style={text}>
              Our team is now processing your order. You will receive another notification once your order is shipped.
            </Text>

            <Hr style={hr} />
            
            <Text style={text}>Thank you for choosing {BUSINESS.name}.</Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} {BUSINESS.name}. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default PaymentReceivedEmail;

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
  color: '#10b981', // Green success color
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
