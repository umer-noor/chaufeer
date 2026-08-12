const FixedPrice = require("../models/FixedPrice");
const HourlyPrice = require("../models/HourlyPrice");
const PriceQuote = require("../models/PriceQuote");
const Fleet = require("../models/Fleet");
const { haversineKm } = require("../utils/distance");
const {
  LONG_DISTANCE_KM,
  QUOTE_TTL_MINUTES,
} = require("../models/PriceQuote");

const DEFAULT_CURRENCY = process.env.MYFATOORAH_CURRENCY || "KWD";

const ensureFleetExists = async (fleet_id) => {
  if (!fleet_id) {
    const error = new Error("fleet_id is required");
    error.statusCode = 400;
    throw error;
  }

  const fleet = await Fleet.findById(fleet_id);

  if (!fleet) {
    const error = new Error("Fleet not found");
    error.statusCode = 404;
    throw error;
  }

  return fleet;
};

const resolveDistanceKm = (data) => {
  if (data.distance_km !== undefined && data.distance_km !== null && data.distance_km !== "") {
    const km = Number(data.distance_km);
    if (Number.isNaN(km) || km < 0) {
      const error = new Error("distance_km must be a valid non-negative number");
      error.statusCode = 400;
      throw error;
    }
    return km;
  }

  const { pickup_latitude, pickup_longitude, dropoff_latitude, dropoff_longitude } = data;

  if (
    [pickup_latitude, pickup_longitude, dropoff_latitude, dropoff_longitude].some(
      (v) => v === undefined || v === null || v === ""
    )
  ) {
    const error = new Error(
      "Provide distance_km or pickup_latitude, pickup_longitude, dropoff_latitude, dropoff_longitude"
    );
    error.statusCode = 400;
    throw error;
  }

  return haversineKm(
    Number(pickup_latitude),
    Number(pickup_longitude),
    Number(dropoff_latitude),
    Number(dropoff_longitude)
  );
};

const isHourlyRequest = (data) => {
  if (data.pricing_type === "hourly") {
    return true;
  }

  if (data.service_type === "hourly_service") {
    return true;
  }

  if (data.hours !== undefined && data.hours !== null && Number(data.hours) > 0) {
    return true;
  }

  return false;
};

const expireQuoteIfNeeded = async (quote) => {
  if (!quote) {
    return quote;
  }

  if (quote.status === "awaiting_admin" && quote.expires_at < new Date()) {
    quote.status = "expired";
    await quote.save();
  }

  return quote;
};

// ---------- Fixed price CRUD (edge case 2) ----------
const createFixedPrice = async ({ fleet_id, price, currency, is_active }) => {
  await ensureFleetExists(fleet_id);

  const existing = await FixedPrice.findOne({ fleet_id });
  if (existing) {
    const error = new Error("Fixed price already exists for this fleet. Use update instead.");
    error.statusCode = 400;
    throw error;
  }

  return FixedPrice.create({
    fleet_id,
    price: Number(price),
    currency: currency || DEFAULT_CURRENCY,
    is_active: is_active !== undefined ? is_active : true,
  });
};

const getFixedPrices = async () => {
  return FixedPrice.find().populate("fleet_id", "vehicle_name vehicle_type category").sort({
    created_at: -1,
  });
};

const getFixedPriceById = async (id) => {
  return FixedPrice.findById(id).populate("fleet_id", "vehicle_name vehicle_type category");
};

const getFixedPriceByFleet = async (fleet_id) => {
  return FixedPrice.findOne({ fleet_id, is_active: true });
};

const updateFixedPrice = async (id, data) => {
  if (data.fleet_id) {
    await ensureFleetExists(data.fleet_id);
  }

  return FixedPrice.findByIdAndUpdate(id, data, { new: true, runValidators: true }).populate(
    "fleet_id",
    "vehicle_name vehicle_type category"
  );
};

const deleteFixedPrice = async (id) => {
  return FixedPrice.findByIdAndDelete(id);
};

