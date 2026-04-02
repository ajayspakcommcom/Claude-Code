// Jest mock for CSS/CSS Module imports.
// In a test environment there is no Webpack, so CSS imports would crash.
// This returns an empty object so className lookups don't throw.
module.exports = {};
