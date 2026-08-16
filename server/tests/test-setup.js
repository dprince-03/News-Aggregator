const { sequelize } = require('../src/models');
const { User, Article, Category, NewsSource } = require('../src/models');
const bcrypt = require('bcryptjs');

const setupTestDB = () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true }); // Drops and re-creates tables
  });

  beforeEach(async () => {
    // Clear all tables before each test
    await User.destroy({ where: {}, truncate: true, cascade: true });
    await Article.destroy({ where: {}, truncate: true, cascade: true });
    await Category.destroy({ where: {}, truncate: true, cascade: true });
    await NewsSource.destroy({ where: {}, truncate: true, cascade:true });

    // Seed necessary data
    await seedData();
  });

  afterAll(async () => {
    await sequelize.close();
  });
};

const seedData = async () => {
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // Seed Users
  await User.bulkCreate([
    {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: hashedPassword,
      role: 'user',
    },
    {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
    },
  ]);

  // Seed other data as needed for tests
  // For example, Categories and NewsSources
};

module.exports = setupTestDB;