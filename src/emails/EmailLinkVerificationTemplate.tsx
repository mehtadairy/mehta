import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Link,
} from "@react-email/components";
import * as React from "react";

interface EmailLinkVerificationTemplateProps {
  verificationUrl: string;
  name: string;
}

export const EmailLinkVerificationTemplate = ({
  verificationUrl,
  name,
}: EmailLinkVerificationTemplateProps) => (
  <Html>
    <Head />
    <Preview>Verify your email address for Mehta Dairy</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoContainer}>
          <Text style={logoText}>Mehta Dairy</Text>
        </Section>
        <Heading style={h1}>Confirm your email address</Heading>
        <Text style={text}>
          Hello {name},
        </Text>
        <Text style={text}>
          Thank you for choosing Mehta Dairy. Please click the button below to verify your email address and link it to your account.
        </Text>
        <Section style={btnContainer}>
          <Link style={button} href={verificationUrl}>
            Verify Email Address
          </Link>
        </Section>
        <Text style={text}>
          This link will expire in 1 hour. If the button above doesn't work, you can copy and paste the following URL into your web browser:
        </Text>
        <Text style={linkText}>
          {verificationUrl}
        </Text>
        <Text style={text}>
          If you did not request this verification, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default EmailLinkVerificationTemplate;

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
  marginBottom: "30px",
  textAlign: "center" as const,
};

const logoText = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#D97706",
  margin: "0",
};

const h1 = {
  color: "#333",
  fontFamily:
    "'Open Sans', 'HelveticaNeue-Light', 'Helvetica Neue Light', 'Helvetica Neue', Helvetica, Arial, 'Lucida Grande', sans-serif",
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "30px 0",
};

const text = {
  fontSize: "16px",
  fontFamily:
    "'Open Sans', 'HelveticaNeue-Light', 'Helvetica Neue Light', 'Helvetica Neue', Helvetica, Arial, 'Lucida Grande', sans-serif",
  fontWeight: "300",
  color: "#404040",
  lineHeight: "26px",
};

const btnContainer = {
  textAlign: "center" as const,
  margin: "30px 0",
};

const button = {
  backgroundColor: "#D97706",
  borderRadius: "4px",
  color: "#ffffff",
  fontFamily:
    "'Open Sans', 'HelveticaNeue-Light', 'Helvetica Neue Light', 'Helvetica Neue', Helvetica, Arial, 'Lucida Grande', sans-serif",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

const linkText = {
  fontSize: "14px",
  color: "#8B5A2B",
  wordBreak: "break-all" as const,
  textAlign: "center" as const,
  margin: "15px 0",
};
