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

interface BookOrderConfirmationProps {
  name: string;
  productLabel: string;
  amountText: string;
  paymentId: string;
  paidOn: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export default function BookOrderConfirmation({
  name,
  productLabel,
  amountText,
  paymentId,
  paidOn,
  address,
  city,
  state,
  pincode,
}: BookOrderConfirmationProps) {
  return (
    <Html>
      <Head />
      <Preview>Your 2212 book order is confirmed</Preview>

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
            Order Confirmed ✅
          </Heading>

          <Text>
            Dear <strong>{name}</strong>,
          </Text>

          <Text>
            Thank you! We have received your payment for{" "}
            <strong>{productLabel}</strong>. Our team will send your book by
            courier to the address below.
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
                <Text style={{ margin: "6px 0", fontWeight: "bold" }}>
                  Delivery address
                </Text>
                <Text style={{ margin: "6px 0" }}>{name}</Text>
                <Text style={{ margin: "6px 0" }}>{address}</Text>
                <Text style={{ margin: "6px 0" }}>
                  {city}, {state} - {pincode}
                </Text>
              </Column>
            </Row>
          </Section>

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
              </Column>
            </Row>
          </Section>

          <Text>
            If the address above is wrong or you have any questions, please
            contact us as soon as possible.
          </Text>

          <Section
            style={{
              marginTop: "30px",
              borderTop: "1px solid #e5e7eb",
              paddingTop: "20px",
            }}
          >
            <Text style={{ fontWeight: "bold", color: "#0f172a" }}>
              2212 Team
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