const isProduction = process.env.NODE_ENV === "production";

if (isProduction && !process.env.SESSION_SECRET) {
  throw new Error(
    "CRITICAL SECURITY ERROR: SESSION_SECRET environment variable is required for production. " +
    "JWT tokens cannot be securely signed without this secret."
  );
}

if (!isProduction && !process.env.SESSION_SECRET) {
  console.warn(
    "\n⚠️  WARNING: Using insecure development JWT secret.\n" +
    "   This is ONLY acceptable in development mode.\n" +
    "   Set SESSION_SECRET environment variable before deploying to production!\n"
  );
}

export const JWT_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "dev-secret-DO-NOT-USE-IN-PRODUCTION"
);

export const JWT_ALGORITHM = "HS256" as const;

export const JWT_EXPIRATION = {
  session: "7d",
  refresh: "30d",
} as const;
