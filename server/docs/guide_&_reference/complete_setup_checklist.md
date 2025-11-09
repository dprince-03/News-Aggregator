# News Aggregator API - Complete Setup Checklist

## ✅ Phase 1: Initial Setup

### 1.1 Project Initialization
```bash
- [ ] mkdir news-aggregator-api && cd news-aggregator-api
- [ ] npm init -y
- [ ] Create project folder structure
```

### 1.2 Install Dependencies
```bash
npm install express sequelize mysql2 dotenv cors helmet morgan
npm install bcryptjs jsonwebtoken
npm install passport passport-local passport-jwt
npm install passport-google-oauth20 passport-facebook passport-twitter
npm install express-validator express-session cookie-parser
npm install express-rate-limit
npm install axios nodemailer node-cron
npm install swagger-jsdoc swagger-ui-express
npm install winston winston-daily-rotate-file
npm install --save-dev nodemon
```

---

## ✅ Phase 2: Database Setup

### 2.1 MySQL Database
```bash
- [ ] Start MySQL server
- [ ] Create database: CREATE DATABASE news_aggregator;
- [ ] Run SQL schema (news_aggregator.sql)
- [ ] Verify tables created
```

### 2.2 Database Configuration
```bash
- [ ] Create src/config/db.config.js
- [ ] Add DB credentials to .env
- [ ] Test database connection
```

---

## ✅ Phase 3: Environment Variables

### 3.1 Create .env File
```env
- [ ] Copy .env.example to .env
- [ ] Set PORT=5080
- [ ] Set NODE_ENV=development
```

### 3.2 Database Config
```env
- [ ] DB_HOST=localhost
- [ ] DB_PORT=3306
- [ ] DB_NAME=news_aggregator
- [ ] DB_USER=root
- [ ] DB_PASSWORD=your_password
```

### 3.3 Generate Secrets
```bash
- [ ] Run: node src/utils/secrets.utils.js generate
- [ ] Verify JWT_SECRET created
- [ ] Verify JWT_REFRESH_SECRET created
- [ ] Verify SESSION_SECRET created
```

### 3.4 API Keys
```env
- [ ] Get NewsAPI key from https://newsapi.org/
- [ ] Get Guardian API key from https://open-platform.theguardian.com/
- [ ] Get NYT API key from https://developer.nytimes.com/
- [ ] Add all keys to .env
```

### 3.5 OAuth Setup (Optional)
```env
- [ ] Get Google OAuth credentials
- [ ] Get Facebook OAuth credentials
- [ ] Get Twitter OAuth credentials
- [ ] Add callback URLs
```

### 3.6 Email Setup (Optional)
```env
- [ ] Configure EMAIL_HOST
- [ ] Configure EMAIL_USER
- [ ] Configure EMAIL_PASSWORD
- [ ] Test email sending
```

---

## ✅ Phase 4: Core Files

### 4.1 Configuration Files
```bash
- [ ] src/config/db.config.js
- [ ] src/config/auth.config.js
- [ ] src/config/passport.config.js
- [ ] src/config/apiKeys.config.js
- [ ] src/config/swagger.config.js
```

### 4.2 Models
```bash
- [ ] src/models/user.models.js
- [ ] src/models/article.models.js
- [ ] src/models/preference.models.js
- [ ] src/models/savedArticle.models.js
- [ ] src/models/newsSource.models.js
- [ ] src/models/category.models.js
- [ ] src/models/apiLog.models.js
- [ ] src/models/index.js
```

### 4.3 Middleware
```bash
- [ ] src/middleware/auth.middleware.js
- [ ] src/middleware/validator.middleware.js
- [ ] src/middleware/errorHandler.middleware.js
```

### 4.4 Controllers
```bash
- [ ] src/controllers/auth.controller.js
- [ ] (Future: article, preference controllers)
```

### 4.5 Routes
```bash
- [ ] src/routes/auth.routes.js
- [ ] (Future: article, preference routes)
```

### 4.6 Services
```bash
- [ ] src/services/news_api.services.js
- [ ] src/services/guardian.services.js
- [ ] src/services/nyt.services.js
- [ ] src/services/aggregator.services.js
```

### 4.7 Utils
```bash
- [ ] src/utils/secrets.utils.js
- [ ] src/utils/emailServices.utils.js
- [ ] src/utils/helper.utils.js
- [ ] src/utils/logger.utils.js
```

### 4.8 Jobs
```bash
- [ ] src/jobs/fetchArticles.jobs.js
```

### 4.9 Logs
```bash
- [ ] mkdir logs
- [ ] touch logs/.gitkeep
- [ ] Update .gitignore
```

---

## ✅ Phase 5: Git Setup

### 5.1 Initialize Git
```bash
- [ ] git init
- [ ] Create .gitignore
- [ ] git add .
- [ ] git commit -m "Initial commit"
```

### 5.2 .gitignore Content
```gitignore
- [ ] node_modules/
- [ ] .env
- [ ] .env.local
- [ ] .env.production
- [ ] .env.backup.*
- [ ] logs/*.log
- [ ] !logs/.gitkeep
- [ ] .DS_Store
```

