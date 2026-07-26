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

interface StudentConfirmationProps {
  name: string;
  email: string;
  
}

export default function StudentConfirmation({
  name,
}: StudentConfirmationProps) {
  return (
    <Html>
      <Head />
      <Preview>Your 2212 Competition Registration is Confirmed 🎉</Preview>

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
            Registration Confirmed 🎉
          </Heading>

          <Text>Dear <strong>{name}</strong>,</Text>

          <Text>
            Thank you for registering for our 2212 Mental Calisthenics. We are excited to have
            you join us!
          </Text>

        

          <Text>
            Our team will contact you shortly with further details.If you have any questions, feel free to
            contact Us.
          </Text>

          <Text>
            We look forward to seeing you at the Competition.
          </Text>

          <Section
            style={{
              marginTop: "30px",
              borderTop: "1px solid #e5e7eb",
              paddingTop: "20px",
            }}
          >
            <Text
              style={{
                fontWeight: "bold",
                color: "#0f172a",
              }}
            >
              2212 Website Team
            </Text>

            <Text
              style={{
                fontSize: "13px",
                color: "#64748b",
              }}
            >
              2212.co.in 
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}