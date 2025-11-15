# SSO/SAML Integration Guide

## Overview

EPI-Q supports **Enterprise Single Sign-On (SSO)** using **SAML 2.0** protocol. This allows organizations to authenticate users through their existing Identity Provider (IdP) such as Okta, Azure AD, Google Workspace, OneLogin, etc.

### Key Features

- ✅ **Multi-tenant SAML** - Each organization can configure their own IdP
- ✅ **Auto-provisioning** - Automatically create users on first SSO login
- ✅ **Attribute mapping** - Map SAML attributes to user profile fields
- ✅ **Role assignment** - Assign default roles to SSO users
- ✅ **Clock skew tolerance** - Handle time differences between systems
- ✅ **Audit logging** - Track all SSO authentication events
- ✅ **SP metadata** - Auto-generated Service Provider metadata for IdP configuration

---

## Architecture

### SAML Flow

```
1. User visits: https://app.example.com/auth/saml/{org-slug}
2. EPI-Q redirects user to IdP login page
3. User authenticates with IdP (e.g., Okta, Azure AD)
4. IdP sends SAML assertion back to: https://app.example.com/api/auth/saml/{org-slug}/callback
5. EPI-Q validates assertion and creates session
6. User is redirected to dashboard
```

### Security Features

- **Signature validation** - All SAML assertions are cryptographically verified
- **Replay attack prevention** - InResponseTo validation with request ID tracking
- **Clock skew tolerance** - Configurable tolerance for distributed systems
- **Tenant isolation** - SAML configs are strictly scoped to organizations
- **Encrypted storage** - IdP certificates and sensitive data securely stored

---

## Configuration Guide

### For Administrators

#### Step 1: Access SAML Configuration

1. Log in as **Admin** or **Super Admin**
2. Navigate to **Settings > SSO/SAML**
3. Click **Configure SAML** button

#### Step 2: Gather IdP Information

You need the following from your Identity Provider:

| Field | Description | Example |
|-------|-------------|---------|
| **IdP Entity ID** | Unique identifier for your IdP | `http://www.okta.com/exk1234567890` |
| **IdP SSO URL** | Single Sign-On endpoint | `https://company.okta.com/app/appname/exk1234/sso/saml` |
| **IdP Certificate** | X.509 certificate (PEM format) | `-----BEGIN CERTIFICATE-----...` |
| **IdP SLO URL** | Single Logout URL (optional) | `https://company.okta.com/app/appname/exk1234/slo/saml` |

#### Step 3: Configure Service Provider (SP) Details

| Field | Description | Value |
|-------|-------------|-------|
| **SP Entity ID** | Your application identifier | `https://app.example.com` |
| **SP ACS URL** | Assertion Consumer Service URL | `https://app.example.com/api/auth/saml/{org-slug}/callback` |
| **SP SLO URL** | Single Logout URL (optional) | `https://app.example.com/api/auth/saml/{org-slug}/logout` |

#### Step 4: Configure Auto-Provisioning (Optional)

- **Enable Auto-Provisioning**: Create users automatically on first SSO login
- **Default Role**: `employee` or `admin`
- **Default Team**: Assign new users to a specific team
- **Attribute Mapping**: Map SAML attributes to user fields

**Default Attribute Mapping:**
```json
{
  "email": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
  "firstName": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname",
  "lastName": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname"
}
```

#### Step 5: Save and Enable

1. Click **Save Configuration**
2. Toggle **Enable SSO** to activate
3. Download **SP Metadata** and provide it to your IdP administrator

---

## Identity Provider Setup Guides

### 1. Okta

#### Step 1: Create SAML 2.0 Application

1. Log in to **Okta Admin Console**
2. Go to **Applications > Create App Integration**
3. Select **SAML 2.0** and click **Next**
4. Enter **App Name**: `EPI-Q Process Mining`
5. Click **Next**

#### Step 2: Configure SAML Settings

**General Settings:**
- **Single sign on URL**: `https://app.example.com/api/auth/saml/{org-slug}/callback`
- **Audience URI (SP Entity ID)**: `https://app.example.com`
- **Name ID format**: `EmailAddress`
- **Application username**: `Email`

**Attribute Statements:**
| Name | Format | Value |
|------|--------|-------|
| `email` | Unspecified | `user.email` |
| `firstName` | Unspecified | `user.firstName` |
| `lastName` | Unspecified | `user.lastName` |

#### Step 3: Get IdP Metadata

1. Click **View Setup Instructions**
2. Copy **Identity Provider Single Sign-On URL**
3. Copy **Identity Provider Issuer**
4. Download **X.509 Certificate**

#### Step 4: Assign Users

1. Go to **Assignments** tab
2. Click **Assign** > **Assign to People**
3. Select users who should have access

---

### 2. Azure Active Directory (Entra ID)

#### Step 1: Create Enterprise Application

1. Go to **Azure Portal** > **Azure Active Directory**
2. Select **Enterprise applications** > **New application**
3. Click **Create your own application**
4. Enter name: `EPI-Q` and select **Integrate any other application**

#### Step 2: Configure Single Sign-On

1. Click **Single sign-on** > **SAML**
2. Edit **Basic SAML Configuration**:
   - **Identifier (Entity ID)**: `https://app.example.com`
   - **Reply URL (ACS URL)**: `https://app.example.com/api/auth/saml/{org-slug}/callback`
   - **Sign on URL**: `https://app.example.com/auth/saml/{org-slug}`

#### Step 3: Configure Attributes & Claims

Add the following claims:

| Claim name | Source | Value |
|------------|--------|-------|
| `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress` | Attribute | `user.mail` |
| `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname` | Attribute | `user.givenname` |
| `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname` | Attribute | `user.surname` |

