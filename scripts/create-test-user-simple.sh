#!/bin/bash
# Simple script to create test user via SQL

EMAIL="test@epiq.com"
PASSWORD_HASH='$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'  # bcrypt hash of "Test@123"
ORG_ID=2

echo "🔍 Creating test user: $EMAIL"
echo "🔑 Password: Test@123"
echo ""

# SQL to insert test user
SQL="
DO \$\$
BEGIN
    -- Check if user exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = '$EMAIL') THEN
        INSERT INTO users (email, password, first_name, last_name, role, organization_id, created_at, updated_at)
        VALUES ('$EMAIL', '$PASSWORD_HASH', 'Test', 'User', 'admin', $ORG_ID, NOW(), NOW());
        RAISE NOTICE '✅ Test user created successfully!';
    ELSE
        RAISE NOTICE '✅ Test user already exists!';
    END IF;
END
\$\$;
"

# Execute SQL using environment variable
export PGPASSWORD="$PGPASSWORD"
echo "$SQL" | psql "$DATABASE_URL" 2>&1

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📧 Email:     $EMAIL"
echo "🔑 Password:  Test@123"
echo "👤 Role:      admin"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎯 Use these credentials to login on the landing page."
