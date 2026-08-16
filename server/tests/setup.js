require('dotenv').config();
const { sequelize, User } = require('../src/models');

// Setup before all tests
beforeAll(async () => {
    // Connect to test database
    await sequelize.authenticate();
    console.log('Test database connected');
});

// Cleanup after all tests
afterAll(async () => {
    // Close database connection
    await sequelize.close();
    console.log('Test database connection closed');
});


