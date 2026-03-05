// Test team name matching
const TEAM_NAME_MAPPINGS = {
  'bengals': ['cincinnati bengals', 'bengals'],
  'steelers': ['pittsburgh steelers', 'steelers'],
};

function normalizeTeamName(name) {
  if (!name) return '';
  
  const cleanName = name
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[^\w\s]/g, ''); // Remove special characters
  
  console.log(`Input: "${name}" -> Clean: "${cleanName}"`);
  
  // Check if this is a known team name and return all possible variations
  for (const [key, variations] of Object.entries(TEAM_NAME_MAPPINGS)) {
    console.log(`Checking key "${key}" with variations:`, variations);
    if (variations.includes(cleanName)) {
      console.log(`✅ MATCH FOUND! Returning variations:`, variations);
      return variations.map(v => v.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim());
    }
  }
  
  console.log(`❌ No match found, returning: ["${cleanName}"]`);
  return [cleanName];
}

// Test the function
console.log('=== Testing Bengals ===');
const bengalsResult = normalizeTeamName('Bengals');
console.log('Result:', bengalsResult);

console.log('\n=== Testing Steelers ===');
const steelersResult = normalizeTeamName('Steelers');
console.log('Result:', steelersResult);

console.log('\n=== Testing key generation ===');
const homeVariations = normalizeTeamName('Bengals');
const awayVariations = normalizeTeamName('Steelers');
const date = '2025-10-16';

console.log('Home variations:', homeVariations);
console.log('Away variations:', awayVariations);

for (const homeVar of homeVariations) {
  for (const awayVar of awayVariations) {
    const key = `${homeVar}|${awayVar}|${date}`;
    console.log(`Generated key: "${key}"`);
  }
}

