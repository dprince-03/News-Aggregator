const { DataTypes } = require('sequelize');

const { sequelize } = require('../config/db.config');

// Stores a hash of each issued refresh token (never the raw token) so a
// refresh token can be looked up and revoked without a DB leak handing out
// usable credentials. See auth.middleware.js for hashToken/persistRefreshToken.
const RefreshToken = sequelize.define(
	'RefreshToken',
	{
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		user_id: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		token_hash: {
			type: DataTypes.STRING(255),
			allowNull: false,
			unique: true,
		},
		expires_at: {
			type: DataTypes.DATE,
			allowNull: false,
		},
		revoked_at: {
			type: DataTypes.DATE,
			allowNull: true,
		},
	},
	{
		tableName: 'refresh_tokens',
		timestamps: true,
		underscored: true,
		updatedAt: false,
	}
);

module.exports = RefreshToken;
