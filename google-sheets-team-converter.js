/**
 * Google Apps Script to automatically convert team names in Google Sheets
 * to match FlashLive API format
 * 
 * Instructions:
 * 1. Open your Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Delete any existing code
 * 4. Paste this entire script
 * 5. Save the script
 * 6. The script will run automatically whenever the sheet is edited
 */

// Copa Sudamericana specific team name mappings
const COPA_SUDAMERICANA_MAP = {
  'Independiente del Valle': 'Ind. del Valle (Ecu)',
  'Atlético Mineiro': 'Atletico-MG (Bra)',
  'Atletico Mineiro': 'Atletico-MG (Bra)',
  'Universidad Chile': 'U. De Chile (Chi)',
  'U. De Chile': 'U. De Chile (Chi)',
  'Lanús': 'Lanus (Arg)',
  'Lanus': 'Lanus (Arg)',
  'Alianza Lima': 'Alianza Lima (Per)',
  'Bolivar': 'Bolivar (Bol)',
  'Once Caldas': 'Once Caldas (Col)',
  'Central Córdoba': 'Central Cordoba (Arg)',
  'Central Cordoba': 'Central Cordoba (Arg)',
  'Godoy Cruz': 'Godoy Cruz (Arg)',
  'Independiente': 'Independiente (Arg)',
  'U. Católica': 'U. Catolica (Ecu)',
  'U. Catolica': 'U. Catolica (Ecu)',
  'Cienciano': 'Cienciano (Per)',
  'América de Cali': 'America De Cali (Col)',
  'America De Cali': 'America De Cali (Col)',
  'Mushuc Runa': 'Mushuc Runa (Ecu)',
  'Huracán': 'Huracan (Arg)',
  'Huracan': 'Huracan (Arg)',
  'Bucaramanga': 'Bucaramanga (Col)',
  'Guarani': 'Guarani (Par)',
  'Gremio': 'Gremio (Bra)',
  'SA Bulo Bulo': 'SA Bulo Bulo (Bol)',
  'Palestino': 'Palestino (Chi)',
  'Bahia': 'Bahia (Bra)',
  'Vasco': 'Vasco (Bra)',
  'Cerro Largo': 'Cerro Largo (Uru)',
  'Boston River': 'Boston River (Uru)',
  'Nacional Potosí': 'Nacional Potosi (Bol)',
  'Nacional Potosi': 'Nacional Potosi (Bol)',
  'Corinthians': 'Corinthians (Bra)',
  'Racing Montevideo': 'Racing Montevideo (Uru)',
  'Grau': 'Grau (Per)',
  'Sp. Luqueño': 'Sp. Luqueno (Par)',
  'Sp. Luqueno': 'Sp. Luqueno (Par)',
  'Cruzeiro': 'Cruzeiro (Bra)',
  'Unión de Santa Fe': 'Union de Santa Fe (Arg)',
  'Union de Santa Fe': 'Union de Santa Fe (Arg)',
  'Fluminense': 'Fluminense (Bra)',
  'U. Española': 'U. Espanola (Chi)',
  'U. Espanola': 'U. Espanola (Chi)',
  'GV San José': 'GV San Jose (Bol)',
  'GV San Jose': 'GV San Jose (Bol)',
  'FBC Melgar': 'FBC Melgar (Per)',
  'Puerto Cabello': 'Puerto Cabello (Ven)',
  'Caracas': 'Caracas (Ven)',
  'Deportes Iquique': 'Deportes Iquique (Chi)',
  'Defensa y Justicia': 'Defensa y Justicia (Arg)',
  'Vitória': 'Vitoria (Bra)',
  'Vitoria': 'Vitoria (Bra)'
};

// Copa Libertadores specific team name mappings
const COPA_LIBERTADORES_MAP = {
  // Add Copa Libertadores specific mappings here
  // These will be different from Copa Sudamericana mappings
  // Example: 'Boca Juniors': 'Boca Juniors (Arg)',
  // Add all Copa Libertadores teams with their specific FlashLive API names
};

// Argentine Primera specific team name mappings
const ARGENTINE_PRIMERA_DIVISION_MAP = {
  'Estudiantes': 'Estudiantes L.P.',
  'Estudiantes L.P.': 'Estudiantes L.P.',
  'Union de Santa Fe': 'Union de Santa Fe',
  'Unión de Santa Fe': 'Union de Santa Fe',
  'Unión Santa Fe': 'Union de Santa Fe',
  'Defensa y Justicia': 'Defensa y Justicia',
  'Argentinos Juniors': 'Argentinos Jrs',
  'Argentinos Jrs': 'Argentinos Jrs',
  'Central Córdoba SdE': 'Central Cordoba',
  'Central Cordoba': 'Central Cordoba',
  'Central Cordoba (Arg)': 'Central Cordoba',
  'Belgrano': 'Belgrano',
  'Barracas Central': 'Barracas Central',
  'Tigre': 'Tigre',
  'Racing Club': 'Racing Club',
  'Boca Juniors': 'Boca Juniors',
  'Banfield': 'Banfield',
  'Huracan': 'Huracan',
  'Huracán': 'Huracan',
  'Independiente Rivadavia': 'Ind. Rivadavia',
  'Ind. Rivadavia': 'Ind. Rivadavia',
  'Newell\'s Old Boys': 'Newells Old Boys',
  'Newells Old Boys': 'Newells Old Boys',
  'Aldosivi': 'Aldosivi',
  'Deportivo Riestra': 'Dep. Riestra',
  'Dep. Riestra': 'Dep. Riestra',
  'Lanus (Arg)': 'Lanus',
  'Lanús': 'Lanus',
  'Lanus': 'Lanus',
  'Vélez Sarsfield': 'Velez Sarsfield',
  'Velez Sarsfield': 'Velez Sarsfield',
  'Rosario Central': 'Rosario Central',
  'River Plate': 'River Plate',
  'San Lorenzo': 'San Lorenzo',
  'San Martín San Juan': 'San Martin S.J.',
  'San Martin S.J.': 'San Martin S.J.',
  'Atlético Tucumán': 'Atl. Tucuman',
  'Atl. Tucuman': 'Atl. Tucuman',
  'Sarmiento': 'Sarmiento Junin',
  'Sarmiento Junin': 'Sarmiento Junin',
  'Instituto': 'Instituto',
  'Talleres Córdoba': 'Talleres Cordoba',
  'Talleres Cordoba': 'Talleres Cordoba',
  'Gimnasia La Plata': 'Gimnasia L.P.',
  'Gimnasia L.P.': 'Gimnasia L.P.',
  'Platense': 'Platense',
  'Godoy Cruz': 'Godoy Cruz',
  'Independiente': 'Independiente'
};

// Saudi Pro League specific team name mappings
const SAUDI_PRO_LEAGUE_MAP = {
  'Al Riyadh': 'Al Riyadh',
  'Al Kholood': 'Al Kholood',
  'Al Feiha': 'Al Fayha',
  'Al Taawon': 'Al Taawon',
  'Al Najma': 'Al Najma',
  'Al-Ahli': 'Al Ahli SC',
  'Al Fateh': 'Al Fateh',
  'Al Ittifaq': 'Al Ettifaq',
  'NEOM': 'Neom SC',
  'Al Khaleej': 'Al Khaleej',
  'Al Ittihad': 'Al Ittihad',
  'Al Hilal': 'Al Hilal',
  'Al Quadisiya': 'Al Qadisiya',
  'Al Akhdoud': 'Al Okhdood',
  'Al Shabab': 'Al Shabab',
  'Damac': 'Damac',
  'Al Hazm': 'Al Hazem',
  'Al Nassr': 'Al Nassr'
};

// EFL Cup specific team name mappings
const EFL_CUP_MAP = {
  'Grimsby Town': 'Grimsby',
  'Wycombe Wanderers': 'Wycombe',
  'Cardiff City': 'Cardiff',
  'Brighton & Hove Albion': 'Brighton',
  'Swansea City': 'Swansea',
  'Wolverhampton Wanderers': 'Wolves',
  'Tottenham Hotspur': 'Tottenham',
  'Newcastle United': 'Newcastle'
};

// DFB-Pokal specific team name mappings
const DFB_POKAL_MAP = {
  'Borussia Dortmund': 'Dortmund',
  'Hertha BSC': 'Hertha Berlin',
  'Borussia M\'gladbach': 'B. Monchengladbach',
  'Energie Cottbus': 'Cottbus',
  'Greuther Fürth': 'Greuther Furth',
  'Mainz 05': 'Mainz',
  'Darmstadt 98': 'Darmstadt',
  'Fortuna Düsseldorf': 'Dusseldorf',
  'Köln': 'FC Koln',
  'Bayern München': 'Bayern Munich',
  'Schalke 04': 'Schalke'
};

// FA Cup specific team name mappings
const FACUP_MAP = {
  'Luton Town': 'Luton',
  'Forest Green Rovers': 'Forest Green',
  'Chelmsford City': 'Chelmsford',
  'Braintree Town': 'Braintree',
  'AFC Wimbledon': 'AFC Wimbledon',
  'Gateshead': 'Gateshead',
  'Barnsley': 'Barnsley',
  'York City': 'York City',
  'Blackpool': 'Blackpool',
  'Scunthorpe United': 'Scunthorpe',
  'Bolton Wanderers': 'Bolton',
  'Huddersfield Town': 'Huddersfield',
  'Boreham Wood': 'Boreham Wood',
  'Crawley Town': 'Crawley',
  'Bromley': 'Bromley',
  'Bristol Rovers': 'Bristol Rovers',
  'Burton Albion': 'Burton',
  'St Albans City': 'St. Albans',
  'St. Albans City': 'St. Albans',
  'Buxton': 'Buxton',
  'Chatham Town': 'Chatham',
  'Cambridge United': 'Cambridge Utd',
  'Chester': 'Chester',
  'Cheltenham Town': 'Cheltenham',
  'Bradford City': 'Bradford City',
  'Colchester United': 'Colchester',
  'Milton Keynes Dons': 'MK Dons',
  'MK Dons': 'MK Dons',
  'Crewe Alexandra': 'Crewe',
  'Doncaster Rovers': 'Doncaster',
  'Fleetwood Town': 'Fleetwood',
  'Barnet': 'Barnet',
  'Grimsby Town': 'Grimsby',
  'Ebbsfleet United': 'Ebbsfleet',
  'Halifax Town': 'FC Halifax',
  'Exeter City': 'Exeter',
  'Macclesfield': 'Macclesfield',
  'AFC Totton': 'AFC Totton',
  'Mansfield Town': 'Mansfield',
  'Harrogate Town': 'Harrogate',
  'Newport County': 'Newport',
  'Gillingham': 'Gillingham',
  'Oldham Athletic': 'Oldham',
  'Northampton Town': 'Northampton',
  'Peterborough United': 'Peterborough',
  'Cardiff City': 'Cardiff',
  'Reading': 'Reading',
  'Carlisle United': 'Carlisle',
  'Rotherham United': 'Rotherham',
  'Swindon Town': 'Swindon',
  'Salford City': 'Salford',
  'Lincoln City': 'Lincoln',
  'Slough Town': 'Slough',
  'Altrincham': 'Altrincham',
  'Spennymoor Town': 'Spennymoor',
  'Barrow': 'Barrow',
  'Stevenage': 'Stevenage',
  'Chesterfield': 'Chesterfield',
  'Sutton United': 'Sutton',
  'AFC Telford United': 'AFC Telford',
  'Tranmere Rovers': 'Tranmere',
  'Stockport County': 'Stockport County',
  'Wealdstone': 'Wealdstone',
  'Southend United': 'Southend',
  'Weston-super-Mare': 'Weston-super-Mare',
  'Aldershot Town': 'Aldershot',
  'Wigan Athletic': 'Wigan',
  'Hemel Hempstead Town': 'Hemel Hempstead',
  'Wycombe Wanderers': 'Wycombe',
  'Plymouth Argyle': 'Plymouth',
  'Brackley Town': 'Brackley Town',
  'Notts County': 'Notts Co',
  'South Shields': 'South Shields',
  'Shrewsbury Town': 'Shrewsbury',
  'Eastleigh': 'Eastleigh',
  'Walsall': 'Walsall',
  'Port Vale': 'Port Vale',
  'Maldon & Tiptree': 'Maldon & Tiptree',
  'Gainsborough Trinity': 'Gainsborough',
  'Accrington Stanley': 'Accrington',
  'Tamworth': 'Tamworth',
  'Leyton Orient': 'Leyton Orient'
};

// NBA specific team name mappings
const NBA_MAP = {
  // All team names match exactly - these mappings ensure consistency
  'Boston Celtics': 'Boston Celtics',
  'Toronto Raptors': 'Toronto Raptors',
  'Oklahoma City Thunder': 'Oklahoma City Thunder',
  'Indiana Pacers': 'Indiana Pacers',
  'Atlanta Hawks': 'Atlanta Hawks',
  'Memphis Grizzlies': 'Memphis Grizzlies',
  'Charlotte Hornets': 'Charlotte Hornets',
  'Dallas Mavericks': 'Dallas Mavericks',
  'Brooklyn Nets': 'Brooklyn Nets',
  'Phoenix Suns': 'Phoenix Suns',
  'Miami Heat': 'Miami Heat',
  'Orlando Magic': 'Orlando Magic',
  'Milwaukee Bucks': 'Milwaukee Bucks',
  'Chicago Bulls': 'Chicago Bulls',
  'Cleveland Cavaliers': 'Cleveland Cavaliers',
  'Golden State Warriors': 'Golden State Warriors',
  'Los Angeles Lakers': 'Los Angeles Lakers',
  'Denver Nuggets': 'Denver Nuggets',
  'Los Angeles Clippers': 'Los Angeles Clippers',
  'San Antonio Spurs': 'San Antonio Spurs',
  'Washington Wizards': 'Washington Wizards',
  'New York Knicks': 'New York Knicks',
  'Detroit Pistons': 'Detroit Pistons',
  'Houston Rockets': 'Houston Rockets',
  'New Orleans Pelicans': 'New Orleans Pelicans',
  'Sacramento Kings': 'Sacramento Kings',
  'Minnesota Timberwolves': 'Minnesota Timberwolves',
  'Philadelphia 76ers': 'Philadelphia 76ers',
  'Portland Trail Blazers': 'Portland Trail Blazers',
  'Utah Jazz': 'Utah Jazz'
};

// NWSL specific team name mappings
const NWSL_MAP = {
  'Kansas City Current': 'Kansas City Current W',
  'Kansas City Current W': 'Kansas City Current W',
  'San Diego Wave': 'San Diego Wave W',
  'San Diego Wave W': 'San Diego Wave W',
  'Chicago Stars': 'Chicago W',
  'Chicago W': 'Chicago W',
  'Angel City': 'Angel City W',
  'Angel City W': 'Angel City W',
  'North Carolina Courage': 'North Carolina Courage W',
  'North Carolina Courage W': 'North Carolina Courage W',
  'NJ/NY Gotham FC': 'Gotham W',
  'Gotham': 'Gotham W',
  'Gotham W': 'Gotham W',
  'Orlando Pride': 'Orlando Pride W',
  'Orlando Pride W': 'Orlando Pride W',
  'Seattle Reign': 'Seattle Reign W',
  'Seattle Reign W': 'Seattle Reign W',
  'Portland Thorns': 'Portland Thorns W',
  'Portland Thorns W': 'Portland Thorns W',
  'Houston Dash': 'Houston Dash W',
  'Houston Dash W': 'Houston Dash W',
  'Racing Louisville FC': 'Racing Louisville W',
  'Racing Louisville': 'Racing Louisville W',
  'Racing Louisville W': 'Racing Louisville W',
  'Bay FC': 'Bay FC W',
  'Bay FC W': 'Bay FC W',
  'Utah Royals': 'Utah Royals W',
  'Utah Royals W': 'Utah Royals W',
  'Washington Spirit': 'Washington Spirit W',
    'Washington Spirit W': 'Washington Spirit W'
};

// Women's Super League specific team name mappings
const WOMENS_SUPER_LEAGUE_MAP = {
    'Chelsea': 'Chelsea W',
    'Chelsea W': 'Chelsea W',
    'Chelsea FC Women': 'Chelsea W',
    'Manchester City': 'Manchester City W',
    'Manchester City W': 'Manchester City W',
    'Manchester City Women': 'Manchester City W',
    'Manchester United': 'Manchester Utd W',
    'Manchester Utd': 'Manchester Utd W',
    'Manchester Utd W': 'Manchester Utd W',
    'Manchester United Women': 'Manchester Utd W',
    'Manchesterd United': 'Manchester Utd W',
    'Tottenham Hotspur': 'Tottenham W',
    'Tottenham': 'Tottenham W',
    'Tottenham W': 'Tottenham W',
    'Tottenham Hotspur Women': 'Tottenham W',
    'Arsenal': 'Arsenal W',
    'Arsenal W': 'Arsenal W',
    'Arsenal Women': 'Arsenal W',
    'London City Lionesses': 'London City Lionesses W',
    'London City Lionesses W': 'London City Lionesses W',
    'London': 'London City Lionesses W',
    'Brighton & Hove Albion': 'Brighton W',
    'Brighton': 'Brighton W',
    'Brighton W': 'Brighton W',
    'Brighton & Hove Albion Women': 'Brighton W',
    'Aston Villa': 'Aston Villa W',
    'Aston Villa W': 'Aston Villa W',
    'Aston Villa Women': 'Aston Villa W',
    'Everton': 'Everton W',
    'Everton W': 'Everton W',
    'Everton Women': 'Everton W',
    'Leicester City': 'Leicester W',
    'Leicester': 'Leicester W',
    'Leicester W': 'Leicester W',
    'Leicester City WFC': 'Leicester W',
    'Leicester City Women': 'Leicester W',
    'Liverpool': 'Liverpool W',
    'Liverpool W': 'Liverpool W',
    'Liverpool Women': 'Liverpool W',
    'West Ham United': 'West Ham W',
    'West Ham': 'West Ham W',
    'West Ham W': 'West Ham W',
    'West Ham United Women': 'West Ham W'
};

