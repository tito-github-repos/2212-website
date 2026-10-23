import StudentConfirmation from "@/templates/studentConfirmation";
import { resend } from "./resend";
import AdminNotification from "@/templates/adminNotification";
import PaymentConfirmation from "@/templates/paymentConfirmation";
import PaymentAdminNotification from "@/templates/paymentAdminNotification";
import BookOrderConfirmation from "@/templates/bookOrderConfirmation";
import BookOrderAdminNotification from "@/templates/bookOrderAdminNotification";

interface StudentConfirmationData {
  name: string;
  email: string;
}

interface AdminNotificationData {
  name: string;
  email: string;
  mobile: string;
}

interface PaymentDetails {
  productLabel: string;
  amountText: string;
  paymentId: string;
  paidOn: string;
  validTill: string;
}

interface BookOrderDetails {
  productLabel: string;
  amountText: string;
  paymentId: string;
  paidOn: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export async function sendStudentConfirmation(data: StudentConfirmationData) {
  await resend.emails.send({
    from: process.env.FROM_EMAIL!,
    to: data.email,
    subject: "2212 Registration Confirmation",
    react: <StudentConfirmation {...data} />,
  });
}

export async function sendAdminNotification(data: AdminNotificationData) {
  await resend.emails.send({
    from: process.env.FROM_EMAIL!,
    to: process.env.ADMIN_EMAIL!,
    subject: "New 2212 Registration",
    react: <AdminNotification {...data} />,
  });
}

export async function sendPaymentConfirmation(
  data: { name: string; email: string } & PaymentDetails,
) {
  const { email, ...rest } = data;
  await resend.emails.send({
    from: process.env.FROM_EMAIL!,
    to: email,
    subject: "2212 Payment Confirmation",
    react: <PaymentConfirmation {...rest} />,
  });
}

export async function sendPaymentAdminNotification(
  data: { name: string; email: string; mobile: string } & PaymentDetails,
) {
  await resend.emails.send({
    from: process.env.FROM_EMAIL!,
    to: process.env.ADMIN_EMAIL!,
    subject: "New 2212 Payment Received",
    react: <PaymentAdminNotification {...data} />,
  });
}

// Book order: confirmation to the buyer, with the delivery address
export async function sendBookOrderConfirmation(
  data: { name: string; email: string } & BookOrderDetails,
) {
  const { email, ...rest } = data;
  await resend.emails.send({
    from: process.env.FROM_EMAIL!,
    to: email,
    subject: "2212 Book Order Confirmation",
    react: <BookOrderConfirmation {...rest} />,
  });
}

// Book order: shipping details for the team
export async function sendBookOrderAdminNotification(
  data: { name: string; email: string; mobile: string } & BookOrderDetails,
) {
  await resend.emails.send({
    from: process.env.FROM_EMAIL!,
    to: process.env.ADMIN_EMAIL!,
    subject: "New 2212 Book Order - Please Ship",
    react: <BookOrderAdminNotification {...data} />,
  });
}