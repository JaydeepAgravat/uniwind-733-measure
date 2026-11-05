// Counts how often Uniwind had to resolve a class string because its cache missed.
// React Native loads Uniwind from src/, so this is the same store the components use.
const store = require('uniwind/src/core/native/store').UniwindStore;

const stockResolveStyles = store.resolveStyles;

export const resolveCounter = { count: 0 };

store.resolveStyles = function (...args: Array<unknown>) {
  resolveCounter.count++;
  return stockResolveStyles.apply(this, args);
};

// The fix build emits `dataAttributeNames` on style records; the original build doesn't.
export const getBuildName = () => {
  const rules = Object.values(store.stylesheet ?? {}) as Array<Array<Record<string, unknown>>>;
  const sample = rules.find((styles) => styles.length > 0)?.[0];

  if (!sample) {
    return 'unknown';
  }

  return 'dataAttributeNames' in sample ? 'with the fix' : 'original main';
};
