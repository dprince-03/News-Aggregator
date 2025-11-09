# News-Aggregator-API-

a RESTful API for a news aggregator service that fetches articles from various sources and provides endpoints for a frontend application to consume.


TWO TYPES OF LOGGING IN YOUR PROJECT:



1. WINSTON LOGGER (logger.utils.js)

   - Saves to FILES (logs/*.log)

   - For: General app logs, errors, debugging

   - Format: Text/JSON files

   - Purpose: Development debugging, error tracking



2. API LOG MODEL (apiLog.models.js)

   - Saves to DATABASE (api_logs table)

   - For: API request statistics, monitoring

   - Format: MySQL rows

   - Purpose: Analytics, performance tracking



BOTH ARE USEFUL BUT SERVE DIFFERENT PURPOSES
