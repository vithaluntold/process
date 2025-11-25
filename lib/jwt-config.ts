const isProduction = process.env.NODE_ENV === "production";

let jwtSecretValidated = false;

function validateJwtSecret(): void {
  if (jwtSecretValidated) return;
  
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
  
  jwtSecretValidated = true;
}

let _jwtSecret: Uint8Array | null = null;

export function getJwtSecret(): Uint8Array {
  if (!_jwtSecret) {
    validateJwtSecret();
    _jwtSecret = new TextEncoder().encode(
      process.env.SESSION_SECRET || "dev-secret-DO-NOT-USE-IN-PRODUCTION"
    );
  }
  return _jwtSecret;
}

export const JWT_SECRET = new Proxy({} as Uint8Array, {
  get(_, prop) {
    return (getJwtSecret() as any)[prop];
  },
  has(_, prop) {
    return prop in getJwtSecret();
  },
  ownKeys() {
    return Reflect.ownKeys(getJwtSecret());
  },
  getOwnPropertyDescriptor(_, prop) {
    return Object.getOwnPropertyDescriptor(getJwtSecret(), prop);
  },
});

export const JWT_ALGORITHM = "HS256" as const;

export const JWT_EXPIRATION = {
  session: "7d",
  refresh: "30d",
} as const;
