import nodemailer from "nodemailer";

// Transporter is created lazily (inside the function) so that
// process.env is fully loaded by dotenv before it's read
const createTransporter = () =>
  nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

export const sendCredentialsEmail = async ({ to, name, role, identifier, password, loginUrl }) => {
  const transporter = createTransporter();
  const roleLabel   = role === "teacher" ? "Teacher" : "Student";
  const identLabel  = role === "teacher" ? "Email"   : "Roll Number";

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#0f172a;font-family:Arial,sans-serif;">
      <div style="max-width:520px;margin:40px auto;background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">
        <div style="background:#10b981;padding:32px 40px;text-align:center;">
          <h1 style="margin:0;color:#0f172a;font-size:24px;font-weight:800;">🗓️ Automated Timetable</h1>
          <p style="margin:8px 0 0;color:#065f46;font-size:14px;">Your account is ready</p>
        </div>
        <div style="padding:36px 40px;">
          <p style="color:#94a3b8;font-size:15px;margin:0 0 24px;">Hi <strong style="color:#f1f5f9;">${name}</strong>,</p>
          <p style="color:#94a3b8;font-size:14px;margin:0 0 28px;">
            Your <strong style="color:#10b981;">${roleLabel}</strong> account has been created.
            Use the credentials below to log in.
          </p>
          <div style="background:#0f172a;border-radius:12px;padding:24px;margin-bottom:28px;border:1px solid #1e3a5f;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="color:#64748b;font-size:12px;padding:8px 0;text-transform:uppercase;letter-spacing:1px;">Role</td>
                <td style="color:#f1f5f9;font-size:14px;font-weight:600;padding:8px 0;">${roleLabel}</td>
              </tr>
              <tr>
                <td style="color:#64748b;font-size:12px;padding:8px 0;text-transform:uppercase;letter-spacing:1px;">${identLabel}</td>
                <td style="color:#10b981;font-size:14px;font-weight:700;font-family:monospace;padding:8px 0;">${identifier}</td>
              </tr>
              <tr>
                <td style="color:#64748b;font-size:12px;padding:8px 0;text-transform:uppercase;letter-spacing:1px;">Temp Password</td>
                <td style="color:#f59e0b;font-size:14px;font-weight:700;font-family:monospace;padding:8px 0;">${password}</td>
              </tr>
            </table>
          </div>
          <div style="background:#451a03;border:1px solid #92400e;border-radius:8px;padding:14px 18px;margin-bottom:28px;">
            <p style="margin:0;color:#fbbf24;font-size:13px;">
              ⚠️ <strong>You will be asked to change your password on first login.</strong>
            </p>
          </div>
          <div style="text-align:center;margin-bottom:28px;">
            <a href="${loginUrl}" style="background:#10b981;color:#0f172a;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:700;font-size:15px;display:inline-block;">
              Login Now →
            </a>
          </div>
          <p style="color:#475569;font-size:12px;text-align:center;margin:0;">
            If you didn't expect this email, please contact your administrator.
          </p>
        </div>
        <div style="padding:20px 40px;border-top:1px solid #1e293b;text-align:center;">
          <p style="margin:0;color:#334155;font-size:12px;">Automated Timetable System</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from:    `"Timetable System" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Your ${roleLabel} Account Credentials — Automated Timetable`,
    html,
  });
};