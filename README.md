# News Aggregator

A full-stack news aggregator application that fetches articles from various sources and provides a modern, responsive web interface for browsing and managing personalized news feeds.

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.3.1-blue.svg)

## Features

### Backend API
- **RESTful API** with Express.js
- **User Authentication** (JWT + OAuth support for Google, Facebook, Twitter)
- **Article Aggregation** from multiple news sources
- **Advanced Search & Filtering** by source, category, date, author
- **Personalized News Feed** based on user preferences
- **Bookmark System** to save articles for later
- **API Logging & Analytics** for monitoring and statistics
- **Rate Limiting** and security with Helmet
- **Database** with MySQL and Sequelize ORM
- **Automated Article Fetching** with cron jobs

### Frontend Application
- **Modern React UI** with responsive design
- **User Authentication** with secure login/register
- **News Feed** with infinite scroll
- **Real-time Search** with debounced input
- **Advanced Filters** by source, category, and date
- **Personalized Feed** tailored to user preferences
- **Bookmark Management** for saved articles
- **User Profile & Settings** with password management
- **Preference Management** for sources, categories, and authors
- **Mobile-First Design** that works on all devices

## Project Structure

```
News-Aggregator-API-/
├── server/                 # Backend API
│   ├── src/
│   │   ├── config/        # Database and passport config
│   │   ├── controllers/   # Request handlers
│   │   ├── middleware/    # Auth, validation, error handling
│   │   ├── models/        # Sequelize models
│   │   ├── routes/        # API routes
│   │   ├── services/      # External API services
│   │   ├── utils/         # Utilities (logger, secrets, etc.)
│   │   └── jobs/          # Cron jobs for article fetching
│   ├── tests/             # API tests
│   ├── server.js          # Entry point
│   └── package.json
│
├── client/                # Frontend Application
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API integration
│   │   ├── context/       # React Context (Auth)
│   │   ├── utils/         # Helper functions
│   │   └── App.jsx        # Main app with routing
│   ├── public/            # Static assets
│   └── package.json
│
├── package.json           # Root package.json with scripts
└── README.md              # This file
```

## Tech Stack

### Backend
- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Database**: MySQL with Sequelize ORM
- **Authentication**: JWT, Passport.js (Local, Google, Facebook, Twitter)
- **Logging**: Winston with daily rotate files
- **Security**: Helmet, CORS, Rate Limiting, bcrypt
- **Job Scheduling**: node-cron
- **Testing**: Jest, Supertest
- **Documentation**: Swagger/OpenAPI

### Frontend
- **Library**: React 18
- **Build Tool**: Vite
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Styling**: Custom CSS with CSS Variables
- **State Management**: React Context API

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- MySQL 8.0+
- Git

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/dprince-03/News-Aggregator-API-.git
cd News-Aggregator-API-
```

2. **Install root dependencies**

```bash
npm install
```

3. **Install server dependencies**

```bash
cd server
npm install
```

4. **Install client dependencies**

```bash
cd ../client
npm install
```

### Configuration

#### Backend Configuration

1. Create a `.env` file in the `server/` directory:

```bash
cd server
cp .env.example .env
```

2. Update the `.env` file with your configuration:

```env
# Server Configuration
NODE_ENV=development
PORT=5080

# Database Configuration
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=news_aggregator
DB_DIALECT=mysql

# JWT Secrets (generate using: npm run secrets:gen)
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret-key

# News API Keys
NEWSAPI_KEY=your-newsapi-key
GUARDIAN_API_KEY=your-guardian-key
NYT_API_KEY=your-nyt-key

# OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
TWITTER_CONSUMER_KEY=your-twitter-consumer-key
TWITTER_CONSUMER_SECRET=your-twitter-consumer-secret

