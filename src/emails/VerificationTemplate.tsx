import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface VerificationTemplateProps {
  validationCode: string;
}

export const VerificationTemplate = ({
  validationCode,
}: VerificationTemplateProps) => (
  <Html>
    <Head />
    <Preview>Your Mehta Dairy Verification Code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoContainer}>
          <Text style={logoText}>Mehta Dairy</Text>
        </Section>
        <Heading style={h1}>Confirm your email address</Heading>
        <Text style={text}>
          Your verification code is below - enter it in your open browser window
          and we'll help you get signed in.
        </Text>
        <Section style={codeBox}>
          <Text style={codeText}>{validationCode}</Text>
        </Section>
        <Text style={text}>
          If you didn't request this email, there's nothing to worry about, you
          can safely ignore it.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default VerificationTemplate;

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

const text = {
  fontSize: "16px",
  fontFamily:
    "'Open Sans', 'HelveticaNeue-Light', 'Helvetica Neue Light', 'Helvetica Neue', Helvetica, Arial, 'Lucida Grande', sans-serif",
  fontWeight: "300",
  color: "#404040",
  lineHeight: "26px",
};

const codeBox = {
  background: "#FAF6EE",
  borderRadius: "4px",
  margin: "16px 0",
  padding: "20px",
};

const codeText = {
  fontSize: "32px",
  margin: "0",
  textAlign: "center" as const,
  fontWeight: "bold",
  color: "#4A2F1F",
  letterSpacing: "4px",
};

const h1 = {
  color: "#333",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: "24px",
  fontWeight: "bold",
  marginBottom: "15px",
};