// ---------- Hourly price CRUD (edge case 3) ----------
const createHourlyPrice = async ({ fleet_id, price_per_hour, currency, is_active }) => {
  await ensureFleetExists(fleet_id);

  const existing = await HourlyPrice.findOne({ fleet_id });
  if (existing) {
    const error = new Error("Hourly price already exists for this fleet. Use update instead.");
    error.statusCode = 400;
    throw error;
  }

  return HourlyPrice.create({
    fleet_id,
    price_per_hour: Number(price_per_hour),
    currency: currency || DEFAULT_CURRENCY,
    is_active: is_active !== undefined ? is_active : true,
  });
};

const getHourlyPrices = async () => {
  return HourlyPrice.find().populate("fleet_id", "vehicle_name vehicle_type category").sort({
    created_at: -1,
  });
};

const getHourlyPriceById = async (id) => {
  return HourlyPrice.findById(id).populate("fleet_id", "vehicle_name vehicle_type category");
};

const updateHourlyPrice = async (id, data) => {
  if (data.fleet_id) {
    await ensureFleetExists(data.fleet_id);
  }

  return HourlyPrice.findByIdAndUpdate(id, data, { new: true, runValidators: true }).populate(
    "fleet_id",
    "vehicle_name vehicle_type category"
  );
};

const deleteHourlyPrice = async (id) => {
  return HourlyPrice.findByIdAndDelete(id);
};

// ---------- Quote / calculate (all 3 edge cases) ----------
const createQuote = async (user, data) => {
  // Edge case 3: hourly — ignore distance rules
  if (isHourlyRequest(data)) {
    const hours = Number(data.hours);

    if (!hours || hours <= 0) {
      const error = new Error("hours is required and must be greater than 0 for hourly pricing");
      error.statusCode = 400;
      throw error;
    }

    await ensureFleetExists(data.fleet_id);

    const hourly = await HourlyPrice.findOne({ fleet_id: data.fleet_id, is_active: true });

    if (!hourly) {
      const error = new Error("No hourly price configured for this fleet. Admin must add it first.");
      error.statusCode = 404;
      throw error;
    }

    const amount = Math.round(hourly.price_per_hour * hours * 1000) / 1000;

    return {
      pricing_mode: "hourly",
      status: "priced",
      requires_admin_price: false,
      fleet_id: data.fleet_id,
      hours,
      price_per_hour: hourly.price_per_hour,
      amount,
      currency: hourly.currency || DEFAULT_CURRENCY,
      distance_km: null,
      quote_id: null,
      expires_at: null,
      message: "Hourly pricing applied",
    };
  }

  const distance_km = resolveDistanceKm(data);

  // Edge case 2: <= 45km fixed price
  if (distance_km <= LONG_DISTANCE_KM) {
    await ensureFleetExists(data.fleet_id);

    const fixed = await FixedPrice.findOne({ fleet_id: data.fleet_id, is_active: true });

    if (!fixed) {
      const error = new Error(
        "No fixed price configured for this fleet. Admin must add fixed price first."
      );
      error.statusCode = 404;
      throw error;
    }

    return {
      pricing_mode: "fixed",
      status: "priced",
      requires_admin_price: false,
      fleet_id: data.fleet_id,
      hours: null,
      price_per_hour: null,
      amount: fixed.price,
      currency: fixed.currency || DEFAULT_CURRENCY,
      distance_km,
      quote_id: null,
      expires_at: null,
      message: `Fixed price for distance ${distance_km} km (≤ ${LONG_DISTANCE_KM} km)`,
    };
  }

  // Edge case 1: > 45km — admin must set price within 15 minutes
  const expires_at = new Date(Date.now() + QUOTE_TTL_MINUTES * 60 * 1000);

  const quote = await PriceQuote.create({
    user: user._id,
    fleet_id: data.fleet_id || null,
    pickup_latitude:
      data.pickup_latitude !== undefined ? Number(data.pickup_latitude) : null,
    pickup_longitude:
      data.pickup_longitude !== undefined ? Number(data.pickup_longitude) : null,
    dropoff_latitude:
      data.dropoff_latitude !== undefined ? Number(data.dropoff_latitude) : null,
    dropoff_longitude:
      data.dropoff_longitude !== undefined ? Number(data.dropoff_longitude) : null,
    pickup_location: data.pickup_location || "",
    dropoff_location: data.dropoff_location || "",
    distance_km,
    pricing_mode: "long_distance",
    status: "awaiting_admin",
    currency: DEFAULT_CURRENCY,
    expires_at,
  });

  return {
    pricing_mode: "long_distance",
    status: "awaiting_admin",
    requires_admin_price: true,
    fleet_id: quote.fleet_id,
    hours: null,
    price_per_hour: null,
    amount: null,
    currency: quote.currency,
    distance_km,
    quote_id: quote._id,
    expires_at: quote.expires_at,
    message: `Distance ${distance_km} km > ${LONG_DISTANCE_KM} km. Waiting for admin price (expires in ${QUOTE_TTL_MINUTES} minutes).`,
  };
};