# Email Configuration (for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-email-password
```

3. Generate JWT secrets:

```bash
npm run secrets:gen
```

4. Create the database:

```sql
CREATE DATABASE news_aggregator;
```

#### Frontend Configuration

1. Create a `.env` file in the `client/` directory:

```bash
cd client
cp .env.example .env
```

2. Update the `.env` file:

```env
VITE_API_URL=http://localhost:5080/api
VITE_APP_NAME=News Aggregator
```

### Running the Application

#### Development Mode

**Option 1: Run both server and client together (from root directory)**

```bash
npm run dev
```

This will start both the backend (port 5080) and frontend (port 3000) concurrently.

**Option 2: Run separately**

Terminal 1 - Backend:
```bash
cd server
npm run dev
```

Terminal 2 - Frontend:
```bash
cd client
npm run dev
```

#### Production Mode

**Build the frontend:**

```bash
cd client
npm run build
```

**Start the backend:**

```bash
cd server
npm start
```

Or use PM2 for production:

```bash
cd server
pm2 start server.js --name news-aggregator
```

## Available Scripts

### Root Directory

- `npm run dev` - Run both server and client in development mode
- `npm run server` - Run only the backend server
- `npm run client` - Run only the frontend client
- `npm run build` - Build the frontend for production
- `npm run test:server` - Run backend tests
- `npm install:all` - Install dependencies for both server and client

### Server Directory

- `npm run dev` - Start server with nodemon
- `npm start` - Start server in production
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run secrets:gen` - Generate JWT secrets
- `npm run stats` - View API statistics

### Client Directory

- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## API Documentation

Once the server is running, access the API documentation at:

- Swagger UI: `http://localhost:5080/api-docs`

### Main Endpoints

#### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/forget-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

#### Articles
- `GET /api/articles` - Get all articles (paginated)
- `GET /api/articles/:id` - Get single article
- `GET /api/articles/search` - Search articles
- `GET /api/articles/filter` - Filter articles
- `GET /api/articles/personalized` - Get personalized feed (auth required)
- `GET /api/articles/saved` - Get saved articles (auth required)
- `POST /api/articles/:id/save` - Save article (auth required)
- `DELETE /api/articles/:id/save` - Unsave article (auth required)

#### Preferences
- `GET /api/preferences` - Get user preferences (auth required)
- `PUT /api/preferences` - Update preferences (auth required)
- `GET /api/preferences/sources` - Get available sources
- `GET /api/preferences/categories` - Get available categories

#### Admin
- `GET /api/admin/api-logs` - Get API logs (admin only)
- `GET /api/admin/api-logs/stats` - Get API statistics (admin only)

## Logging System

The application uses two types of logging:

### 1. Winston Logger (logger.utils.js)
- Saves to FILES (`logs/*.log`)
- For: General app logs, errors, debugging
- Format: Text/JSON files
- Purpose: Development debugging, error tracking

### 2. API Log Model (apiLog.models.js)
- Saves to DATABASE (`api_logs` table)
- For: API request statistics, monitoring
- Format: MySQL rows
- Purpose: Analytics, performance tracking

## Testing

Run backend tests:

```bash
cd server
npm test
```

Run with coverage:

```bash
npm run test:coverage
```

## Security Features

- JWT authentication with refresh tokens
- Password hashing with bcrypt
- SQL injection prevention with Sequelize
- XSS protection with Helmet
- CORS configuration
- Rate limiting on API endpoints
- Environment variable validation
- Secure session management

## Performance Optimizations

### Backend
- Database query optimization with indexes
- Request caching with node-cache
- Pagination for large datasets
- Connection pooling
- Efficient article aggregation with cron jobs

### Frontend
- Code splitting with React Router
- Lazy loading of images
- Debounced search inputs
- Optimized bundle size with Vite
- Production build minification

## Deployment

### Backend Deployment

1. Set `NODE_ENV=production`
2. Update database credentials
3. Set secure JWT secrets
4. Configure CORS for your domain
5. Use PM2 or similar process manager
6. Set up reverse proxy (Nginx/Apache)
7. Enable SSL/TLS

### Frontend Deployment

1. Update `VITE_API_URL` to production API URL
2. Run `npm run build`
3. Deploy `dist/` folder to:
   - Netlify
   - Vercel
   - AWS S3 + CloudFront
   - Any static hosting service

## Environment Variables

### Required Backend Variables
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - Database config
- `JWT_SECRET`, `JWT_REFRESH_SECRET` - Authentication
- At least one news API key (NewsAPI, Guardian, or NYT)

### Optional Backend Variables
- OAuth credentials (Google, Facebook, Twitter)
- Email configuration (for password reset)
- Redis URL (for advanced caching)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Author

dprince-03

## Support

For issues and questions, please open an issue on GitHub:
https://github.com/dprince-03/News-Aggregator-API-/issues

## Acknowledgments

- News data provided by NewsAPI, The Guardian, and New York Times APIs
- Authentication powered by Passport.js
- UI inspired by modern news aggregators
