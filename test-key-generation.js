// Test the key generation logic
function normalizeTeamName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[^\w\s]/g, ''); // Remove special characters
}

// Test with your actual data
const mlbHome = "Los Angeles Dodgers";
const mlbAway = "Philadelphia Phillies";
const mlbDate = "2025-10-09";

const sportsGamesHome = "Los Angeles Dodgers";
const sportsGamesAway = "Philadelphia Phillies";
const todayStr = "2025-10-09";

// Generate keys
const mlbKey = `${normalizeTeamName(mlbHome)}|${normalizeTeamName(mlbAway)}|${mlbDate}`;
const sportsGamesKey = `${normalizeTeamName(sportsGamesHome)}|${normalizeTeamName(sportsGamesAway)}|${todayStr}`;

console.log('MLB Collection Key:', mlbKey);
console.log('SportsGames Lookup Key:', sportsGamesKey);
console.log('Keys Match:', mlbKey === sportsGamesKey);

// Test individual team names
console.log('\nTeam Name Normalization:');
console.log('MLB Home:', `"${mlbHome}" -> "${normalizeTeamName(mlbHome)}"`);
console.log('MLB Away:', `"${mlbAway}" -> "${normalizeTeamName(mlbAway)}"`);
console.log('SportsGames Home:', `"${sportsGamesHome}" -> "${normalizeTeamName(sportsGamesHome)}"`);
console.log('SportsGames Away:', `"${sportsGamesAway}" -> "${normalizeTeamName(sportsGamesAway)}"`);