const getQuoteById = async (quoteId, user) => {
  let quote = await PriceQuote.findById(quoteId).populate(
    "fleet_id",
    "vehicle_name vehicle_type category"
  );

  if (!quote) {
    const error = new Error("Quote not found");
    error.statusCode = 404;
    throw error;
  }

  if (
    user.role !== "admin" &&
    quote.user.toString() !== user._id.toString()
  ) {
    const error = new Error("Not authorized to view this quote");
    error.statusCode = 403;
    throw error;
  }

  quote = await expireQuoteIfNeeded(quote);

  return quote;
};

const getPendingQuotes = async () => {
  const now = new Date();

  await PriceQuote.updateMany(
    { status: "awaiting_admin", expires_at: { $lt: now } },
    { $set: { status: "expired" } }
  );

  return PriceQuote.find({ status: "awaiting_admin" })
    .populate("fleet_id", "vehicle_name vehicle_type category")
    .populate("user", "full_name email phone_number")
    .sort({ created_at: -1 });
};

const setQuotePrice = async (quoteId, adminUser, { amount, fleet_id, admin_note }) => {
  let quote = await PriceQuote.findById(quoteId);

  if (!quote) {
    const error = new Error("Quote not found");
    error.statusCode = 404;
    throw error;
  }

  quote = await expireQuoteIfNeeded(quote);

  if (quote.status === "expired") {
    const error = new Error(
      "Quote expired. Admin did not set price within 15 minutes. User must request a new quote."
    );
    error.statusCode = 400;
    throw error;
  }

  if (quote.status !== "awaiting_admin") {
    const error = new Error(`Quote cannot be priced (status: ${quote.status})`);
    error.statusCode = 400;
    throw error;
  }

  if (amount === undefined || amount === null || Number(amount) < 0) {
    const error = new Error("amount is required and must be >= 0");
    error.statusCode = 400;
    throw error;
  }

  if (fleet_id) {
    await ensureFleetExists(fleet_id);
    quote.fleet_id = fleet_id;
  }

  quote.amount = Number(amount);
  quote.status = "priced";
  quote.priced_by = adminUser._id;
  quote.admin_note = admin_note || "";
  await quote.save();

  return quote.populate("fleet_id", "vehicle_name vehicle_type category");
};

module.exports = {
  createFixedPrice,
  getFixedPrices,
  getFixedPriceById,
  getFixedPriceByFleet,
  updateFixedPrice,
  deleteFixedPrice,
  createHourlyPrice,
  getHourlyPrices,
  getHourlyPriceById,
  updateHourlyPrice,
  deleteHourlyPrice,
  createQuote,
  getQuoteById,
  getPendingQuotes,
  setQuotePrice,
  LONG_DISTANCE_KM,
  QUOTE_TTL_MINUTES,
};