const WOMENS_UCL_MAP = {
  'Vålerenga': 'Valerenga W',
  'Valerenga': 'Valerenga W',
  'Vålerenga Kvinner': 'Valerenga W',
  'Valerenga Kvinner': 'Valerenga W',
  'Roma': 'AS Roma W',
  'AS Roma': 'AS Roma W',
  'AS Roma Women': 'AS Roma W',
  'Wolfsburg': 'Wolfsburg W',
  'VfL Wolfsburg': 'Wolfsburg W',
  'OL Lyonnes': 'Lyon W',
  'Olympique Lyonnais': 'Lyon W',
  'Lyon': 'Lyon W',
  'Paris FC': 'Paris FC W',
  'Real Madrid': 'Real Madrid W',
  'Real Madrid Femenino': 'Real Madrid W',
  'Chelsea FC': 'Chelsea W',
  'Chelsea': 'Chelsea W',
  'St. Pölten': 'St. Polten W',
  'St. Polten': 'St. Polten W',
  'SKN St. Pölten': 'St. Polten W',
  'SKN St. Polten': 'St. Polten W',
  'OH Leuven': 'Leuven W',
  'Leuven': 'Leuven W',
  'Barcelona': 'Barcelona W',
  'FC Barcelona': 'Barcelona W',
  'Arsenal': 'Arsenal W',
  'Juventus': 'Juventus W',
  'Juventus Women': 'Juventus W',
  'Bayern': 'Bayern Munich W',
  'Bayern Munich': 'Bayern Munich W',
  'Bayern München': 'Bayern Munich W',
  'Bayern Munchen': 'Bayern Munich W',
  'Atletico Madrid': 'Atl. Madrid W',
  'Atlético Madrid': 'Atl. Madrid W',
  'Atl. Madrid': 'Atl. Madrid W',
  'PSG': 'PSG W',
  'Paris Saint-Germain': 'PSG W',
  'Manchester United': 'Manchester Utd W',
  'Manchester Utd': 'Manchester Utd W',
  'SL Benfica': 'SL Benfica W',
  'Benfica': 'SL Benfica W',
  'Twente': 'Twente W',
  'Paris FC W': 'Paris FC W',
  'Real Madrid W': 'Real Madrid W',
  'Barcelona W': 'Barcelona W',
  'Arsenal W': 'Arsenal W',
  'Bayern Munich W': 'Bayern Munich W',
  'Atl. Madrid W': 'Atl. Madrid W',
  'PSG W': 'PSG W',
  'Manchester Utd W': 'Manchester Utd W',
  'SL Benfica W': 'SL Benfica W',
  'Twente W': 'Twente W',
  'Lyon W': 'Lyon W',
  'Leuven W': 'Leuven W',
  'St. Polten W': 'St. Polten W'
};

