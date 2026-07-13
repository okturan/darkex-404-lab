/**
 * The 404 page's engine: apply the copy overrides, then boot the field.
 *
 * The page's public API is the four surfaces at the top of 404.html — copy
 * & motion config, color/type tokens, and the logo template. This bundle
 * never needs editing.
 */
import { startAssembly } from './boot.js';

const config = window.DARKEX404;

// Copy overrides: a set field replaces the markup's text, an empty one
// leaves the markup — the no-JS/crawler version — as-is.
const override = (selector, text) => text && (document.querySelector(selector).textContent = text);
override('.eyebrow', config.copy.eyebrow);
override('h1', config.copy.headline);
override('.detail', config.copy.detail);
override('.home-label', config.copy.ctaLabel);
if (config.copy.ctaHref) document.querySelector('.home').href = config.copy.ctaHref;

await startAssembly(config);
