# Contributing

## Getting set up

See [`docs/SETUP.md`](docs/SETUP.md) for local setup, or
[`infra/README.md`](infra/README.md) to run the full stack in Docker
(recommended - it gets you a working MySQL instance without touching your
own machine's install).

## Before opening a PR

```bash
# Server
cd server && npm test && npm run secrets:check

# Client
cd client && npm run lint && npm test -- --run && npm run build
```

CI (`.github/workflows/ci.yml`) runs the same checks, plus a Docker build
sanity check, against a fresh ephemeral database - so these should pass
locally before they hit CI.

## Conventions

- **Response shape**: every API response is
  `{ success, message, data, pagination? }` - see
  [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md#requestresponse-envelope).
  Don't add an endpoint that returns something else; the frontend's service
  layer (`client/src/services/*.js`) assumes this shape.
- **Model imports**: model files `module.exports = ModelName` (default
  export). Import them as `const ModelName = require('../models/x.models')`,
  or `const { ModelName } = require('../models')` via the index barrel
  (which re-exports everything as named exports). Destructuring `{ ModelName }`
  directly from a model file is a bug that's bitten this codebase more than
  once - it silently gives you `undefined`.
- **Secrets**: never commit `.env` files or paste real secrets into a
  terminal command/PR description - see
  [`docs/SECURITY.md`](docs/SECURITY.md#secrets-handling).
- **Docker/nginx**: everything Docker- or nginx-related lives under
  `infra/` - see [`infra/README.md`](infra/README.md).

## Reporting bugs / security issues

Regular bugs: open a GitHub issue. Security vulnerabilities: see
[`docs/SECURITY.md`](docs/SECURITY.md#reporting-a-vulnerability) - please
don't file those as public issues.