// NCAAM specific team name mappings
const NCAAM_MAP = {
  'Queens': 'Queens Royals',
  'Bradley': 'Bradley',
  'Eastern Illinois': 'Eastern Illinois',
  'Arlington Baptist': 'Arlington Baptist',
  'Binghamton': 'Binghamton',
  'Texas A&M-San Antonio': 'Texas A&M SA Jaguars',
  'Murray State': 'Murray State',
  'Millsaps': 'Millsaps',
  'Drake': 'Drake',
  'Thomas-ME': 'Thomas-ME',
  'Widener': 'Widener',
  'Maryland': 'Maryland',
  'High Point': 'High Point',
  'Quinnipiac': 'Quinnipiac',
  'IU Indianapolis': 'IU Indy',
  'Morgan State': 'Morgan State',
  'Southern Miss': 'Southern Miss',
  'Georgia State Panthers': 'Georgia State',
  'Farmingdale State': 'Farmingdale State',
  'Arizona': 'Arizona',
  'Embry-Riddle-AZ': 'Embry-Riddle Eagles',
  'New Hampshire': 'New Hampshire Wildcats',
  'NC Central': 'N. Carolina Central',
  'Rider': 'Rider',
  'Long Island': 'Long Island University',
  'Charleston Southern': 'Charleston Southern',
  'Colgate': 'Colgate',
  'Fairfield': 'Fairfield',
  'Paine College': 'Paine College',
  'Vermont State Johnson': 'Vermont State Johnson',
  'SUNY Cobleskill': 'SUNY Cobleskill',
  'Delaware Fightin': 'Delaware',
  'New College-FL': 'New College-FL',
  'Southern': 'Southern Univ.',
  'Erskine': 'Erskine',
  'Union (KY)': 'Union (KY)',
  'North Carolina Central': 'N. Carolina Central',
  'Long Island University': 'Long Island University',
  'Youngstown State': 'Youngstown State',
  'Central Arkansas': 'Central Arkansas',
  'DeSales': 'DeSales',
  'Canisius': 'Canisius',
  'Wofford': 'Wofford',
  'Western Carolina': 'Western Carolina',
  'New Haven': 'New Haven Chargers',
  'Florida National': 'Florida National',
  'Oakwood': 'Oakwood',
  'Paine': 'Paine',
  'Kentucky Christian': 'Kentucky Christian',
  'UC Clermont': 'UC Clermont',
  'Franklin College': 'Franklin College',
  'Colorado Buffaloes': 'Colorado',
  'BYU': 'Brigham Young',
  'San José State': 'San Jose State',
  'Louisiana-Lafayette': 'Louisiana Lafayette',
  'Arkansas State': 'Arkansas State',
  'South Alabama': 'South Alabama',
  'Missouri': 'Missouri',
  'Union College (KY)': 'Union (KY)',
  'Marshall': 'Marshall',
  'Texas State Bobcats': 'Texas State',
  'Coastal Carolina': 'Coastal Carolina',
  'Tusculum': 'Tusculum',
  'Mount Olive': 'Mount Olive',
  'Holy Cross': 'Holy Cross',
  'Marist': 'Marist',
  'Md.-East. Shor': 'Md.-East. Shore',
  'Maryland Eastern Shore': 'Md.-East. Shore',
  'Saint Peter\'s': 'St. Peters',
  'LeTourneau': 'LeTourneau',
  'Tennessee Tech': 'Tennessee Tech',
  'Air Force': 'Air Force',
  'RIT': 'RIT Tigers',
  'Bluefield University': 'Bluefield State',
  'Bellarmine': 'Bellarmine',
  'Boston University': 'Boston University',
  'Florida A&M': 'Florida A&M',
  'UTRGV': 'UTRGV',
  'Lehigh': 'Lehigh',
  'American': 'American University',
  'Chicago State': 'Chicago State',
  'Gardner-Webb': 'Gardner Webb',
  'West Ga.': 'West Georgia',
  'Mercyhurst': 'Mercyhurst',
  'Campbell': 'Campbell',
  'Jacksonville': 'Jacksonville',
  'American University': 'American University',
  'Indiana State': 'Indiana State',
  'Oklahoma Christian': 'Oklahoma Christian',
  'Maine': 'Maine Black Bears',
  'Southern Arkansas': 'Southern Arkansas',
  'UT Rio Grande Valley': 'UTRGV',
  'Fairleigh Dickinson': 'Fairleigh Dickinson',
  'Green Bay': 'Wisc. Green Bay',
  'Albany': 'Albany Great Danes',
  'Menlo': 'Menlo',
  'Hampton': 'Hampton',
  'SUNY Maritime': 'SUNY Maritime',
  'North Dakota': 'North Dakota',
  'Bethune-Cookman': 'Bethune-Cookman',
  'SE Louisiana': 'SE Louisiana',
  'Northwestern State': 'Northwestern St.',
  'Lipscomb': 'Lipscomb',
  'William Carey University (MS)': 'William Carey',
 'Saint Elizabeth': 'St. Elizabeth',
  'Bethel-TN': 'Bethel (TN)',
  'Fisk': 'Fisk',
  'UNT Dallas': 'UNT Dallas',
  'Cleveland St': 'Cleveland State',
  'Southeast Missouri State': 'Southeast Missouri State',
  'McKendree': 'McKendree',
  'UL Monroe': 'Louisiana Monroe',
  'New Mexico Highlands': 'New Mexico Highlands',
  'UNO': 'New Orleans',
  'Samford': 'Samford',
  'Jackson State': 'Jackson State',
  'SEMO': 'Southeast Missouri State',
  'Oakland': 'Oakland',
  'Northern Illinois': 'Northern Illinois',
  'Northern State': 'Northern State',
  'Utah Tech': 'Utah Tech',
  'Saint Francis (PA)': 'St. Francis (PA)',
  'Bryan': 'Bryan',
  'Trinity': 'Trinity',
  'Towson': 'Towson',
  'South Dakota State': 'South Dakota St.',
  'UTPB': 'UTPB',
  'Purdue Fort Wayne': 'IPFW',
  'Incarnate Word': 'Inc. Word',
  'Hawai\'i Pacific': 'Hawai\'i Pacific',
  'Texas Southern University': 'Texas Southern',
  'South Carolina State': 'South Carolina St',
  'West Coast Baptist': 'West Coast Baptist',
  'Montana State': 'Montana State',
  'Florida Memorial': 'Florida Mem.',
  'San Jose State': 'San Jose State',
  'Texas Southern': 'Texas Southern',
  'Life Pacific': 'Life Pacific',
  'McMurry': 'McMurry',
  'Northwest Indian': 'Northwest Indian',
  'North Dakota State University': 'North Dakota St',
  'University of Idaho': 'Idaho',
  'North Dakota State': 'North Dakota St',
  'Idaho': 'Idaho',
  'Colorado College': 'Colorado College',
  'CSU Bakersfield': 'CSU Bakersfield',
  'University of Denver': 'Denver',
  'Lincoln University CA': 'Lincoln University CA',
  'Willamette University': 'Willamette',
  'St. Thomas': 'St. Thomas (Minn.)',
  'Cal State Bakersfield': 'CSU Bakersfield',
  'Lincoln (CA)': 'Lincoln (CA)',
  'Willamette': 'Willamette',
  'UC Santa Cruz': 'UC Santa Cruz',
  'Denver': 'Denver',
  'Bethesda': 'Bethesda',
  'La Verne': 'La Verne',
  'La Sierra': 'La Sierra',
  'Cal Tech': 'Cal Tech',
  'Nobel University': 'Nobel University',
  'Eastern Washington': 'East. Washington',
  'Fresno Pacific': 'Fresno Pacific',
  'South Carolina Upstate': 'USC Upstate',
  'Arkansas-Pine Bluff': 'Arkansas-Pine Bluff',
  'Mount St. Mary\'s': 'Mount St. Mary\'s',
  'Lindenwood': 'Lindenwood',
  'Alcorn State': 'Alcorn State',
  'Long Beach State': 'Long Beach State',
  'Louisville': 'Louisville',
  'Penn State York': 'Penn State York',
  'Evansville': 'Evansville',
  'Georgia Southern': 'Georgia Southern',
  'NJIT': 'NJIT',
  'St. Mary\'s': 'St. Marys (CA)',
  'East West University': 'East West University',
  'Nicholls': 'Nicholls State',
  'North Carolina A&T': 'N. Carolina A&T',
  'St. Joseph\'s Brooklyn': 'St. Joseph\'s Brooklyn',
  'Merchant Marine Academy': 'Merchant Marine Academy',
  'Converse': 'Converse',
  'Caldwell': 'Caldwell',
  'UNC Asheville': 'UNC Asheville',
  'Oral Roberts': 'Oral Roberts',
  'College of Biblical Studies': 'College of Biblical Studies',
  'UNC Greensboro': 'NC Greensboro',
  'Missouri Southern': 'Missouri Southern',
  'Arkansas Baptist': 'Arkansas Baptist',
  'Robert Morris': 'Robert Morris',
  'Texas': 'Texas',
  'Southern Utah': 'Southern Utah',
  'San Francisco State': 'San Francisco State',
  'Adams State': 'Adams State',
  'Portland State': 'Portland State',
  'UT Martin': 'UT Martin',
  'Louisiana Tech': 'Louisiana Tech',
  'Occidental College': 'Occidental',
  'Occidental': 'Occidental',
  'Cal Poly Humboldt': 'Cal Poly Humboldt',
  'Park University': 'Park University',
  'Dominican': 'Dominican',
  'Hawaii': 'Hawaii',
  'Milligan': 'Milligan',
  'East Texas A&M': 'East Texas A&M',
  'Bluefield University': 'Bluefield University',
  'Coppin State': 'Coppin State',
  'Carolina University': 'Carolina University',
  'Southern Indiana': 'Southern Indiana',
  'Dickinson': 'Dickinson Red Devils',
  'Delaware State': 'Delaware State',
  'Lynchburg': 'Lynchburg',
  'Southern Virginia': 'Southern Virginia',
  'Dickinson College': 'Dickinson Red Devils',
  'Plattsburgh State': 'Plattsburgh',
  'LaGrange': 'La Grange',
  'Washington & Lee': 'Washington & Lee',
  'Belmont Abbey': 'Belmont Abbey',
  'South Dakota': 'South Dakota Coyotes',
  'Alabama A&M': 'Alabama A&M',
  'USC Upstate': 'USC Upstate',
  'Ottawa University': 'Ottawa University',
  'North Alabama': 'North Alabama',
  'Pacific Lutheran (WA)': 'Pacific Lutheran (WA)',
  'Eastern Washington University': 'East. Washington',
  'PSU Abington': 'Penn State Abington',
  'Penn State Abington': 'Penn State Abington',
  'Grambling State': 'Grambling St.',
  'Wright State': 'Wright State',
  'Whittier': 'Whittier',
  'Curry College': 'Curry College',
  'Long Island University': 'LIU Sharks',
  'The Citadel': 'Citadel',
  'Le Moyne College': 'Le Moyne',
  'University of Valley Forge': 'Valley Forge',
  'Allegheny College': 'Allegheny College',
  'Illinois State': 'Illinois State',
  'Northwood': 'Northwood',
  'University of D.C.': 'University of the District of Columbia',
  'Valley Forge': 'Valley Forge',
  'Randolph': 'Randolph',
  'University of Health Sciences & Pharm': 'University of Health Sciences & Pharm',
  'Central Connecticut': 'Central Connecticut State',
  'Toccoa Falls': 'Toccoa Falls',
  'Capital University': 'Capital University',
  'Illinois Tech': 'Illinois Tech',
  'Bethany College': 'Bethany College',
  'University of the District of Columbia': 'University of the District of Columbia',
  'Mid-Atlantic Christian': 'Mid-Atlantic Christian',
  'Trinity College of Florida': 'Trinity College of Florida',
  'Grambling': 'Grambling St.',
  'Omaha': 'Nebraska O.',
  'Merrimack': 'Merrimack Warriors',
  'North Florida': 'North Florida',
  'Cal State Northridge': 'CS Northridge',
  'Tougaloo': 'Tougaloo',
  'Wilmington (Del.)': 'Wilmington',
  'Wilmington': 'Wilmington',
  'Wilmington (DE)': 'Wilmington',
  'Calumet College of St. Joseph': 'Calumet College of St. Joseph',
  'Sam Houston': 'Sam Houston St.',
  'Alabama State': 'Alabama State',
  'Georgetown': 'Georgetown',
  'Umass': 'UMass',
  'Columbia': 'Columbia',
  'SIU-Edwardsville': 'Siu Edwardsville',
  'SIU Edwardsville': 'Siu Edwardsville',
  'Northeastern': 'Northeastern',
  'Boston U.': 'Boston University',
  'Veterans Classic': 'Veterans Classic',
  'Jarvis Christian': 'Jarvis Christian',
  'Purdue-Fort Waynelil': 'Purdue Fort Wayne',
  'Kansas': 'Kansas',
  'Detroit Mercy': 'Detroit',
  'Lane': 'Lane',
  'Fort Lauderdale': 'Fort Lauderdale',
  'Sacred Heart': 'Sacred Heart',
  'Georgia State': 'Georgia State',
  'Virginia Lynchburg': 'Virginia-Lynchburg',
  'Valparaiso': 'Valparaiso',
  'Huntingdon': 'Huntingdon',
  'Hofstra': 'Hofstra',
  'Bucknell': 'Bucknell',
  'Washington State': 'Washington State',
  'Winthrop': 'Winthrop',
  'West Virginia Wesleyan': 'West Virginia Wesleyan',
  'Siena': 'Siena',
  'Rowan': 'Rowan',
  'Cornell': 'Cornell',
  'Mansfield': 'Mansfield',
  'Wagner College': 'Wagner',
  'Wagner': 'Wagner',
  'Trinity Christian': 'Trinity Christian',
  'Stonehill College': 'Stonehill',
  'Colorado Christian': 'Colorado Christian',
  'Stonehill': 'Stonehill',
  'Kansas City': 'Kansas City',
  'Justice College': 'Justice College',
  'Mississippi Valley State': 'Miss. Valley St.',
  'FGCU': 'Florida Gulf Coast',
  'WNMU': 'WNMU',
  'Whitman College': 'Whitman College',
  'McNeese State': 'McNeese State',
  'Idaho State University': 'Idaho State',
  'Idaho State': 'Idaho State',
  'McNeese': 'McNeese State',
  'Pepperdine': 'Pepperdine',
  'Chattanooga': 'Chattanooga Mocs',
  'California Baptist': 'California Baptist',
  'Alabama': 'Alabama',
  'Princeton': 'Princeton',
  'Weber State': 'Weber State',
  'IU Indy': 'IU Indy',
  'UT Arlington': 'UT Arlington',
  'Florida International': 'Florida International',
  'Penn State': 'Penn State',
  'Drexel': 'Drexel',
  'Milwaukee': 'Wisc. Milwaukee',
  'UMBC': 'UMBC Retrievers',
  'Champion Christian': 'Champion Christian',
  'San Francisco': 'San Francisco',
  'Northern Kentucky': 'Northern Kentucky',
  'Monmouth': 'Monmouth',
  'Providence': 'Providence',
  'Utah Valley': 'Utah Valley State',
  'Cal State Fullerton': 'CS Fullerton',
  'Austin Peay': 'Austin Peay',
  'Montana': 'Montana',
  'Elon': 'Elon',
  'Southern-New Orleans': 'New Orleans',
  'Spring Hill': 'Spring Hill',
  'IUPUI': 'IUPUI',
  'Averett': 'Averett',
  'East Tennessee State': 'East Tennessee St',
  'Prairie View A&P': 'Prairie View A&M',
  'Arkansas': 'Arkansas',
  'Queens (NC)': 'Queens Royals',
  'Texas A&M-Corpus Christi': 'Texas A&M-CC',
  'Houston Christian': 'Houston Christian',
  'Webster': 'Webster',
  'Army': 'Army',
  'Northwestern Okla.': 'Northwestern Okla.',
  'Northwestern Oklahoma State': 'Northwestern Oklahoma State',
  'Central Michigan': 'Central Michigan',
  'Arkansas - Pine Bluff': 'Arkansas-Pine Bluff',
  'Arkansas Pine Bluff': 'Arkansas-Pine Bluff',
  'Pacific': 'Pacific',
  'Cal Poly': 'Cal Poly',
  'Oklahoma': 'Oklahoma',
  'Alliance Invitational': 'Alliance Invitational',
  'Pennsylvania': 'Pennsylvania',
  'Texas A&M': 'Texas A&M',
  'Vermont': 'Vermont',
  'Le Moyne': 'Le Moyne',
  'Lyon College': 'Lyon College',
  'Oakland City': 'Oakland City',
  'UC Davis': 'UC Davis',
  'Kentucky Christian': 'Kentucky Christian',
  'Washington': 'Washington',
  'Molloy': 'Molloy',
  'Reinhardt': 'Reinhardt',
  'Ripon': 'Ripon',
  'CSU Fullerton': 'CS Fullerton',
  'Columbia Int\'l': 'Columbia International',
  'Columbia International': 'Columbia International',
  'Penn State-Shenango': 'Penn State Shenango',
  'Charleston So.': 'Charleston',
  'Presbyterian': 'Presbyterian',
  'Western Kentucky': 'Western Kentucky',
  'North Greenville': 'North Greenville',
  'UNC Wilmington': 'NC Wilmington',
  'Simpson': 'Simpson',
  'Rust College': 'Rust College',
  'Iowa State': 'Iowa State',
  'Mississippi State': 'Mississippi St.',
  'Little Rock': 'UALR',
  'Santa Clara': 'Santa Clara',
  'University of St. Thomas': 'St. Thomas (Minn.)',
  'West Ga.': 'West Georgia',
  'IU Columbus': 'IU Columbus',
  'Chicago State': 'Chicago State',
  'Creighton': 'Creighton',
  'UC Riverside': 'UC Riverside',
  'Southwestern Adventist': 'Southwestern Adventist',
  'Southwest Christian University': 'Southwest Christian University',
  'Wake Forest': 'Wake Forest',
  'Navy': 'Navy',
  'St. Joseph\'s Long Island': 'St. Joseph\'s Long Island',
  'Radford': 'Radford',
  'Central Connecticut State': 'Central Connecticut State',
  'Duke': 'Duke',
  'Florida State': 'Florida State',
  'Davidson': 'Davidson',
  'La Salle': 'La Salle',
  'William & Mary': 'William & Mary',
  'Dayton': 'Dayton',
  'Northwestern State': 'Northwestern St.',
  'Catawba': 'Catawba',
  'Jacksonville': 'Jacksonville Dolphins',
  'Toledo': 'Toledo',
  'Cleary University': 'Cleary University',
  'Pensacola Christian': 'Pensacola Christian',
  'Wilson College': 'Wilson College',
  'Buffalo': 'Buffalo',
  'Kentucky': 'Kentucky',
  'Stephen F. Austin': 'Stephen F. Austin',
  'Yale': 'Yale',
  'St. John\'s': 'St. John\'s (N.Y.)',
  'DePaul': 'DePaul',
  'Stanford': 'Stanford',
  'North Carolina': 'North Carolina',
  'Nebraska': 'Nebraska',
  'ETSU': 'ETSU',
  'Nevada': 'Nevada',
  'Charlotte': 'Charlotte',
  'Pittsburgh': 'Pittsburgh',
  'Middle Tennessee': 'Middle Tenn. St.',
  'Jacksonville State': 'Jacksonville State',
  'Gonzaga': 'Gonzaga',
  'Kennesaw State': 'Kennesaw State',
  'West Virginia': 'West Virginia',
  'California': 'California',
  'Michigan': 'Michigan',
  'Furman': 'Furman',
  'Temple': 'Temple',
  'Virginia': 'Virginia',
  'Stony Brook': 'Stony Brook',
  'Ohio State': 'Ohio State',
  'Indiana': 'Indiana',
  'Wyoming': 'Wyoming',
  'Uconn': 'UConn',
  'Arizona State': 'Arizona State',
  'Colorado State': 'Colorado State Rams',
  'Baylor': 'Baylor',
  'San Diego State': 'San Diego State',
  'South Florida': 'South Florida',
  'NC State': 'NC State',
  'Notre Dame': 'Notre Dame',
  'Purdue': 'Purdue',
  'Boston': 'Boston University',
  'Tulane': 'Tulane',
  'Tulsa': 'Tulsa',
  'Houston': 'Houston',
  'Boise State': 'Boise State',
  'Louisville': 'Louisville',
  'Syracuse': 'Syracuse',
  'East Carolina': 'East Carolina',
  'Virginia Tech': 'Virginia Tech',
  'Xavier': 'Xavier',
  'UConn': 'UConn',
  'Texas Tech': 'Texas Tech',
  'Wichita State': 'Wichita State',
  'Miami': 'Miami (FL)',
  'California': 'California',
  'Villanova': 'Villanova',
  'Butler': 'Butler',
  'Utah State': 'Utah State',
  'Seattle U': 'Seattle',
  'Oklahoma': 'Oklahoma',
  'Delaware': 'Delaware',
  'Georgia': 'Georgia',
  'Northwestern': 'Northwestern',
  'Florida': 'Florida',
  'Rice': 'Rice',
  'Clemson': 'Clemson',
  'Colorado': 'Colorado',
  'Illinois': 'Illinois',
  'Oregon': 'Oregon',
  'Auburn': 'Auburn',
  'Oregon State': 'Oregon State',
  'Loyola Maryland': 'Loyola Maryland',
  'San Diego': 'San Diego Toreros',
  'Vanderbilt': 'Vanderbilt',
  'San Jose State': 'San Jose State',
  'Pacific': 'Pacific',
  'Seton Hall': 'Seton Hall',
  'Maryland': 'Maryland',
  'Grand Canyon': 'Grand Canyon',
  'UNLV': 'UNLV',
  'Utah': 'Utah Utes',
  'Gonzaga': 'Gonzaga',
  'New Mexico': 'New Mexico',
  'Minnesota': 'Minnesota',
  'Campbell': 'Campbell',
  'Iowa': 'Iowa',
  'Boise State': 'Boise State',
  'Charleston': 'Charleston',
  'Portland': 'Portland',
  'Liberty': 'Liberty',
  'Michigan State': 'Michigan State',
  'Tennessee': 'Tennessee',
  'UNC Greensboro': 'NC Greensboro',
  'Georgia Tech': 'Georgia Tech',
  'Missouri State': 'Missouri State',
  'Kansas': 'Kansas',
  'Arizona': 'Arizona',
  'Loyola Marymount': 'Loyola Marymount',
  'Memphis': 'Memphis',
  'Cincinnati': 'Cincinnati',
  'Middle Tennessee': 'Middle Tenn. St.',
  'Marquette': 'Marquette',
  'UCLA': 'UCLA',
  'Lincoln': 'Lincoln',
  'Fayetteville State': 'Fayetteville State',
  'Charlotte': 'Charlotte',
  'Lehigh': 'Lehigh',
  'Grambling State': 'Grambling St.',
  'Oklahoma State': 'Oklahoma State',
  'UTEP': 'UTEP',
  'Wisconsin': 'Wisconsin',
  'Fairleigh Dickinson': 'Fairleigh Dickinson',
  'Towson': 'Towson',
  'Norfolk State': 'Norfolk State',
  'UCLA': 'UCLA',
  'Saint Mary\'s': 'St. Marys (CA)',
  'Seattle': 'Seattle',
  'Kansas State': 'Kansas State',
  'North Carolina A&T': 'N. Carolina A&T',
  'ETSU': 'ETSU',
  'New Mexico': 'New Mexico',
  'Saint Francis U': 'St. Francis U',
  'Virginia Tech': 'Virginia Tech',
  'Utah State': 'Utah State',
  'UNC Wilmington': 'NC Wilmington',
  'Northwestern': 'Northwestern',
  'Wyoming': 'Wyoming',
  'Washington State': 'Washington State',
  'Santa Clara': 'Santa Clara',
  'Houston': 'Houston',
  'Iowa': 'Iowa',
  'Virginia': 'Virginia',
  'UNLV': 'UNLV',
  'Tulane': 'Tulane',
  'Stanford': 'Stanford',
  'Georgetown': 'Georgetown',
  'SMU': 'SMU Mustangs',
  'Rutgers': 'Rutgers',
  'Pepperdine': 'Pepperdine',
  'Nevada': 'Nevada',
  'San Diego State': 'San Diego State',
  'Furman': 'Furman',
  'New Mexico State': 'New Mexico State',
  'DePaul': 'DePaul',
  'Oregon': 'Oregon',
  'Minnesota': 'Minnesota',
  'Pacific': 'Pacific',
  'UTEP': 'UTEP',
  'West Virginia': 'West Virginia',
  'Kansas': 'Kansas',
  'Florida State': 'Florida State',
  'San Diego State': 'San Diego State',
  'Wagner': 'Wagner',
  'Butler': 'Butler',
  'UTSA': 'UTSA Roadrunners',
  'Tulsa': 'Tulsa',
  'Elon': 'Elon',
  'Virginia': 'Virginia',
  'Indiana': 'Indiana',
  'Temple': 'Temple',
  'North Texas': 'North Texas',
  'Syracuse': 'Syracuse',
  'Boston College': 'Boston College',
  'Louisiana Tech': 'Louisiana Tech',
  'Illinois': 'Illinois',
  'Memphis': 'Memphis',
  'North Carolina': 'North Carolina',
  'Creighton': 'Creighton',
  'Wisconsin': 'Wisconsin',
  'Grand Canyon': 'Grand Canyon',
  'Arizona': 'Arizona',
  'Oklahoma': 'Oklahoma',
  'Washington': 'Washington',
  'Saint Mary\'s': 'St. Marys (CA)',
  'Campbell': 'Campbell',
  'Ohio State': 'Ohio State',
  'Missouri State': 'Missouri State',
  'UCLA': 'UCLA',
  'St. John\'s': 'St. John\'s (N.Y.)',
  'Army': 'Army',
  'Loyola Marymount': 'Loyola Marymount',
  'Seton Hall': 'Seton Hall',
  'UNC Wilmington': 'NC Wilmington',
  'Stanford': 'Stanford',
  'Seattle U': 'Seattle',
  'Oregon State': 'Oregon State',
  'Portland': 'Portland',
  'San Diego': 'San Diego Toreros',
  'Texas Tech': 'Texas Tech',
  'Boston College': 'Boston College',
  'Colgate': 'Colgate',
  'Wofford': 'Wofford',
  'Colorado': 'Colorado',
  'New Mexico State': 'New Mexico State',
  'Maryland': 'Maryland',
  'Loyola Marymount': 'Loyola Marymount',
  'Oregon': 'Oregon',
  'Pepperdine': 'Pepperdine',
  'Iowa State': 'Iowa State',
  'Penn State': 'Penn State',
  'Delaware': 'Delaware',
  'Georgia Tech': 'Georgia Tech',
  'Illinois': 'Illinois',
  'Baylor': 'Baylor',
  'South Florida': 'South Florida',
  'Iowa': 'Iowa',
  'William & Mary': 'William & Mary',
  'Florida': 'Florida',
  'North Carolina A&T': 'N. Carolina A&T',
  'Cincinnati': 'Cincinnati',
  'Michigan State': 'Michigan State',
  'Purdue': 'Purdue',
  'Rutgers': 'Rutgers',
  'Michigan': 'Michigan',
  'Jacksonville State': 'Jacksonville State',
  'Hampton': 'Hampton',
  'Elon': 'Elon',
  'Hofstra': 'Hofstra',
  'Charleston': 'Charleston',
  'Louisiana Tech': 'Louisiana Tech',
  'Houston': 'Houston',
  'Oklahoma State': 'Oklahoma State',
  'Ole Miss': 'Ole Miss',
  'Minnesota': 'Minnesota',
  'Washington': 'Washington',
  'Auburn': 'Auburn',
  'UNLV': 'UNLV',
  'Washington': 'Washington',
  'Air Force': 'Air Force',
  'Colorado State': 'Colorado State',
  'Seattle U': 'Seattle',
  'Oregon State': 'Oregon State',
  'San Diego': 'San Diego Toreros',
  'Converse': 'Converse Valkyries',
  'Caldwell': 'Caldwell College',
  'College of Biblical Studies': 'CBS Ambassadors',
  'Merchant Marine Academy': 'USMMA',
  'St. Joseph\'s Brooklyn': 'St. Joseph\'s (Brooklyn)',
  'St. Marys (CA)': 'Mount St. Mary\'s',
  'Western Carolina': 'Western Carolina',
  'Northwestern': 'Northwestern',
  'South Carolina': 'South Carolina',
  'The Citadel': 'Citadel',
  'Penn State York': 'Penn State-York',
  'Charlotte': 'Charlotte',
  'North Carolina': 'North Carolina',
  'Missouri Southern': 'Missouri Southern State',
  'Miami': 'Miami (FL)',
  'Marquette': 'Marquette',
  'Wisconsin': 'Wisconsin',
  'Park University': 'Gilbert Buccaneers',
  'UNLV Rebels': 'UNLV',
  'Dominican': 'Dominican Penguins',
  'Tennessee': 'Tennessee',
  'Stanford': 'Stanford',
  'California': 'California',
  'Creighton': 'Creighton',
  'Cal Poly Humboldt': 'Humboldt State',
  'Nebraska': 'Nebraska',
  'Fresno State': 'Fresno State',
  'Sacramento': 'Sacramento State',
  'Pepperdine': 'Pepperdine',
  'San Jose State': 'San Jose State',
  'Loyola Marymount': 'Loyola Marymount',
  'Portland': 'Portland',
  'Boise State': 'Boise State',
  'East Carolina': 'East Carolina',
  'NC State': 'NC State',
  'Lehigh': 'Lehigh',
  'Holy Cross': 'Holy Cross',
  'Furman': 'Furman',
  'Florida Atlantic': 'Florida Atlantic',
  'American': 'American University',
  'Navy': 'Navy',
  'Tulsa': 'Tulsa',
  'Syracuse': 'Syracuse',
  'Virginia Tech': 'Virginia Tech',
  'William & Mary': 'William & Mary',
  'Monmouth': 'Monmouth',
  'Elon': 'Elon',
  'Hampton': 'Hampton',
  'North Carolina A&T': 'N. Carolina A&T',
  'Memphis': 'Memphis',
  'Duke': 'Duke',
  'Belmont Abbey': 'Belmont',
  'Xavier': 'Xavier',
  'Villanova': 'Villanova',
  'UNC Wilmington': 'NC Wilmington',
  'Georgetown': 'Georgetown',
  'San Diego': 'San Diego Toreros',
  'Regent': 'Regent University',
  'Richmond': 'Richmond Spiders',
  'Appalachian State': 'Appalachian State',
  'Stetson': 'Stetson',
  'Cumberlands': 'University of the Cumberlands (KY)',
  'Texas A&M-CC': 'Texas A&M-CC',
  'UMass Lowell': 'UMass Lowell',
  'Central Connecticut State': 'Central Connecticut State',
  'Loras College': 'Loras Duhawks',
  'Manhattanville': 'Manhattanville',
  'Harvard': 'Harvard',
  'Colorado State': 'Colorado State',
  'Incarnate Word': 'Inc. Word',
  'Illinois State': 'Illinois State',
  'Akron': 'Akron',
  'Troy': 'Troy',
  'Miami (FL)': 'Miami (FL)',
  'Niagara': 'Niagara',
  'North Alabama': 'North Alabama',
  'Lafayette': 'Lafayette',
  'West Georgia': 'West Georgia',
  'Saint Joseph\'s': 'St. Joseph\'s (Brooklyn)',
  'Siu Edwardsville': 'Siu Edwardsville',
  'Stonehill': 'Stonehill',
  'Prairie View A&M': 'Prairie View A&M',
  'UMBC Retrievers': 'UMBC Retrievers',
  'Florida Gulf Coast': 'Florida Gulf Coast',
  'UC Irvine': 'UC Irvine',
  'Lipscomb': 'Lipscomb',
  'Arkansas State': 'Arkansas State',
  'Campbell': 'Campbell',
  'Nobel University': 'Nobel University',
  'Evergreen State': 'Evergreen State',
  'Robert Morris': 'Robert Morris',
  'Brown': 'Brown',
  'Pittsburgh': 'Pittsburgh',
  'Pacific': 'Pacific',
  'Colgate': 'Colgate',
  'NC Greensboro': 'NC Greensboro',
  'LIU Sharks': 'LIU Sharks',
  'Northeastern': 'Northeastern',
  'Northern Kentucky': 'Northern Kentucky',
  'Mercyhurst': 'Mercyhurst',
  'Tarleton': 'Tarleton',
  'South Dakota Coyotes': 'South Dakota Coyotes',
  'CBS Ambassadors': 'CBS Ambassadors',
  'Texas Tech': 'Texas Tech',
  'Cal Poly': 'Cal Poly',
  'Mississippi St.': 'Mississippi St.',
  'Arizona State': 'Arizona State',
  'Regent University': 'Regent University',
  'Wisc. Green Bay': 'Wisc. Green Bay',
  'Utah State': 'Utah State',
  'Butler': 'Butler',
  'UMass': 'UMass',
  'Davidson': 'Davidson',
  'Wisconsin': 'Wisconsin',
  'Northwestern': 'Northwestern',
  'Iona': 'Iona',
  'West Virginia': 'West Virginia',
  'Cincinnati': 'Cincinnati',
  'Detroit': 'Detroit',
  'Erskine': 'Erskine',
  'Charleston Southern': 'Charleston Southern',
  'Morehead State': 'Morehead State',
  'Merrimack Warriors': 'Merrimack Warriors',
  'USC Upstate': 'USC Upstate',
  'Coastal Carolina': 'Coastal Carolina',
  'NC Wilmington': 'NC Wilmington',
  'Morgan State': 'Morgan State',
  'Fisk': 'Fisk',
  'Evansville': 'Evansville',
  'Nebraska O.': 'Nebraska O.',
  'Samford': 'Samford',
  'Denver': 'Denver',
  'Schreiner': 'Schreiner',
  'Providence': 'Providence',
  'Miss. Valley St.': 'Miss. Valley St.',
  'UTRGV': 'UTRGV',
  'UC Santa Barbara': 'UC Santa Barbara',
  'Wisc. Milwaukee': 'Wisc. Milwaukee',
  'Coppin State': 'Coppin State',
  'ULM': 'Louisiana Monroe',
  'Delaware State': 'Delaware State',
  'Binghamton': 'Binghamton',
  'South Carolina St': 'South Carolina St',
  'East. Washington': 'East. Washington',
  'Longwood': 'Longwood',
  'Howard': 'Howard',
  'St. Thomas (Minn.)': 'St. Thomas (Minn.)',
  'East Texas A&M': 'East Texas A&M',
  'Towson': 'Towson',
  'Stony Brook': 'Stony Brook',
  'Rutgers': 'Rutgers',
  'Liberty': 'Liberty',
  'Creighton': 'Creighton',
  'Seton Hall': 'Seton Hall',
  'Syracuse': 'Syracuse',
  'George Mason': 'George Mason',
  'Siena': 'Siena',
  'Bellarmine': 'Bellarmine',
  'Eastern Kentucky': 'Eastern Kentucky',
  'Auburn': 'Auburn',
  'Cal Poly': 'Cal Poly',
  'Jacksonville State': 'Jacksonville State',
  'Florida Atlantic': 'Florida Atlantic',
  'Washington State': 'Washington State',
  'Gonzaga': 'Gonzaga',
  'Denver': 'Denver',
  'San Diego State': 'San Diego State',
  'UNLV': 'UNLV',
  'Hawai\'i Pacific': 'Hawai\'i Pacific',
  'Michigan State': 'Michigan State',
  'Iowa State': 'Iowa State',
  'St. John\'s (N.Y.)': 'St. John\'s (N.Y.)',
  'Portland': 'Portland',
  'Morehouse College': 'Morehouse College',
  'Lafayette': 'Lafayette',
  'Norfolk State': 'Norfolk State',
  'Kansas City': 'Kansas City',
  'Morehouse College': 'Morehouse College',
  'Coppin State': 'Coppin State',
  'Mount St. Mary\'s': 'Mount St. Mary\'s',
  'Alcorn State': 'Alcorn State',
  'Abilene Christian': 'Abilene Christian',
  'North Alabama': 'North Alabama',
  'Washington': 'Washington',
  'South Dakota Coyotes': 'South Dakota Coyotes',
  'Kentucky': 'Kentucky',
  'Robert Morris': 'Robert Morris',
  'Memphis': 'Memphis',
  'Colorado State': 'Colorado State',
  'Howard': 'Howard',
  'North Carolina': 'North Carolina',
  'Northeastern': 'Northeastern',
  'Grand Canyon': 'Grand Canyon',
  'LIU': 'LIU',
  'Mercer': 'Mercer',
  'Loyola Chicago': 'Loyola Chicago',
  'Arkansas': 'Arkansas',
  'Auburn': 'Auburn',
  'Fresno State': 'Fresno State',
  'Portland State': 'Portland State',
  'Colorado': 'Colorado',
  'Xavier': 'Xavier',
  'Marquette': 'Marquette',
  'Rice University': 'Rice',
  'Boise State': 'Boise State',
  'Hawai\'i': 'Hawaii',
  'Wright State': 'Wright State',
  'Dartmouth': 'Dartmouth',
  'Ohio State': 'Ohio State',
  'Morehead State': 'Morehead State',
  'Virginia Tech': 'Virginia Tech',
  'Wake Forest': 'Wake Forest',
  'Fairfield': 'Fairfield',
  'Maine Black Bears': 'Maine Black Bears',
  'Fordham': 'Fordham',
  'Marist': 'Marist',
  'Indiana': 'Indiana',
  'Long Beach State': 'Long Beach State',
  'CS Northridge': 'CS Northridge',
  'Le Moyne': 'Le Moyne',
  'Clemson': 'Clemson',
  'High Point': 'High Point',
  'Tennessee Tech': 'Tennessee Tech',
  'Pennsylvania': 'Pennsylvania',
  'Charleston': 'Charleston',
  'Louisiana Monroe': 'Louisiana Monroe',
  'Iowa State': 'Iowa State',
  'Kansas State': 'Kansas State',
  'Missouri': 'Missouri',
  'Tennessee': 'Tennessee',
  'Gonzaga': 'Gonzaga',
  'Oregon': 'Oregon',
  'San Jose State': 'San Jose State',
  'Portland State': 'Portland State',
  'UTSA Roadrunners': 'UTSA Roadrunners',
  'Buffalo': 'Buffalo',
  'Boston College': 'Boston College',
  'Xavier': 'Xavier',
  'Seton Hall': 'Seton Hall',
  'Delaware': 'Delaware',
  'Lehigh': 'Lehigh',
  'Fairleigh Dickinson': 'Fairleigh Dickinson',
  'Florida State': 'Florida State',
  'Providence': 'Providence',
  'Longwood': 'Longwood',
  'Florida International': 'Florida International',
  'South Carolina': 'South Carolina',
  'George Mason': 'George Mason',
  'Detroit': 'Detroit',
  'Drexel': 'Drexel',
  'Georgia Tech': 'Georgia Tech',
  'Minnesota': 'Minnesota',
  'Yale': 'Yale',
  'Southern Miss': 'Southern Miss',
  'LSU': 'LSU',
  'Ole Miss': 'Ole Miss',
  'Texas A&M': 'Texas A&M',
  'Murray State': 'Murray State',
  'Texas State': 'Texas State',
  'DePaul': 'DePaul',
  'Iowa': 'Iowa',
  'Cornell': 'Cornell',
  'Duke': 'Duke',
  'Texas': 'Texas',
  'Pepperdine': 'Pepperdine',
  'Nevada': 'Nevada',
  'California': 'California',
  'Stanford': 'Stanford',
  'San Diego Toreros': 'San Diego Toreros',
  'Santa Clara': 'Santa Clara',
  'UCLA': 'UCLA',
  'Air Force': 'Air Force',
  'Michigan': 'Michigan',
  'Furman': 'Furman',
  'Penn State': 'Penn State',
  'UConn': 'UConn',
  'La Salle': 'La Salle',
  'Temple': 'Temple',
  'Richmond Spiders': 'Richmond Spiders',
  'Jacksonville State': 'Jacksonville State',
  'Indiana State': 'Indiana State',
  'Citadel': 'Citadel',
  'Wofford': 'Wofford',
  'SE Louisiana': 'SE Louisiana',
  'Duquesne': 'Duquesne',
  'George Washington': 'George Washington',
  'Toledo': 'Toledo',
  'Bowling Green': 'Bowling Green',
  'Ohio': 'Ohio',
  'Sam Houston St.': 'Sam Houston St.',
  'TCU': 'TCU',
  'Bradley': 'Bradley',
  'Eastern Illinois': 'Eastern Illinois',
  'Utah Valley State': 'Utah Valley State',
  'Belmont': 'Belmont',
  'Illinois': 'Illinois',
  'UTEP': 'UTEP',
  'Weber State': 'Weber State',
  'New Mexico': 'New Mexico',
  'St. John\'s (N.Y.)': 'St. John\'s (N.Y.)',
  'Miami (FL)': 'Miami (FL)',
  'Vanderbilt': 'Vanderbilt',
  'Queens-NC': 'Queens Royals',
  'Princeton': 'Princeton',
  'Central Michigan': 'Central Michigan',
  'Miami-OH': 'Miami-OH',
  'Marshall': 'Marshall',
  'North Texas': 'North Texas',
  'Houston Christian': 'Houston Christian',
  'Utah Utes': 'Utah Utes',
  'William & Mary': 'William & Mary',
  'Tulane': 'Tulane',
  'East Tennessee St': 'East Tennessee St',
  'West Georgia': 'West Georgia',
  'Radford': 'Radford',
  'Belmont': 'Belmont',
  'Saint Louis': 'Saint Louis',
  'New Mexico State': 'New Mexico State',
  'Grand Canyon': 'Grand Canyon',
  'Fresno State': 'Fresno State',
  'Georgia': 'Georgia',
  'Georgetown': 'Georgetown',
  'Navy': 'Navy',
  'ETSU': 'ETSU',
  'Miami-OH': 'Miami-OH',
  'Canisius': 'Canisius',
  'Georgia Tech': 'Georgia Tech',
  'Monmouth': 'Monmouth',
  'Western Michigan': 'Western Michigan',
  'East Tennessee St': 'East Tennessee St',
  'Montana': 'Montana',
  'Air Force': 'Air Force',
  'Illinois State': 'Illinois State',
  'Furman': 'Furman',
  'FDU': 'FDU',
  'Rhode Island': 'Rhode Island',
  'Pacific': 'Pacific',
  'Tennessee': 'Tennessee',
  'Vermont': 'Vermont',
  'Baylor': 'Baylor',
  'Bethune-Cookman': 'Bethune-Cookman',
  'UC Riverside': 'UC Riverside',
  'Oakland': 'Oakland',
  'Ohio': 'Ohio',
  'Holy Cross': 'Holy Cross',
  'Appalachian State': 'Appalachian State',
  'Louisville': 'Louisville',
  'Cincinnati': 'Cincinnati',
  'American University': 'American University',
  'Missouri State': 'Missouri State',
  'UC Davis': 'UC Davis',
  'Alabama': 'Alabama',
  'Maryland': 'Maryland',
  'Hawai\'i': 'Hawaii',
  'Rhode Island': 'Rhode Island',
  'Butler': 'Butler',
  'Kennesaw State': 'Kennesaw State',
  'Mercer': 'Mercer',
  'Tulane': 'Tulane',
  'North Texas': 'North Texas',
  'Oklahoma State': 'Oklahoma State',
  'Marquette': 'Marquette',
  'Maryland': 'Maryland',
  'Rutgers': 'Rutgers',
  'Florida State': 'Florida State',
  'Ole Miss': 'Ole Miss',
  'Kansas': 'Kansas',
  'Creighton': 'Creighton',
  'Grand Canyon': 'Grand Canyon',
  'Pepperdine': 'Pepperdine',
  'Kentucky': 'Kentucky',
  'Oregon': 'Oregon',
  'Loyola Marymount': 'Loyola Marymount',
  'West Virginia': 'West Virginia',
  'Iowa State': 'Iowa State',
  'San Francisco': 'San Francisco',
  'Boston University': 'Boston University',
  'Seton Hall': 'Seton Hall',
  'Minnesota': 'Minnesota',
  'St. Francis U': 'St. Francis U',
  'Towson': 'Towson',
  'NC Wilmington': 'NC Wilmington',
  'Hampton': 'Hampton',
  'Arkansas': 'Arkansas',
  'Alabama': 'Alabama',
  'Boston College': 'Boston College',
  'Georgetown': 'Georgetown',
  'Rice': 'Rice',
  'California Baptist': 'California Baptist',
  'Wisconsin': 'Wisconsin',
  'Vanderbilt': 'Vanderbilt',
  'Georgia Tech': 'Georgia Tech',
  'Oregon State': 'Oregon State',
  'Santa Clara': 'Santa Clara',
  'Seattle': 'Seattle',
  'Washington': 'Washington',
  'FDU': 'FDU',
  'Fairleigh Dickinson': 'Fairleigh Dickinson',
  'South Florida': 'South Florida',
  'TCU': 'TCU',
  'ETSU': 'ETSU',
  'Kennesaw State': 'Kennesaw State',
  'Kentucky': 'Kentucky',
  'Xavier': 'Xavier',
  'VMI': 'VMI',
  'San Jose State': 'San Jose State',
  'Portland': 'Portland',
  'Virginia': 'Virginia',
  'Miami (FL)': 'Miami (FL)',
  'NC State': 'NC State',
  'Providence': 'Providence',
  'Michigan State': 'Michigan State',
  'Purdue': 'Purdue',
  'Bucknell': 'Bucknell',
  'NC State': 'NC State',
  'Wagner': 'Wagner',
  'Butler': 'Butler',
  'Northwestern': 'Northwestern',
  'Wisconsin': 'Wisconsin',
  'Liberty': 'Liberty',
  'Colgate': 'Colgate',
  'American University': 'American University',
  'Lehigh': 'Lehigh',
  'Chattanooga Mocs': 'Chattanooga Mocs',
  'Indiana': 'Indiana',
  'Tulsa': 'Tulsa',
  'Virginia Tech': 'Virginia Tech',
  'West Virginia': 'West Virginia',
  'East Carolina': 'East Carolina',
  'Tulane': 'Tulane',
  'Iowa': 'Iowa',
  'Michigan': 'Michigan',
  'Western Kentucky': 'Western Kentucky',
  'Wyoming': 'Wyoming',
  'Memphis': 'Memphis',
  'Kansas State': 'Kansas State',
  'Colorado State': 'Colorado State',
  'Oregon State': 'Oregon State',
  'Pepperdine': 'Pepperdine',
  'Kansas State': 'Kansas State',
  'UCLA': 'UCLA',
  'USC': 'USC',
  'Oklahoma State': 'Oklahoma State',
  'Tennessee': 'Tennessee',
  'Florida State': 'Florida State',
  'North Dakota': 'North Dakota',
  'St. John\'s (N.Y.)': 'St. John\'s (N.Y.)',
  'Utah Utes': 'Utah Utes',
  'UNLV': 'UNLV',
  'Alabama': 'Alabama',
  'Utah Utes': 'Utah Utes',
  'Nevada': 'Nevada',
  'Gonzaga': 'Gonzaga',
  'Temple': 'Temple',
  'Virginia Tech': 'Virginia Tech',
  'East Carolina': 'East Carolina',
  'Minnesota': 'Minnesota',
  'Missouri': 'Missouri',
  'Campbell': 'Campbell',
  'Iowa': 'Iowa',
  'Colorado State': 'Colorado State',
  'Boise State': 'Boise State',
  'Charleston': 'Charleston',
  'Portland': 'Portland',
  'Wake Forest': 'Wake Forest',
  'Texas A&M': 'Texas A&M',
  'USC': 'USC',
  'TCU': 'TCU',
  'Western Kentucky': 'Western Kentucky',
  'South Dakota St.': 'South Dakota St.',
  'Drexel': 'Drexel',
  'Villanova': 'Villanova',
  'Cincinnati': 'Cincinnati',
  'Xavier': 'Xavier',
  'Jacksonville State': 'Jacksonville State',
  'Delaware': 'Delaware',
  'Hampton': 'Hampton',
  'Middle Tenn. St.': 'Middle Tenn. St.',
  'Kansas State': 'Kansas State',
  'Colorado': 'Colorado',
  'Stanford': 'Stanford',
  'Army': 'Army',
  'Western Carolina': 'Western Carolina',
  'Penn State': 'Penn State',
  'Syracuse': 'Syracuse',
  'Pittsburgh': 'Pittsburgh',
  'Wake Forest': 'Wake Forest',
  'South Carolina': 'South Carolina',
  'East Carolina': 'East Carolina',
  'Butler': 'Butler',
  'Providence': 'Providence',
  'Michigan State': 'Michigan State',
  'Kennesaw State': 'Kennesaw State',
  'Mercer': 'Mercer',
  'Duke': 'Duke',
  'Tulane': 'Tulane',
  'Wichita State': 'Wichita State',
  'North Texas': 'North Texas',
  'Tulsa': 'Tulsa',
  'Baylor': 'Baylor',
  'Oklahoma State': 'Oklahoma State',
  'Marquette': 'Marquette',
  'Maryland': 'Maryland',
  'Rutgers': 'Rutgers',
  'Notre Dame': 'Notre Dame',
  'Florida State': 'Florida State',
  'Ole Miss': 'Ole Miss',
  'Kansas': 'Kansas',
  'Creighton': 'Creighton',
  'Grand Canyon': 'Grand Canyon',
  'Pepperdine': 'Pepperdine',
  'Kentucky': 'Kentucky',
  'Oregon': 'Oregon',
  'Nevada': 'Nevada',
  'Loyola Marymount': 'Loyola Marymount',
  'FDU': 'FDU',
  'Fairleigh Dickinson': 'Fairleigh Dickinson',
  'South Florida': 'South Florida',
  'TCU': 'TCU',
  'UConn': 'UConn',
  'ETSU': 'ETSU',
  'Kennesaw State': 'Kennesaw State',
  'Lafayette': 'Lafayette',
  'Kentucky': 'Kentucky',
  'Xavier': 'Xavier',
  'VMI': 'VMI',
  'San Jose State': 'San Jose State',
  'Portland': 'Portland',
  'Virginia': 'Virginia',
  'Miami (FL)': 'Miami (FL)',
  'Boston College': 'Boston College',
  'NC State': 'NC State',
  'Providence': 'Providence',
  'Michigan State': 'Michigan State',
  'Purdue': 'Purdue',
  'Bucknell': 'Bucknell',
  'NC State': 'NC State',
  'Wagner': 'Wagner',
  'Butler': 'Butler',
  'Northwestern': 'Northwestern',
  'Wisconsin': 'Wisconsin',
  'Liberty': 'Liberty',
  'Colgate': 'Colgate',
  'American University': 'American University',
  'Lehigh': 'Lehigh',
  'Chattanooga Mocs': 'Chattanooga Mocs',
  'Indiana': 'Indiana',
  'Tulsa': 'Tulsa',
  'Virginia Tech': 'Virginia Tech',
  'West Virginia': 'West Virginia',
  'East Carolina': 'East Carolina',
  'Tulane': 'Tulane',
  'Iowa': 'Iowa',
  'Michigan': 'Michigan',
  'Western Kentucky': 'Western Kentucky',
  'Wyoming': 'Wyoming',
  'Memphis': 'Memphis',
  'Kansas State': 'Kansas State',
  'Colorado State': 'Colorado State',
  'Oregon State': 'Oregon State',
  'Pepperdine': 'Pepperdine',
  'Kansas State': 'Kansas State',
  'UCLA': 'UCLA',
  'USC': 'USC',
  'Oklahoma State': 'Oklahoma State',
  'Tennessee': 'Tennessee',
  'Florida State': 'Florida State',
  'North Dakota': 'North Dakota',
  'St. John\'s (N.Y.)': 'St. John\'s (N.Y.)',
  'Utah Utes': 'Utah Utes',
  'UNLV': 'UNLV',
  'Alabama': 'Alabama',
  'Utah Utes': 'Utah Utes',
  'Nevada': 'Nevada',
  'Gonzaga': 'Gonzaga',
  'Temple': 'Temple',
  'Virginia Tech': 'Virginia Tech',
  'East Carolina': 'East Carolina',
  'Minnesota': 'Minnesota',
  'Missouri': 'Missouri',
  'Campbell': 'Campbell',
  'Iowa': 'Iowa',
  'Colorado State': 'Colorado State',
  'Boise State': 'Boise State',
  'Charleston': 'Charleston',
  'Portland': 'Portland',
  'Wake Forest': 'Wake Forest',
  'Texas A&M': 'Texas A&M',
  'USC': 'USC',
  'Texas': 'Texas',
  'VMI': 'VMI',
  'BYU': 'BYU',
  'Michigan': 'Michigan',
  'Temple': 'Temple',
  'Virginia': 'Virginia',
  'Kentucky': 'Kentucky',
  'Citadel': 'Citadel',
  'Chattanooga Mocs': 'Chattanooga Mocs',
  'Stony Brook': 'Stony Brook',
  'Providence': 'Providence',
  'Ohio State': 'Ohio State',
  'DePaul': 'DePaul',
  'Indiana': 'Indiana',
  'Wyoming': 'Wyoming',
  'UConn': 'UConn',
  'Arizona State': 'Arizona State',
  'Colorado State': 'Colorado State',
  'San Diego Toreros': 'San Diego Toreros',
  'San Jose State': 'San Jose State',
  'Baylor': 'Baylor',
  'Yale': 'Yale',
  'Boston College': 'Boston College',
  'Florida Atlantic': 'Florida Atlantic',
  'South Florida': 'South Florida',
  'NC State': 'NC State',
  'Notre Dame': 'Notre Dame',
  'Purdue': 'Purdue',
  'Boston University': 'Boston University',
  'Hofstra': 'Hofstra',
  'Tulane': 'Tulane',
  'Tulsa': 'Tulsa',
  'Houston': 'Houston',
  'Nebraska': 'Nebraska',
  'Boise State': 'Boise State',
  'San Diego State': 'San Diego State',
  'Notre Dame': 'Notre Dame',
  'Louisville': 'Louisville',
  'Syracuse': 'Syracuse',
  'NC State': 'NC State',
  'East Carolina': 'East Carolina',
  'Virginia Tech': 'Virginia Tech',
  'Wagner': 'Wagner',
  'Iowa State': 'Iowa State',
  'Syracuse': 'Syracuse',
  'Xavier': 'Xavier',
  'NC Greensboro': 'NC Greensboro',
  'N. Carolina A&T': 'N. Carolina A&T',
  'UConn': 'UConn',
  'Florida State': 'Florida State',
  'Texas Tech': 'Texas Tech',
  'Wichita State': 'Wichita State',
  'Miami (FL)': 'Miami (FL)',
  'St. John\'s (N.Y.)': 'St. John\'s (N.Y.)',
  'Penn State': 'Penn State',
  'Stony Brook': 'Stony Brook',
  'Florida Atlantic': 'Florida Atlantic',
  'Oklahoma': 'Oklahoma',
  'Delaware': 'Delaware',
  'Elon': 'Elon',
  'Georgia': 'Georgia',
  'North Carolina': 'North Carolina',
  'Purdue': 'Purdue',
  'Northwestern': 'Northwestern',
  'North Dakota': 'North Dakota',
  'Notre Dame': 'Notre Dame',
  'Florida': 'Florida',
  'Georgetown': 'Georgetown',
  'Rice': 'Rice',
  'Houston': 'Houston',
  'Clemson': 'Clemson',
  'Creighton': 'Creighton',
  'Louisiana Tech': 'Louisiana Tech',
  'Louisville': 'Louisville',
  'Colorado': 'Colorado',
  'Illinois': 'Illinois',
  'Oregon': 'Oregon',
  'Syracuse': 'Syracuse',
  'Oregon State': 'Oregon State',
  'NC State': 'NC State',
  'Washington': 'Washington',
  'Loyola Maryland': 'Loyola Maryland',
  'San Diego Toreros': 'San Diego Toreros',
  'Santa Clara': 'Santa Clara',
  'San Jose State': 'San Jose State',
  'Pacific': 'Pacific',
  'Kentucky': 'Kentucky',
  'Ohio State': 'Ohio State',
  'Seton Hall': 'Seton Hall',
  'Maryland': 'Maryland',
  'Grand Canyon': 'Grand Canyon',
  'Utah Utes': 'Utah Utes',
  'UNLV': 'UNLV',
  'Alabama': 'Alabama',
  'Utah Utes': 'Utah Utes',
  'Nevada': 'Nevada',
  'Gonzaga': 'Gonzaga',
  'Temple': 'Temple',
  'Virginia Tech': 'Virginia Tech',
  'East Carolina': 'East Carolina',
  'Minnesota': 'Minnesota',
  'Missouri': 'Missouri',
  'Campbell': 'Campbell',
  'Iowa': 'Iowa',
  'Colorado State': 'Colorado State',
  'Boise State': 'Boise State',
  'Charleston': 'Charleston',
  'Portland': 'Portland',
  'Wake Forest': 'Wake Forest',
  'Texas A&M': 'Texas A&M',
  'USC': 'USC',
  'TCU': 'TCU',
  'Western Kentucky': 'Western Kentucky',
  'South Dakota St.': 'South Dakota St.',
  'Drexel': 'Drexel',
  'Villanova': 'Villanova',
  'Cincinnati': 'Cincinnati',
  'Xavier': 'Xavier',
  'Jacksonville State': 'Jacksonville State',
  'Delaware': 'Delaware',
  'Hampton': 'Hampton',
  'Middle Tenn. St.': 'Middle Tenn. St.',
  'Kansas State': 'Kansas State',
  'Colorado': 'Colorado',
  'Stanford': 'Stanford',
  'Rice': 'Rice',
  'Xavier': 'Xavier',
  'Florida': 'Florida',
  'East Carolina': 'East Carolina',
  'Memphis': 'Memphis',
  'Cincinnati': 'Cincinnati',
  'NC State': 'NC State',
  'Pittsburgh': 'Pittsburgh',
  'Syracuse': 'Syracuse',
  'Wake Forest': 'Wake Forest',
  'Jacksonville State': 'Jacksonville State',
  'Wagner': 'Wagner',
  'Charleston': 'Charleston',
  'Monmouth': 'Monmouth',
  'Elon': 'Elon',
  'Stony Brook': 'Stony Brook',
  'Tulane': 'Tulane',
  'Wichita State': 'Wichita State',
  'Middle Tenn. St.': 'Middle Tenn. St.',
  'Marquette': 'Marquette',
  'Colorado': 'Colorado',
  'USC': 'USC',
  'Santa Clara': 'Santa Clara',
  'Gonzaga': 'Gonzaga',
  'Oregon State': 'Oregon State',
  'Stanford': 'Stanford',
  'San Diego State': 'San Diego State',
  'UCLA': 'UCLA',
  'Oregon': 'Oregon',
  'Lincoln': 'Lincoln',
  'Fayetteville State': 'Fayetteville State',
  'Hampton': 'Hampton',
  'Charlotte': 'Charlotte',
  'Lehigh': 'Lehigh',
  'William & Mary': 'William & Mary',
  'Grambling St.': 'Grambling St.',
  'North Dakota': 'North Dakota',
  'Oklahoma State': 'Oklahoma State',
  'UTEP': 'UTEP',
  'Lincoln': 'Lincoln',
  'Fayetteville State': 'Fayetteville State',
  'Grambling St.': 'Grambling St.',
  'Navy': 'Navy',
  'Providence': 'Providence',
  'Drexel': 'Drexel',
  'Norfolk State': 'Norfolk State',
  'Western Kentucky': 'Western Kentucky',
  'Wisconsin': 'Wisconsin',
  'Baylor': 'Baylor',
  'BYU': 'BYU',
  'UCLA': 'UCLA',
  'Loyola Marymount': 'Loyola Marymount',
  'Mount St. Mary\'s': 'Mount St. Mary\'s',
  'Seattle': 'Seattle',
  'Oakland': 'Oakland',
  'Kansas State': 'Kansas State',
  'Louisville': 'Louisville',
  'St. John\'s (N.Y.)': 'St. John\'s (N.Y.)',
  'Indiana': 'Indiana',
  'St. Francis U': 'St. Francis U',
  'Georgia Tech': 'Georgia Tech',
  'Virginia Tech': 'Virginia Tech',
  'Mississippi St.': 'Mississippi St.',
  'Utah State': 'Utah State',
  'NC Wilmington': 'NC Wilmington',
  'Ohio State': 'Ohio State',
  'Northwestern': 'Northwestern',
  'Syracuse': 'Syracuse',
  'Wyoming': 'Wyoming',
  'Washington State': 'Washington State',
  'Santa Clara': 'Santa Clara',
  'Houston': 'Houston',
  'Iowa': 'Iowa',
  'Virginia': 'Virginia',
  'Purdue': 'Purdue',
  'UNLV': 'UNLV',
  'Tulane': 'Tulane',
  'Stanford': 'Stanford',
  'Duke': 'Duke',
  'Georgetown': 'Georgetown',
  'Rutgers': 'Rutgers',
  'Creighton': 'Creighton',
  'Pepperdine': 'Pepperdine',
  'Nevada': 'Nevada',
  'San Diego State': 'San Diego State',
  'UCF': 'UCF Knights',
  'VCU': 'VCU Rams',
  'Alabama State': 'Alabama State',
  'Angelo State': 'Angelo State',
  'Coastal Georgia': 'Coastal Georgia',
  'Coe': 'Coe',
  'Eastern Oregon': 'Eastern Oregon',
  'Lamar': 'Lamar',
  'Penn': 'Penn',
  'Peru State': 'Peru State',
  'Rhodes': 'Rhodes Lynx',
  'Saint Josephs Hawks': 'Saint Josephs Hawks',
  'Southern Illinois': 'Southern Illinois',
  'Southwest Adventist': 'Southwest Adventist',
  'Memphis Tigers': 'Memphis',
  'Tarleton': 'Tarleton',
  'Colorado': 'Colorado Buffaloes',
  'USC': 'USC Trojans',
  'St. Joseph\'s (Brooklyn)': 'Saint Josephs Hawks',
  'USC Trojans': 'USC',
  'UIC': 'Illinois (Chi.)',
  'Mercyhurst': 'Mercyhurst Lakers',
  'Miami-OH': 'Miami (Ohio)',
  'Nobel University': 'Nobel Knights',
  'Rockford': 'Rockford University',
 };
 

