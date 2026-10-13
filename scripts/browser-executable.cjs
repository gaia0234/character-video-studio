const {existsSync, readdirSync} = require('node:fs');
const {homedir} = require('node:os');
const {join} = require('node:path');
module.exports = function browserExecutable(explicit) {
  if (explicit) {
    if (!existsSync(explicit)) throw new Error('Configured browser executable does not exist');
    return explicit;
  }
  const cache = process.env.PLAYWRIGHT_BROWSERS_PATH || join(homedir(), '.cache', 'ms-playwright');
  const revisions = existsSync(cache) ? readdirSync(cache).filter(name => /^chromium-[0-9]+$/.test(name)) : [];
  for (const revision of revisions) {
    for (const layout of ['chrome-linux64/chrome', 'chrome-linux/chrome']) {
      const candidate = join(cache, revision, layout);
      if (existsSync(candidate)) return candidate;
    }
  }
  throw new Error('No installed Playwright Chromium; set KNOWLEDGE_EDITOR_BROWSER or CUTOUT_BROWSER');
};
