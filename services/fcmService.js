const { initializeApp, getApps, cert } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");

let initAttempted = false;
let ready = false;

const getPrivateKey = () => {
  const key = process.env.FIREBASE_PRIVATE_KEY;
  if (!key) return null;
  return key.replace(/\\n/g, "\n");
};

const isConfigured = () => {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
  );
};

const ensureInit = () => {
  if (ready) {
    return true;
  }

  if (initAttempted) {
    return false;
  }

  initAttempted = true;

  if (!isConfigured()) {
    console.warn("FCM skipped: Firebase env vars not set");
    return false;
  }

  try {
    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: getPrivateKey(),
        }),
      });
    }

    ready = true;
    return true;
  } catch (error) {
    console.error("FCM init failed:", error.message);
    return false;
  }
};

const sendToTokens = async (tokens, { title, body, data = {} }) => {
  if (!ensureInit() || !tokens?.length) {
    return { success_count: 0, failure_count: 0, invalid_tokens: [] };
  }

  const uniqueTokens = [...new Set(tokens.filter(Boolean))];
  const stringData = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      stringData[key] = String(value);
    }
  });

  try {
    const response = await getMessaging().sendEachForMulticast({
      tokens: uniqueTokens,
      notification: {
        title,
        body,
      },
      data: stringData,
      webpush: {
        notification: {
          title,
          body,
        },
      },
    });

    const invalid_tokens = [];
    response.responses.forEach((item, index) => {
      if (!item.success) {
        const code = item.error?.code || "";
        if (
          code.includes("registration-token-not-registered") ||
          code.includes("invalid-registration-token") ||
          code.includes("invalid-argument")
        ) {
          invalid_tokens.push(uniqueTokens[index]);
        }
      }
    });

    return {
      success_count: response.successCount,
      failure_count: response.failureCount,
      invalid_tokens,
    };
  } catch (error) {
    console.error("FCM send failed:", error.message);
    return { success_count: 0, failure_count: uniqueTokens.length, invalid_tokens: [] };
  }
};

module.exports = {
  isConfigured,
  sendToTokens,
};
