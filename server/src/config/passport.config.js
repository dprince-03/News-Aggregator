const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const TwitterStrategy = require("passport-twitter").Strategy;

const User = require("../models/user.models");
const crypto = require("crypto");

const authConfig = require("./auth.config");

// OAuth-created accounts never log in via the local (password) strategy,
// but the User model still requires a password hash - Math.random() is not
// cryptographically secure and its 8-char base36 output is small enough to
// be realistically brute-forced against a leaked hash (or even online,
// given no additional protection beyond the standard auth rate limit).
// A long crypto-random value here means that path stays theoretical.
const generateUnusablePassword = () => crypto.randomBytes(32).toString('hex');

// ============================================
// JWT Strategy (for API authentication)
// ============================================
const jwtOptions = {
	jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
	secretOrKey: authConfig.jwt.secret,
	// Pin the accepted algorithm explicitly - every token this app issues
	// is HS256, and jsonwebtoken's verify() will reject anything else once
	// this is set, closing off algorithm-confusion/downgrade attacks.
	algorithms: ['HS256'],
};

passport.use(
	"jwt",
	new JwtStrategy(jwtOptions, async (jwtPayload, done) => {
		try {
			const user = await User.findByPk(jwtPayload.id, {
				attributes: { exclude: ['password'] },
			});

			if (!user) {
				return done(null, false);
			}

			return done(null, user);
		} catch (error) {
			return done(error, false);
		}
	})
);

// ============================================
// Local Strategy (username/password)
// ============================================
passport.use(
	"local",
	new LocalStrategy(
		{
			usernameField: "email",
			passwordField: "password",
		},
		async (email, password, done) => {
			try {
				const user = await User.findByEmailWithPassword(email);

				if (!user) {
					return done(null, false, { message: "Invalid email or password" });
				}

				const isMatch = await user.comparePassword(password);

				if (!isMatch) {
					return done(null, false, { message: "Invalid email or password" });
				}

				return done(null, user);
			} catch (error) {
				return done(error);
			}
		}
	)
);

// ============================================
// Google OAuth Strategy
// ============================================
if (authConfig.google.clientID && authConfig.google.clientSecret) {
	passport.use(
		new GoogleStrategy(
			{
				clientID: authConfig.google.clientID,
				clientSecret: authConfig.google.clientSecret,
				callbackURL: authConfig.google.callbackURL,
			},
			async (accessToken, refreshToken, profile, done) => {
				try {
					// Check if user exists
					let user = await User.findOne({
						where: { email: profile.emails[0].value },
					});

					if (!user) {
						// Create new user
						user = await User.create({
							email: profile.emails[0].value,
							name: profile.displayName,
							password: generateUnusablePassword(),
							google_id: profile.id,
							profile_picture: profile.photos[0]?.value,
						});
					}

					return done(null, user);
				} catch (error) {
					return done(error, false);
				}
			}
		)
	);
}

// ============================================
// Facebook OAuth Strategy
// ============================================
if (authConfig.facebook.clientID && authConfig.facebook.clientSecret) {
	passport.use(
		new FacebookStrategy(
			{
				clientID: authConfig.facebook.clientID,
				clientSecret: authConfig.facebook.clientSecret,
				callbackURL: authConfig.facebook.callbackURL,
				profileFields: authConfig.facebook.profileFields,
			},
			async (accessToken, refreshToken, profile, done) => {
				try {
					let user = await User.findOne({
						where: { email: profile.emails[0].value },
					});

					if (!user) {
						user = await User.create({
							email: profile.emails[0].value,
							name: profile.displayName,
							password: generateUnusablePassword(),
							facebook_id: profile.id,
							profile_picture: profile.photos[0]?.value,
						});
					}

					return done(null, user);
				} catch (error) {
					return done(error, false);
				}
			}
		)
	);
}

// ============================================
// Twitter (X) OAuth Strategy
// ============================================
if (authConfig.twitter.consumerKey && authConfig.twitter.consumerSecret) {
	passport.use(
		new TwitterStrategy(
			{
				consumerKey: authConfig.twitter.consumerKey,
				consumerSecret: authConfig.twitter.consumerSecret,
				callbackURL: authConfig.twitter.callbackURL,
				includeEmail: true,
			},
			async (token, tokenSecret, profile, done) => {
				try {
					// Twitter might not provide email
					const email = profile.emails?.[0]?.value || `${profile.username}@twitter.placeholder`;

					let user = await User.findOne({
						where: { email },
					});

					if (!user) {
						user = await User.create({
							email,
							name: profile.displayName,
							password: generateUnusablePassword(),
							twitter_id: profile.id,
							profile_picture: profile.photos[0]?.value,
						});
					}

					return done(null, user);
				} catch (error) {
					return done(error, false);
				}
			}
		)
	);
}

// Serialize user for session
passport.serializeUser((user, done) => {
	done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
	try {
		const user = await User.findByPk(id);
		done(null, user);
	} catch (error) {
		done(error, null);
	}
});

module.exports = passport;