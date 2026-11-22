# Security Policy

## Supported Versions

We actively maintain the latest version of SPIMS. Security updates will be provided for the currently maintained version.

| Version | Supported |
|---------|-----------|
| Latest  | ✅ Yes |
| Older versions | ❌ No |

---

# Reporting a Vulnerability

If you discover a security vulnerability in SPIMS, please report it responsibly.

Please do **not** create a public GitHub issue for security vulnerabilities.

Instead, report the issue privately by contacting:

**Email:** aabhushandhakal1@gmail.com

Include the following information:

- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Screenshots or logs (if applicable)
- Suggested fix (if available)

We will try to acknowledge your report within **48 hours** and investigate the issue as soon as possible.

---

# Security Practices

SPIMS follows industry-standard security practices including:

## Authentication & Authorization

- JWT-based authentication
- Refresh token mechanism
- Role-Based Access Control (RBAC)
- Protected API routes
- Password hashing using secure algorithms

Supported roles include:

- Owner
- Pharmacist
- Inventory Manager

---

## Data Protection

- Sensitive environment variables are stored using `.env` files
- Secrets are never committed to version control
- Database credentials and API keys are managed securely
- Input validation is performed on API requests

---

## API Security

The backend implements:

- Request validation using schema validation
- Authentication middleware
- Authorization checks
- Secure error handling
- Protection against unauthorized access

---

## Database Security

- MongoDB access is restricted using authentication
- Database operations are performed through controlled service layers
- User permissions are validated before sensitive operations

---

## Infrastructure Security

Implemented:

- Environment-based configuration management
- CI security checks (dependency audit, Gitleaks, CodeQL)
- Helmet security headers and a CORS/WebSocket origin allow-list
- Redis-backed auth rate limiting and account lockout
- Immediate access-token revocation on logout, password reset, role change,
  deactivation, and owner force-logout
- Owner-only audit log for authentication and user-admin actions

Not planned for this project (declined):

- Docker containerization
- NGINX reverse proxy
- HTTPS termination and deployment manifests

---

# Secrets Management

Never commit sensitive information such as:

- Database connection strings
- JWT secrets
- Payment gateway keys
- Cloud provider credentials
- Third-party API tokens

Use environment variables:
