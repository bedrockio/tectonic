# Authentication API

This API can be used to login users.

## Login

This exchanges a user's credentials (email and password) for a JWT token. This token can be used for authentication on all subsequent API calls (See Getting Started).

callSummary({method: 'POST', path: '/1/auth/login'})
