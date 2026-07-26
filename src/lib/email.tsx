import StudentConfirmation from "@/templates/studentConfirmation";
import { resend } from "./resend";
import AdminNotification from "@/templates/adminNotification";



interface StudentConfirmationData {
  name: string;
  email: string;
}

interface AdminNotificationData {
  name: string;
  email: string;
  mobile: string;
 
}

export async function sendStudentConfirmation(
  data: StudentConfirmationData
) {
  await resend.emails.send({
    from: process.env.FROM_EMAIL!,
    to: data.email,
    subject: "2212 Website Registration Confirmation",
    react: <StudentConfirmation {...data} />,
  });
}

export async function sendAdminNotification(
  data: AdminNotificationData
) {
  await resend.emails.send({
    from: process.env.FROM_EMAIL!,
    to: process.env.ADMIN_EMAIL!,
    subject: "New 2212 Website Registration",
    react: <AdminNotification {...data} />,
  });
}