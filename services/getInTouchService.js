const GetInTouch = require("../models/GetInTouch");
const { sendGetInTouchEmail } = require("../utils/sendEmail");

const getInTouch = async (data) => {
  const inquiry = await GetInTouch.create({
    full_name: data.full_name,
    phone_number: data.phone_number,
    email_address: data.email_address,
    note: data.note,
  });

  try {
    await sendGetInTouchEmail(inquiry);
  } catch (error) {
    console.error("Get in touch email failed:", error.message);
  }

  return inquiry;
};

const getAllInquiries = async () => {
  return GetInTouch.find().sort({ createdAt: -1 });
};

const getInquiryById = async (id) => {
  return GetInTouch.findById(id);
};

module.exports = {
  getInTouch,
  getAllInquiries,
  getInquiryById,
};
