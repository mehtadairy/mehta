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

interface OrderDeliveredEmailProps {
  customerName: string;
  orderNumber: string;
}

export const OrderDeliveredEmail = ({
  customerName = "Customer",
  orderNumber = "12345",
}: OrderDeliveredEmailProps) => {
  const previewText = `Your Order #${orderNumber} has been delivered!`;

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
            <Heading style={heading}>Order Delivered! 🎉</Heading>
            <Text style={text}>Hi {customerName},</Text>
            <Text style={text}>
              Your order <strong>#{orderNumber}</strong> has been successfully delivered.
            </Text>
            <Text style={text}>
              We hope you enjoy your premium sweets! Your satisfaction is our top priority.
            </Text>

            <Section style={buttonContainer}>
              <Link href={BUSINESS.whatsappUrl()} style={primaryButton}>
                Contact Support
              </Link>
            </Section>

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

export default OrderDeliveredEmail;

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

const buttonContainer = {
  textAlign: 'center' as const,
  marginTop: '24px',
  marginBottom: '24px',
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
