import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Row,
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

// The website address shown in the footer and used for its link
const SITE_URL = "https://2212.co.in";
const SITE_LABEL = "2212.co.in";

// Contact details for the scholarship (same as the Contact page)
const CONTACT_EMAIL = "2212users@gmail.com";
const CONTACT_PHONE = "+91 9499953257";

const linkStyle = { color: "#0f766e", fontWeight: "bold" };

const subHeadingStyle = {
  fontWeight: "bold",
  color: "#0f172a",
  margin: "16px 0 6px 0",
};

const listStyle = {
  margin: "0 0 16px 0",
  paddingLeft: "20px",
  color: "#334155",
};

// "What you get" points for each product
const WHAT_YOU_GET = {
  WORKSHEET: [
    "1 year validity",
    "Multiple downloads",
    "16 worksheets with questions and answers (PDF)",
  ],
  WEBAPP: [
    "Timed tests on all 16 topics",
    "Voice answers and instant scores",
    "Multiple practice modes",
    "Your score history",
  ],
};

export default function PaymentConfirmation({
  name,
  productLabel,
  amountText,
  paymentId,
  paidOn,
  validTill,
}: PaymentConfirmationProps) {
  // Pick the right list from the product name
  const type = productLabel.toLowerCase().includes("worksheet")
    ? "WORKSHEET"
    : "WEBAPP";

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
            <strong>{productLabel}</strong>.
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

          <Text style={subHeadingStyle}>What you get</Text>
          <ul style={listStyle}>
            {WHAT_YOU_GET[type].map((item) => (
              <li key={item} style={{ marginBottom: "4px" }}>
                {item}
              </li>
            ))}
          </ul>

          <Text style={subHeadingStyle}>Online coaching scholarship</Text>
          <Text>
            Complete at least 10 of the 16 sheets in less than one minute each
            with a full score, and you become a Qualifier. All Qualifiers are
            eligible for the online coaching classes scholarship. When you
            achieve the status, please contact us at{" "}
            <Link href={`mailto:${CONTACT_EMAIL}`} style={linkStyle}>
              {CONTACT_EMAIL}
            </Link>{" "}
            or{" "}
            <Link
              href={`tel:${CONTACT_PHONE.replace(/\s/g, "")}`}
              style={linkStyle}
            >
              {CONTACT_PHONE}
            </Link>
            .
          </Text>

          <Text>If you have any questions, feel free to contact us.</Text>

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
              <Link
                href={SITE_URL}
                style={{ color: "#0f766e", textDecoration: "underline" }}
              >
                {SITE_LABEL}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}