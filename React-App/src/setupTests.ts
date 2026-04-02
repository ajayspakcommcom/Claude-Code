// Adds custom matchers like toBeInTheDocument(), toHaveValue(), toBeVisible() etc.
// to every test file automatically — no manual import needed per file.
import "@testing-library/jest-dom";

// Polyfill fetch for jsdom environment.
// jsdom does not expose Node 18's built-in fetch — this makes it available
// so MSW and components using fetch() work without global.fetch = jest.fn().
import "cross-fetch/polyfill";
