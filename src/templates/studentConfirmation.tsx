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
import type { ReactNode } from "react";

import { PRODUCT_CONFIG } from "@/lib/razorpay";

interface StudentConfirmationProps {
  name: string;
  email: string;
}

// Same links as the "Get the 2212 App" section on the website
const GOOGLE_PLAY_URL =
  "https://play.google.com/store/apps/details?id=com.kids_edu_app";
const APP_STORE_URL = "https://apps.apple.com/in/app/2212/id6756906682";

// The website address shown in the footer and used for its link
const SITE_URL = "https://2212.co.in";
const SITE_LABEL = "2212.co.in";

// Prices come from the payment settings, so the email never goes out of date
const rupees = (paise: number) => `₹${paise / 100}`;

const linkStyle = { color: "#0f766e", fontWeight: "bold" };

function Offer({
  title,
  price,
  children,
}: {
  title: string;
  price: string;
  children: ReactNode;
}) {
  return (
    <Section
      style={{
        backgroundColor: "#f4faf9",
        borderRadius: "8px",
        padding: "12px 18px",
        margin: "0 0 12px 0",
      }}
    >
      <Text style={{ margin: "4px 0", fontWeight: "bold", color: "#0f172a" }}>
        {title} <span style={{ color: "#0f766e" }}>- {price}</span>
      </Text>
      <Text style={{ margin: "4px 0", color: "#475569", fontSize: "14px" }}>
        {children}
      </Text>
    </Section>
  );
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

          <Text>
            Dear <strong>{name}</strong>,
          </Text>

          <Text>
            Thank you for registering for our 2212 Mental Calisthenics. We are
            excited to have you join us! Here is what you can do next:
          </Text>

          <Offer title="2212 Mobile App" price="Free">
            Practise anytime, anywhere. Get it on{" "}
            <Link href={GOOGLE_PLAY_URL} style={linkStyle}>
              Google Play
            </Link>{" "}
            or the{" "}
            <Link href={APP_STORE_URL} style={linkStyle}>
              App Store
            </Link>
            .
          </Offer>

          <Offer
            title="DD Worksheets"
            price={`${rupees(PRODUCT_CONFIG.WORKSHEET.amount)} per year`}
          >
            16 worksheets with questions and answers (PDF), to download for a
            full year.
          </Offer>

          <Offer
            title="DD Web App"
            price={`${rupees(PRODUCT_CONFIG.WEBAPP.amount)} per month`}
          >
            Timed practice tests on all 16 topics, with instant scores.
          </Offer>

          {/* Book box, switched off for now. Uncomment when book orders open.
          <Offer title="DD Workbook + worksheet PDFs" price={rupees(PRODUCT_CONFIG.BOOK.amount)}>
            The DD workbook is delivered to your address, and you can also
            download the worksheet PDFs.
          </Offer>
          */}

          <Text>If you have any questions, feel free to contact us.</Text>

          <Text>We look forward to seeing you at the Competition.</Text>

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
              2212 Team
            </Text>

            <Text
              style={{
                fontSize: "13px",
                color: "#64748b",
              }}
            >
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