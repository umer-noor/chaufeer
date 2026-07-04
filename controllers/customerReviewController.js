const customerReviewService = require("../services/customerReviewService");

const formatCustomerReview = (review) => ({
  id: review._id,
  section_title: review.section_title || "",
  section_subtitle: review.section_subtitle || "",
  customer_name: review.customer_name || "",
  customer_image_url: review.customer_image_url || "",
  star_rating: review.star_rating ?? 0,
  review_title: review.review_title || "",
  review_content: review.review_content || "",
  is_active: review.is_active,
  display_order: review.display_order,
  created_at: review.created_at,
  updated_at: review.updated_at,
});

const createCustomerReview = async (req, res, next) => {
  try {
    const review = await customerReviewService.createCustomerReview(req.body);

    res.status(201).json({
      success: true,
      message: "Customer review created successfully",
      data: formatCustomerReview(review),
    });
  } catch (error) {
    next(error);
  }
};

const getCustomerReviews = async (req, res, next) => {
  try {
    const reviews = await customerReviewService.getAllCustomerReviews(req.query);

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews.map(formatCustomerReview),
    });
  } catch (error) {
    next(error);
  }
};

const getCustomerReview = async (req, res, next) => {
  try {
    const review = await customerReviewService.getCustomerReviewById(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: "Customer review not found" });
    }

    res.status(200).json({
      success: true,
      data: formatCustomerReview(review),
    });
  } catch (error) {
    next(error);
  }
};

const updateCustomerReview = async (req, res, next) => {
  try {
    const review = await customerReviewService.updateCustomerReview(req.params.id, req.body);

    if (!review) {
      return res.status(404).json({ success: false, message: "Customer review not found" });
    }

    res.status(200).json({
      success: true,
      message: "Customer review updated successfully",
      data: formatCustomerReview(review),
    });
  } catch (error) {
    next(error);
  }
};

const deleteCustomerReview = async (req, res, next) => {
  try {
    const review = await customerReviewService.deleteCustomerReview(req.params.id);

    if (!review) {
      return res.status(404).json({ success: false, message: "Customer review not found" });
    }

    res.status(200).json({
      success: true,
      message: "Customer review deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCustomerReview,
  getCustomerReviews,
  getCustomerReview,
  updateCustomerReview,
  deleteCustomerReview,
};
