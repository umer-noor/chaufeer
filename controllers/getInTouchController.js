const getInTouchService = require("../services/getInTouchService");

const formatInquiry = (inquiry) => ({
  id: inquiry._id,
  full_name: inquiry.full_name,
  phone_number: inquiry.phone_number,
  email_address: inquiry.email_address,
  note: inquiry.note,
  createdAt: inquiry.createdAt,
  updatedAt: inquiry.updatedAt,
});

const getInTouch = async (req, res, next) => {
  try {
    const { full_name, phone_number, email_address, note } = req.body;

    if (!full_name || !phone_number || !email_address || !note) {
      return res.status(400).json({
        success: false,
        message: "full_name, phone_number, email_address, and note are required",
      });
    }

    const inquiry = await getInTouchService.getInTouch({
      full_name,
      phone_number,
      email_address,
      note,
    });

    res.status(201).json({
      success: true,
      message: "Request submitted successfully",
      data: formatInquiry(inquiry),
    });
  } catch (error) {
    next(error);
  }
};

const getInquiries = async (req, res, next) => {
  try {
    const inquiries = await getInTouchService.getAllInquiries();

    res.status(200).json({
      success: true,
      count: inquiries.length,
      data: inquiries.map(formatInquiry),
    });
  } catch (error) {
    next(error);
  }
};

const getInquiry = async (req, res, next) => {
  try {
    const inquiry = await getInTouchService.getInquiryById(req.params.id);

    if (!inquiry) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    res.status(200).json({
      success: true,
      data: formatInquiry(inquiry),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInTouch,
  getInquiries,
  getInquiry,
};
