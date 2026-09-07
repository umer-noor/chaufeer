/**
 * Generic notification text for admin vs client (user).
 * Keep messages short for the notifications dropdown.
 */

const shortId = (id) => {
  if (!id) return "";
  const value = String(id);
  return value.slice(-6).toUpperCase();
};

const buildBookingCreated = ({ booking, customerName }) => {
  const code = shortId(booking._id);

  return {
    admin: {
      title: "New Booking Request",
      message: `Booking #${code} received from ${customerName || "a customer"}.`,
    },
    user: {
      title: "Booking Created",
      message: `Your booking #${code} has been created successfully.`,
    },
  };
};

const buildBookingCancelled = ({ booking, customerName }) => {
  const code = shortId(booking._id);

  return {
    admin: {
      title: "Booking Cancelled",
      message: `Booking #${code} was cancelled${customerName ? ` by ${customerName}` : ""}.`,
    },
    user: {
      title: "Booking Cancelled",
      message: `Your booking #${code} has been cancelled.`,
    },
  };
};

const buildBookingCompleted = ({ booking, customerName }) => {
  const code = shortId(booking._id);

  return {
    admin: {
      title: "Booking Completed",
      message: `Booking #${code}${customerName ? ` for ${customerName}` : ""} is completed.`,
    },
    user: {
      title: "Trip Completed",
      message: `Your booking #${code} is marked as completed.`,
    },
  };
};

const buildBookingInProgress = ({ booking }) => {
  const code = shortId(booking._id);

  return {
    admin: {
      title: "Booking In Progress",
      message: `Booking #${code} is now in progress.`,
    },
    user: {
      title: "Trip Started",
      message: `Your booking #${code} is now in progress.`,
    },
  };
};

const buildLongDistanceQuote = ({ quote, customerName, distanceKm }) => {
  const code = shortId(quote._id || quote.quote_id);
  const km = distanceKm ?? quote.distance_km;

  return {
    admin: {
      title: "Long Distance Quote",
      message: `${customerName || "Customer"} needs price for ${km} km trip (#${code}).`,
    },
    user: {
      title: "Price Pending",
      message: `Your ${km} km trip needs admin price. We will notify you soon.`,
    },
  };
};

const buildQuotePriced = ({ quote, amount, currency }) => {
  const code = shortId(quote._id);
  const money = `${amount} ${currency || "KWD"}`;

  return {
    admin: {
      title: "Quote Price Set",
      message: `Price ${money} set for quote #${code}.`,
    },
    user: {
      title: "Price Ready",
      message: `Your long-distance quote #${code} is ready: ${money}.`,
    },
  };
};

const buildQuoteExpired = ({ quote, distanceKm }) => {
  const code = shortId(quote._id);
  const km = distanceKm ?? quote.distance_km;

  return {
    admin: {
      title: "Quote Expired",
      message: `Long-distance quote #${code} (${km} km) expired without a price.`,
    },
    user: {
      title: "Quote Expired",
      message: `Your ${km} km price request expired. Please request a new quote.`,
    },
  };
};

module.exports = {
  shortId,
  buildBookingCreated,
  buildBookingCancelled,
  buildBookingCompleted,
  buildBookingInProgress,
  buildLongDistanceQuote,
  buildQuotePriced,
  buildQuoteExpired,
};
