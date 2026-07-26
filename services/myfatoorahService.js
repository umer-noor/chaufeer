const axios = require("axios");
const crypto = require("crypto");

const getBaseUrl = () =>
  process.env.MYFATOORAH_BASE_URL || "https://apitest.myfatoorah.com";

const getApiKey = () => {
  const apiKey = process.env.MYFATOORAH_API_KEY;

  if (!apiKey) {
    const error = new Error("MyFatoorah API key is not configured");
    error.statusCode = 500;
    throw error;
  }

  return apiKey;
};

const getClient = () => {
  return axios.create({
    baseURL: getBaseUrl(),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
  });
};

const parsePhone = (phone) => {
  if (!phone) {
    return { countryCode: "965", mobile: "50000000" };
  }

  const digits = String(phone).replace(/\D/g, "");

  if (digits.startsWith("965") && digits.length > 3) {
    return { countryCode: "965", mobile: digits.slice(3) };
  }

  if (digits.startsWith("00") && digits.length > 4) {
    return { countryCode: digits.slice(2, 5), mobile: digits.slice(5) };
  }

  return { countryCode: "965", mobile: digits.slice(-8) || "50000000" };
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
  language = "en",
}) => {
  const { countryCode, mobile } = parsePhone(clientPhone);
  const client = getClient();

  const payload = {
    CustomerName: clientName || "Customer",
    NotificationOption: "LNK",
    InvoiceValue: Number(amount),
    DisplayCurrencyIso: currency || process.env.MYFATOORAH_CURRENCY || "KWD",
    CallBackUrl: successUrl,
    ErrorUrl: failureUrl,
    Language: language === "ar" ? "ar" : "en",
    CustomerEmail: clientEmail,
    CustomerMobile: mobile,
    MobileCountryCode: countryCode,
    CustomerReference: String(orderId),
  };

  try {
    const response = await client.post("/v2/SendPayment", payload);
    const data = response.data;

    if (!data.IsSuccess || !data.Data?.InvoiceURL) {
      const error = new Error(
        data.Message || data.ValidationErrors?.[0]?.Error || "Failed to create MyFatoorah payment"
      );
      error.statusCode = 502;
      throw error;
    }

    return {
      checkout_url: data.Data.InvoiceURL,
      invoice_id: String(data.Data.InvoiceId),
    };
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }

    const message =
      error.response?.data?.Message ||
      error.response?.data?.message ||
      error.message;

    const mfError = new Error(message);
    mfError.statusCode = error.response?.status || 502;
    throw mfError;
  }
};

const getPaymentStatus = async ({ paymentId, invoiceId }) => {
  const client = getClient();

  const payload = paymentId
    ? { Key: String(paymentId), KeyType: "PaymentId" }
    : { Key: String(invoiceId), KeyType: "InvoiceId" };

  try {
    const response = await client.post("/v2/GetPaymentStatus", payload);
    const data = response.data;

    if (!data.IsSuccess || !data.Data) {
      const error = new Error(data.Message || "Failed to verify MyFatoorah payment");
      error.statusCode = 502;
      throw error;
    }

    const invoice = data.Data;
    const invoiceStatus = String(invoice.InvoiceStatus || "").toLowerCase();

    let payment_status = "pending";
    if (invoiceStatus === "paid") {
      payment_status = "SUCCESS";
    } else if (["failed", "expired", "canceled", "cancelled"].includes(invoiceStatus)) {
      payment_status = "FAILURE";
    }

    return {
      payment_status,
      transaction_id: String(invoice.InvoiceId),
      amount: invoice.InvoiceValue,
      currency: invoice.InvoiceDisplayValue?.replace(/[0-9.\s]/g, "") || process.env.MYFATOORAH_CURRENCY || "KWD",
      description: invoice.InvoiceStatus,
      payment_date: invoice.CreatedDate,
      auth_code: invoice.InvoiceReference || null,
      customer_reference: invoice.CustomerReference || null,
      raw: invoice,
    };
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }

    const message =
      error.response?.data?.Message ||
      error.response?.data?.message ||
      error.message;

    const mfError = new Error(message);
    mfError.statusCode = error.response?.status || 502;
    throw mfError;
  }
};

const verifyWebhookSignature = (dataObject, signatureHeader) => {
  const secret = process.env.MYFATOORAH_WEBHOOK_SECRET;

  if (!secret) {
    return true;
  }

  if (!signatureHeader || !dataObject || typeof dataObject !== "object") {
    return false;
  }

  const sortedKeys = Object.keys(dataObject).sort();
  const dataString = sortedKeys.map((key) => `${key}=${dataObject[key]}`).join(",");
  const keyBuffer = Buffer.from(secret, "base64");
  const computed = crypto.createHmac("sha256", keyBuffer).update(dataString).digest("base64");

  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signatureHeader));
  } catch {
    return computed === signatureHeader;
  }
};

module.exports = {
  createCheckout,
  getPaymentStatus,
  verifyWebhookSignature,
};
