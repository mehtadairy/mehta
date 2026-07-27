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
  Link
} from '@react-email/components';
import * as React from 'react';
import { BUSINESS } from '@/lib/businessConfig';

interface OrderCancelledEmailProps {
  customerName: string;
  orderNumber: string;
  reason: string;
  refundPending: boolean;
}

export const OrderCancelledEmail = ({
  customerName = "Customer",
  orderNumber = "12345",
  reason = "Ordered by mistake",
  refundPending = false,
}: OrderCancelledEmailProps) => {
  const previewText = `Your Order #${orderNumber} has been cancelled`;

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
            <Heading style={heading}>Order Cancelled</Heading>
            <Text style={text}>Hi {customerName},</Text>
            <Text style={text}>
              Your order <strong>#{orderNumber}</strong> has been cancelled successfully.
            </Text>
            <Text style={text}>
              <strong>Reason for cancellation:</strong> {reason}
            </Text>
            {refundPending && (
              <Text style={highlightText}>
                Your online payment refund has been initiated and is being processed. It will be credited to your original payment method in 5-7 working days.
              </Text>
            )}

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

export default OrderCancelledEmail;

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
  padding: '40px 30px',
  borderRadius: '0 0 12px 12px',
  border: '1px solid #EAE0D3',
};

const heading = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#4A2F1F',
  margin: '0 0 20px 0',
  fontFamily: 'serif',
};

const text = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#4A2F1F',
  margin: '0 0 16px 0',
};

const highlightText = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#B45309',
  backgroundColor: '#FEF3C7',
  padding: '16px',
  borderRadius: '8px',
  border: '1px solid #FCD34D',
  margin: '16px 0',
};

const hr = {
  borderColor: '#EAE0D3',
  margin: '30px 0',
};

const footer = {
  textAlign: 'center' as const,
  marginTop: '24px',
};

const footerText = {
  fontSize: '12px',
  color: '#7E6B5A',
  margin: '0',
};
