#!/usr/bin/env python3
import re
import sys

# Read the full schedule from stdin or file
schedule_text = sys.stdin.read() if not sys.stdin.isatty() else open('ncaa-schedule.txt').read()

month_map = {
    'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
    'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
}

lines = schedule_text.split('\n')
current_date = None
games = []

i = 0
while i < len(lines):
    line = lines[i].strip()
    
    # Check if it's a date line
    date_match = re.match(r'^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (January|February|March|April|May|June|July|August|September|October|November|December) (\d+)', line)
    if date_match:
        month_name = date_match.group(2)
        day = int(date_match.group(3))
        month = month_map[month_name]
        current_date = f"{month}/{day}/2025"
        i += 1
        continue
    
    # Skip header lines
    if 'Time' in line and ('Game' in line or 'TV' in line):
        i += 1
        continue
    
    # Check if it's a time line
    time_match = re.match(r'^(\d{1,2}):(\d{2})\s*(am|pm)$', line, re.IGNORECASE)
    if time_match:
        hour = int(time_match.group(1))
        minute = int(time_match.group(2))
        am_pm = time_match.group(3).upper()
        
        # Convert to 24-hour format
        if am_pm == 'PM' and hour != 12:
            hour += 12
        elif am_pm == 'AM' and hour == 12:
            hour = 0
        
        time_str = f"{hour:02d}:{minute:02d}"
        i += 1
        
        # Skip tournament/event name lines
        skip_patterns = ['Field of 68', 'Hall of Fame', 'Armed Forces', 'Dick Vitale', 
                        'Champions Classic', 'Players Era', 'Battle 4', 'Maui Invitational',
                        'Paradise Jam', 'Shriners', 'Charleston Classic', 'ESPN Events',
                        'Rady Children', 'Acrisure', 'Baha Mar', 'Emerald Coast',
                        'Orange Bowl', 'Never Forget', 'CBS Sports', 'Greenbrier',
                        'Live Oak Bank', 'Jerry Colangelo', 'Music City', 'Holiday Hoopsgiving',
                        'Coast to Coast', 'Jimmy V', 'MGM Springfield', 'Chris Paul',
                        'Revocruit', 'CareSource', 'Cleveland Hoops', 'Compete 4 Cause',
                        'C.M. Newton', 'Bad Boy Mowers', 'The Battleground']
        
        while i < len(lines):
            if any(pattern in lines[i] for pattern in skip_patterns):
                i += 1
                continue
            break
        
        # Get away team (skip empty lines and numbers)
        away_team = ""
        while i < len(lines):
            candidate = lines[i].strip()
            if not candidate:
                i += 1
                continue
            if candidate == 'vs' or re.match(r'^\d+$', candidate):
                i += 1
                continue
            if any(pattern in candidate for pattern in skip_patterns):
                i += 1
                continue
            if re.match(r'^[A-Z]{2,3}$', candidate):  # State abbreviations
                i += 1
                continue
            away_team = candidate
            break
        
        if not away_team:
            i += 1
            continue
        
        i += 1
        
        # Skip "vs" line
        while i < len(lines) and lines[i].strip().lower() == 'vs':
            i += 1
        
        # Skip ranking numbers
        while i < len(lines) and re.match(r'^\d+$', lines[i].strip()):
            i += 1
        
        # Get home team
        home_team = ""
        while i < len(lines):
            candidate = lines[i].strip()
            if not candidate:
                i += 1
                continue
            if re.match(r'^\d+$', candidate):  # Skip numbers
                i += 1
                continue
            # Check if it's a location (contains comma or state abbreviations)
            if ',' in candidate or re.match(r'.*, [A-Z]{2}$', candidate):
                i += 1
                continue
            # Check if it's a channel line
            if any(x in candidate.upper() for x in ['ESPN', 'ACC', 'SEC', 'BTN', 'CBS', 'FOX', 'TNT', 'NBC', 'PEACOCK', 'YOUTUBE', 'FLOHOPS', 'MW NETWORK', 'NEC FRONT ROW', 'MNMT', 'MIDCO', 'SPECTRUM', 'BALLERTV', 'TBD', 'TV DATA']):
                break
            home_team = candidate
            break
        
        if not home_team:
            i += 1
            continue
        
        i += 1
        
        # Skip location lines
        while i < len(lines):
            loc_line = lines[i].strip()
            if not loc_line:
                i += 1
                continue
            if ',' in loc_line or re.match(r'.*, [A-Z]{2}$', loc_line):
                i += 1
                continue
            break
        
        # Get channel (first one)
        channel = ""
        if i < len(lines):
            channel_line = lines[i].strip()
            
            # Extract first channel
            if ',' in channel_line:
                # Take first part before comma
                parts = channel_line.split(',')
                channel = parts[0].strip()
            else:
                channel = channel_line
            
            # Clean up channel names - take the first/main channel
            channel_clean = channel
            
            # Priority: specific channels first
            if 'ESPN+' in channel_clean:
                channel_clean = 'ESPN+'
            elif 'ESPNU' in channel_clean:
                channel_clean = 'ESPNU'
            elif 'ESPN2' in channel_clean:
                channel_clean = 'ESPN2'
            elif 'ESPN' in channel_clean:
                channel_clean = 'ESPN'
            elif 'ACC Network' in channel_clean or 'ACC' in channel_clean:
                channel_clean = 'ACC Network'
            elif 'SECN+' in channel_clean:
                channel_clean = 'SECN+'
            elif 'SEC Network' in channel_clean or 'SEC' in channel_clean:
                channel_clean = 'SEC Network'
            elif 'B1G+' in channel_clean:
                channel_clean = 'B1G+'
            elif 'BTN' in channel_clean:
                channel_clean = 'BTN'
            elif 'CBSSN' in channel_clean:
                channel_clean = 'CBSSN'
            elif 'FS1' in channel_clean or 'FS2' in channel_clean:
                channel_clean = 'FS1' if 'FS1' in channel_clean else 'FS2'
            elif 'FOX' in channel_clean:
                channel_clean = 'FOX'
            elif 'TNT' in channel_clean:
                channel_clean = 'TNT'
            elif 'HBO Max' in channel_clean:
                channel_clean = 'HBO Max'
            elif 'truTV' in channel_clean:
                channel_clean = 'truTV'
            elif 'FloHoops' in channel_clean:
                channel_clean = 'FloHoops'
            elif 'YouTube' in channel_clean:
                channel_clean = 'YouTube'
            elif 'MW Network' in channel_clean:
                channel_clean = 'MW Network'
            elif 'NEC Front Row' in channel_clean:
                channel_clean = 'NEC Front Row'
            elif 'MNMT' in channel_clean:
                channel_clean = 'MNMT'
            elif 'Midco Sports Plus' in channel_clean or 'Midco' in channel_clean:
                channel_clean = 'Midco Sports Plus'
            elif 'Peacock' in channel_clean:
                channel_clean = 'Peacock'
            elif 'NBC' in channel_clean:
                channel_clean = 'NBC'
            elif 'Spectrum' in channel_clean:
                channel_clean = 'Spectrum'
            elif 'BallerTV' in channel_clean:
                channel_clean = 'BallerTV'
            elif 'TBD' in channel_clean or 'TV data unavailable' in channel_clean:
                channel_clean = 'TBD'
            elif 'CW' in channel_clean:
                channel_clean = 'CW'
            elif 'Paramount+' in channel_clean:
                channel_clean = 'Paramount+'
            elif 'SNY' in channel_clean:
                channel_clean = 'SNY'
            elif 'NBCSP' in channel_clean:
                channel_clean = 'NBCSP'
            elif 'MASN' in channel_clean:
                channel_clean = 'MASN'
            else:
                channel_clean = channel
            
            channel = channel_clean
            i += 1
        
        if away_team and home_team and current_date:
            # Clean team names (remove leading numbers/rankings)
            away_clean = re.sub(r'^\d+\s+', '', away_team).strip()
            home_clean = re.sub(r'^\d+\s+', '', home_team).strip()
            
            games.append({
                'date': current_date,
                'time': time_str,
                'away': away_clean,
                'home': home_clean,
                'channel': channel
            })
        continue
    
    i += 1

# Output CSV
print("Date,Time,Away Team,Home Team,Channel")
for game in games:
    print(f"{game['date']},{game['time']},{game['away']},{game['home']},{game['channel']}")

