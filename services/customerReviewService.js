const CustomerReview = require("../models/CustomerReview");

const createCustomerReview = async (data) => {
  return CustomerReview.create(data);
};

const getAllCustomerReviews = async ({ is_active }) => {
  const filter = {};

  if (is_active !== undefined) {
    filter.is_active = is_active === "true" || is_active === true;
  }

  return CustomerReview.find(filter).sort({ display_order: 1, created_at: -1 });
};

const getCustomerReviewById = async (id) => {
  return CustomerReview.findById(id);
};

const updateCustomerReview = async (id, data) => {
  return CustomerReview.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

const deleteCustomerReview = async (id) => {
  return CustomerReview.findByIdAndDelete(id);
};

module.exports = {
  createCustomerReview,
  getAllCustomerReviews,
  getCustomerReviewById,
  updateCustomerReview,
  deleteCustomerReview,
};
