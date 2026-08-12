const pricingService = require("../services/pricingService");

const formatFleet = (fleet) => {
  if (!fleet) return null;
  if (typeof fleet === "string") return { id: fleet };
  return {
    id: fleet._id,
    vehicle_name: fleet.vehicle_name,
    vehicle_type: fleet.vehicle_type,
    category: fleet.category,
  };
};

const formatFixed = (item) => ({
  id: item._id,
  fleet_id: item.fleet_id?._id || item.fleet_id,
  fleet: formatFleet(item.fleet_id),
  price: item.price,
  currency: item.currency,
  is_active: item.is_active,
  created_at: item.created_at,
  updated_at: item.updated_at,
});

const formatHourly = (item) => ({
  id: item._id,
  fleet_id: item.fleet_id?._id || item.fleet_id,
  fleet: formatFleet(item.fleet_id),
  price_per_hour: item.price_per_hour,
  currency: item.currency,
  is_active: item.is_active,
  created_at: item.created_at,
  updated_at: item.updated_at,
});

const formatQuote = (quote) => ({
  id: quote._id,
  fleet_id: quote.fleet_id?._id || quote.fleet_id || null,
  fleet: formatFleet(quote.fleet_id),
  user:
    quote.user && typeof quote.user === "object"
      ? {
          id: quote.user._id,
          full_name: quote.user.full_name,
          email: quote.user.email,
          phone_number: quote.user.phone_number,
        }
      : quote.user,
  pickup_latitude: quote.pickup_latitude,
  pickup_longitude: quote.pickup_longitude,
  dropoff_latitude: quote.dropoff_latitude,
  dropoff_longitude: quote.dropoff_longitude,
  pickup_location: quote.pickup_location,
  dropoff_location: quote.dropoff_location,
  distance_km: quote.distance_km,
  pricing_mode: quote.pricing_mode,
  status: quote.status,
  amount: quote.amount,
  currency: quote.currency,
  admin_note: quote.admin_note,
  expires_at: quote.expires_at,
  created_at: quote.created_at,
  updated_at: quote.updated_at,
});

// ----- Quote (app) -----
const createQuote = async (req, res, next) => {
  try {
    const result = await pricingService.createQuote(req.user, req.body);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getQuote = async (req, res, next) => {
  try {
    const quote = await pricingService.getQuoteById(req.params.id, req.user);

    res.status(200).json({
      success: true,
      data: formatQuote(quote),
    });
  } catch (error) {
    next(error);
  }
};

const getPendingQuotes = async (req, res, next) => {
  try {
    const quotes = await pricingService.getPendingQuotes();

    res.status(200).json({
      success: true,
      count: quotes.length,
      data: quotes.map(formatQuote),
    });
  } catch (error) {
    next(error);
  }
};

const setQuotePrice = async (req, res, next) => {
  try {
    const { amount, fleet_id, admin_note } = req.body;

    if (amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        message: "amount is required",
      });
    }

    const quote = await pricingService.setQuotePrice(req.params.id, req.user, {
      amount,
      fleet_id,
      admin_note,
    });

    res.status(200).json({
      success: true,
      message: "Price set successfully",
      data: formatQuote(quote),
    });
  } catch (error) {
    next(error);
  }
};

// ----- Fixed price CRUD -----
const createFixedPrice = async (req, res, next) => {
  try {
    const { fleet_id, price, currency, is_active } = req.body;

    if (!fleet_id || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "fleet_id and price are required",
      });
    }

    const item = await pricingService.createFixedPrice({
      fleet_id,
      price,
      currency,
      is_active,
    });

    res.status(201).json({
      success: true,
      message: "Fixed price created successfully",
      data: formatFixed(item),
    });
  } catch (error) {
    next(error);
  }
};

const getFixedPrices = async (req, res, next) => {
  try {
    const items = await pricingService.getFixedPrices();

    res.status(200).json({
      success: true,
      count: items.length,
      data: items.map(formatFixed),
    });
  } catch (error) {
    next(error);
  }
};

const getFixedPrice = async (req, res, next) => {
  try {
    const item = await pricingService.getFixedPriceById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: "Fixed price not found" });
    }

    res.status(200).json({ success: true, data: formatFixed(item) });
  } catch (error) {
    next(error);
  }
};

const updateFixedPrice = async (req, res, next) => {
  try {
    const item = await pricingService.updateFixedPrice(req.params.id, req.body);

    if (!item) {
      return res.status(404).json({ success: false, message: "Fixed price not found" });
    }

    res.status(200).json({
      success: true,
      message: "Fixed price updated successfully",
      data: formatFixed(item),
    });
  } catch (error) {
    next(error);
  }
};

const deleteFixedPrice = async (req, res, next) => {
  try {
    const item = await pricingService.deleteFixedPrice(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: "Fixed price not found" });
    }

    res.status(200).json({
      success: true,
      message: "Fixed price deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ----- Hourly price CRUD -----
const createHourlyPrice = async (req, res, next) => {
  try {
    const { fleet_id, price_per_hour, currency, is_active } = req.body;

    if (!fleet_id || price_per_hour === undefined) {
      return res.status(400).json({
        success: false,
        message: "fleet_id and price_per_hour are required",
      });
    }

    const item = await pricingService.createHourlyPrice({
      fleet_id,
      price_per_hour,
      currency,
      is_active,
    });

    res.status(201).json({
      success: true,
      message: "Hourly price created successfully",
      data: formatHourly(item),
    });
  } catch (error) {
    next(error);
  }
};

const getHourlyPrices = async (req, res, next) => {
  try {
    const items = await pricingService.getHourlyPrices();

    res.status(200).json({
      success: true,
      count: items.length,
      data: items.map(formatHourly),
    });
  } catch (error) {
    next(error);
  }
};

const getHourlyPrice = async (req, res, next) => {
  try {
    const item = await pricingService.getHourlyPriceById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: "Hourly price not found" });
    }

    res.status(200).json({ success: true, data: formatHourly(item) });
  } catch (error) {
    next(error);
  }
};

const updateHourlyPrice = async (req, res, next) => {
  try {
    const item = await pricingService.updateHourlyPrice(req.params.id, req.body);

    if (!item) {
      return res.status(404).json({ success: false, message: "Hourly price not found" });
    }

    res.status(200).json({
      success: true,
      message: "Hourly price updated successfully",
      data: formatHourly(item),
    });
  } catch (error) {
    next(error);
  }
};

const deleteHourlyPrice = async (req, res, next) => {
  try {
    const item = await pricingService.deleteHourlyPrice(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: "Hourly price not found" });
    }

    res.status(200).json({
      success: true,
      message: "Hourly price deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createQuote,
  getQuote,
  getPendingQuotes,
  setQuotePrice,
  createFixedPrice,
  getFixedPrices,
  getFixedPrice,
  updateFixedPrice,
  deleteFixedPrice,
  createHourlyPrice,
  getHourlyPrices,
  getHourlyPrice,
  updateHourlyPrice,
  deleteHourlyPrice,
};