// NCAAW specific team name mappings
const NCAAW_MAP = {
  'SMU': 'SMU Mustangs',
  'Grambling': 'Grambling St',
  'SEMO': 'Southeast Missouri State',
  'Sacred Heart': 'Sacred Heart Pioneers',
  'Tennessee': 'Tennessee Volunteers',
  'Oklahoma': 'Oklahoma Sooners',
  'Towson': 'Towson Tigers',
  'Mt. St. Mary\'s': 'Mount St. Mary\'s',
  'Washington Huskies': 'Washington',
  'Richmond': 'Richmond Spiders',
  'Dean College': 'Dean Bulldogs',
  'Furman': 'Furman Paladins',
  'Cincinnati': 'Cincinnati Bearcats',
  'Memphis': 'Memphis Tigers',
  'New Haven': 'New Haven Chargers',
  'Westminster (MO)': 'Westminster Blue Jays',
  'Mercyhurst': 'Mercyhurst Lakers',
  'Albany': 'Albany Great Danes',
  'Florida Memorial': 'Florida Mem.',
  'UAlbany': 'Albany Great Danes',
  'Lipscomb': 'Lipscomb Bisons',
  'Virginia': 'Virginia Cavaliers',
  'Frostburg State': 'Frostburg State Bobcats',
  'Merrimack': 'Merrimack Warriors',
  'Cal State Fullerton': 'CS Fullerton',
  'Cal State Northridge': 'CS Northridge',
  'Bethesda': 'Bethesda University',
  'Montana': 'Montana Griz',
  'Colorado State Rams': 'Colorado State',
  'LSU': 'LSU Tigers',
  'Saint Peter\'s': 'St. Peters',
  'Saint Joseph\'s': 'Saint Josephs Hawks',
  'Southeast Missouri State': 'SE Missouri State',
  'Illinois': 'Illinois Fighting Illini',
  'Michigan': 'Michigan Wolverines',
  'Houston': 'Houston Cougars',
  'Providence': 'Providence Friars',
  'Arkansas': 'Arkansas Razorbacks',
  'Saint Mary\'s': 'Saint Marys Gaels',
  'Southern': 'Southern Jaguars',
  'UC Irvine': 'UC Irvine Anteaters',
  'Apprentice School': 'Apprentice Builders',
  'SUNY-New Paltz': 'New Paltz',
  'Tulsa': 'Tulsa Golden Hurricane',
  'UM Kansas City': 'UMKC',
  'Kansas City': 'UMKC',
  'Wisconsin': 'Wisconsin Badgers',
  'East Texas A&M': 'East Texas A&M Lions',
  'Utah Valley': 'Utah Valley Wolverines',
  'Texas A&M-Corpus Christi': 'Texas A&M-CC',
  'Northwest': 'Northwest Eagles',
  'Seattle U': 'Seattle U Redhawks',
  'UNLV Rebels': 'UNLV Lady Rebels',
  'Alabama': 'Alabama',
  'Alabama A&M': 'Alabama A&M',
  'Auburn': 'Auburn',
  'Bard College': 'Bard College',
  'Benedictine': 'Benedictine (AZ)',
  'Cal Poly': 'Cal Poly',
  'California Golden Bears': 'California Golden Bears',
  'Chicago State': 'Chicago State',
  'Delaware': 'Delaware',
  'DePaul': 'DePaul',
  'East. Washington': 'East. Washington',
  'Erskine': 'Erskine',
  'George Washington': 'George Washington',
  'Georgia State': 'Georgia State',
  'Harvard': 'Harvard Crimson',
  'Houston Cougars': 'Houston Cougars',
  'Howard': 'Howard',
  'IU East': 'Indiana East',
  'Lindenwood': 'Lindenwood',
  'Longwood': 'Longwood',
  'LSU Tigers': 'LSU Tigers',
  'Maine Black Bears': 'Maine Black Bears',
  'New Haven Chargers': 'New Haven Chargers',
  'Northwestern': 'Northwestern',
  'Oral Roberts': 'Oral Roberts',
  'Prairie View A&M': 'Prairie View A&M',
  'Presbyterian College': 'Presbyterian College',
  'Sam Houston': 'Sam Houston St.',
  'San Diego': 'San Diego',
  'South Carolina State': 'South Carolina State',
  'South Carolina Upstate': 'South Carolina Upstate',
  'Southern Indiana': 'Southern Indiana',
  'Stephen F. Austin': 'Stephen F. Austin',
  'Stonehill': 'Stonehill Skyhawks',
  'Texas State Bobcats': 'Texas State Bobcats',
  'Tulane': 'Tulane Green Wave',
  'Tulsa Golden Hurricane': 'Tulsa Golden Hurricane',
  'UTRGV': 'UTRGV',
  'UMKC': 'UMKC',
  'Utah Valley Wolverines': 'Utah Valley Wolverines',
  'VCU': 'VCU',
  'Western Illinois': 'Western Illinois',
  'American University': 'American University',
  'American': 'American University',
  'Arlington Baptist': 'Arlington Baptist Patriots',
  'Stanislaus State Warriors': 'California State-Stanislaus Warriors',
  'Florida': 'Florida Gators',
  'Iowa': 'Iowa Hawkeyes',
  'Ohio': 'Ohio Bobcats',
  'Little Rock': 'UALR',
  'North Carolina A&T': 'N. Carolina A&T',
  'Mississippi State': 'Mississippi St.',
  'California': 'California Golden Bears',
  'North Carolina Central': 'N. Carolina Central',
};

