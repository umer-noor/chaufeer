const nodemailer = require("nodemailer");

const isEmailConfigured = () => {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
  );
};

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST.trim(),
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    requireTLS: true,
    auth: {
      user: process.env.SMTP_USER.trim(),
      pass: process.env.SMTP_PASS.trim(),
    },
  });
};

const formatServiceType = (serviceType) => {
  return serviceType.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

const sendBookingConfirmationEmail = async (booking, user) => {
  if (!isEmailConfigured()) {
    console.warn("Email not configured. Skipping booking confirmation email.");
    return;
  }

  const transporter = createTransporter();
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;

  const mailOptions = {
    from,
    to: booking.user_email,
    subject: "Chaufeer - Booking Confirmation",
    html: `
      <h2>Booking Confirmed</h2>
      <p>Hello ${user.full_name || "Customer"},</p>
      <p>Your ride has been booked successfully.</p>
      <table border="1" cellpadding="8" cellspacing="0">
        <tr><td><strong>Service</strong></td><td>${formatServiceType(booking.service_type)}</td></tr>
        <tr><td><strong>Pick Up</strong></td><td>${booking.pickup_location || booking.pick_up_location}</td></tr>
        <tr><td><strong>Drop Off</strong></td><td>${booking.dropoff_location || booking.drop_off_location}</td></tr>
        <tr><td><strong>Vehicle</strong></td><td>${booking.fleet_name || booking.class || "-"}</td></tr>
        <tr><td><strong>Date & Time</strong></td><td>${new Date(booking.date_and_time).toLocaleString()}</td></tr>
        <tr><td><strong>Passengers</strong></td><td>${booking.passengers_count ?? booking.passengers ?? 0}</td></tr>
        <tr><td><strong>Children</strong></td><td>${booking.children_count ?? booking.childs ?? 0}</td></tr>
        <tr><td><strong>Email</strong></td><td>${booking.user_email}</td></tr>
      </table>
      <p>Thank you for choosing Chaufeer.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`Booking confirmation email sent to ${booking.user_email}`);
};

const sendGetInTouchEmail = async (inquiry) => {
  if (!isEmailConfigured()) {
    console.warn("Email not configured. Skipping get in touch email.");
    return;
  }

  const transporter = createTransporter();
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;

  const mailOptions = {
    from,
    to: inquiry.email_address,
    subject: "Chaufeer - We Received Your Request",
    html: `
      <h2>Request a Callback</h2>
      <p>Hello ${inquiry.full_name},</p>
      <p>Thank you for contacting Chaufeer. We have received your request and will get back to you shortly.</p>
      <table border="1" cellpadding="8" cellspacing="0">
        <tr><td><strong>Name</strong></td><td>${inquiry.full_name}</td></tr>
        <tr><td><strong>Phone</strong></td><td>${inquiry.phone_number}</td></tr>
        <tr><td><strong>Email</strong></td><td>${inquiry.email_address}</td></tr>
        <tr><td><strong>Message</strong></td><td>${inquiry.note}</td></tr>
      </table>
      <p>Thank you for choosing Chaufeer.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`Get in touch email sent to ${inquiry.email_address}`);
};

const sendOtpEmail = async ({ email, full_name, otp, purpose = "password reset" }) => {
  if (!isEmailConfigured()) {
    console.warn("Email not configured. Skipping OTP email.");
    return;
  }

  const transporter = createTransporter();
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
  const expiryMinutes = Number(process.env.OTP_EXPIRES_MINUTES) || 10;

  const mailOptions = {
    from,
    to: email,
    subject: "Chaufeer - Verification Code",
    html: `
      <h2>Your Verification Code</h2>
      <p>Hello ${full_name || "User"},</p>
      <p>Use the following 6-digit code for ${purpose}:</p>
      <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px;">${otp}</p>
      <p>This code expires in ${expiryMinutes} minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
      <p>Thank you,<br/>Chaufeer Team</p>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`OTP email sent to ${email}`);
};

module.exports = {
  sendBookingConfirmationEmail,
  sendGetInTouchEmail,
  sendOtpEmail,
  isEmailConfigured,
};
