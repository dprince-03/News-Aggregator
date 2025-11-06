require('dotenv').config();
const { sequelize } = require('../src/models');

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

// Clean up after each test
afterEach(async () => {
    // Clear test data
    await User.destroy({ where: {}, force: true });
});