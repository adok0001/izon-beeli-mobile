const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

const FROM_EMAIL = process.env.EMAIL_FROM ?? "noreply@beeli.app";
const FROM_NAME = process.env.EMAIL_FROM_NAME ?? "Beeli";

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailMessage {
  to: EmailRecipient;
  subject: string;
  htmlContent: string;
  textContent: string;
}

export async function sendEmail(message: EmailMessage): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn("[email] BREVO_API_KEY not set — skipping email");
    return false;
  }

  try {
    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: FROM_NAME, email: FROM_EMAIL },
        to: [message.to],
        subject: message.subject,
        htmlContent: message.htmlContent,
        textContent: message.textContent,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("[email] Brevo API error:", response.status, text);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] Failed to send email:", err);
    return false;
  }
}

// ---- HTML email templates ----

function emailWrapper(title: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">
        <tr><td style="background:#1d4ed8;padding:24px 32px;">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">Beeli</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          ${body}
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0 24px;">
          <p style="margin:0;color:#9ca3af;font-size:12px;">
            You're receiving this because you have email notifications enabled in Beeli.
            <br>To unsubscribe, open the Beeli app and go to Settings → Notifications.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function ctaButton(text: string): string {
  return `<a href="https://beeli.app" style="display:inline-block;background:#1d4ed8;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:24px;">${text}</a>`;
}

export function wordOfDayEmailHtml(name: string, word: string, english: string, languageId: string): string {
  const body = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">Word of the Day</h2>
    <p style="margin:0 0 24px;color:#6b7280;">Hello ${name},</p>
    <div style="background:#eff6ff;border-left:4px solid #1d4ed8;padding:20px 24px;border-radius:4px;">
      <p style="margin:0 0 4px;font-size:28px;font-weight:700;color:#1d4ed8;">${word}</p>
      <p style="margin:0;font-size:18px;color:#374151;">${english}</p>
      <p style="margin:8px 0 0;font-size:13px;color:#6b7280;text-transform:capitalize;">${languageId}</p>
    </div>
    ${ctaButton("Open Beeli")}`;
  return emailWrapper("Word of the Day", body);
}

export function wordOfDayEmailText(name: string, word: string, english: string): string {
  return `Word of the Day\n\nHello ${name},\n\nToday's word: ${word}\nTranslation: ${english}\n\nOpen Beeli to practice: https://beeli.app\n\nTo unsubscribe, go to Settings → Notifications in the Beeli app.`;
}

export function streakReminderEmailHtml(name: string, streak: number): string {
  const body = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">Keep your streak alive! 🔥</h2>
    <p style="margin:0 0 24px;color:#6b7280;">Hello ${name},</p>
    <p style="margin:0 0 16px;color:#374151;font-size:16px;">
      You have a <strong>${streak}-day streak</strong> — don't let it end today!
    </p>
    <p style="margin:0 0 8px;color:#374151;">Complete at least one lesson to keep your streak going.</p>
    ${ctaButton("Practice Now")}`;
  return emailWrapper("Keep your streak alive!", body);
}

export function streakReminderEmailText(name: string, streak: number): string {
  return `Keep your streak alive!\n\nHello ${name},\n\nYou have a ${streak}-day streak — don't let it end today!\n\nComplete a lesson now: https://beeli.app\n\nTo unsubscribe, go to Settings → Notifications in the Beeli app.`;
}

export function assignmentDueEmailHtml(name: string, lessonTitle: string, dueDate: Date): string {
  const formatted = dueDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const body = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">Assignment Due Tomorrow</h2>
    <p style="margin:0 0 24px;color:#6b7280;">Hello ${name},</p>
    <p style="margin:0 0 16px;color:#374151;font-size:16px;">
      A lesson assignment is due soon:
    </p>
    <div style="background:#fef3c7;border-left:4px solid #d97706;padding:20px 24px;border-radius:4px;">
      <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#92400e;">${lessonTitle}</p>
      <p style="margin:0;font-size:14px;color:#78350f;">Due: ${formatted}</p>
    </div>
    ${ctaButton("Complete Assignment")}`;
  return emailWrapper("Assignment Due Tomorrow", body);
}

export function assignmentDueEmailText(name: string, lessonTitle: string, dueDate: Date): string {
  const formatted = dueDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  return `Assignment Due Tomorrow\n\nHello ${name},\n\nYour assignment "${lessonTitle}" is due on ${formatted}.\n\nComplete it now: https://beeli.app\n\nTo unsubscribe, go to Settings → Notifications in the Beeli app.`;
}

export function contributionStatusEmailHtml(name: string, word: string, status: "approved" | "rejected", note?: string | null): string {
  const approved = status === "approved";
  const color = approved ? "#15803d" : "#dc2626";
  const bg = approved ? "#f0fdf4" : "#fef2f2";
  const border = approved ? "#16a34a" : "#dc2626";
  const emoji = approved ? "🎉" : "📝";
  const headline = approved ? `Your contribution was approved ${emoji}` : `Contribution update ${emoji}`;

  const body = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">${headline}</h2>
    <p style="margin:0 0 24px;color:#6b7280;">Hello ${name},</p>
    <div style="background:${bg};border-left:4px solid ${border};padding:20px 24px;border-radius:4px;">
      <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:${color};">${word}</p>
      <p style="margin:0;font-size:14px;color:${color};text-transform:capitalize;">${status}</p>
      ${note ? `<p style="margin:12px 0 0;font-size:14px;color:#374151;"><strong>Note:</strong> ${note}</p>` : ""}
    </div>
    ${approved ? `<p style="margin:16px 0 0;color:#374151;">XP has been added to your account. Keep contributing!</p>` : ""}
    ${ctaButton("Open Beeli")}`;
  return emailWrapper(headline, body);
}

export function contributionStatusEmailText(name: string, word: string, status: "approved" | "rejected", note?: string | null): string {
  const headline = status === "approved" ? "Your contribution was approved!" : "Contribution update";
  let text = `${headline}\n\nHello ${name},\n\nYour contribution "${word}" has been ${status}.`;
  if (note) text += `\n\nNote: ${note}`;
  if (status === "approved") text += "\n\nXP has been added to your account!";
  text += "\n\nOpen Beeli: https://beeli.app\n\nTo unsubscribe, go to Settings → Notifications in the Beeli app.";
  return text;
}

export function reviewerApplicationStatusEmailHtml(name: string, status: "approved" | "rejected", note?: string | null): string {
  const approved = status === "approved";
  const emoji = approved ? "🎉" : "📝";
  const headline = approved ? `Reviewer access granted ${emoji}` : `Reviewer application update ${emoji}`;
  const color = approved ? "#15803d" : "#dc2626";
  const bg = approved ? "#f0fdf4" : "#fef2f2";
  const border = approved ? "#16a34a" : "#dc2626";

  const body = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">${headline}</h2>
    <p style="margin:0 0 24px;color:#6b7280;">Hello ${name},</p>
    <div style="background:${bg};border-left:4px solid ${border};padding:20px 24px;border-radius:4px;">
      <p style="margin:0;font-size:16px;color:${color};">
        ${approved
          ? "Your reviewer application has been approved. You now have access to review contributions in Beeli."
          : "Your reviewer application was not approved at this time."}
      </p>
      ${note ? `<p style="margin:12px 0 0;font-size:14px;color:#374151;"><strong>Note:</strong> ${note}</p>` : ""}
    </div>
    ${ctaButton("Open Beeli")}`;
  return emailWrapper(headline, body);
}

export function reviewerApplicationStatusEmailText(name: string, status: "approved" | "rejected", note?: string | null): string {
  const headline = status === "approved" ? "Reviewer access granted!" : "Reviewer application update";
  let text = `${headline}\n\nHello ${name},\n\n`;
  text += status === "approved"
    ? "Your reviewer application has been approved. You now have access to review contributions in Beeli."
    : "Your reviewer application was not approved at this time.";
  if (note) text += `\n\nNote: ${note}`;
  text += "\n\nOpen Beeli: https://beeli.app\n\nTo unsubscribe, go to Settings → Notifications in the Beeli app.";
  return text;
}

export function newReviewerApplicationEmailHtml(
  adminName: string,
  applicantName: string,
  applicantEmail: string,
  role: string,
  languages: string[]
): string {
  const langList = languages.length > 0 ? languages.join(", ") : "Not specified";
  const body = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:20px;">New Reviewer Application</h2>
    <p style="margin:0 0 24px;color:#6b7280;">Hello ${adminName},</p>
    <p style="margin:0 0 16px;color:#374151;">A new reviewer application has been submitted and is awaiting your review.</p>
    <div style="background:#eff6ff;border-left:4px solid #1d4ed8;padding:20px 24px;border-radius:4px;">
      <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#1e3a8a;">${applicantName}</p>
      <p style="margin:0 0 4px;font-size:14px;color:#374151;"><strong>Email:</strong> ${applicantEmail}</p>
      <p style="margin:0 0 4px;font-size:14px;color:#374151;"><strong>Role:</strong> ${role}</p>
      <p style="margin:0;font-size:14px;color:#374151;"><strong>Languages:</strong> ${langList}</p>
    </div>
    ${ctaButton("Review Application")}`;
  return emailWrapper("New Reviewer Application", body);
}

export function newReviewerApplicationEmailText(
  adminName: string,
  applicantName: string,
  applicantEmail: string,
  role: string,
  languages: string[]
): string {
  const langList = languages.length > 0 ? languages.join(", ") : "Not specified";
  return `New Reviewer Application\n\nHello ${adminName},\n\nA new reviewer application has been submitted.\n\nApplicant: ${applicantName}\nEmail: ${applicantEmail}\nRole: ${role}\nLanguages: ${langList}\n\nReview it in Beeli: https://beeli.app\n`;
}
