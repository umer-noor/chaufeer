require("dotenv").config();

const connectDB = require("../config/db");
const User = require("../models/User");

const ADMINS = [
  {
    full_name: "Admin One",
    email: "admin@chaufeer.com",
    password: "Admin@123",
    phone_number: "+97450000001",
  },
  {
    full_name: "Admin Two",
    email: "admin2@chaufeer.com",
    password: "Admin@123",
    phone_number: "+97450000002",
  },
];

(async () => {
  try {
    await connectDB();

    for (const admin of ADMINS) {
      const existing = await User.findOne({ email: admin.email });

      if (existing) {
        existing.full_name = admin.full_name;
        existing.password = admin.password;
        existing.phone_number = admin.phone_number;
        existing.provider = "local";
        existing.role = "admin";
        existing.is_email_verified = true;
        existing.signup_otp = undefined;
        existing.signup_otp_expires = undefined;
        await existing.save();
        console.log(`Updated admin: ${admin.email}`);
        continue;
      }

      await User.create({
        ...admin,
        provider: "local",
        role: "admin",
        is_email_verified: true,
      });
      console.log(`Created admin: ${admin.email}`);
    }

    console.log("\nAdmin accounts ready:");
    ADMINS.forEach((admin) => {
      console.log(`  ${admin.email} / ${admin.password}`);
    });
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
})();
