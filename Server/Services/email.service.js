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

export const sendTeacherTimetableEmail = async ({ to, name, rows }) => {
  const transporter = createTransporter();
  const tableRows = rows.map((row) => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #334155;color:#cbd5e1;">${row.section_name}</td>
      <td style="padding:10px;border-bottom:1px solid #334155;color:#cbd5e1;">${row.subject_name}</td>
      <td style="padding:10px;border-bottom:1px solid #334155;color:#cbd5e1;">${row.day}</td>
      <td style="padding:10px;border-bottom:1px solid #334155;color:#cbd5e1;">${String(row.start_time).slice(0, 5)}-${String(row.end_time).slice(0, 5)}</td>
      <td style="padding:10px;border-bottom:1px solid #334155;color:#cbd5e1;">${row.room_no}</td>
    </tr>
  `).join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#0f172a;font-family:Arial,sans-serif;">
      <div style="max-width:760px;margin:32px auto;background:#1e293b;border-radius:14px;overflow:hidden;border:1px solid #334155;">
        <div style="background:#10b981;padding:26px 34px;">
          <h1 style="margin:0;color:#0f172a;font-size:22px;font-weight:800;">Automated Timetable</h1>
          <p style="margin:6px 0 0;color:#064e3b;font-size:14px;">Your latest teaching schedule</p>
        </div>
        <div style="padding:30px 34px;">
          <p style="color:#cbd5e1;font-size:15px;margin:0 0 18px;">Hi <strong style="color:#f8fafc;">${name}</strong>,</p>
          <p style="color:#94a3b8;font-size:14px;margin:0 0 24px;">
            A timetable has been generated successfully. Your assigned classes are listed below.
          </p>
          <table style="width:100%;border-collapse:collapse;background:#0f172a;border:1px solid #334155;border-radius:10px;overflow:hidden;">
            <thead>
              <tr>
                <th style="padding:11px;text-align:left;color:#10b981;border-bottom:1px solid #334155;">Section</th>
                <th style="padding:11px;text-align:left;color:#10b981;border-bottom:1px solid #334155;">Subject</th>
                <th style="padding:11px;text-align:left;color:#10b981;border-bottom:1px solid #334155;">Day</th>
                <th style="padding:11px;text-align:left;color:#10b981;border-bottom:1px solid #334155;">Time</th>
                <th style="padding:11px;text-align:left;color:#10b981;border-bottom:1px solid #334155;">Room</th>
              </tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>
        <div style="padding:18px 34px;border-top:1px solid #334155;text-align:center;">
          <p style="margin:0;color:#64748b;font-size:12px;">Automated Timetable System</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"Timetable System" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Your generated timetable",
    html,
  });
};

export const sendAccountCredentialsEmail = async ({ to, name, role, identifier, password, loginUrl }) => {
  const transporter = createTransporter();
  const roleLabel = role === "teacher" ? "Teacher" : "Student";
  const identLabel = role === "teacher" ? "Email" : "Roll Number";

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
      <div style="max-width:640px;margin:32px auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
        <div style="padding:28px 32px;background:#0f172a;color:#f8fafc;">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#34d399;">Automated Timetable</p>
          <h1 style="margin:0;font-size:24px;line-height:1.25;">Your login credentials</h1>
          <p style="margin:10px 0 0;color:#cbd5e1;font-size:14px;">Use these details to access your timetable account.</p>
        </div>
        <div style="padding:30px 32px;">
          <p style="margin:0 0 20px;font-size:15px;color:#334155;">Hello <strong>${name}</strong>,</p>
          <div style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:22px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:14px 16px;background:#f1f5f9;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;width:34%;">Role</td>
                <td style="padding:14px 16px;font-weight:700;">${roleLabel}</td>
              </tr>
              <tr>
                <td style="padding:14px 16px;background:#f1f5f9;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;">${identLabel}</td>
                <td style="padding:14px 16px;font-family:Consolas,monospace;color:#047857;font-weight:700;">${identifier}</td>
              </tr>
              <tr>
                <td style="padding:14px 16px;background:#f1f5f9;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Temporary Password</td>
                <td style="padding:14px 16px;font-family:Consolas,monospace;color:#b45309;font-weight:800;">${password}</td>
              </tr>
            </table>
          </div>
          <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;padding:14px 16px;margin-bottom:24px;">
            <p style="margin:0;color:#065f46;font-size:13px;">You will be asked to change this password after login.</p>
          </div>
          <a href="${loginUrl}" style="display:inline-block;background:#10b981;color:#06281f;text-decoration:none;font-weight:800;padding:13px 22px;border-radius:9px;">Open Login Page</a>
          <p style="margin:24px 0 0;color:#64748b;font-size:12px;line-height:1.6;">
            If you did not expect this email, please contact your timetable administrator.
          </p>
        </div>
        <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px;">
          Automated Timetable System
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"Timetable System" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Login credentials for your ${roleLabel} account`,
    html,
  });
};
