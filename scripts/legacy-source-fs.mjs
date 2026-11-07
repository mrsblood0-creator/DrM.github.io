// Compatibility adapter for the historical note importers. Source pages live
// in one data file so obsolete HTML files are not needed in the site folder.
import nativeFs from 'node:fs';
import path from 'node:path';

const sources = JSON.parse(nativeFs.readFileSync(new URL('../content/legacy-html-sources.json', import.meta.url), 'utf8'));
const archivedName = value => {
  if (typeof value !== 'string') return undefined;
  const absolute = path.resolve(value);
  return path.dirname(absolute) === process.cwd() && Object.hasOwn(sources, path.basename(absolute))
    ? path.basename(absolute) : undefined;
};

export default {
  ...nativeFs,
  readdirSync(directory, options) {
    const entries = nativeFs.readdirSync(directory, options);
    return path.resolve(directory) === process.cwd() && !options
      ? [...new Set([...entries, ...Object.keys(sources)])].sort() : entries;
  },
  readFileSync(file, options) {
    const name = archivedName(file);
    if (!name || nativeFs.existsSync(file)) return nativeFs.readFileSync(file, options);
    const encoding = typeof options === 'string' ? options : options?.encoding;
    return encoding ? Buffer.from(sources[name]).toString(encoding) : Buffer.from(sources[name]);
  },
  existsSync(file) {
    return nativeFs.existsSync(file) || Boolean(archivedName(file));
  },
};
