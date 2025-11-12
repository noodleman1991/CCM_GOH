const en = require('../messages/en.json');
const es = require('../messages/es.json');
const fr = require('../messages/fr.json');
const ar = require('../messages/ar.json');

function flattenKeys(obj, prefix = '') {
  let keys = [];
  for (let key in obj) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys = keys.concat(flattenKeys(obj[key], newKey));
    } else {
      keys.push(newKey);
    }
  }
  return keys;
}

function getValue(obj, path) {
  return path.split('.').reduce((o, k) => o?.[k], obj);
}

const enKeys = flattenKeys(en);
const esKeys = new Set(flattenKeys(es));
const frKeys = new Set(flattenKeys(fr));
const arKeys = new Set(flattenKeys(ar));

const missingES = enKeys.filter(k => !esKeys.has(k));
const missingFR = enKeys.filter(k => !frKeys.has(k));
const missingAR = enKeys.filter(k => !arKeys.has(k));

console.log('=== Missing Translations Summary ===\n');
console.log(`Spanish: ${missingES.length} keys`);
console.log(`French: ${missingFR.length} keys`);
console.log(`Arabic: ${missingAR.length} keys`);

console.log('\n=== Missing in Spanish ===');
missingES.forEach(k => {
  const value = getValue(en, k);
  console.log(`${k}: "${value}"`);
});

console.log('\n=== Missing in French ===');
missingFR.forEach(k => {
  const value = getValue(en, k);
  console.log(`${k}: "${value}"`);
});

console.log('\n=== Missing in Arabic ===');
missingAR.forEach(k => {
  const value = getValue(en, k);
  console.log(`${k}: "${value}"`);
});
