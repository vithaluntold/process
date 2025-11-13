# Desktop Agent Production Setup Guide

## Overview
The EPI-Q Desktop Capture Agent requires proper server configuration for encryption and API key management. This guide covers production deployment setup.

## Required Environment Variables

### MASTER_ENCRYPTION_KEY (REQUIRED)

**Purpose**: Master encryption key used to encrypt/decrypt user-specific AES keys for desktop agent data encryption.

**Generate the key:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Set in environment:**
```bash
export MASTER_ENCRYPTION_KEY="<your-generated-key-here>"
```

**Important Notes:**
- **NEVER commit this key to version control**
- **Store securely** in your environment variable management system (e.g., Replit Secrets, AWS Secrets Manager, Azure Key Vault)
- **Backup the key** - losing it makes all encrypted agent data unrecoverable
- **Use the same key** across all server instances for consistent decryption

### Adding to Replit

1. Open your Repl
2. Go to the "Secrets" tab (lock icon in the left sidebar)
3. Click "+ New secret"
4. Name: `MASTER_ENCRYPTION_KEY`
5. Value: Paste the generated key
6. Save

## Database Setup

The desktop agent requires two additional database tables:

### agent_api_keys
Stores secure API keys for desktop agent authentication.

### agent_encryption_keys
Stores per-user AES encryption keys (encrypted with the master key).

**Migration:**
Tables are auto-created on first run. To manually create:
```bash
pnpm drizzle-kit push --force
```

## API Key Generation

Users must generate API keys through the platform UI:

1. Navigate to **Task Mining** page
2. Click **Desktop Agent** tab
3. Click **"Generate API Key"** button
4. Copy the API key and encryption key (shown only once)
5. Configure the desktop agent with these keys

## Desktop Agent Configuration

Users need to configure their desktop agent with:
- **Platform URL**: Your EPI-Q deployment URL
- **API Key**: Generated from the platform (starts with `epix_`)
- **Encryption Key** (optional): Per-user AES key for encrypting captured data

## Security Best Practices

1. **API Key Rotation**: Users should rotate API keys periodically
2. **Key Revocation**: Revoke compromised keys immediately via the platform UI
3. **Encryption**: Enable encryption for sensitive environments
4. **Audit Logging**: All API key operations are logged in `audit_logs` table
5. **Rate Limiting**: Configure rate limits for activity ingestion endpoints

## Troubleshooting

### Error: "MASTER_ENCRYPTION_KEY environment variable is required"

**Solution**: The master encryption key is not set. Generate and configure it as described above.

### Error: "Server configuration error: MASTER_ENCRYPTION_KEY not set"

**Solution**: When generating API keys, the server requires MASTER_ENCRYPTION_KEY. Add it to your environment variables.

### Activities not being received

**Check:**
1. API key is valid and active
2. Desktop agent is configured with correct platform URL
3. Network connectivity between agent and platform
4. Server logs for authentication errors

## Monitoring

Monitor these metrics for desktop agent health:

- **API Key Usage**: Track `last_used_at` in `agent_api_keys`
- **Activity Volume**: Monitor `user_activities` table growth
- **Failed Authentications**: Check server logs for 401 errors
- **Encryption Errors**: Watch for decryption failures in logs

## Data Retention

Configure automatic cleanup of old activity data:
- Default retention: 90 days
- Configurable per user
- Scheduled cleanup job removes old records

See `server/data-retention.ts` for configuration details.