// MLS specific team name mappings
const MLS_MAP = {
  'Atlanta United FC': 'Atlanta Utd',
  'D.C. United': 'DC United',
  'Charlotte FC': 'Charlotte',
  'Charlotte': 'Charlotte',
  'Philadelphia Union': 'Philadelphia Union',
  'FC Cincinnati': 'FC Cincinnati',
  'Cincinnati': 'FC Cincinnati',
  'Montréal': 'CF Montreal',
  'Columbus Crew': 'Columbus Crew',
  'New York Red Bulls': 'New York Red Bulls',
  'Nashville SC': 'Nashville SC',
  'Inter Miami CF': 'Inter Miami',
  'Inter Miami': 'Inter Miami',
  'New York City FC': 'New York City',
  'New York City': 'New York City',
  'Seattle Sounders': 'Seattle Sounders',
  'Seattle Sounders FC': 'Seattle Sounders',
  'Toronto FC': 'Toronto FC',
  'Orlando City': 'Orlando City',
  'Colorado Rapids': 'Colorado Rapids',
  'LAFC': 'Los Angeles FC',
  'Los Angeles FC': 'Los Angeles FC',
  'Austin': 'Austin FC',
  'Sporting Kansas City': 'Sporting Kansas City',
  'Houston Dynamo': 'Houston Dynamo',
  'Los Angeles Galaxy': 'Los Angeles Galaxy',
  'Minnesota United FC': 'Minnesota United',
  'Minnesota United': 'Minnesota United',
  'Portland Timbers': 'Portland Timbers',
  'San Diego FC': 'San Diego FC',
  'San Diego': 'San Diego FC',
  'St. Louis City SC': 'St. Louis City',
  'Real Salt Lake': 'Real Salt Lake',
  'Vancouver Whitecaps': 'Vancouver Whitecaps',
  'FC Dallas': 'FC Dallas',
  'Dallas': 'FC Dallas',
  'San Jose Earthquakes': 'San Jose Earthquakes',
  'Austin FC': 'Austin FC',
  'Chicago Fire': 'Chicago Fire',
  'New England Revolution': 'New England Revolution'
};

// Copa del Rey specific team name mappings
const COPA_DEL_REY_MAP = {
  'Atlético Tordesillas': 'Atl. Tordesillas',
  'Burgos': 'Burgos CF',
  'Constància': 'Constancia',
  'Real Oviedo': 'Oviedo',
  'R. Oviedo': 'Oviedo',
  'Racing Ferrol': 'Racing Club Ferrol',
  'SD Logroñés': 'SD Logrones',
  'Racing Santander': 'Racing Santander',
  'Cádiz': 'Cadiz CF',
  'CD Guadalajara': 'Guadalajara',
  'Cacereño': 'Cacereno',
  'Talavera CF': 'CF Talavera',
  'Granada': 'Granada CF',
  'San Fernando CD': 'San Fernando',
  'Tropezón': 'Tropezon',
  'RSD Alcalá': 'RSD Alcala',
  'Utebo': 'Utebo FC',
  'Extremadura 1924': 'CD Extremadura',
  'Negreira': 'SD Negreira',
  'Los Garres': 'UD Los Garres',
  'Real Zaragoza': 'Zaragoza',
  'La Unión Atlético': 'La Union',
  'Atlético Astorga': 'Atl. Astorga',
  'Leganés': 'Leganes',
  'Caudal': 'Caudal Deportivo',
  'Sporting Gijón': 'Gijon',
  'Cieza': 'Ciudad Cieza',
  'Almería': 'Almeria',
  'Mérida AD': 'Merida AD',
  'Náxara': 'Naxara',
  'Numancia': 'Numancia',
  'Arenas de Getxo': 'Arenas Getxo',
  'Real Valladolid': 'Valladolid',
  'Teruel': 'Teruel',
  'Juventud Torremolinos': 'Torremolinos',
  'Cartagena': 'FC Cartagena SAD',
  'Reddis': 'Reus FCR',
  'Europa': 'CE Europa',
  'Pontevedra': 'Pontevedra',
  'Lucena': 'Ciudad de Lucena',
  'Ibiza': 'UD Ibiza',
  'Real Jaén': 'Jaen',
  'Eldense': 'Eldense',
  'Yuncos': 'CD Yuncos',
  'Celta de Vigo': 'Celta Vigo',
  'Valle Egüés': 'Valle Egues',
  'FC Andorra': 'Andorra',
  'Atlético Baleares': 'Baleares',
  'Gimnàstic Tarragona': 'Gimnastic',
  'Getxo': 'Deportivo Getxo',
  'Deportivo Alavés': 'Alaves',
  'Real Ávila': 'Real Avila',
  'Real Avilés': 'Real Aviles',
  'UD Logroñés': 'UD Logrones',
  'Ponferradina': 'Ponferradina',
  'CD Castellon': 'Castellon',
  'Atlètic Lleida': 'Atletic Lleida',
  'Espanyol': 'Espanyol',
  'Estepona': 'CD Estepona',
  'Málaga': 'Malaga',
  'Real Betis': 'Betis',
  'Real Murcia': 'Murcia',
  'Antequera': 'Antequera',
  'Sámano': 'UD Samano',
  'Deportivo La Coruña': 'Dep. La Coruna'
};