#### Step 4: Get Federation Metadata

1. Scroll down to **SAML Signing Certificate**
2. Download **Certificate (Base64)**
3. Copy **Login URL** from **Set up EPI-Q** section
4. Copy **Azure AD Identifier**

---

### 3. Google Workspace

#### Step 1: Create SAML Application

1. Go to **Admin Console** > **Apps** > **Web and mobile apps**
2. Click **Add App** > **Add custom SAML app**
3. Enter name: `EPI-Q`

#### Step 2: Google Identity Provider Details

1. Download **IDP metadata** or copy:
   - **SSO URL**
   - **Entity ID**
   - **Certificate**

#### Step 3: Service Provider Details

- **ACS URL**: `https://app.example.com/api/auth/saml/{org-slug}/callback`
- **Entity ID**: `https://app.example.com`
- **Name ID format**: `EMAIL`
- **Name ID**: `Basic Information > Primary email`

#### Step 4: Attribute Mapping

| Google Directory attributes | App attributes |
|-----------------------------|----------------|
| Primary email | `email` |
| First name | `firstName` |
| Last name | `lastName` |

---

### 4. OneLogin

#### Step 1: Create New App Connector

1. Go to **Applications** > **Add App**
2. Search for **SAML Custom Connector (Advanced)**
3. Click **Save**

#### Step 2: Configuration Tab

- **Audience (EntityID)**: `https://app.example.com`
- **Recipient**: `https://app.example.com/api/auth/saml/{org-slug}/callback`
- **ACS (Consumer) URL Validator**: `https://app\.example\.com/.*`
- **ACS (Consumer) URL**: `https://app.example.com/api/auth/saml/{org-slug}/callback`

#### Step 3: Parameters

| Field name | Value |
|------------|-------|
| `email` | Email |
| `firstName` | First Name |
| `lastName` | Last Name |

#### Step 4: SSO Tab

1. Copy **Issuer URL**
2. Copy **SAML 2.0 Endpoint (HTTP)**
3. Download **X.509 Certificate**

---

## Testing SSO

### Pre-Flight Checklist

- [ ] SAML configuration saved in EPI-Q
- [ ] SSO enabled for organization
- [ ] IdP application configured with correct URLs
- [ ] IdP certificate uploaded to EPI-Q
- [ ] Users assigned to IdP application
- [ ] Auto-provisioning enabled (if desired)

### Test Login Flow

1. **Open incognito/private browser window**
2. Navigate to: `https://app.example.com/auth/saml/{org-slug}`
3. You should be redirected to your IdP login page
4. Enter your corporate credentials
5. After authentication, you should be redirected to EPI-Q dashboard
6. Verify user profile is populated correctly

### Troubleshooting

#### "SAML configuration not found"
- Verify organization slug is correct
- Check that SSO is enabled in admin panel
- Ensure SAML config exists for organization

#### "SAML validation failed"
- **Clock skew**: Increase `clockTolerance` to 600 seconds
- **Invalid signature**: Re-download IdP certificate
- **Wrong ACS URL**: Verify callback URL matches IdP configuration

#### "User not found and auto-provisioning disabled"
- Enable auto-provisioning in SAML config
- Or manually create user account before SSO login

#### "Email not found in SAML assertion"
- Check IdP attribute mapping
- Verify email claim is being sent
- Update `attributeMapping` in EPI-Q config

---

## API Reference

### Login Initiation

```
GET /api/auth/saml/{orgSlug}
```

Initiates SAML authentication flow by redirecting to IdP.

### Assertion Consumer Service (ACS)

```
POST /api/auth/saml/{orgSlug}/callback
```

Receives and validates SAML assertion from IdP.

### Service Provider Metadata

```
GET /api/auth/saml/{orgSlug}/metadata
```

Returns SP metadata XML for IdP configuration.

### Admin Configuration

```
GET /api/admin/saml-config
POST /api/admin/saml-config
DELETE /api/admin/saml-config
```

Manage SAML configuration (Admin only).

---

## Security Best Practices

### Production Deployment

1. **Use HTTPS only** - SAML requires secure connections
2. **Validate certificates** - Always verify IdP certificate authenticity
3. **Enable signature validation** - Set `wantAssertionsSigned: true`
4. **Limit clock tolerance** - Use minimum necessary (300-600 seconds)
5. **Audit all SSO events** - Monitor authentication logs
6. **Rotate certificates** - Update IdP certificates before expiration
7. **Test thoroughly** - Validate login/logout flows before production

### Compliance

- **SAML 2.0 compliant** - Adheres to OASIS SAML 2.0 specification
- **GDPR ready** - User data handling with consent management
- **SOC 2 aligned** - Audit logging and access controls
- **HIPAA compatible** - Secure authentication for healthcare organizations

---

## Advanced Configuration

### Custom Attribute Mapping

To map custom SAML attributes (e.g., department, manager):

```json
{
  "email": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
  "firstName": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname",
  "lastName": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname",
  "department": "department",
  "employeeId": "employeeNumber"
}
```

### Force Re-Authentication

Set `forceAuthn: true` to require users to re-authenticate with IdP every time.

### Signature Algorithms

Supported algorithms:
- `sha256` (recommended)
- `sha512` (high security)
- `sha1` (legacy, not recommended)

---

## Support

For assistance with SSO/SAML setup:

1. Check [Troubleshooting](#troubleshooting) section
2. Review IdP-specific setup guides above
3. Contact EPI-Q Support with:
   - Organization name
   - IdP provider
   - Error messages/logs
   - Steps to reproduce issue

---

**Last Updated:** November 15, 2025  
**Version:** 1.0.0
