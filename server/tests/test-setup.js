const { sequelize } = require('../src/models');
const { User, Article, Category, NewsSource, RefreshToken, SavedArticle, Preference } = require('../src/models');
// bcrypt (native), not bcryptjs - the latter was never a dependency here,
// and the User model already uses bcrypt everywhere else.
const bcrypt = require('bcrypt');

const setupTestDB = () => {
  beforeAll(async () => {
    // Belt-and-suspenders: db.config.js already points NODE_ENV=test at a
    // separate `${DB_NAME}_test` database, but force:true drops every table,
    // so refuse to run this helper at all outside a test environment.
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('setupTestDB() drops all tables - it must only run with NODE_ENV=test');
    }
    await sequelize.sync({ force: true }); // Drops and re-creates tables
  });

  beforeEach(async () => {
    // Clear all tables before each test. MySQL's InnoDB refuses to TRUNCATE
    // any table that's referenced by a foreign key constraint at all -
    // regardless of whether the referencing table is empty, and regardless
    // of truncation order (`cascade: true` is a Postgres concept; MySQL has
    // no equivalent). Disabling FK checks for the duration of the cleanup
    // is the standard way to reset a MySQL test database between tests.
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await RefreshToken.destroy({ where: {}, truncate: true });
    await SavedArticle.destroy({ where: {}, truncate: true });
    await Preference.destroy({ where: {}, truncate: true });
    await User.destroy({ where: {}, truncate: true });
    await Article.destroy({ where: {}, truncate: true });
    await Category.destroy({ where: {}, truncate: true });
    await NewsSource.destroy({ where: {}, truncate: true });
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    // Seed necessary data
    await seedData();
  });

  afterAll(async () => {
    await sequelize.close();
  });
};

const seedData = async () => {
  // Pre-hashed and inserted via bulkCreate (which skips the User model's
  // beforeCreate hook unless individualHooks is set), so this doesn't get
  // double-hashed.
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // Seed Users - field names must match models/user.models.js (name/email/
  // password only - there's no firstName/lastName/role column).
  await User.bulkCreate([
    {
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
    },
    {
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
    },
  ]);

  // Seed other data as needed for tests
  // For example, Categories and NewsSources
};

module.exports = setupTestDB;