---

## ✅ Phase 6: Testing

### 6.1 Validate Setup
```bash
- [ ] Run: npm run secrets:validate
- [ ] Check API keys status
- [ ] Test database connection
```

### 6.2 Start Server
```bash
- [ ] Run: npm run dev
- [ ] Check server starts without errors
- [ ] Visit: http://localhost:5080/api/health
- [ ] Verify health check returns 200
```

### 6.3 Test Authentication
```bash
- [ ] POST /api/auth/register (Create test user)
- [ ] POST /api/auth/login (Login test user)
- [ ] GET /api/auth/me (Get profile with token)
- [ ] PUT /api/auth/profile (Update profile)
- [ ] PUT /api/auth/change-password (Change password)
```

### 6.4 Test OAuth (If Configured)
```bash
- [ ] GET /api/auth/google (Google login flow)
- [ ] GET /api/auth/facebook (Facebook login flow)
- [ ] GET /api/auth/twitter (Twitter login flow)
```

### 6.5 Test News APIs
```bash
- [ ] Create test-services.js
- [ ] Test NewsAPI connection
- [ ] Test Guardian API connection
- [ ] Test NYT API connection
- [ ] Run aggregator service
```

### 6.6 Test Cron Job
```bash
- [ ] Enable ENABLE_CRON=true
- [ ] Restart server
- [ ] Check logs for cron messages
- [ ] Verify articles fetched
```

---

## ✅ Phase 7: Documentation

### 7.1 Swagger Setup
```bash
- [ ] Install swagger dependencies
- [ ] Configure swagger.config.js
- [ ] Add JSDoc comments to routes
- [ ] Visit: http://localhost:5080/api/docs
```

### 7.2 README.md
```bash
- [ ] Create README.md
- [ ] Add project description
- [ ] Add installation instructions
- [ ] Add API endpoints list
- [ ] Add environment variables
```

---

## ✅ Phase 8: Production Preparation

### 8.1 Security
```bash
- [ ] Ensure helmet is configured
- [ ] Set up rate limiting
- [ ] Add CORS configuration
- [ ] Remove debug middleware
- [ ] Set NODE_ENV=production
```

### 8.2 Logging
```bash
- [ ] Configure winston logger
- [ ] Set up log rotation
- [ ] Add request logging
- [ ] Add error logging
```

### 8.3 Performance
```bash
- [ ] Add database indexes
- [ ] Enable gzip compression
- [ ] Set up caching (if needed)
- [ ] Optimize queries
```

### 8.4 Deployment
```bash
- [ ] Choose hosting (Heroku, AWS, DigitalOcean)
- [ ] Set up production database
- [ ] Configure environment variables
- [ ] Set up SSL certificate
- [ ] Deploy application
```

---

## 📋 Quick Commands Reference

### Development
```bash
npm run dev                  # Start development server
npm run secrets:generate     # Generate secrets
npm run secrets:validate     # Validate secrets
npm run logs:clean          # Clean old logs
```

### Testing
```bash
node test-services.js       # Test external APIs
node src/utils/secrets.utils.js validate  # Validate secrets
```

### Production
```bash
npm start                   # Start production server
NODE_ENV=production npm start  # Explicit production mode
```

---

## 🎯 Verification Checklist

### Before First Commit:
- [ ] All files created
- [ ] .env configured
- [ ] .gitignore updated
- [ ] Secrets generated
- [ ] Database connected
- [ ] Server starts successfully

### Before Going Live:
- [ ] All tests passing
- [ ] API keys valid
- [ ] OAuth configured (if using)
- [ ] Email working (if using)
- [ ] Swagger docs accessible
- [ ] Error handling tested
- [ ] Logging working
- [ ] Security headers set
- [ ] Rate limiting enabled
- [ ] Production .env configured

---

## 🚀 Next Steps After Setup

1. **Build Article Controller**
   - GET /api/articles
   - GET /api/articles/:id
   - GET /api/articles/search

2. **Build Preference Controller**
   - GET /api/preferences
   - PUT /api/preferences

3. **Build Saved Articles Feature**
   - POST /api/articles/:id/save
   - DELETE /api/articles/:id/unsave
   - GET /api/saved-articles

4. **Add Admin Features**
   - Manage sources
   - Manage categories
   - View statistics

5. **Optimize & Scale**
   - Add Redis caching
   - Implement pagination
   - Add search functionality
   - Set up monitoring

---

## 📞 Getting Help

If you encounter issues:

1. **Check logs**: `logs/combined-*.log` and `logs/error-*.log`
2. **Validate environment**: `npm run secrets:validate`
3. **Test database**: Run test connection
4. **Check API keys**: Verify they're valid
5. **Review error messages**: Read them carefully

---

## 🎉 Success Criteria

Your setup is complete when:

✅ Server starts without errors
✅ Database connected
✅ API health check returns 200
✅ User registration works
✅ User login works
✅ At least one news API works
✅ Swagger docs accessible
✅ Cron job fetching articles

**Congratulations! Your News Aggregator API is ready! 🚀**