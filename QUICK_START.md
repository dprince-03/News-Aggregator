# Quick Start Guide

Get your News Aggregator up and running in 5 minutes!

## Prerequisites Check

```bash
# Check Node.js version (need 16+)
node --version

# Check npm version
npm --version

# Check MySQL is running
mysql --version
```

## Installation Steps

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/dprince-03/News-Aggregator-API-.git
cd News-Aggregator-API-

# Install all dependencies (root, server, and client)
npm run install:all
```

### 2. Setup Database

```bash
# Create database
mysql -u root -p

# In MySQL shell:
CREATE DATABASE news_aggregator;
EXIT;
```

### 3. Configure Backend

```bash
cd server

# Copy environment template
cp .env.example .env

# Edit .env with your details:
# - Database credentials
# - Generate JWT secrets: npm run secrets:gen
# - Add at least one news API key
```

**Quick .env setup:**
```env
NODE_ENV=development
PORT=5080

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=news_aggregator

# Run: npm run secrets:gen to generate these
JWT_SECRET=your-generated-secret
JWT_REFRESH_SECRET=your-generated-refresh-secret

# Get free key from: https://newsapi.org/
NEWSAPI_KEY=your-newsapi-key
```

### 4. Configure Frontend

```bash
cd ../client

# Copy environment template
cp .env.example .env

# Update if needed (defaults should work):
VITE_API_URL=http://localhost:5080/api
VITE_APP_NAME=News Aggregator
```

### 5. Run the Application

**Option A: Run everything together (recommended)**

```bash
# From root directory
cd ..
npm run dev
```

This will start:
- Backend API on http://localhost:5080
- Frontend UI on http://localhost:3000

**Option B: Run separately**

Terminal 1:
```bash
cd server
npm run dev
```

Terminal 2:
```bash
cd client
npm run dev
```

## Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5080
- **API Documentation**: http://localhost:5080/api-docs

## First Steps

1. **Register a new account** at http://localhost:3000/register
2. **Browse articles** on the home page
3. **Set your preferences** to get personalized news
4. **Save articles** to read later

## Available Commands

From root directory:

```bash
npm run dev              # Run both server and client
npm run server           # Run only backend
npm run client           # Run only frontend
npm run build           # Build frontend for production
npm test                # Run backend tests
```

## Troubleshooting

### Database Connection Error
```bash
# Check MySQL is running
sudo systemctl status mysql

# Verify database exists
mysql -u root -p -e "SHOW DATABASES;"
```

### Port Already in Use
```bash
# Backend (5080):
lsof -ti:5080 | xargs kill -9

# Frontend (3000):
lsof -ti:3000 | xargs kill -9
```

### Missing Dependencies
```bash
# Reinstall everything
npm run clean
npm run install:all
```

### No Articles Showing
The backend fetches articles automatically every hour. To fetch immediately:
1. Check your API keys are valid in `.env`
2. Restart the backend server
3. Wait a few minutes for articles to be fetched
4. Or manually call the aggregation endpoint

## Getting API Keys

### NewsAPI (Free)
1. Go to https://newsapi.org/
2. Sign up for free account
3. Copy your API key
4. Add to `NEWSAPI_KEY` in server/.env

### The Guardian (Optional)
1. Go to https://open-platform.theguardian.com/access/
2. Register for API key
3. Add to `GUARDIAN_API_KEY` in server/.env

### New York Times (Optional)
1. Go to https://developer.nytimes.com/
2. Create an account
3. Get an API key
4. Add to `NYT_API_KEY` in server/.env

## Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Check out [server/README.md](./server/README.md) for backend API details
- Check out [client/README.md](./client/README.md) for frontend details
- Explore the API documentation at http://localhost:5080/api-docs

## Need Help?

- Check the [Issues](https://github.com/dprince-03/News-Aggregator-API-/issues) page
- Read the logs in `server/logs/`
- Check browser console for frontend errors

## Production Deployment

For production deployment instructions, see the main [README.md](./README.md#deployment) file.

---

Happy coding! 🚀
