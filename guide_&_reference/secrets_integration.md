# Secrets Integration Guide for News Aggregator

## Method 1: Generate Before Server Starts (RECOMMENDED)

### Step 1: Update package.json

```json
{
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js",
    "prestart": "node src/utils/secrets.utils.js validate",
    "predev": "node src/utils/secrets.utils.js validate",
    "secrets:generate": "node src/utils/secrets.utils.js generate",
    "secrets:validate": "node src/utils/secrets.utils.js validate",
    "secrets:force": "node src/utils/secrets.utils.js force"
  }
}
```

**How it works:**
- `prestart` and `predev` run BEFORE the server starts
- Automatically validates secrets exist
- Server won't start if secrets are missing

### Step 2: First Time Setup

```bash
# 1. Generate secrets first time
npm run secrets:generate

# 2. Then start server
npm run dev
```

---

## Method 2: Auto-Generate on Server Start

### Update server.js

```javascript
// At the top of server.js, BEFORE any other imports
require('dotenv').config();

// Add this right after dotenv
const { validateSecrets, generateAllSecrets } = require('./src/utils/secrets.utils');

// Check secrets before starting server
const ensureSecrets = async () => {
    const validation = validateSecrets();
    
    if (!validation.valid) {
        console.log('⚠️  Missing or invalid secrets detected!');
        console.log('🔐 Generating missing secrets...\n');
        
        try {
            generateAllSecrets(false); // Generate only missing ones
            console.log('✅ Secrets generated successfully!\n');
            
            // Reload environment variables
            require('dotenv').config();
        } catch (error) {
            console.error('❌ Failed to generate secrets:', error.message);
            process.exit(1);
        }
    } else {
        console.log('✅ All required secrets are present\n');
    }
};

// Then in your start_server function:
const start_server = async () => {
    try {
        console.log('='.repeat(50));
        console.log("Starting News Aggregator API...");
        console.log('='.repeat(50));
        console.log('');

        // Check/generate secrets first
        await ensureSecrets();

        // Rest of your server startup code...
        const dbconnect = await testConnection();
        // ... etc
    } catch (error) {
        // error handling
    }
};
```

---

## Method 3: Separate Setup Script (BEST FOR PRODUCTION)

### Create: setup.js

```javascript
// setup.js (in root directory)
require('dotenv').config();
const { generateAllSecrets, validateSecrets } = require('./src/utils/secrets.utils');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (prompt) => {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
};

const setup = async () => {
    console.log('\n🚀 News Aggregator Setup Wizard\n');
    console.log('This will help you configure your environment\n');

    // Check current secrets
    const validation = validateSecrets();

    if (!validation.valid) {
        console.log('Missing secrets detected!');
        const answer = await question('\nGenerate secrets now? (y/n): ');
        
        if (answer.toLowerCase() === 'y') {
            generateAllSecrets(false);
            console.log('\n✅ Setup complete!');
            console.log('You can now run: npm run dev\n');
        }
    } else {
        console.log('✅ All secrets are already configured!');
        console.log('You can now run: npm run dev\n');
    }

    rl.close();
};

setup();
```

### Update package.json

```json
{
  "scripts": {
    "setup": "node setup.js",
    "dev": "nodemon server.js",
    "start": "node server.js"
  }
}
```

### Usage

```bash
# First time setup
npm run setup

# Then start server
npm run dev
```

---

## Method 4: Keep Your Current Approach (Simplest)

### Remove from server.js

Your current line:
```javascript
const mySecret = await generateSecret(32); // ❌ Remove this
```

This generates a NEW secret every time server starts (not persistent)!

### Instead, do this:

```javascript
// server.js - Remove the generateSecret line completely
const start_server = async () => {
    try {
        console.log('='.repeat(50));
        console.log("Starting News Aggregator API...");
        console.log('='.repeat(50));
        
        // Just test connection, don't generate secrets here
        const dbconnect = await testConnection();
        // ... rest of code
    } catch (error) {
        // error handling
    }
};
```

### Then manually run ONCE:

```bash
# Run this once to generate secrets
node src/utils/secrets.utils.js generate

# Then start your server
npm run dev
```

---

## Comparison of Methods

| Method | Pros | Cons | Best For |
|--------|------|------|----------|
| **Method 1** | Automatic validation | Requires npm scripts | Most projects |
| **Method 2** | Auto-fixes missing secrets | Slower startup | Development |
| **Method 3** | Interactive, clear | Extra step | Production |
| **Method 4** | Simple, manual | Need to remember | Quick start |

---

## Recommended Setup Steps

### For Development:

```bash
# 1. Clone/setup project
git clone your-repo
cd news-aggregator

# 2. Install dependencies
npm install

# 3. Generate secrets (one time)
npm run secrets:generate

# 4. Validate secrets
npm run secrets:validate

# 5. Start server
npm run dev
```

### For Production:

```bash
# 1. Generate production secrets in separate file
node src/utils/secrets.utils.js env production

# 2. Manually review .env.production
# Make sure to use STRONG secrets!

# 3. Deploy with .env.production
NODE_ENV=production npm start
```

---

## Best Practices

### 1. **Never Generate Secrets on Every Start**
```javascript
// ❌ BAD - generates new secret each time
const start_server = async () => {
    const mySecret = await generateSecret(32);
    // Server starts with DIFFERENT secret each time!
};
```

```javascript
// ✅ GOOD - use secrets from .env
const start_server = async () => {
    // Secrets already in .env file, loaded by dotenv
    const jwtSecret = process.env.JWT_SECRET;
};
```

### 2. **Validate on Startup**
```javascript
// ✅ Check secrets exist
const start_server = async () => {
    if (!process.env.JWT_SECRET) {
        console.error('❌ JWT_SECRET is missing!');
        console.log('Run: npm run secrets:generate');
        process.exit(1);
    }
    
    // Continue server startup...
};
```

### 3. **Use Environment-Specific Files**
```
.env                    # Development (gitignored)
.env.example            # Template (committed to git)
.env.production         # Production (NEVER commit)
.env.test               # Testing (gitignored)
```

---

## Quick Fix for Your Current server.js

Replace this line:
```javascript
const mySecret = await generateSecret(32); // Remove this
```

With this validation:
```javascript
const start_server = async () => {
    try {
        console.log('='.repeat(50));
        console.log("Starting News Aggregator API...");
        console.log('='.repeat(50));
        console.log('');

        // Validate required secrets
        const requiredSecrets = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'SESSION_SECRET'];
        const missingSecrets = requiredSecrets.filter(key => !process.env[key]);
        
        if (missingSecrets.length > 0) {
            console.error('❌ Missing required secrets:');
            missingSecrets.forEach(key => console.error(`   - ${key}`));
            console.error('\nRun: npm run secrets:generate\n');
            process.exit(1);
        }

        console.log('✅ All secrets loaded\n');

        // Initialize database
        const dbconnect = await testConnection();
        // ... rest of your code
    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
};
```

---

## TL;DR - What to Do Right Now

1. **Remove this line from server.js:**
   ```javascript
   const mySecret = await generateSecret(32); // DELETE THIS
   ```

2. **Run once to generate secrets:**
   ```bash
   node src/utils/secrets.utils.js generate
   ```

3. **Check secrets were created:**
   ```bash
   node src/utils/secrets.utils.js validate
   ```

4. **Start your server:**
   ```bash
   npm run dev
   ```

5. **Add to .gitignore:**
   ```
   .env
   .env.local
   .env.production
   .env.backup.*
   ```

That's it! Your secrets are now persistent and secure. 🔐