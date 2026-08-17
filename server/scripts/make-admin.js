#!/usr/bin/env node
/**
 * Promotes an existing user to the 'admin' role.
 *
 * There's no API endpoint for this deliberately - self-service role
 * escalation is exactly what shouldn't exist. This is a one-off,
 * operator-run script instead, the same pattern as secrets.utils.js.
 *
 * Usage:
 *   node scripts/make-admin.js user@example.com
 *   npm run admin:promote -- user@example.com
 */
require('dotenv').config();
const { User, sequelize } = require('../src/models');

const email = process.argv[2];

if (!email) {
    console.error('Usage: node scripts/make-admin.js <email>');
    process.exit(1);
}

(async () => {
    try {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            console.error(`No user found with email: ${email}`);
            process.exit(1);
        }

        if (user.role === 'admin') {
            console.log(`${email} is already an admin.`);
            process.exit(0);
        }

        await user.update({ role: 'admin' });
        console.log(`${email} is now an admin.`);
        process.exit(0);
    } catch (error) {
        console.error('Failed to promote user:', error.message);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
})();
