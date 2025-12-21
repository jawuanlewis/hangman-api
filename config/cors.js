const allowedOrigins = new Set(
  [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.CUSTOM_URL,
    process.env.PROD_URL,
    process.env.STAGING_URL,
  ].filter(Boolean) // Remove undefined values
);

export const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin
    if (!origin) return callback(null, true);

    if (allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    const msg = 'CORS policy does not allow access from this origin.';
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
