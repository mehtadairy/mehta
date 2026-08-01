import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface AccountLockedTemplateProps {
  userIdentifier: string;
  resetUrl: string;
}

export const AccountLockedTemplate = ({
  userIdentifier,
  resetUrl,
}: AccountLockedTemplateProps) => (
  <Html>
    <Head />
    <Preview>Security Alert: Your Mehta Dairy account has been temporarily locked</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoContainer}>
          <Text style={logoText}>Mehta Dairy Security Alert</Text>
        </Section>
        <Heading style={h1}>Security Notice: Account Temporarily Locked</Heading>
        <Text style={text}>
          We detected multiple consecutive failed sign-in attempts for your account (<strong>{userIdentifier}</strong>).
        </Text>
        <Text style={text}>
          To protect your privacy and security, your account has been temporarily locked for <strong>15 minutes</strong>.
        </Text>
        <Section style={buttonContainer}>
          <Link href={resetUrl} style={button}>
            Reset Your Password
          </Link>
        </Section>
        <Text style={text}>
          If you attempted to log in, you may try again after 15 minutes or reset your password immediately using the link above.
        </Text>
        <Text style={subtext}>
          If you did not perform these sign-in attempts, we strongly recommend resetting your password right away.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default AccountLockedTemplate;

const main = {
  backgroundColor: "#f6f9fc",
  padding: "10px 0",
};

const container = {
  backgroundColor: "#ffffff",
  border: "1px solid #f0f0f0",
  padding: "45px",
};

const logoContainer = {
  display: "flex",
  justifyContent: "center",
  width: "100%",
  marginBottom: "20px",
  textAlign: "center" as const,
};

const logoText = {
  fontSize: "22px",
  fontWeight: "bold",
  color: "#DC2626",
  margin: "0",
};

const h1 = {
  color: "#1F2937",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: "20px",
  fontWeight: "bold",
  marginBottom: "15px",
};

const text = {
  fontSize: "15px",
  fontFamily:
    "'Open Sans', 'HelveticaNeue-Light', 'Helvetica Neue Light', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  color: "#4B5563",
  lineHeight: "24px",
};

const subtext = {
  fontSize: "13px",
  fontFamily: "sans-serif",
  color: "#6B7280",
  marginTop: "20px",
  lineHeight: "20px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "25px 0",
};

const button = {
  backgroundColor: "#D97706",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};
