const TERMINAL_STATUSES = ["cancelled", "completed"];
const UPCOMING_TAB_STATUSES = ["upcoming", "inprogress"];
const HISTORY_TAB_STATUSES = ["cancelled", "completed"];

const parseDateTime = (dateStr, timeStr, fallbackDate) => {
  if (dateStr && timeStr) {
    const parsed = new Date(`${dateStr}T${timeStr}:00`);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  if (dateStr) {
    const parsed = new Date(`${dateStr}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  if (fallbackDate) {
    const parsed = new Date(fallbackDate);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
};

const getBookingWindow = (booking) => {
  const start =
    parseDateTime(booking.pickup_date, booking.pickup_time, booking.date_and_time) ||
    booking.created_at ||
    new Date();

  let end = parseDateTime(booking.dropoff_date, booking.dropoff_time);

  if (!end && booking.hours && Number(booking.hours) > 0) {
    end = new Date(start.getTime() + Number(booking.hours) * 60 * 60 * 1000);
  }

  if (!end && booking.pickup_date) {
    end = new Date(`${booking.pickup_date}T23:59:59`);
  }

  if (!end) {
    end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  }

  return { start, end };
};

const resolveLiveStatus = (booking, now = new Date()) => {
  const stored = booking.booking_status;

  if (stored === "cancelled" || stored === "cancel") {
    return "cancelled";
  }

  if (stored === "completed") {
    return "completed";
  }

  // Respect admin/manual inprogress (do not override with date logic)
  if (stored === "inprogress") {
    return "inprogress";
  }

  const { start, end } = getBookingWindow(booking);

  if (now < start) {
    return "upcoming";
  }

  if (now >= start && now <= end) {
    return "inprogress";
  }

  return "completed";
};

const normalizeStatusParam = (status) => {
  if (!status) {
    return null;
  }

  const value = String(status).toLowerCase().trim();

  if (value === "cancel") {
    return "cancelled";
  }

  if (value === "in_progress" || value === "in-progress") {
    return "inprogress";
  }

  return value;
};

const matchesTab = (liveStatus, statusParam) => {
  const status = normalizeStatusParam(statusParam);

  if (!status || status === "all") {
    return true;
  }

  if (status === "history") {
    return HISTORY_TAB_STATUSES.includes(liveStatus);
  }

  if (status === "upcoming") {
    return UPCOMING_TAB_STATUSES.includes(liveStatus);
  }

  return liveStatus === status;
};

const overlapsDateRange = (booking, from, to) => {
  if (!from && !to) {
    return true;
  }

  const { start, end } = getBookingWindow(booking);
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;

  if (fromDate && Number.isNaN(fromDate.getTime())) {
    return true;
  }

  if (toDate && Number.isNaN(toDate.getTime())) {
    return true;
  }

  if (fromDate && end < fromDate) {
    return false;
  }

  if (toDate && start > toDate) {
    return false;
  }

  return true;
};

module.exports = {
  TERMINAL_STATUSES,
  UPCOMING_TAB_STATUSES,
  HISTORY_TAB_STATUSES,
  getBookingWindow,
  resolveLiveStatus,
  normalizeStatusParam,
  matchesTab,
  overlapsDateRange,
};