// UEFA Conference League specific team name mappings
const UEFA_CONFERENCE_LEAGUE_MAP = {
  'AEK Athens': 'AEK Athens FC',
  'Aberdeen': 'Aberdeen',
  'Breiðablik': 'Breidablik',
  'KuPS': 'KuPS',
  'Drita': 'Drita',
  'Omonia Nicosia': 'Omonia',
  'Omonia': 'Omonia',
  'Omonoia': 'Omonia',
  'U. Craiova': 'Univ. Craiova',
  'Univ. Craiova': 'Univ. Craiova',
  'BK Häcken': 'Hacken',
  'Häcken': 'Hacken',
  'Rayo Vallecano': 'Rayo Vallecano',
  'HNK Rijeka': 'Rijeka',
  'Rijeka': 'Rijeka',
  'Sparta Prague': 'Sparta Prague',
  'Sparta Praha': 'Sparta Prague',
  'Shakhtar Donetsk': 'Shakhtar Donetsk',
  'Shakhtar': 'Shakhtar Donetsk',
  'Legia Warsaw': 'Legia',
  'Legia Warszawa': 'Legia',
  'KF Shkëndija': 'Shkendija',
  'Shkëndija': 'Shkendija',
  'Shelbourne FC': 'Shelbourne',
  'Shelbourne': 'Shelbourne',
  'SK Rapid Wien': 'SK Rapid',
  'SK Rapid': 'SK Rapid',
  'Fiorentina': 'Fiorentina',
  'Strasbourg': 'Strasbourg',
  'Jagiellonia Białystok': 'Jagiellonia',
  'Jagiellonia': 'Jagiellonia',
  'AZ Alkmaar': 'AZ Alkmaar',
  'Slovan Bratislava': 'Slovan Bratislava',
  'S. Bratislava': 'Slovan Bratislava',
  'Crystal Palace': 'Crystal Palace',
  'AEK Larnaca': 'AEK Larnaca',
  'Hamrun Spartans': 'Hamrun',
  'Hamrun': 'Hamrun',
  'Lausanne-Sport': 'Lausanne',
  'Lausanne': 'Lausanne',
  'Lincoln Red Imps': 'Lincoln Red Imps',
  'L. Red Imps': 'Lincoln Red Imps',
  'Lech Poznań': 'Lech Poznan',
  'Lech Poznan': 'Lech Poznan',
  'Mainz': 'Mainz',
  'HŠK Zrinjski Mostar': 'Zrinjski',
  'Zrinjski': 'Zrinjski',
  'Shamrock Rovers': 'Shamrock Rovers',
  'Celje': 'Celje',
  'Samsunspor': 'Samsunspor',
  'Dynamo Kyiv': 'Dyn. Kyiv',
  'Dyn. Kyiv': 'Dyn. Kyiv',
  'Universitatea Craiova': 'Univ. Craiova',
  'Univ. Craiova': 'Univ. Craiova',
  'Noah': 'Noah',
  'SK Sigma Olomouc': 'Sigma Olomouc',
  'Sigma Olomouc': 'Sigma Olomouc',
  'Raków Częstochowa': 'Rakow',
  'Rakow': 'Rakow',
  'Raków': 'Rakow'
};

// LaLiga specific team name mappings
const LALIGA_MAP = {
  'Oviedo': 'R. Oviedo',
  'Espanyol': 'Espanyol',
  'Sevilla FC': 'Sevilla',
  'Mallorca': 'Mallorca',
  'Barcelona': 'Barcelona',
  'Girona': 'Girona',
  'Villarreal': 'Villarreal',
  'Real Betis': 'Betis',
  'Atlético Madrid': 'Atl. Madrid',
  'Osasuna': 'Osasuna',
  'Elche': 'Elche',
  'Athletic Bilbao': 'Ath Bilbao',
  'Celta Vigo': 'Celta Vigo',
  'Real Sociedad': 'Real Sociedad',
  'Levante': 'Levante',
  'Rayo Vallecano': 'Rayo Vallecano',
  'Getafe': 'Getafe',
  'Real Madrid': 'Real Madrid',
  'Alavés': 'Alaves',
  'Valencia': 'Valencia',
  'Deportivo Alavés': 'Alaves'
};

// Premier League specific team name mappings
const PREMIER_LEAGUE_MAP = {
  'Arsenal': 'Arsenal',
  'Manchester City': 'Manchester City',
  'Liverpool': 'Liverpool',
  'AFC Bournemouth': 'Bournemouth',
  'Tottenham Hotspur': 'Tottenham',
  'Chelsea': 'Chelsea',
  'Sunderland': 'Sunderland',
  'Manchester United': 'Manchester Utd',
  'Crystal Palace': 'Crystal Palace',
  'Brighton & Hove Albion': 'Brighton',
  'Aston Villa': 'Aston Villa',
  'Brentford': 'Brentford',
  'Newcastle United': 'Newcastle',
  'Fulham': 'Fulham',
  'Everton': 'Everton',
  'Leeds United': 'Leeds',
  'Burnley': 'Burnley',
  'West Ham United': 'West Ham',
  'Nottingham Forest': 'Nottingham',
  'Wolverhampton Wanderers': 'Wolves'
};

// Ligue 1 specific team name mappings
const LIGUE1_MAP = {
  'LOSC': 'Lille',
  'PSG': 'PSG',
  'Paris FC': 'Paris FC',
  'Strasbourg': 'Strasbourg',
  'Marseille': 'Marseille',
  'Lyon': 'Lyon',
  'Monaco': 'Monaco',
  'Lens': 'Lens',
  'Toulouse': 'Toulouse',
  'Rennes': 'Rennes',
  'Brest': 'Brest',
  'Nice': 'Nice',
  'Lorient': 'Lorient',
  'Le Havre': 'Le Havre',
  'Nantes': 'Nantes',
  'Auxerre': 'Auxerre',
  'Angers': 'Angers',
  'Metz': 'Metz',
  'Olympique Marseille': 'Marseille',
  'Olympique Lyonnais': 'Lyon',
  'Paris': 'Paris FC',
  'Angers SCO': 'Angers'
};

// Bundesliga specific team name mappings
const BUNDESLIGA_MAP = {
  'FC Union Berlin': 'Union Berlin',
  'Borussia Mönchengladbach': 'B. Monchengladbach',
  'VfL Wolfsburg': 'Wolfsburg',
  'VfB Stuttgart': 'Stuttgart',
  '1. FC Heidenheim 1846': 'Heidenheim',
  'Werder Bremen': 'Werder Bremen',
  'Mainz': 'Mainz',
  'Bayer Leverkusen': 'Bayer Leverkusen',
  'FC Köln': 'FC Koln',
  'FC Augsburg': 'Augsburg',
  'RB Leipzig': 'RB Leipzig',
  'Hamburger SV': 'Hamburger SV',
  'Bayern Munich': 'Bayern Munich',
  'Borussia Dortmund': 'Dortmund',
  'SC Freiburg': 'Freiburg',
  'Eintracht Frankfurt': 'Eintracht Frankfurt',
  'FC St. Pauli': 'St. Pauli',
  'TSG Hoffenheim': 'Hoffenheim'
};

// Liga Portugal specific team name mappings
const LIGA_PORTUGAL_MAP = {
  'Gil Vicente': 'Gil Vicente',
  'Alverca': 'Alverca',
  'AVS': 'AFS',
  'Santa Clara': 'Santa Clara',
  'Arouca': 'Arouca',
  'Benfica': 'Benfica',
  'Rio Ave': 'Rio Ave',
  'Estrela': 'Estrela',
  'Nacional': 'Nacional',
  'Estoril': 'Estoril',
  'Vitória Guimarães': 'Vitoria Guimaraes',
  'Famalicão': 'Famalicao',
  'Sporting CP': 'Sporting CP',
  'Tondela': 'Tondela',
  'Casa Pia': 'Casa Pia',
  'Sporting Braga': 'Braga',
  'Porto': 'FC Porto',
  'Moreirense': 'Moreirense'
};

// Serie A specific team name mappings
const SERIE_A_MAP = {
  'Pisa': 'Pisa',
  'Hellas Verona': 'Verona',
  'Lecce': 'Lecce',
  'Sassuolo': 'Sassuolo',
  'Torino': 'Torino',
  'Napoli': 'Napoli',
  'AS Roma': 'AS Roma',
  'Inter Milan': 'Inter',
  'Como 1907': 'Como',
  'Juventus': 'Juventus',
  'Cagliari': 'Cagliari',
  'Bologna': 'Bologna',
  'Genoa': 'Genoa',
  'Parma': 'Parma',
  'Atalanta': 'Atalanta',
  'Lazio': 'Lazio',
  'AC Milan': 'AC Milan',
  'Fiorentina': 'Fiorentina',
  'Cremonese': 'Cremonese',
  'Udinese': 'Udinese'
};

// Eredivisie specific team name mappings
const EREDIVISIE_MAP = {
  'Feyenoord': 'Feyenoord',
  'PSV': 'PSV',
  'PSV Eindhoven': 'PSV',
  'Ajax': 'Ajax',
  'AZ Alkmaar': 'AZ Alkmaar',
  'AZ': 'AZ Alkmaar',
  'Groningen': 'Groningen',
  'Sparta Rotterdam': 'Sparta Rotterdam',
  'Nijmegen': 'Nijmegen',
  'NEC': 'Nijmegen',
  'Twente': 'Twente',
  'Utrecht': 'Utrecht',
  'FC Utrecht': 'Utrecht',
  'Heerenveen': 'Heerenveen',
  'Sittard': 'Sittard',
  'Fortuna Sittard': 'Sittard',
  'G.A. Eagles': 'G.A. Eagles',
  'Go Ahead Eagles': 'G.A. Eagles',
  'FC Volendam': 'FC Volendam',
  'Volendam': 'FC Volendam',
  'Excelsior': 'Excelsior',
  'NAC Breda': 'NAC Breda',
  'Zwolle': 'Zwolle',
  'PEC Zwolle': 'Zwolle',
  'Telstar': 'Telstar',
  'Heracles': 'Heracles'
};

// Scottish Premiership specific team name mappings
const SCOTTISH_PREMIERSHIP_MAP = {
  'Celtic': 'Celtic',
  'Hearts': 'Hearts',
  'Dundee Utd': 'Dundee United',
  'Dundee United': 'Dundee United',
  'Hibernian': 'Hibernian',
  'Falkirk': 'Falkirk',
  'Motherwell': 'Motherwell',
  'Kilmarnock': 'Kilmarnock',
  'Rangers': 'Rangers',
  'St. Mirren': 'St. Mirren',
  'Dundee FC': 'Dundee',
  'Dundee': 'Dundee',
  'Aberdeen': 'Aberdeen',
  'Livingston': 'Livingston'
};

// UEFA Champions League specific team name mappings
const UEFA_CHAMPIONS_LEAGUE_MAP = {
  'Olympiacos': 'Olympiacos Piraeus',
  'Barcelona': 'Barcelona',
  'Pafos': 'Pafos',
  'Kairat': 'Kairat Almaty',
  'Atletico Madrid': 'Atl. Madrid',
  'Arsenal': 'Arsenal',
  'Paris Saint-Germain': 'PSG',
  'Bayer Leverkusen': 'Bayer Leverkusen',
  'Borussia Dortmund': 'Dortmund',
  'Copenhagen': 'FC Copenhagen',
  'Benfica': 'Benfica',
  'Newcastle United': 'Newcastle',
  'Napoli': 'Napoli',
  'PSV Eindhoven': 'PSV',
  'Inter Milan': 'Inter',
  'Union Saint-Gilloise': 'Royale Union SG',
  'Manchester City': 'Manchester City',
  'Villarreal': 'Villarreal',
  'Qarabag': 'Qarabag',
  'Athletic Bilbao': 'Ath Bilbao',
  'Bodo/Glimt': 'Bodo/Glimt',
  'Galatasaray': 'Galatasaray',
  'Tottenham Hotspur': 'Tottenham',
  'Monaco': 'Monaco',
  'Slavia Prague': 'Slavia Prague',
  'Atalanta': 'Atalanta',
  'Ajax': 'Ajax',
  'Chelsea': 'Chelsea',
  'Liverpool': 'Liverpool',
  'Eintracht Frankfurt': 'Eintracht Frankfurt',
  'Club Brugge': 'Club Brugge KV',
  'Bayern Munich': 'Bayern Munich',
  'Juventus': 'Juventus',
  'Real Madrid': 'Real Madrid',
  'Marseille': 'Marseille',
  'Sporting CP': 'Sporting CP'
};

// Liga MX specific team name mappings
const LIGA_MX_MAP = {
  'Puebla': 'Puebla',
  'Tijuana': 'Club Tijuana',
  'Tigres UANL': 'Tigres UANL',
  'Necaxa': 'Necaxa',
  'Atlético San Luis': 'Atl. San Luis',
  'Atlas': 'Atlas',
  'FC Juarez': 'Juarez',
  'Juárez': 'Juarez',
  'Juarez': 'Juarez',
  'Pachuca': 'Pachuca',
  'Toluca': 'Toluca',
  'Querétaro': 'Queretaro',
  'Queretaro': 'Queretaro',
  'Santos Laguna': 'Santos Laguna',
  'León': 'Club Leon',
  'Club Leon': 'Club Leon',
  'Leon': 'Club Leon',
  'Monterrey': 'Monterrey',
  'Pumas UNAM': 'UNAM Pumas',
  'UNAM Pumas': 'UNAM Pumas',
  'Chivas de Guadalajara': 'Guadalajara Chivas',
  'Guadalajara Chivas': 'Guadalajara Chivas',
  'Guadalajara': 'Guadalajara Chivas',
  'Mazatlán FC': 'Mazatlan FC',
  'Mazatlan FC': 'Mazatlan FC',
  'Mazatlán': 'Mazatlan FC',
  'Cruz Azul': 'Cruz Azul',
  'América': 'Club America',
  'Club America': 'Club America',
  'America': 'Club America',
  'Club Tijuana': 'Club Tijuana'
};

// UEFA Europa League specific team name mappings
const UEFA_EUROPA_LEAGUE_MAP = {
  'Braga': 'Braga',
  'Red Star Belgrade': 'Crvena zvezda',
  'FCSB': 'FCSB',
  'Bologna': 'Bologna',
  'SK Brann': 'Brann',
  'Rangers': 'Rangers',
  'Fenerbahçe': 'Fenerbahce',
  'VfB Stuttgart': 'Stuttgart',
  'Feyenoord Rotterdam': 'Feyenoord',
  'Panathinaikos F.C.': 'Panathinaikos',
  'Go Ahead Eagles': 'G.A. Eagles',
  'Aston Villa': 'Aston Villa',
  'Genk': 'Genk',
  'Real Betis': 'Betis',
  'Lyon': 'Lyon',
  'Basel': 'Basel',
  'RB Salzburg': 'Salzburg',
  'Ferencvaros': 'Ferencvaros',
  'AS Roma': 'AS Roma',
  'FC Viktoria Plzeň': 'Plzen',
  'D. Zagreb': 'Din. Zagreb',
  'Din. Zagreb': 'Din. Zagreb',
  'Nottm Forest': 'Nottingham',
  'Nottingham Forest': 'Nottingham',
  'Viktoria Plzeň': 'Plzen',
  'Ferencváros': 'Ferencvaros',
  'M. Tel-Aviv': 'Maccabi Tel Aviv',
  'Maccabi Tel Aviv': 'Maccabi Tel Aviv',
  'Roma': 'AS Roma',
  'Celta Vigo': 'Celta Vigo',
  'Nice': 'Nice',
  'Celtic': 'Celtic',
  'SK Sturm Graz': 'Sturm Graz',
  'SC Freiburg': 'Freiburg',
  'FC Utrecht': 'Utrecht',
  'Lille': 'Lille',
  'PAOK Thessaloniki': 'PAOK',
  'Maccabi Tel-Aviv': 'Maccabi Tel Aviv',
  'FC Midtjylland': 'Midtjylland',
  'Malmö': 'Malmo FF',
  'Dinamo Zagreb': 'D. Zagreb',
  'Nottingham Forest': 'Nottingham',
  'Porto': 'FC Porto',
  'BSC Young Boys': 'Young Boys',
  'Ludogorets': 'Ludogorets'
};

