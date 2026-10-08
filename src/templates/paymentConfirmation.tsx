import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Row,
  Column,
  Section,
  Text,
} from "@react-email/components";

interface PaymentConfirmationProps {
  name: string;
  productLabel: string;
  amountText: string;
  paymentId: string;
  paidOn: string;
  validTill: string;
}

export default function PaymentConfirmation({
  name,
  productLabel,
  amountText,
  paymentId,
  paidOn,
  validTill,
}: PaymentConfirmationProps) {
  return (
    <Html>
      <Head />
      <Preview>Your 2212 payment was successful</Preview>

      <Body
        style={{
          backgroundColor: "#f5f7fa",
          fontFamily: "Arial, sans-serif",
          padding: "30px 0",
        }}
      >
        <Container
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            backgroundColor: "#ffffff",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            padding: "30px",
          }}
        >
          <Heading
            style={{
              color: "#0f766e",
              fontSize: "26px",
              marginBottom: "20px",
            }}
          >
            Payment Successful ✅
          </Heading>

          <Text>
            Dear <strong>{name}</strong>,
          </Text>

          <Text>
            Thank you! We have received your payment for{" "}
            <strong>{productLabel}</strong>. You are also eligible to join the
            2212 competitions.
          </Text>

          <Section
            style={{
              backgroundColor: "#f4faf9",
              borderRadius: "8px",
              padding: "16px 20px",
              margin: "20px 0",
            }}
          >
            <Row>
              <Column>
                <Text style={{ margin: "6px 0" }}>
                  <strong>Amount paid:</strong> {amountText}
                </Text>
                <Text style={{ margin: "6px 0" }}>
                  <strong>Payment ID:</strong> {paymentId}
                </Text>
                <Text style={{ margin: "6px 0" }}>
                  <strong>Paid on:</strong> {paidOn}
                </Text>
                <Text style={{ margin: "6px 0" }}>
                  <strong>Valid until:</strong> {validTill}
                </Text>
              </Column>
            </Row>
          </Section>

          <Text>
            Our team will contact you shortly with further details. If you have
            any questions, feel free to contact us.
          </Text>

          <Section
            style={{
              marginTop: "30px",
              borderTop: "1px solid #e5e7eb",
              paddingTop: "20px",
            }}
          >
            <Text style={{ fontWeight: "bold", color: "#0f172a" }}>
              2212 Website Team
            </Text>

            <Text style={{ fontSize: "13px", color: "#64748b" }}>
              2212.co.in
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}