// Validates required environment secrets on startup - prevents the server
// from starting with missing/weak secrets (extracted from server.js).
const REQUIRED_SECRETS = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'SESSION_SECRET'];

const validateEnvironmentSecrets = () => {
    console.log('-- Validating environment secrets... \n');

    const missingSecrets = [];
    const weakSecrets = [];

    REQUIRED_SECRETS.forEach((key) => {
        const value = process.env[key];

        if (!value) {
            missingSecrets.push(key);
        } else if (value.length < 32 || value.includes('your_') || value.includes('change_this') || value.includes('placeholder')) {
            weakSecrets.push(key);
        }
    });

    if (missingSecrets.length > 0) {
        console.error('-- Missing required secrets:');
        missingSecrets.forEach((key) => console.error(`   • ${key}`));
        console.error('\n-- To fix this, run:');
        console.error('   node server/src/utils/secrets.utils.js generate\n');
        process.exit(1);
    }

    if (weakSecrets.length > 0) {
        console.warn('--  Weak secrets detected (use production-grade secrets):');
        weakSecrets.forEach((key) => console.warn(`   • ${key}`));
        console.warn('\n-- To regenerate, run:');
        console.warn('   node server/src/utils/secrets.utils.js force\n');

        if (process.env.NODE_ENV === 'production') {
            console.error('-- Cannot start in production with weak secrets!\n');
            process.exit(1);
        }
    }

    console.log('All required secrets are valid\n');
};

module.exports = validateEnvironmentSecrets;
