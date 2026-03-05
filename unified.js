<script>
// --- FINAL UNIFIED SCRIPT for ALL Game, Schedule, and Standings Logic ---
document.addEventListener('DOMContentLoaded', function () {

    // --- 1. CONFIGURATION ---
  const LEAGUE_DATA_CONFIG = {
    'NFL': { leagueId: 'USA: NFL', standingsUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSoXI911JBowIVpsOtYo7Jk0WwwNlujQ76rR4lgDAqxGWLa_q67gOXI0DyKsC4YkKIfbSYqerHp17-m/pub?gid=1628205730&single=true&output=csv' },
    'NBA': { leagueId: 'USA: NBA', standingsUrl: 'YOUR_NBA_STANDINGS_CSV_URL_HERE' },
    'MLB': { leagueId: 'USA: MLB', standingsUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRQHOSDTxfJ554E0MhgZPfmnarCUunnYmxDBSZ78APQ3QfvPWBnn1i68JPSuNCNByd1IzYEbj-6AVAZ/pub?gid=1312763847&single=true&output=csv' },
    'NHL': { leagueId: 'USA: NHL', standingsUrl: 'YOUR_NHL_STANDINGS_CSV_URL_HERE' },
    'PremierLeague': { leagueId: 'ENGLAND: PREMIER LEAGUE', standingsUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT8lEnnlz6Uhb47U4yOnsSUOcsfBS3TrpEXri3g6S2Yj2FUkq1rSSgE4SveKPoAJQsu6U2kkfdGtmhO/pub?gid=0&single=true&output=csv', upcomingCollectionName: 'PremierLeague' },    'LaLiga': { leagueId: 'SPAIN: LALIGA', standingsUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS8ZGW33Hc9fDIq8mJZZqVj8GJdm3p08Jug6e5fTP0-KBtGpFB6BIXgDKkvHqyHnJRKZ9Ba24I3hekV/pub?gid=0&single=true&output=csv' },
    'SerieA': { leagueId: 'ITALY: SERIE A', standingsUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRaaFrDXpcgY4EiGwkYfT0zodrVA1GJU2A6qcrc1GcLxkPjHh43ksM3T4c4p5nFdqKJoj96eEpUKST3/pub?gid=0&single=true&output=csv' },
    'Bundesliga': { leagueId: 'GERMANY: BUNDESLIGA', standingsUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTwpzErtNqiT5mq4kII0P1OxnY41WAgyY4fi7kiThIgNSgf6lr3kslZ9OBAP3-I2YJ4_aA0p0LNjsaH/pub?gid=0&single=true&output=csv' },
    'Ligue1': { leagueId: 'FRANCE: LIGUE 1', standingsUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRD-758CxWtSSl1PCJRdVREjXqhrxTBjYBtnxx4ot8wUdEGfw7ONCzQNfTIdvntZoi1Kme0F7Nkt4Wa/pub?gid=0&single=true&output=csv' },
    'NCAAF': { leagueId: 'USA: NCAAF', standingsUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRiThcO5BjAuw3818zbgA9WxlLQFK8T3n5LCPxAihwjANmnxme5ynsLG2EyD2RyPvACe4wGlY36ekF7/pub?gid=0&single=true&output=csv' },
    'WNBA': { leagueId: 'USA: WNBA', standingsUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSMWPTh0lOh89-qkXYbx63Vs8FQ7gUoT0333Pa9ZgPg4WWBMgB-xERDMM_U2yIUgS3TSPOXOD5M7sVl/pub?gid=0&single=true&output=csv' },
    'Soccer': { leagueId: 'WORLD: SOCCER', standingsUrl: 'YOUR_SOCCER_STANDINGS_CSV_URL_HERE' },
    'UEFAChampionsLeague': { leagueId: 'EUROPE: UEFA CHAMPIONS LEAGUE', standingsUrl: 'YOUR_UEFACHAMPIONSLEAGUE_STANDINGS_CSV_URL_HERE' },
    'FACup': { leagueId: 'ENGLAND: FA CUP', standingsUrl: 'YOUR_FACUP_STANDINGS_CSV_URL_HERE' },
    'LigaMX': { leagueId: 'MEXICO: LIGA MX', standingsUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSL_7HJC0jqhF1jy4tiIrrh5RLewsiH9RezMKDx6TpZtz2JHB8D7Dlx7yyZRWZ7rU5txoTasyiHk7M4/pub?gid=0&single=true&output=csv' },
    'NWSL': { leagueId: 'USA: NWSL', standingsUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQJn_hnVeNfnXsDpeer_hgh6dxOcL2VOJzHKsE8cv-OTaX8EzWRYIGNLqLztvuAeuJbM4oEElA-LoiU/pub?gid=0&single=true&output=csv' },
    'UEFAEuropaLeague': { leagueId: 'EUROPE: UEFA EUROPA LEAGUE', standingsUrl: 'YOUR_UEFAEUROPALEAGUE_STANDINGS_CSV_URL_HERE' },
    'UEFAConferenceLeague': { leagueId: 'EUROPE: UEFA CONFERENCE LEAGUE', standingsUrl: 'YOUR_UEFACONFERENCELEAGUE_STANDINGS_CSV_URL_HERE' },
    'FormulaOne': { leagueId: 'WORLD: FORMULA ONE', standingsUrl: 'YOUR_FORMULAONE_STANDINGS_CSV_URL_HERE' },
    'PGATour': { leagueId: 'WORLD: PGA TOUR', standingsUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRh72gyQFguMGj0RkHvy-WrAH3EBpOMdikyKIjrOfSs5aAYYlE7NjbRJsBa7gkkJ4gV_nUUYSbCje2L/pub?gid=786471151&single=true&output=csv' },
    'UFC': { leagueId: 'WORLD: UFC', standingsUrl: 'YOUR_UFC_STANDINGS_CSV_URL_HERE' },
    'Boxing': { leagueId: 'WORLD: BOXING', standingsUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRthmvN_N-bKFQdsc5V_Otx92FF5qwjYkI9YXHoKgKyV5jvfmb6skABo0Ncbh1x0ehEU-4Je3w_KPmb/pub?gid=1100984840&single=true&output=csv' },
    'NASCARCupSeries': { leagueId: 'USA: NASCAR CUP SERIES', standingsUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRzMLdfLfGydr1dpjhS8hr1PLCBod_Jm-J9ABvGaeyhttkAep5HAtWfB5hGeCaLHteZBapJMhNExe0l/pub?gid=0&single=true&output=csv' },
    'Tennis': { leagueId: 'WORLD: TENNIS', standingsUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ74Qw3ZgBqRAKd_HVAnGLI9zDqk_JILTBTtlrFKI8oCosRHnLQZ9Nu8BIAVYdLq932wzE8oz3UNCIP/pub?gid=0&single=true&output=csv' },
    'LIVGolf': { leagueId: 'WORLD: LIV GOLF', standingsUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTZ7zf4PAme33oOeQ5NFNVE3W1OXJDJ2-qN0_TKLYaditRtpsa7yfxGY3lsGJQxZLQxhIKGzAH7NgBo/pub?gid=0&single=true&output=csv' },
    'IndyCar': { leagueId: 'USA: INDYCAR', standingsUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQWqPs7Krfm7U1_bU2MShMSgAGF5RIXqIVUZ6vQO2XWz0waDHd48eiawVeOwXwAkeZBdoNA1X4Mkzs3/pub?gid=0&single=true&output=csv' },
    'NCAAM': { leagueId: 'USA: NCAAM', standingsUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRWwuY4T7aQXTeW_8WDncuzDZUAIr9JDhV2MjP4ZFAM0EjuUWgpKBb2sWjI9gZxvqCxnON9JTN7lo2i/pub?gid=0&single=true&output=csv' },
    'NCAAW': { leagueId: 'USA: NCAAW', standingsUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRDKX76cBl2tx7s_rW20e2TzKX-uvA6UsPBjsv_UXhhoE8zVmUFJvDaopCxEhaDWyaOtL4wDWSVE6H7/pub?gid=0&single=true&output=csv' },
    'NCAABaseball': { leagueId: 'USA: NCAA BASEBALL', standingsUrl: 'YOUR_NCAABASEBALL_STANDINGS_CSV_URL_HERE' },
    'NCAASoftball': { leagueId: 'USA: NCAA SOFTBALL', standingsUrl: 'YOUR_NCAASOFTBALL_STANDINGS_CSV_URL_HERE' },
    'MotoGP': { leagueId: 'WORLD: MOTOGP', standingsUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSqOmundPRaLEu2Jcgt3KBdTRX6jy-Nmkb89fuJC_SfntbZVF_Y-tNehFSnZwqdmK2O3GJR3UlHFXms/pub?gid=0&single=true&output=csv' },
    'LPGATour': { leagueId: 'WORLD: LPGA TOUR', standingsUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSgv4aRqL4dKgbADnZNH1e_oR8rgnbGOY9roEzXNVas0C6nlkx3RggqK7RCq0Cl148yFD0DfxAxtK4q/pub?gid=0&single=true&output=csv' },
    'TrackAndField': { leagueId: 'WORLD: TRACK AND FIELD', standingsUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRbnsEETRJkJlYNokKws_nlk6-OfyJKg8aoq8AldZZgRcdV5YtuQ1kdINCKvR2H-XQZJVxRxcZaKOq2/pub?gid=2060167316&single=true&output=csv' }
};
    const LEAGUE_DISPLAY_ORDER = ["NFL", "U.S. Open - Men's", "U.S. Open - Women's", "NBA", "MLB", "Premier League", "UEFA Champions League", "ATP", "WTA", "LaLiga", "Bundesliga", "Serie A", "WNBA", "UEFA Europa League", "UEFA Conference League", "Leagues Cup", "NWSL", "FIBA AmeriCup", "Copa Libertadores", "Coppa Italia", "DFB-Pokal", "Brasileirão", "Super Lig", "Copa Sudamericana", "Club Friendly"]; 

    // --- 2. FIREBASE INITIALIZATION (SINGLETON) ---
    if (!firebase.apps.length) {
        const firebaseConfig = {
            apiKey: "AIzaSyD3bw8d4q2oO2qpbgGiUG6Qnlf4aABK3Bc",
            authDomain: "flashlive-daily-scraper.firebaseapp.com",
            projectId: "flashlive-daily-scraper",
            storageBucket: "flashlive-daily-scraper.appspot.com",
            messagingSenderId: "124291936014",
            appId: "1:124291936014:web:acadcaa791d6046849315f"
        };
        firebase.initializeApp(firebaseConfig);
    }
    const db = firebase.firestore();
    const gamesCollectionRef = db.collection("artifacts/flashlive-daily-scraper/public/data/sportsGames");

    // --- 3. ELEMENT REFERENCES ---
    const leagueHeader = document.getElementById('league-specific-header');
    const scheduleContent = document.getElementById('league-schedule-content');
    const standingsContent = document.getElementById('league-standings-content');
    
    // --- 4. HELPER FUNCTIONS ---
    function getLeagueDisplayName(name) {
        const map = { "USA: WNBA": "WNBA", "USA: MLB": "MLB", "USA: NFL": "NFL", "USA: US Open ATP, hard": "U.S. Open - Men's", "USA: US Open WTA, hard": "U.S. Open - Women's", "ENGLAND: PREMIER LEAGUE": "Premier League", "USA: NWSL Women": "NWSL", "World: Club Friendly": "Club Friendly", "USA: Cleveland WTA, hard": "WTA", "Germany: DFB Pokal": "DFB-Pokal", "Italy: Coppa Italia": "Coppa Italia", "Turkey: Super Lig": "Super Lig", "Spain: LaLiga": "LaLiga", "England: Premier League": "Premier League", "Europe: Champions League - Qualification": "UEFA Champions League", "Brazil: Serie A Betano": "Brasileirão", "South America: Copa Libertadores - Play Offs": "Copa Libertadores", "North & Central America: Leagues Cup - Play Offs": "Leagues Cup", "South America: Copa Sudamericana - Play Offs": "Copa Sudamericana", "World: AmeriCup": "FIBA AmeriCup", "Europe: Champions League Women - Qualification - Second stage": "UEFA Women's Champions League", "Europe: Europa League - Qualification": "UEFA Europa League", "Europe: Conference League - Qualification": "UEFA Conference League", "Germany: Bundesliga": "Bundesliga" };
        return map[name] || name;
    }
    function getTeamDisplayName(name) {
        let p = name.endsWith(" W") ? name.slice(0, -2) : name;
        const map = { "Arizona Diamondbacks": "Diamondbacks", "Atlanta Braves": "Braves", "Baltimore Orioles": "Orioles", "Boston Red Sox": "Red Sox", "Chicago Cubs": "Cubs", "Chicago White Sox": "White Sox", "Cincinnati Reds": "Reds", "Cleveland Guardians": "Guardians", "Colorado Rockies": "Rockies", "Detroit Tigers": "Tigers", "Houston Astros": "Astros", "Kansas City Royals": "Royals", "Los Angeles Angels": "Angels", "Los Angeles Dodgers": "Dodgers", "Miami Marlins": "Marlins", "Milwaukee Brewers": "Brewers", "Minnesota Twins": "Twins", "New York Mets": "Mets", "New York Yankees": "Yankees", "Athletics": "Athletics", "Philadelphia Phillies": "Phillies", "Pittsburgh Pirates": "Pirates", "San Diego Padres": "Padres", "San Francisco Giants": "Giants", "Seattle Mariners": "Mariners", "St. Louis Cardinals": "Cardinals", "Tampa Bay Rays": "Rays", "Texas Rangers": "Rangers", "Toronto Blue Jays": "Blue Jays", "Washington Nationals": "Nationals", "Atlanta Dream": "Dream", "Chicago Sky": "Sky", "Connecticut Sun": "Sun", "Dallas Wings": "Wings", "Indiana Fever": "Fever", "Las Vegas Aces": "Aces", "Los Angeles Sparks": "Sparks", "Minnesota Lynx": "Lynx", "New York Liberty": "Liberty", "Phoenix Mercury": "Mercury", "Seattle Storm": "Storm", "Washington Mystics": "Mystics" };
        return map[p] || p;
    }
    
    // --- 5. CORE RENDERING FUNCTION ---
    function renderGames(container, gamesData, isGroupedByLeague) {
        container.innerHTML = "";
        const leagueGroups = {};

        if (isGroupedByLeague) {
            gamesData.forEach(game => {
                const leagueDisplayName = getLeagueDisplayName(game.League) || "Other";
                if (!leagueGroups[leagueDisplayName]) leagueGroups[leagueDisplayName] = [];
                leagueGroups[leagueDisplayName].push(game);
            });
        } else {
            leagueGroups['singleLeague'] = gamesData;
        }

        const sortedLeagueNames = isGroupedByLeague 
            ? Object.keys(leagueGroups).sort((a, b) => (LEAGUE_DISPLAY_ORDER.indexOf(a) === -1 ? 99 : LEAGUE_DISPLAY_ORDER.indexOf(a)) - (LEAGUE_DISPLAY_ORDER.indexOf(b) === -1 ? 99 : LEAGUE_DISPLAY_ORDER.indexOf(b)))
            : ['singleLeague'];

        sortedLeagueNames.forEach(leagueNameKey => {
            const games = leagueGroups[leagueNameKey];
            const leagueSection = document.createElement("div");
            if(isGroupedByLeague) {
                leagueSection.className = "league-section";
                const title = document.createElement("div");
                title.className = "league-title";
                title.textContent = leagueNameKey;
                leagueSection.appendChild(title);
            }

            const table = document.createElement("table");
            table.className = "game-table";
            let lastDisplayedTimeLabel = null;

            games.forEach(data => {
                const home = getTeamDisplayName(data["Home Team"] || "");
                const away = getTeamDisplayName(data["Away Team"] || "");
                const homeScore = data["Home Score"], awayScore = data["Away Score"];
                const matchStatus = (data["Match Status"] || "").toUpperCase();
                const rawStart = data["Start Time"];
                
                const isLive = matchStatus.includes("IN PROGRESS") || matchStatus.includes("LIVE");
                const isFinal = matchStatus.includes("FINISHED") || matchStatus.includes("FINAL") || matchStatus.includes("GAME OVER");
                let currentTimeLabel = "";

                if (isLive) {
                    let parsedStatus = '';
                    const displayLeague = getLeagueDisplayName(data.League);
                    if (displayLeague === "MLB") {
                        const inningHalf = data.inningHalf || "";
                        const currentInning = data.currentInning || "";
                        if (inningHalf && currentInning) parsedStatus = `${inningHalf.slice(0,3)} ${currentInning}`;
                    } else if (displayLeague === "WNBA") {
                        const status = data.Status || "";
                        const quarterMatch = status.match(/Q(\d+)/i);
                        if (quarterMatch) parsedStatus = `Q${quarterMatch[1]}`;
                        else if (status.toUpperCase() === "HALF_TIME") parsedStatus = "Half";
                    } else if (data.Sport === "Tennis") { 
                        parsedStatus = data.Status || "Live";
                    }
                    currentTimeLabel = parsedStatus ? `<span style="color: red;">${parsedStatus}</span>` : '<span style="color: red;">Live</span>';
                } else if (isFinal) {
                    currentTimeLabel = "F";
                } else if (rawStart && rawStart.toDate) {
                    currentTimeLabel = luxon.DateTime.fromJSDate(rawStart.toDate()).toFormat('h:mm a');
                } else {
                    currentTimeLabel = "TBD";
                }

                let displayTimeLabel = currentTimeLabel;
                if (!isLive && !isFinal && currentTimeLabel !== "TBD") {
                    if (currentTimeLabel === lastDisplayedTimeLabel) displayTimeLabel = "";
                    else lastDisplayedTimeLabel = currentTimeLabel;
                }
                
                let displayAwayScore = awayScore ?? '';
                let displayHomeScore = homeScore ?? '';
                
                if (!isLive && !isFinal) {
                   displayAwayScore = '';
                   displayHomeScore = '';
                }

                const row1 = table.insertRow();
                row1.className = "game-row";
                const row2 = table.insertRow();
                row2.className = "game-row game-separator";
                
                row1.innerHTML = `<td rowspan="2" style="width: 90px; text-align: left; font-size: 12px; vertical-align: top;">${displayTimeLabel}</td><td class="team-cell">${away}</td><td style="width: 40px; text-align: right;">${displayAwayScore}</td>`;
                row2.innerHTML = `<td class="team-cell">${home}</td><td style="text-align: right;">${displayHomeScore}</td>`;

                let gameStatusClass = 'scheduled-game';
                if (isLive) gameStatusClass = 'live-game';
                if (isFinal) gameStatusClass = 'final-game';
                row1.classList.add(gameStatusClass);
                row2.classList.add(gameStatusClass);
            });
            leagueSection.appendChild(table);
            container.appendChild(leagueSection);
        });
    }

    // --- 6. DATA FETCHING AND LOGIC FUNCTIONS ---
    function sortGames(a, b) {
        const statusA = (a["Match Status"] || "").toUpperCase();
        const statusB = (b["Match Status"] || "").toUpperCase();
        const isFinalA = statusA.includes("FINISHED") || statusA.includes("FINAL");
        const isFinalB = statusB.includes("FINISHED") || statusB.includes("FINAL");
        if (isFinalA && !isFinalB) return 1;
        if (!isFinalA && isFinalB) return -1;
        return a["Start Time"].toMillis() - b["Start Time"].toMillis();
    }

     function fetchLeagueSchedule(leagueId, leagueName) {
        scheduleContent.innerHTML = '<p style="color: #9ca3af;">Loading schedule...</p>';
        const { DateTime } = luxon;
        const todayStr = DateTime.now().setZone('America/New_York').toISODate();
        gamesCollectionRef.where('League', '==', leagueId).where('gameDate', '==', todayStr)
            .onSnapshot(snapshot => {
                if (snapshot.empty) {
                    scheduleContent.innerHTML = `<p>No ${leagueName} games found for today.</p>`;
                    return;
                }
                const gamesData = snapshot.docs.map(doc => doc.data()).sort(sortGames);
                renderGames(scheduleContent, gamesData, false);
            }, err => { scheduleContent.innerHTML = '<p style="color: #ef4444;">Error loading schedule.</p>'; });
    }

    // REPLACE THE OLD FUNCTION WITH THIS ONE
    async function fetchLeagueStandings(url) {
        standingsContent.innerHTML = '<p style="color: #9ca3af;">Loading standings...</p>';
        try {
            if (!url || !url.startsWith('http')) {
                standingsContent.innerHTML = '<p>Standings not available.</p>';
                return;
            }
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            const csvText = await response.text();
            const rows = csvText.split(/\r?\n/).map(row => row.split(','));
            if (rows.length < 2) {
                standingsContent.innerHTML = '<p>No standings data available.</p>';
                return;
            }
            let tableHtml = '<table style="width: 100%; border-collapse: collapse; font-size: 11px;"><thead><tr>';
            rows[0].forEach(header => tableHtml += `<th style="padding: 4px; text-align: left; border-bottom: 1px solid #4a4a4a;">${header.trim().replace(/^"|"$/g, '')}</th>`);
            tableHtml += '</tr></thead><tbody>';
            for (let i = 1; i < rows.length; i++) {
                if (rows[i].length < 2) continue;
                tableHtml += `<tr style="border-top: 1px solid #374151;">`;
                rows[i].forEach(cell => tableHtml += `<td style="padding: 4px;">${cell.trim().replace(/^"|"$/g, '')}</td>`);
                tableHtml += '</tr>';
            }
            tableHtml += '</tbody></table>';
            standingsContent.innerHTML = tableHtml;
        } catch (error) { standingsContent.innerHTML = `<p style="color: #ef4444;">Error loading standings.</p>`; }
    }
    
    function fetchTodayGames(callback) {
        const todayContainer = document.getElementById('games');
        const errorDiv = document.getElementById('error');
        if (!todayContainer || !errorDiv) return () => {};

        errorDiv.textContent = "";
        const { DateTime } = luxon;
        const todayStr = DateTime.now().setZone('America/New_York').toISODate();

        return gamesCollectionRef.where('gameDate', '==', todayStr)
            .onSnapshot(snapshot => {
                if (snapshot.empty) {
                    todayContainer.innerHTML = `<p style="padding: 10px;">No games found for today.</p>`;
                    return;
                }
                const gamesData = snapshot.docs.map(doc => doc.data()).sort(sortGames);
                renderGames(todayContainer, gamesData, true);
                if (callback) {
                    callback();
                }
            }, err => { 
                console.error("Error fetching today's games: ", err);
                errorDiv.textContent = "Failed to load real-time data.";
            });
    }

    function fetchYesterdayScores() {
        const scoresContainer = document.getElementById('dynamicScoresContent');
        const scoresLoading = document.getElementById('scoresLoading');
        const scoresError = document.getElementById('scoresErrorMessage');
        const scoresErrorText = document.getElementById('scoresErrorText');

        if (!scoresContainer || !scoresLoading || !scoresError) return;

        scoresLoading.style.display = 'flex';
        scoresError.style.display = 'none';
        scoresContainer.innerHTML = '';

        const { DateTime } = luxon;
        const yesterdayStr = DateTime.now().setZone('America/New_York').minus({ days: 1 }).toISODate();

        const scoresDocRef = db.collection('dailyScores').doc(yesterdayStr);

        scoresDocRef.get().then(doc => {
            scoresLoading.style.display = 'none';
            if (doc.exists) {
                const gamesData = doc.data().games; 
                if (gamesData && gamesData.length > 0) {
                    renderGames(scoresContainer, gamesData, true);
                } else {
                    scoresContainer.innerHTML = '<p style="padding: 10px;">No scores found for yesterday.</p>';
                }
            } else {
                scoresContainer.innerHTML = `<p style="padding: 10px;">Yesterday's final scores are not yet available. Please check back later.</p>`;
            }
        }).catch(error => {
            scoresLoading.style.display = 'none';
            scoresError.style.display = 'block';
            if(scoresErrorText) scoresErrorText.textContent = "An error occurred while loading scores.";
            console.error("Error fetching yesterday's scores:", error);
        });
    }
    
    // START OF CORRECTED SECTION
    window.loadLeagueSpecificData = function(leagueKey) {
        const leagueInfo = LEAGUE_DATA_CONFIG[leagueKey];
        if (!leagueInfo) return;
        if (leagueHeader) leagueHeader.innerText = leagueKey;
        const todayScheduleContent = document.getElementById('league-schedule-today-content');
        const upcomingScheduleContent = document.getElementById('league-schedule-upcoming-content');
        const standingsContent = document.getElementById('league-standings-content');
        
        // --- RESET TAB STATE WHEN SWITCHING LEAGUES ---
        // Always reset to Today tab when switching to a new league
        const scheduleTabsContainer = document.getElementById('schedule-tabs');
        if (scheduleTabsContainer) {
            const todayScheduleTab = scheduleTabsContainer.querySelector('.schedule-tab[data-schedule-tab="today"]');
            const upcomingScheduleTab = scheduleTabsContainer.querySelector('.schedule-tab[data-schedule-tab="upcoming"]');
            
            // Set Today tab as active and show its content
            todayScheduleTab.classList.add('active');
            upcomingScheduleTab.classList.remove('active');
            document.getElementById('league-schedule-today-content').style.display = 'block';
            document.getElementById('league-schedule-upcoming-content').style.display = 'none';
        }

        // Load TODAY schedule from Firestore
        todayScheduleContent.innerHTML = '<p style="color: #9ca3af;">Loading today\'s schedule...</p>';
        const { DateTime } = luxon;
        const todayStr = DateTime.now().setZone('America/New_York').toISODate();
        gamesCollectionRef.where('League', '==', leagueInfo.leagueId).where('gameDate', '==', todayStr)
            .onSnapshot(snapshot => {
                if (snapshot.empty) {
                    todayScheduleContent.innerHTML = `<p>No games found for today.</p>`;
                    return;
                }
                const gamesData = snapshot.docs.map(doc => doc.data()).sort(sortGames);
                renderGames(todayScheduleContent, gamesData, false);
            }, err => { todayScheduleContent.innerHTML = '<p style="color: #ef4444;">Error loading today\'s schedule.</p>'; });

        // Clear upcoming schedule content when switching leagues
        upcomingScheduleContent.innerHTML = '<p style="color: #9ca3af;">Upcoming schedule functionality is currently not available.</p>';
        // Reusing the standings fetcher
        fetchLeagueStandings(leagueInfo.standingsUrl);
    };

    function loadUpcomingSchedule(leagueKey) {
        const upcomingScheduleContent = document.getElementById('league-schedule-upcoming-content');
        if (!upcomingScheduleContent) return;

        const leagueInfo = LEAGUE_DATA_CONFIG[leagueKey];
        if (!leagueInfo || !leagueInfo.upcomingCollectionName) {
            upcomingScheduleContent.innerHTML = '<p style="color: #9ca3af;">Upcoming schedule is not available for this league.</p>';
            return;
        }

        upcomingScheduleContent.innerHTML = '<p style="color: #9ca3af;">Loading upcoming schedule...</p>';
        const upcomingCollectionRef = db.collection(leagueInfo.upcomingCollectionName);

        upcomingCollectionRef.get().then(snapshot => {
            const now = luxon.DateTime.now().toMillis();
            const games = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                const away = data["Away"] || "";
                const home = data["Home"] || "";
                const timeStr = (data["Time (ET)"] || "").replace(/"/g, "");
                let gameDate;

                if (typeof data["Date"] === "object" && typeof data["Date"].toDate === "function") {
                    gameDate = luxon.DateTime.fromJSDate(data["Date"].toDate());
                } else if (typeof data["Date"] === "string") {
                    let cleaned = data["Date"].replace(" at ", " ").replace(/ UTC[-+]\d+/, "");
                    gameDate = luxon.DateTime.fromFormat(cleaned, "LLLL d, yyyy h:mm:ss.SSS a", { zone: 'America/New_York' });
                    if (!gameDate.isValid) {
                        let dateOnly = data["Date"].split(" at ")[0];
                        gameDate = luxon.DateTime.fromFormat(dateOnly, "LLLL d, yyyy", { zone: 'America/New_York' });
                    }
                }
                if (!gameDate || !gameDate.isValid || gameDate.toMillis() < now) return;
                games.push({
                    dateHeader: gameDate.toFormat('MMMM d, yyyy'),
                    time: timeStr || gameDate.toFormat('h:mm a'),
                    away,
                    home,
                    gameDate,
                    channel: data["Channel"] || data["channel"] || '' // Include channel if available
                });
            });
            if (games.length === 0) {
                upcomingScheduleContent.innerHTML = "<p>No upcoming games found.</p>";
                return;
            }
            games.sort((a, b) => a.gameDate - b.gameDate);
            const gamesByDate = {};
            games.forEach(g => {
                if (!gamesByDate[g.dateHeader]) gamesByDate[g.dateHeader] = [];
                gamesByDate[g.dateHeader].push(g);
            });
            
            // Use the same format as the Today tab - create a table with proper columns
            let html = "";
            Object.keys(gamesByDate).forEach(dateHeader => {
                html += `<div class="date-header" style="background-color: #374151; color: white; padding: 8px; margin: 10px 0 5px 0; font-weight: bold;">${dateHeader}</div>`;
                
                // Create table for this date's games
                html += '<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">';
                gamesByDate[dateHeader].forEach(game => {
                    // Convert the game data to match the format expected by renderGames
                    const gameData = {
                        'Away Team': game.away,
                        'Home Team': game.home,
                        'Start Time': { toDate: () => game.gameDate.toJSDate() },
                        'channel': game.channel || '', // Add channel if available
                        'Match Status': 'Scheduled'
                    };
                    
                    // Create the same row structure as renderGames with channel column
                    html += `
                        <tr class="game-row scheduled-game">
                            <td style="width: 90px; text-align: left; font-size: 12px; vertical-align: top;">${game.time}</td>
                            <td class="team-cell">${game.away}</td>
                            <td style="width: 40px; text-align: right;"></td>
                            <td style="width: 120px; text-align: right; color: #9ca3af; font-size: 11px;">${game.channel || ''}</td>
                        </tr>
                        <tr class="game-row game-separator scheduled-game">
                            <td></td>
                            <td class="team-cell">${game.home}</td>
                            <td style="text-align: right;"></td>
                            <td></td>
                        </tr>
                    `;
                });
                html += '</table>';
            });
            upcomingScheduleContent.innerHTML = html;
        }).catch(error => {
            upcomingScheduleContent.innerHTML = `<div class="error" style="color: #c00;">Error loading schedule: ${error.message}</div>`;
        });
    }


    // --- 7. TABS AND FILTER INITIALIZATION ---
const gamesTabsContainer = document.getElementById('games-tabs');
if (gamesTabsContainer) {
    const todayTab = gamesTabsContainer.querySelector('.games-tab[data-tab="today"]');
    const scoresTab = gamesTabsContainer.querySelector('.games-tab[data-tab="scores"]');
    const liveFilter = document.getElementById('live-filter-toggle');
    
    let activeListenerUnsubscribe = null;

    const applyLiveFilter = () => {
        const isFilterActive = liveFilter.classList.contains('active');
        const todayContent = document.getElementById('games');
        if (!todayContent) return;
        const allGameRows = todayContent.querySelectorAll('.game-row');
        const leagueSections = todayContent.querySelectorAll('.league-section');

        allGameRows.forEach(row => {
            let showRow = true;
            if (isFilterActive && !row.classList.contains('live-game')) {
                showRow = false;
            }
            // THIS IS THE CORRECTED LINE:
            row.style.display = showRow ? '' : 'none';
        });

        leagueSections.forEach(section => {
            const visibleRows = section.querySelectorAll('.game-row:not([style*="display: none"])');
            section.style.display = visibleRows.length > 0 ? 'block' : 'none';
        });
    };

    scoresTab.addEventListener('click', () => {
        if (activeListenerUnsubscribe) {
            activeListenerUnsubscribe();
            activeListenerUnsubscribe = null;
        }
        
        todayTab.classList.remove('active');
        liveFilter.classList.remove('active');
        scoresTab.classList.add('active');

        document.getElementById('tv-listings-scores').style.display = 'block';
        document.getElementById('tv-listings-today').style.display = 'none';

        fetchYesterdayScores();
    });

    todayTab.addEventListener('click', () => {
        if (activeListenerUnsubscribe) {
            activeListenerUnsubscribe();
            activeListenerUnsubscribe = null;
        }

        scoresTab.classList.remove('active');
        liveFilter.classList.remove('active');
        todayTab.classList.add('active');
        
        document.getElementById('tv-listings-today').style.display = 'block';
        document.getElementById('tv-listings-scores').style.display = 'none';
        
        activeListenerUnsubscribe = fetchTodayGames(applyLiveFilter);
    });

    liveFilter.addEventListener('click', () => {
        if (!todayTab.classList.contains('active')) {
            todayTab.click();
            // A small delay to allow the tab content to render before filtering
            setTimeout(applyLiveFilter, 50); 
        } else {
            liveFilter.classList.toggle('active');
            applyLiveFilter();
        }
    });

    // Initial load
    if (todayTab) todayTab.click();
}

// --- SCHEDULE TABS INITIALIZATION ---
const scheduleTabsContainer = document.getElementById('schedule-tabs');
if (scheduleTabsContainer) {
    const todayScheduleTab = scheduleTabsContainer.querySelector('.schedule-tab[data-schedule-tab="today"]');
    const upcomingScheduleTab = scheduleTabsContainer.querySelector('.schedule-tab[data-schedule-tab="upcoming"]');
    
    todayScheduleTab.addEventListener('click', () => {
        // Remove active class from all tabs
        scheduleTabsContainer.querySelectorAll('.schedule-tab').forEach(tab => tab.classList.remove('active'));
        // Add active class to clicked tab
        todayScheduleTab.classList.add('active');
        
        // Show today content, hide upcoming content
        document.getElementById('league-schedule-today-content').style.display = 'block';
        document.getElementById('league-schedule-upcoming-content').style.display = 'none';
    });
    
    upcomingScheduleTab.addEventListener('click', (event) => {
        // Remove active class from all tabs
        scheduleTabsContainer.querySelectorAll('.schedule-tab').forEach(tab => tab.classList.remove('active'));
        // Add active class to clicked tab
        event.currentTarget.classList.add('active');

        // Show upcoming content, hide today content
        document.getElementById('league-schedule-today-content').style.display = 'none';
        document.getElementById('league-schedule-upcoming-content').style.display = 'block';
        
        // Get the current league key from the header
        const leagueHeader = document.getElementById('league-specific-header');
        const leagueKey = leagueHeader ? leagueHeader.innerText : null;

        // Call the new function to load the upcoming schedule, passing the current leagueKey
        if (leagueKey) {
            loadUpcomingSchedule(leagueKey);
        }
    });
}
});
</script>

