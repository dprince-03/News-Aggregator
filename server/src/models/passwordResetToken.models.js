const { DataTypes } = require('sequelize');

const { sequelize } = require('../config/db.config');

// Tracks issued password-reset tokens so each one can be redeemed at most
// once, even though the underlying JWT stays cryptographically valid until
// its 1h expiry. Mirrors refresh_tokens' hash-lookup pattern - see
// persistResetToken/consumeResetToken in auth.middleware.js.
const PasswordResetToken = sequelize.define(
	'PasswordResetToken',
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
		used_at: {
			type: DataTypes.DATE,
			allowNull: true,
		},
	},
	{
		tableName: 'password_reset_tokens',
		timestamps: true,
		underscored: true,
		updatedAt: false,
	}
);

module.exports = PasswordResetToken;
