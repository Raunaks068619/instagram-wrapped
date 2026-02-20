# Security Notes

1. **OAuth state validation** implemented via `oauth_sessions` table to mitigate CSRF.
2. **Secrets handling** via `.env` files; never commit real API keys.
3. **Token lifecycle:** short and long-lived token fields are stored; production should encrypt at rest.
4. **Input validation** using `express-validator` for wrapped year and sync parameters.
5. **Error handling** centralized middleware; avoids raw stack traces in API responses.
6. **CORS** enabled; restrict `origin` in production.
7. **Mock mode** allows non-production demo without exposing real third-party credentials.
8. **OpenAI output safety:** generated image references are persisted as URL/base64; sanitize any user-influenced prompting for production.
