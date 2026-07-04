const axios = require("axios");

const FATORA_API_URL = process.env.FATORA_API_URL || "https://api.fatora.io/v1";

const getApiKey = () => {
  const apiKey = process.env.FATORA_API_KEY;

  if (!apiKey) {
    const error = new Error("Fatora API key is not configured");
    error.statusCode = 500;
    throw error;
  }

  return apiKey;
};

const getFatoraClient = () => {
  return axios.create({
    baseURL: FATORA_API_URL,
    headers: {
      "Content-Type": "application/json",
      api_key: getApiKey(),
    },
  });
};

const createCheckout = async ({
  amount,
  currency,
  orderId,
  clientName,
  clientEmail,
  clientPhone,
  successUrl,
  failureUrl,
  note,
  language = "en",
}) => {
  const client = getFatoraClient();

  const payload = {
    amount: Number(amount),
    currency: currency || process.env.FATORA_CURRENCY || "QAR",
    order_id: orderId,
    client: {
      name: clientName,
      email: clientEmail,
    },
    language,
    success_url: successUrl,
    failure_url: failureUrl,
    note,
  };

  if (clientPhone) {
    payload.client.phone = clientPhone;
  }

  try {
    const response = await client.post("/payments/checkout", payload);
    const data = response.data;

    if (data.status !== "SUCCESS" || !data.result?.checkout_url) {
      const error = new Error(data.error?.description || "Failed to create Fatora checkout session");
      error.statusCode = 502;
      throw error;
    }

    return data.result.checkout_url;
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }

    const message =
      error.response?.data?.error?.description ||
      error.response?.data?.message ||
      error.message;

    const fatoraError = new Error(message);
    fatoraError.statusCode = error.response?.status || 502;
    throw fatoraError;
  }
};

const verifyPayment = async ({ orderId, transactionId }) => {
  const client = getFatoraClient();

  const payload = { order_id: orderId };

  if (transactionId) {
    payload.transaction_id = transactionId;
  }

  try {
    const response = await client.post("/payments/verify", payload);
    const data = response.data;

    if (data.status !== "SUCCESS" || !data.result) {
      const error = new Error(data.error?.description || "Failed to verify Fatora payment");
      error.statusCode = 502;
      throw error;
    }

    return data.result;
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }

    const message =
      error.response?.data?.error?.description ||
      error.response?.data?.message ||
      error.message;

    const fatoraError = new Error(message);
    fatoraError.statusCode = error.response?.status || 502;
    throw fatoraError;
  }
};

module.exports = {
  createCheckout,
  verifyPayment,
};
