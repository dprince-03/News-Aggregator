// This is a pure JSON API - no first-party page needs inline scripts/styles
// or to load third-party assets, so the CSP can be tight by default.
// Swagger UI (mounted at /api/docs) gets its own relaxed override scoped to
// that path only - see swagger.config.js.
const helmetConfig = {
	contentSecurityPolicy: {
		directives: {
			defaultSrc: ["'self'"],
			styleSrc: ["'self'"],
			scriptSrc: ["'self'"],
			imgSrc: ["'self'", "data:"],
			connectSrc: ["'self'"],
			fontSrc: ["'self'"],
			objectSrc: ["'none'"],
			frameAncestors: ["'none'"],
			upgradeInsecureRequests: [],
		},
	},
};

module.exports = helmetConfig;
