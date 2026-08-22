// Manual Jest mock for the `sanitize-html` package.
//
// The real package's `htmlparser2` dependency ships ESM-only as of
// sanitize-html 2.17.5+ (the version this repo needs for a moderate CVE
// fix - see npm audit / CHANGELOG.md). Node's own `require()` can load it
// fine (Node 22+ supports synchronous require-of-ESM), but Jest's
// CommonJS-only module system can't, so every test suite that transitively
// requires aggregator.service.js fails with "Cannot use import statement
// outside a module" before this mock existed.
//
// Every real call site (aggregator.service.js) passes
// `{ allowedTags: [], allowedAttributes: {} }` - i.e. strip all markup and
// keep only text. This mock reproduces exactly that behavior so tests still
// exercise the real "no HTML survives" guarantee, without needing the real
// library (or a project-wide Babel/ESM setup) inside Jest.
module.exports = (html) => (typeof html === 'string' ? html.replace(/<[^>]*>/g, '') : html);