// NCAAF specific team name mappings
const NCAAF_MAP = {
  'FIU': 'Florida International',
  'Louisiana Tech': 'Louisiana Tech',
  'Delaware': 'Delaware Fightin',
  'New Mexico State': 'New Mexico State',
  'Georgia State': 'Georgia State Panthers',
  'Dartmouth': 'Dartmouth',
  'Charlotte': 'Charlotte',
  'Virginia Tech': 'Virginia Tech',
  'Nevada': 'Nevada',
  'Sacramento State': 'Sacramento State',
  'Old Dominion': 'Old Dominion',
  'Kent State': 'Kent State',
  'Kansas': 'Kansas',
  'Nebraska': 'Nebraska',
  'Eastern Michigan': 'Eastern Michigan',
  'Ole Miss': 'Ole Miss',
  'Oklahoma': 'Oklahoma',
  'Purdue': 'Purdue',
  'Wake Forest': 'Wake Forest',
  'Memphis': 'Memphis',
  'Georgia Tech': 'Georgia Tech',
  'Indiana': 'Indiana',
  'North Carolina': 'North Carolina',
  'Yale': 'Yale',
  'Penn': 'Penn',
  'Pennsylvania': 'Pennsylvania',
  'Wagner': 'Wagner',
  'Princeton': 'Princeton',
  'Marist': 'Marist',
  'Davidson': 'Davidson',
  'Bucknell': 'Bucknell',
  'Arkansas': 'Arkansas',
  'Buffalo': 'Buffalo',
  'North Carolina Central': 'North Carolina Central',
  'Fordham': 'Fordham',
  'Valparaiso': 'Valparaiso',
  'Tennessee Tech': 'Tennessee Tech',
  'Stetson': 'Stetson',
  'Holy Cross': 'Holy Cross',
  'Cornell': 'Cornell',
  'Bethune-Cookman': 'Bethune-Cookman',
  'Youngstown State': 'Youngstown State',
  'West Georgia': 'West Georgia',
  'Tuskegee': 'Tuskegee',
  'South Dakota': 'South Dakota',
  'Norfolk State': 'Norfolk State',
  'Furman': 'Furman',
  'Charleston Southern': 'Charleston Southern',
  'Benedict': 'Benedict',
  'Tennessee State': 'Tennessee State',
  'Rice': 'Rice',
  'New Mexico': 'New Mexico',
  'Weber State': 'Weber State',
  'Prairie View A&M': 'Prairie View A&M',
  'Alcorn State': 'Alcorn State',
  'Southern Illinois': 'Southern Illinois',
  'Northern Colorado': 'Northern Colorado',
  'Mercer': 'Mercer',
  'Lindenwood': 'Lindenwood',
  'Houston Christian': 'Houston Christian',
  'Washington State': 'Washington State',
  'South Carolina': 'South Carolina',
  'Northern Illinois': 'Northern Illinois',
  'Iowa State': 'Iowa State',
  'Navy': 'Navy',
  'Washington': 'Washington Huskies',
  'Southern Miss': 'Southern Miss',
  'Central Michigan': 'Central Michigan',
  'Iowa': 'Iowa',
  'Vanderbilt': 'Vanderbilt',
  'Pittsburgh': 'Pittsburgh',
  'Fresno State': 'Fresno State',
  'Tulsa': 'Tulsa',
  'Miami-OH': 'Miami (Oh)',
  'Alabama State': 'Alabama State',
  'Howard': 'Howard',
  'Samford': 'Samford',
  'East Tennessee State': 'East Tennessee State',
  'Cincinnati': 'Cincinnati Bearcats',
  'Texas Tech': 'Texas Tech',
  'Idaho': 'Idaho',
  'North Dakota': 'North Dakota',
  'Nicholls': 'Nicholls',
  'Austin Peay': 'Austin Peay',
  'Mississippi State': 'Mississippi St.',
  'Southern': 'Southern',
  'Northwestern State': 'Northwestern State',
  'West Virginia': 'West Virginia',
  'Grambling State': 'Grambling State',
  'Idaho State': 'Idaho State',
  'Arkansas State': 'Arkansas State',
  'Troy': 'Troy',
  'Miami': 'Miami (FL)',
  'Oregon': 'Oregon',
  'East Texas A&M': 'East Texas A&M',
  'Louisville': 'Louisville',
  'Wyoming': 'Wyoming',
  'Michigan State': 'Michigan State',
  'LSU': 'LSU',
  'Kentucky': 'Kentucky',
  'Arizona State': 'Arizona State',
  'South Dakota State': 'South Dakota State',
  'Utah Tech': 'Utah Tech',
  'UT Rio Grande Valley': 'UT Rio Grande Valley',
  'Cal Poly': 'Cal Poly',
  'Utah': 'Utah',
  'Texas State': 'Texas State Bobcats',
  'Kennesaw State': 'Kennesaw State',
  'Middle Tennessee': 'Middle Tennessee St',
  'Missouri State': 'Missouri State',
  'Delaware State': 'Delaware State',
  'Coastal Carolina': 'Coastal Carolina',
  'UTSA': 'UTSA',
  'Brown': 'Brown',
  'Syracuse': 'Syracuse',
  'Northern Arizona': 'Northern Arizona',
  'Air Force': 'Air Force',
  'Clemson': 'Clemson',
  'North Texas': 'North Texas',
  'UConn': 'Connecticut',
  'Texas': 'Texas',
  'Columbia': 'Columbia',
  'Colorado': 'Colorado Buffaloes',
  'Bowling Green': 'Bowling Green',
  'Western Michigan': 'Western Michigan',
  'Boise State': 'Boise State',
  'NC State': 'North Carolina State',
  'Maryland': 'Maryland',
  'Auburn': 'Auburn',
  'South Alabama': 'South Alabama',
  'SMU': 'Southern Methodist',
  'Minnesota': 'Minnesota',
  'Mississippi Valley State': 'Mississippi Valley State',
  'Morgan State': 'Morgan State',
  'St. Thomas (MN)': 'St. Thomas',
  'UNLV': 'UNLV Rebels',
  'Texas Southern': 'Texas Southern',
  'Montana': 'Montana',
  'Northern Iowa': 'Northern Iowa',
  'Harvard': 'Harvard',
  'Alabama A&M': 'Alabama A&M',
  'Arkansas-Pine Bluff': 'Arkansas-Pine Bluff',
  'Liberty': 'Liberty Flames',
  'Florida': 'Florida Gators',
  'Stanford': 'Stanford',
  'North Dakota State': 'North Dakota State',
  'Eastern Washington': 'Eastern Washington',
  'UC Davis': 'UC Davis',
  'Murray State': 'Murray State',
  'Portland State': 'Portland State',
  'San Diego State': 'San Diego State',
  'Florida State': 'Florida State',
  'Oregon State': 'Oregon State',
  'San Jose State': 'San Jose State',
  'Akron': 'Akron',
  'Ohio': 'Ohio',
  'Toledo': 'Toledo',
  'Appalachian State': 'Appalachian State',
  'South Florida': 'South Florida',
  'UCF': 'UCF',
  'USC': 'USC',
  'Army': 'Army',
  'Temple': 'Temple',
  'WKU': 'Western Kentucky',
  'Boston College': 'Boston College',
  'Tennessee': 'Tennessee',
  'Illinois': 'Illinois',
  'UAB': 'UAB',
  'Louisiana': 'Louisiana-Lafayette',
  'Texas A&M': 'Texas A&M',
  'Missouri': 'Missouri',
  'Florida Atlantic': 'Florida Atlantic',
  'Colorado State': 'Colorado State Rams',
  'Virginia': 'Virginia',
  'California': 'California',
  'Hawaii': 'Hawaii',
  'Massachusetts': 'Massachusetts',
  'Ball State': 'Ball State',
  'Georgia Southern': 'Georgia Southern',
  'Tulane': 'Tulane',
  'Penn State': 'Penn State',
  'Michigan': 'Michigan',
  'Rutgers': 'Rutgers',
  'Baylor': 'Baylor',
  'UCLA': 'UCLA',
  'UTEP': 'UTEP',
  'Duke': 'Duke',
  'Jackson State': 'Jackson State',
  'Florida A&M': 'Florida A&M',
  'East Carolina': 'East Carolina',
  'Alabama': 'Alabama',
  'Georgia': 'Georgia',
  'Notre Dame': 'Notre Dame',
  'Ohio State': 'Ohio State',
  'Wisconsin': 'Wisconsin',
  'Sam Houston': 'Sam Houston State',
  'Montana State': 'Montana State',
  'Kansas State': 'Kansas State',
  'Oklahoma State': 'Oklahoma State',
  'Louisiana-Monroe': 'Louisiana-Monroe',
  'TCU': 'TCU',
  'BYU': 'Brigham Young',
  'Northwestern': 'Northwestern',
  'Houston': 'Houston',
  'Arizona': 'Arizona',
  'Marshall': 'Marshall',
  'James Madison': 'James Madison',
  'Jacksonville State': 'Jacksonville State'
};

// Belgian Pro League specific team name mappings
const BELGIAN_PRO_LEAGUE_MAP = {
  'Union Saint-Gilloise': 'Royale Union SG',
  'Club Brugge': 'Club Brugge KV',
  'Anderlecht': 'Anderlecht',
  'Mechelen': 'KV Mechelen',
  'Sint-Truiden': 'St. Truiden',
  'Zulte-Waregem': 'Waregem',
  'Gent': 'Gent',
  'Genk': 'Genk',
  'Westerlo': 'Westerlo',
  'Standard Liège': 'St. Liege',
  'RAAL La Louvière': 'RAAL La Louviere',
  'Sporting Charleroi': 'Charleroi',
  'Cercle Brugge': 'Cercle Brugge KSV',
  'Antwerp': 'Antwerp',
  'OH Leuven': 'Leuven',
  'Dender': 'Dender'
};

// EFL Championship specific team name mappings
const EFL_CHAMPIONSHIP_MAP = {
  'Coventry City': 'Coventry',
  'Middlesbrough': 'Middlesbrough',
  'Millwall': 'Millwall',
  'Bristol City': 'Bristol City',
  'Charlton Athletic': 'Charlton',
  'Stoke City': 'Stoke',
  'Hull City': 'Hull',
  'Leicester City': 'Leicester',
  'West Bromwich Albion': 'West Brom',
  'Preston North End': 'Preston',
  'Queens Park Rangers': 'QPR',
  'Birmingham City': 'Birmingham',
  'Ipswich Town': 'Ipswich',
  'Swansea City': 'Swansea',
  'Portsmouth': 'Portsmouth',
  'Watford': 'Watford',
  'Southampton': 'Southampton',
  'Derby County': 'Derby',
  'Wrexham': 'Wrexham',
  'Oxford United': 'Oxford Utd',
  'Sheffield United': 'Sheffield Utd',
  'Norwich City': 'Norwich',
  'Blackburn Rovers': 'Blackburn',
  'Sheffield Wednesday': 'Sheffield Wed'
};

// Super Lig specific team name mappings
const SUPER_LIG_MAP = {
  'Galatasaray': 'Galatasaray',
  'Trabzonspor': 'Trabzonspor',
  'Fenerbahçe': 'Fenerbahce',
  'Fenerbahce': 'Fenerbahce',
  'Gaziantep FK': 'Gaziantep',
  'Gaziantep': 'Gaziantep',
  'Göztepe': 'Goztepe',
  'Goztepe': 'Goztepe',
  'Samsunspor': 'Samsunspor',
  'Beşiktaş': 'Besiktas',
  'Besiktas': 'Besiktas',
  'Alanyaspor': 'Alanyaspor',
  'Konyaspor': 'Konyaspor',
  'Antalyaspor': 'Antalyaspor',
  'Kasımpaşa': 'Kasimpasa',
  'Kasimpasa': 'Kasimpasa',
  'Rizespor': 'Rizespor',
  'Gençlerbirliği': 'Genclerbirligi',
  'Genclerbirligi': 'Genclerbirligi',
  'Eyüpspor': 'Eyupspor',
  'Eyupspor': 'Eyupspor',
  'Kocaelispor': 'Kocaelispor',
  'İstanbul Başakşehir': 'Basaksehir',
  'Istanbul Basaksehir': 'Basaksehir',
  'Basaksehir': 'Basaksehir',
  'Kayserispor': 'Kayserispor',
  'Fatih Karagümrük': 'Karagumruk',
  'Fatih Karagumruk': 'Karagumruk',
  'Karagumruk': 'Karagumruk'
};

// Brasileirão specific team name mappings
const BRASILEIRAO_MAP = {
  'Flamengo': 'Flamengo RJ',
  'Cruzeiro': 'Cruzeiro',
  'Mirassol': 'Mirassol',
  'Botafogo': 'Botafogo RJ',
  'Bahia': 'Bahia',
  'Fluminense': 'Fluminense',
  'Vasco da Gama': 'Vasco',
  'Vasco': 'Vasco',
  'São Paulo': 'Sao Paulo',
  'Sao Paulo': 'Sao Paulo',
  'RB Bragantino': 'Bragantino',
  'Corinthians': 'Corinthians',
  'Grêmio': 'Gremio',
  'Gremio': 'Gremio',
  'Ceará': 'Ceara',
  'Ceara': 'Ceara',
  'Internacional': 'Internacional',
  'Atlético Mineiro': 'Atletico-MG',
  'Atletico Mineiro': 'Atletico-MG',
  'Atletico-MG': 'Atletico-MG',
  'Santos': 'Santos',
  'Vitória': 'Vitoria',
  'Vitoria': 'Vitoria',
  'Juventude': 'Juventude',
  'Fortaleza': 'Fortaleza',
  'Sport Recife': 'Sport Recife',
  'Palmeiras': 'Palmeiras'
};

// USL Championship specific team name mappings
const USL_CHAMPIONSHIP_MAP = {
  'Louisville City': 'Louisville City',
  'Charleston Battery': 'Charleston',
  'Hartford Athletic': 'Hartford Athletic',
  'Pittsburgh Riverhounds': 'Pittsburgh',
  'North Carolina': 'North Carolina',
  'Loudoun United': 'Loudoun',
  'Rhode Island': 'Rhode Island',
  'Detroit City': 'Detroit',
  'Indy Eleven': 'Indy Eleven',
  'Tampa Bay Rowdies': 'Tampa Bay',
  'Miami FC': 'Miami FC',
  'Birmingham City': 'Birmingham',
  'Birmingham Legion': 'Birmingham',
  'FC Tulsa': 'FC Tulsa',
  'New Mexico United': 'New Mexico',
  'Sacramento Republic': 'Sacramento Republic',
  'El Paso Locomotive': 'El Paso',
  'Phoenix Rising': 'Phoenix Rising',
  'San Antonio': 'San Antonio',
  'Colorado Springs': 'Colorado Springs',
  'Orange County SC': 'Orange County SC',
  'Lexington': 'Lexington',
  'Oakland Roots': 'Oakland Roots',
  'Monterey Bay': 'Monterey Bay',
  'Las Vegas Lights': 'Las Vegas Lights'
};

// UEFA European Qualifiers specific team name mappings
const UEFA_EUROPEAN_QUALIFIERS_MAP = {
  'Ireland Republic': 'Ireland',
  'Bosnia and Herzegovina': 'Bosnia & Herzegovina',
};

// CONCACAF Qualifiers specific team name mappings
const CONCACAF_QUALIFIERS_MAP = {
  'Curaçao': 'Curacao',
  'Trinidad and Tobago': 'Trinidad & Tobago'
};

// CAF Qualifiers specific team name mappings
const CAF_QUALIFIERS_MAP = {
  'Congo DR': 'D.R. Congo'
};

// General team name mapping: Google Sheets format → FlashLive API format
// This is now empty as all leagues have their own specific maps
const TEAM_NAME_MAP = {};

/**
 * This function runs automatically whenever the spreadsheet is edited
 */
function onEdit(e) {
  // Check if event object exists (required for onEdit)
  if (!e || !e.source || !e.range) {
    return;
  }
  
  // Prevent infinite loops by checking if we're already processing
  // Also add a timeout check - if processing flag is older than 30 seconds, reset it
  const processingFlag = PropertiesService.getScriptProperties().getProperty('processing');
  const processingTime = PropertiesService.getScriptProperties().getProperty('processingTime');
  
  if (processingFlag === 'true') {
    // If processing flag is stuck (older than 30 seconds), reset it
    if (processingTime && (Date.now() - parseInt(processingTime)) > 30000) {
      PropertiesService.getScriptProperties().deleteProperty('processing');
      PropertiesService.getScriptProperties().deleteProperty('processingTime');
    } else {
      return; // Still processing, skip this edit
    }
  }
  
  try {
    PropertiesService.getScriptProperties().setProperty('processing', 'true');
    PropertiesService.getScriptProperties().setProperty('processingTime', Date.now().toString());
    
    const sheet = e.source.getActiveSheet();
    const range = e.range;
    const sheetName = sheet.getName();
    
    // Get the mapping to use based on sheet name
    let mappingToUse = null;
    if (sheetName === 'CopaSudamericana') {
      mappingToUse = COPA_SUDAMERICANA_MAP;
    } else if (sheetName === 'CopaLibertadores') {
      mappingToUse = COPA_LIBERTADORES_MAP;
    } else if (sheetName === 'ArgentinePrimeraDivision') {
      mappingToUse = ARGENTINE_PRIMERA_DIVISION_MAP;
    } else if (sheetName === 'UEFAConferenceLeague') {
      mappingToUse = UEFA_CONFERENCE_LEAGUE_MAP;
    } else if (sheetName === 'SaudiProLeague') {
      mappingToUse = SAUDI_PRO_LEAGUE_MAP;
    } else if (sheetName === 'EFLCup') {
      mappingToUse = EFL_CUP_MAP;
    } else if (sheetName === 'DFBPokal') {
      mappingToUse = DFB_POKAL_MAP;
    } else if (sheetName === 'FACup') {
      mappingToUse = FACUP_MAP;
    } else if (sheetName === 'CopaDelRey') {
      mappingToUse = COPA_DEL_REY_MAP;
    } else if (sheetName === 'NWSL') {
      mappingToUse = NWSL_MAP;
    } else if (sheetName === 'WomensSuperLeague') {
      mappingToUse = WOMENS_SUPER_LEAGUE_MAP;
    } else if (sheetName === 'WomensUCL') {
      mappingToUse = WOMENS_UCL_MAP;
    } else if (sheetName === 'NCAAM') {
      mappingToUse = NCAAM_MAP;
    } else if (sheetName === 'NCAAW') {
      mappingToUse = NCAAW_MAP;
    } else if (sheetName === 'MLS') {
      mappingToUse = MLS_MAP;
    } else if (sheetName === 'NBA') {
      mappingToUse = NBA_MAP;
    } else if (sheetName === 'LaLiga') {
      mappingToUse = LALIGA_MAP;
    } else if (sheetName === 'Premier League' || sheetName === 'PremierLeague') {
      mappingToUse = PREMIER_LEAGUE_MAP;
    } else if (sheetName === 'Ligue 1') {
      mappingToUse = LIGUE1_MAP;
    } else if (sheetName === 'Bundesliga') {
      mappingToUse = BUNDESLIGA_MAP;
    } else if (sheetName === 'Liga Portugal') {
      mappingToUse = LIGA_PORTUGAL_MAP;
    } else if (sheetName === 'Serie A') {
      mappingToUse = SERIE_A_MAP;
    } else if (sheetName === 'Eredivisie') {
      mappingToUse = EREDIVISIE_MAP;
    } else if (sheetName === 'Scottish Premiership') {
      mappingToUse = SCOTTISH_PREMIERSHIP_MAP;
    } else if (sheetName === 'UEFA Champions League') {
      mappingToUse = UEFA_CHAMPIONS_LEAGUE_MAP;
    } else if (sheetName === 'Liga MX') {
      mappingToUse = LIGA_MX_MAP;
    } else if (sheetName === 'UEFA Europa League' || sheetName === 'UEFAEuropaLeague') {
      mappingToUse = UEFA_EUROPA_LEAGUE_MAP;
    } else if (sheetName === 'NCAAF') {
      mappingToUse = NCAAF_MAP;
    } else if (sheetName === 'Belgian Pro League') {
      mappingToUse = BELGIAN_PRO_LEAGUE_MAP;
    } else if (sheetName === 'EFL Championship') {
      mappingToUse = EFL_CHAMPIONSHIP_MAP;
    } else if (sheetName === 'Super Lig') {
      mappingToUse = SUPER_LIG_MAP;
    } else if (sheetName === 'Brasileirão' || sheetName === 'Brasileirao' || sheetName.toLowerCase() === 'brasileirão' || sheetName.toLowerCase() === 'brasileirao') {
      mappingToUse = BRASILEIRAO_MAP;
    } else if (sheetName === 'USL Championship') {
      mappingToUse = USL_CHAMPIONSHIP_MAP;
    } else if (sheetName === 'UEFAEuropeanQualifiers') {
      mappingToUse = UEFA_EUROPEAN_QUALIFIERS_MAP;
    } else if (sheetName === 'CONCACAFQualifiers') {
      mappingToUse = CONCACAF_QUALIFIERS_MAP;
    } else if (sheetName === 'CAFQualifiers') {
      mappingToUse = CAF_QUALIFIERS_MAP;
    } else {
      // Use general mapping for all other sheets
      mappingToUse = TEAM_NAME_MAP;
    }
    
    // If no mapping found for this sheet, skip processing
    if (!mappingToUse) {
      return;
    }
    
    // Get all values from the edited range (handles single cells and paste operations)
    const values = range.getValues();
    const numRows = values.length;
    const numCols = values[0].length;
    let hasChanges = false;
    const newValues = [];
    
    // Process each cell in the range
    for (let row = 0; row < numRows; row++) {
      const newRow = [];
      for (let col = 0; col < numCols; col++) {
        const cellValue = values[row][col];
        
        // Check if the cell value matches any team name in our map
        if (cellValue && typeof cellValue === 'string') {
          const trimmedValue = cellValue.trim();
          const mappedValue = mappingToUse[trimmedValue];
          
          if (mappedValue && mappedValue !== trimmedValue) {
            newRow.push(mappedValue);
            hasChanges = true;
            Logger.log(`Converted "${trimmedValue}" to "${mappedValue}" in sheet "${sheetName}"`);
          } else {
            newRow.push(cellValue);
          }
        } else {
          newRow.push(cellValue);
        }
      }
      newValues.push(newRow);
    }
    
    // Write back all changes at once if any were made
    if (hasChanges) {
      range.setValues(newValues);
    }
  } catch (error) {
    Logger.log(`Error in onEdit: ${error.toString()}`);
    // Don't throw - just log the error so the script doesn't break
  } finally {
    PropertiesService.getScriptProperties().setProperty('processing', 'false');
    PropertiesService.getScriptProperties().deleteProperty('processingTime');
  }
}

/**
 * Reset the processing flag if it gets stuck
 * Run this manually if onEdit stops working
 */
function resetProcessingFlag() {
  PropertiesService.getScriptProperties().deleteProperty('processing');
  PropertiesService.getScriptProperties().deleteProperty('processingTime');
  Logger.log('Processing flag reset');
}

/**
 * Manual function to convert ALL team names in the entire active sheet
 * Run this once after installing the script to convert existing data
 * Go to Extensions > Apps Script > Select "convertAllTeamNames" > Click Run
 */
function convertAllTeamNames() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const sheetName = sheet.getName();
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  
  let changesCount = 0;
  
  // Determine which mapping to use based on sheet name
  let mappingToUse = TEAM_NAME_MAP;
  if (sheetName === 'CopaSudamericana') {
    mappingToUse = COPA_SUDAMERICANA_MAP;
  } else if (sheetName === 'CopaLibertadores') {
    mappingToUse = COPA_LIBERTADORES_MAP;
  } else if (sheetName === 'ArgentinePrimeraDivision') {
    mappingToUse = ARGENTINE_PRIMERA_DIVISION_MAP;
  } else if (sheetName === 'UEFAConferenceLeague') {
    mappingToUse = UEFA_CONFERENCE_LEAGUE_MAP;
  } else if (sheetName === 'SaudiProLeague') {
    mappingToUse = SAUDI_PRO_LEAGUE_MAP;
  } else if (sheetName === 'EFLCup') {
    mappingToUse = EFL_CUP_MAP;
  } else if (sheetName === 'DFBPokal') {
    mappingToUse = DFB_POKAL_MAP;
  } else if (sheetName === 'FACup') {
    mappingToUse = FACUP_MAP;
  } else if (sheetName === 'CopaDelRey') {
    mappingToUse = COPA_DEL_REY_MAP;
  } else if (sheetName === 'NWSL') {
    mappingToUse = NWSL_MAP;
  } else if (sheetName === 'WomensSuperLeague') {
    mappingToUse = WOMENS_SUPER_LEAGUE_MAP;
  } else if (sheetName === 'WomensUCL') {
    mappingToUse = WOMENS_UCL_MAP;
  } else if (sheetName === 'NCAAM') {
    mappingToUse = NCAAM_MAP;
  } else if (sheetName === 'NCAAW') {
    mappingToUse = NCAAW_MAP;
  } else if (sheetName === 'MLS') {
    mappingToUse = MLS_MAP;
  } else if (sheetName === 'NBA') {
    mappingToUse = NBA_MAP;
  } else if (sheetName === 'LaLiga') {
    mappingToUse = LALIGA_MAP;
  } else if (sheetName === 'Premier League' || sheetName === 'PremierLeague') {
    mappingToUse = PREMIER_LEAGUE_MAP;
  } else if (sheetName === 'Ligue 1') {
    mappingToUse = LIGUE1_MAP;
  } else if (sheetName === 'Bundesliga') {
    mappingToUse = BUNDESLIGA_MAP;
  } else if (sheetName === 'Liga Portugal') {
    mappingToUse = LIGA_PORTUGAL_MAP;
  } else if (sheetName === 'Serie A') {
    mappingToUse = SERIE_A_MAP;
  } else if (sheetName === 'Eredivisie') {
    mappingToUse = EREDIVISIE_MAP;
  } else if (sheetName === 'Scottish Premiership') {
    mappingToUse = SCOTTISH_PREMIERSHIP_MAP;
  } else if (sheetName === 'UEFA Champions League') {
    mappingToUse = UEFA_CHAMPIONS_LEAGUE_MAP;
  } else if (sheetName === 'Liga MX') {
    mappingToUse = LIGA_MX_MAP;
  } else if (sheetName === 'UEFA Europa League' || sheetName === 'UEFAEuropaLeague') {
    mappingToUse = UEFA_EUROPA_LEAGUE_MAP;
  } else if (sheetName === 'NCAAF') {
    mappingToUse = NCAAF_MAP;
  } else if (sheetName === 'Belgian Pro League') {
    mappingToUse = BELGIAN_PRO_LEAGUE_MAP;
  } else if (sheetName === 'EFL Championship') {
    mappingToUse = EFL_CHAMPIONSHIP_MAP;
  } else if (sheetName === 'Super Lig') {
    mappingToUse = SUPER_LIG_MAP;
  } else if (sheetName === 'Brasileirão' || sheetName === 'Brasileirao' || sheetName.toLowerCase() === 'brasileirão' || sheetName.toLowerCase() === 'brasileirao') {
    mappingToUse = BRASILEIRAO_MAP;
  } else if (sheetName === 'USL Championship') {
    mappingToUse = USL_CHAMPIONSHIP_MAP;
  } else if (sheetName === 'UEFAEuropeanQualifiers') {
    mappingToUse = UEFA_EUROPEAN_QUALIFIERS_MAP;
  } else if (sheetName === 'CONCACAFQualifiers') {
    mappingToUse = CONCACAF_QUALIFIERS_MAP;
  } else if (sheetName === 'CAFQualifiers') {
    mappingToUse = CAF_QUALIFIERS_MAP;
  }
  
  // Loop through all cells
  for (let row = 0; row < values.length; row++) {
    for (let col = 0; col < values[row].length; col++) {
      const cellValue = values[row][col];
      
      if (cellValue && typeof cellValue === 'string') {
        const trimmedValue = cellValue.trim();
        const mappedValue = mappingToUse[trimmedValue];
        
        if (mappedValue && mappedValue !== trimmedValue) {
          values[row][col] = mappedValue;
          changesCount++;
          Logger.log(`Row ${row + 1}, Col ${col + 1}: "${trimmedValue}" -> "${mappedValue}"`);
        }
      }
    }
  }
  
  // Write all changes back to the sheet at once (more efficient)
  if (changesCount > 0) {
    dataRange.setValues(values);
    SpreadsheetApp.getActiveSpreadsheet().toast(
      `Converted ${changesCount} team names to FlashLive API format`, 
      'Conversion Complete', 
      5
    );
    Logger.log(`Converted ${changesCount} team names in sheet "${sheetName}"`);
  } else {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      'No team names needed conversion', 
      'Already Up to Date', 
      3
    );
  }
}

/**
 * Manual function to convert ALL team names in ALL sheets in the document
 * Run this once after installing the script to convert existing data across all sheets
 * Go to Extensions > Apps Script > Select "convertAllSheetsTeamNames" > Click Run
 */
function convertAllSheetsTeamNames() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = spreadsheet.getSheets();
  let totalChanges = 0;
  let sheetsProcessed = 0;
  
  for (const sheet of sheets) {
    try {
      const sheetName = sheet.getName();
      const dataRange = sheet.getDataRange();
      const values = dataRange.getValues();
      let sheetChanges = 0;
      
      // Determine which mapping to use based on sheet name
      let mappingToUse = TEAM_NAME_MAP;
      if (sheetName === 'CopaSudamericana') {
        mappingToUse = COPA_SUDAMERICANA_MAP;
      } else if (sheetName === 'CopaLibertadores') {
        mappingToUse = COPA_LIBERTADORES_MAP;
      } else if (sheetName === 'ArgentinePrimeraDivision') {
        mappingToUse = ARGENTINE_PRIMERA_DIVISION_MAP;
      } else if (sheetName === 'UEFAConferenceLeague') {
        mappingToUse = UEFA_CONFERENCE_LEAGUE_MAP;
      } else if (sheetName === 'SaudiProLeague') {
        mappingToUse = SAUDI_PRO_LEAGUE_MAP;
      } else if (sheetName === 'EFLCup') {
        mappingToUse = EFL_CUP_MAP;
      } else if (sheetName === 'DFBPokal') {
        mappingToUse = DFB_POKAL_MAP;
      } else if (sheetName === 'FACup') {
        mappingToUse = FACUP_MAP;
      } else if (sheetName === 'CopaDelRey') {
        mappingToUse = COPA_DEL_REY_MAP;
      } else if (sheetName === 'NWSL') {
        mappingToUse = NWSL_MAP;
      } else if (sheetName === 'WomensSuperLeague') {
        mappingToUse = WOMENS_SUPER_LEAGUE_MAP;
      } else if (sheetName === 'WomensUCL') {
        mappingToUse = WOMENS_UCL_MAP;
      } else if (sheetName === 'NCAAM') {
        mappingToUse = NCAAM_MAP;
      } else if (sheetName === 'NCAAW') {
        mappingToUse = NCAAW_MAP;
      } else if (sheetName === 'MLS') {
        mappingToUse = MLS_MAP;
      } else if (sheetName === 'NBA') {
        mappingToUse = NBA_MAP;
      } else if (sheetName === 'LaLiga') {
        mappingToUse = LALIGA_MAP;
      } else if (sheetName === 'Premier League' || sheetName === 'PremierLeague') {
        mappingToUse = PREMIER_LEAGUE_MAP;
      } else if (sheetName === 'Ligue 1') {
        mappingToUse = LIGUE1_MAP;
      } else if (sheetName === 'Bundesliga') {
        mappingToUse = BUNDESLIGA_MAP;
      } else if (sheetName === 'Liga Portugal') {
        mappingToUse = LIGA_PORTUGAL_MAP;
      } else if (sheetName === 'Serie A') {
        mappingToUse = SERIE_A_MAP;
      } else if (sheetName === 'Eredivisie') {
        mappingToUse = EREDIVISIE_MAP;
      } else if (sheetName === 'Scottish Premiership') {
        mappingToUse = SCOTTISH_PREMIERSHIP_MAP;
      } else if (sheetName === 'UEFA Champions League') {
        mappingToUse = UEFA_CHAMPIONS_LEAGUE_MAP;
      } else if (sheetName === 'Liga MX') {
        mappingToUse = LIGA_MX_MAP;
      } else if (sheetName === 'UEFA Europa League') {
        mappingToUse = UEFA_EUROPA_LEAGUE_MAP;
      } else if (sheetName === 'NCAAF') {
        mappingToUse = NCAAF_MAP;
      } else if (sheetName === 'Belgian Pro League') {
        mappingToUse = BELGIAN_PRO_LEAGUE_MAP;
      } else if (sheetName === 'EFL Championship') {
        mappingToUse = EFL_CHAMPIONSHIP_MAP;
      } else if (sheetName === 'Super Lig') {
        mappingToUse = SUPER_LIG_MAP;
      } else if (sheetName === 'Brasileirão') {
        mappingToUse = BRASILEIRAO_MAP;
      } else if (sheetName === 'USL Championship') {
        mappingToUse = USL_CHAMPIONSHIP_MAP;
      } else if (sheetName === 'UEFAEuropeanQualifiers') {
        mappingToUse = UEFA_EUROPEAN_QUALIFIERS_MAP;
      } else if (sheetName === 'CONCACAFQualifiers') {
        mappingToUse = CONCACAF_QUALIFIERS_MAP;
      } else if (sheetName === 'CAFQualifiers') {
        mappingToUse = CAF_QUALIFIERS_MAP;
      }
      
      // Loop through all cells in this sheet
      for (let row = 0; row < values.length; row++) {
        for (let col = 0; col < values[row].length; col++) {
          const cellValue = values[row][col];
          
          if (cellValue && typeof cellValue === 'string') {
            const mappedValue = mappingToUse[cellValue.trim()];
            
            if (mappedValue && mappedValue !== cellValue) {
              values[row][col] = mappedValue;
              sheetChanges++;
            }
          }
        }
      }
      
      // Write changes back to this sheet if any were made
      if (sheetChanges > 0) {
        dataRange.setValues(values);
        Logger.log(`Sheet "${sheetName}": Converted ${sheetChanges} team names`);
      }
      
      totalChanges += sheetChanges;
      sheetsProcessed++;
      
      // Add delay between sheets to avoid quota exceeded errors
      // Wait 4 seconds between each sheet (except after the last one)
      if (sheetsProcessed < sheets.length) {
        Utilities.sleep(4000);
      }
      
    } catch (error) {
      Logger.log(`Error processing sheet "${sheet.getName()}": ${error.message}`);
      // Still add delay even on error to avoid quota issues
      if (sheetsProcessed < sheets.length) {
        Utilities.sleep(4000);
      }
    }
  }
  
  // Show final results
  if (totalChanges > 0) {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      `Converted ${totalChanges} team names across ${sheetsProcessed} sheets`, 
      'All Sheets Conversion Complete', 
      5
    );
    Logger.log(`Total: Converted ${totalChanges} team names across ${sheetsProcessed} sheets`);
  } else {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      'No team names needed conversion across all sheets', 
      'All Sheets Already Up to Date', 
      3
    );
  }
}

/**
 * Manual function to convert team names in a specific range
 * Select the cells you want to convert, then run this function
 */
function convertSelectedRange() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const sheetName = sheet.getName();
  const range = sheet.getActiveRange();
  const values = range.getValues();
  
  let changesCount = 0;
  
  // Determine which mapping to use based on sheet name
  let mappingToUse = TEAM_NAME_MAP;
  if (sheetName === 'CopaSudamericana') {
    mappingToUse = COPA_SUDAMERICANA_MAP;
  } else if (sheetName === 'CopaLibertadores') {
    mappingToUse = COPA_LIBERTADORES_MAP;
  } else if (sheetName === 'ArgentinePrimeraDivision') {
    mappingToUse = ARGENTINE_PRIMERA_DIVISION_MAP;
  } else if (sheetName === 'UEFAConferenceLeague') {
    mappingToUse = UEFA_CONFERENCE_LEAGUE_MAP;
  } else if (sheetName === 'SaudiProLeague') {
    mappingToUse = SAUDI_PRO_LEAGUE_MAP;
  } else if (sheetName === 'EFLCup') {
    mappingToUse = EFL_CUP_MAP;
  } else if (sheetName === 'DFBPokal') {
    mappingToUse = DFB_POKAL_MAP;
  } else if (sheetName === 'FACup') {
    mappingToUse = FACUP_MAP;
  } else if (sheetName === 'CopaDelRey') {
    mappingToUse = COPA_DEL_REY_MAP;
  } else if (sheetName === 'NWSL') {
    mappingToUse = NWSL_MAP;
      } else if (sheetName === 'WomensSuperLeague') {
        mappingToUse = WOMENS_SUPER_LEAGUE_MAP;
      } else if (sheetName === 'WomensUCL') {
        mappingToUse = WOMENS_UCL_MAP;
  } else if (sheetName === 'NCAAM') {
    mappingToUse = NCAAM_MAP;
  } else if (sheetName === 'NCAAW') {
    mappingToUse = NCAAW_MAP;
  } else if (sheetName === 'MLS') {
    mappingToUse = MLS_MAP;
  } else if (sheetName === 'NBA') {
    mappingToUse = NBA_MAP;
  } else if (sheetName === 'LaLiga') {
    mappingToUse = LALIGA_MAP;
  } else if (sheetName === 'Premier League' || sheetName === 'PremierLeague') {
    mappingToUse = PREMIER_LEAGUE_MAP;
  } else if (sheetName === 'Ligue 1') {
    mappingToUse = LIGUE1_MAP;
  } else if (sheetName === 'Bundesliga') {
    mappingToUse = BUNDESLIGA_MAP;
  } else if (sheetName === 'Liga Portugal') {
    mappingToUse = LIGA_PORTUGAL_MAP;
  } else if (sheetName === 'Serie A') {
    mappingToUse = SERIE_A_MAP;
  } else if (sheetName === 'Eredivisie') {
    mappingToUse = EREDIVISIE_MAP;
  } else if (sheetName === 'Scottish Premiership') {
    mappingToUse = SCOTTISH_PREMIERSHIP_MAP;
  } else if (sheetName === 'UEFA Champions League') {
    mappingToUse = UEFA_CHAMPIONS_LEAGUE_MAP;
  } else if (sheetName === 'Liga MX') {
    mappingToUse = LIGA_MX_MAP;
  } else if (sheetName === 'UEFA Europa League' || sheetName === 'UEFAEuropaLeague') {
    mappingToUse = UEFA_EUROPA_LEAGUE_MAP;
  } else if (sheetName === 'NCAAF') {
    mappingToUse = NCAAF_MAP;
  } else if (sheetName === 'Belgian Pro League') {
    mappingToUse = BELGIAN_PRO_LEAGUE_MAP;
  } else if (sheetName === 'EFL Championship') {
    mappingToUse = EFL_CHAMPIONSHIP_MAP;
  } else if (sheetName === 'Super Lig') {
    mappingToUse = SUPER_LIG_MAP;
  } else if (sheetName === 'Brasileirão' || sheetName === 'Brasileirao' || sheetName.toLowerCase() === 'brasileirão' || sheetName.toLowerCase() === 'brasileirao') {
    mappingToUse = BRASILEIRAO_MAP;
  } else if (sheetName === 'USL Championship') {
    mappingToUse = USL_CHAMPIONSHIP_MAP;
  } else if (sheetName === 'UEFAEuropeanQualifiers') {
    mappingToUse = UEFA_EUROPEAN_QUALIFIERS_MAP;
  } else if (sheetName === 'CONCACAFQualifiers') {
    mappingToUse = CONCACAF_QUALIFIERS_MAP;
  } else if (sheetName === 'CAFQualifiers') {
    mappingToUse = CAF_QUALIFIERS_MAP;
  }
  
  // Loop through selected cells
  for (let row = 0; row < values.length; row++) {
    for (let col = 0; col < values[row].length; col++) {
      const cellValue = values[row][col];
      
      if (cellValue && typeof cellValue === 'string') {
        const mappedValue = mappingToUse[cellValue.trim()];
        
        if (mappedValue && mappedValue !== cellValue) {
          values[row][col] = mappedValue;
          changesCount++;
        }
      }
    }
  }
  
  // Write changes back
  if (changesCount > 0) {
    range.setValues(values);
    SpreadsheetApp.getActiveSpreadsheet().toast(
      `Converted ${changesCount} team names in selection`, 
      'Conversion Complete', 
      5
    );
  } else {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      'No team names needed conversion in selection', 
      'Already Up to Date', 
      3
    );
  }
}

/**
 * Creates a custom menu when the spreadsheet is opened
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Team Name Converter')
    .addItem('Convert All Team Names (Current Sheet)', 'convertAllTeamNames')
    .addItem('Convert All Team Names (ALL SHEETS)', 'convertAllSheetsTeamNames')
    .addItem('Convert Selected Range', 'convertSelectedRange')
    .addToUi();
}
