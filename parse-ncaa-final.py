#!/usr/bin/env python3
import re
from datetime import datetime

# Read the schedule from parse-ncaa.py
with open('parse-ncaa.py', 'r') as f:
    content = f.read()

# Extract the schedule_text from the triple-quoted string
match = re.search(r'schedule_text = """(.*?)"""', content, re.DOTALL)
if not match:
    match = re.search(r'schedule_text = """(.*)$', content, re.DOTALL)
    # Find the closing """
    end_match = re.search(r'"""', content[match.end():], re.DOTALL)
    if end_match:
        schedule_text = content[match.end():match.end()+end_match.start()]
    else:
        # Fallback: read from original file structure
        schedule_text = content.split('schedule_text = """')[1].split('"""')[0]
else:
    schedule_text = match.group(1)

month_map = {
    'January': 1, 'February': 2, 'March': 3, 'April': 4, 'May': 5, 'June': 6,
    'July': 7, 'August': 8, 'September': 9, 'October': 10, 'November': 11, 'December': 12
}

lines = schedule_text.split('\n')
current_date = None
games = []
i = 0

def parse_time(time_str):
    """Convert time like '8:00 am' to 24-hour format like '08:00'"""
    if not time_str or 'TBD' in time_str.upper():
        return None
    match = re.match(r'^(\d{1,2}):(\d{2})\s*(am|pm)$', time_str.strip(), re.IGNORECASE)
    if not match:
        return None
    hour = int(match.group(1))
    minute = int(match.group(2))
    am_pm = match.group(3).upper()
    
    if am_pm == 'PM' and hour != 12:
        hour += 12
    elif am_pm == 'AM' and hour == 12:
        hour = 0
    
    return f"{hour:02d}:{minute:02d}"

def is_channel_line(line):
    """Check if a line contains channel information"""
    line_upper = line.upper()
    channel_keywords = ['ESPN', 'ACC', 'SEC', 'BTN', 'CBS', 'FOX', 'TNT', 'NBC', 'PEACOCK', 
                       'YOUTUBE', 'FLOHOPS', 'MW NETWORK', 'NEC FRONT ROW', 'MNMT', 'MIDCO', 
                       'SPECTRUM', 'BALLERTV', 'TBD', 'TV DATA', 'HBO MAX', 'TRUTV', 
                       'PARAMOUNT', 'SNY', 'MASN', 'CW', 'CBSSN', 'FS1', 'FS2', 'B1G+']
    return any(kw in line_upper for kw in channel_keywords)

def get_first_channel(channel_line):
    """Extract the first channel from a channel line"""
    if not channel_line:
        return "TBD"
    
    # Split by comma and take first
    parts = channel_line.split(',')
    first_part = parts[0].strip()
    
    # Map to clean channel names
    if 'ESPN+' in first_part:
        return 'ESPN+'
    elif 'ESPNU' in first_part:
        return 'ESPNU'
    elif 'ESPN2' in first_part:
        return 'ESPN2'
    elif 'ESPN' in first_part and 'ESPN+' not in first_part:
        return 'ESPN'
    elif 'ACC Network' in first_part:
        return 'ACC Network'
    elif 'ACCNX' in first_part:
        return 'ACCNX'
    elif 'SECN+' in first_part:
        return 'SECN+'
    elif 'SEC Network' in first_part:
        return 'SEC Network'
    elif 'B1G+' in first_part:
        return 'B1G+'
    elif 'BTN' in first_part:
        return 'BTN'
    elif 'CBSSN' in first_part:
        return 'CBSSN'
    elif 'FS1' in first_part:
        return 'FS1'
    elif 'FS2' in first_part:
        return 'FS2'
    elif 'FOX' in first_part and 'FS' not in first_part:
        return 'FOX'
    elif 'TNT' in first_part:
        return 'TNT'
    elif 'HBO Max' in first_part:
        return 'HBO Max'
    elif 'truTV' in first_part:
        return 'truTV'
    elif 'FloHoops' in first_part:
        return 'FloHoops'
    elif 'YouTube' in first_part:
        return 'YouTube'
    elif 'MW Network' in first_part:
        return 'MW Network'
    elif 'NEC Front Row' in first_part:
        return 'NEC Front Row'
    elif 'MNMT' in first_part:
        return 'MNMT'
    elif 'Midco Sports Plus' in first_part or 'Midco' in first_part:
        return 'Midco Sports Plus'
    elif 'Peacock' in first_part:
        return 'Peacock'
    elif 'NBC' in first_part and 'Peacock' not in first_part:
        return 'NBC'
    elif 'Spectrum' in first_part:
        return 'Spectrum'
    elif 'BallerTV' in first_part:
        return 'BallerTV'
    elif 'TBD' in first_part or 'TV data unavailable' in first_part:
        return 'TBD'
    elif 'CW' in first_part:
        return 'CW'
    elif 'Paramount+' in first_part:
        return 'Paramount+'
    elif 'SNY' in first_part:
        return 'SNY'
    elif 'NBCSP' in first_part:
        return 'NBCSP'
    elif 'MASN' in first_part:
        return 'MASN'
    elif 'CBS' in first_part:
        return 'CBS'
    else:
        return first_part if first_part else 'TBD'

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
    if 'Time' in line and 'Game' in line:
        i += 1
        continue
    
    # Check if it's a time line (including TBD)
    time_match = re.match(r'^(\d{1,2}):(\d{2})\s*(am|pm)$|^TBD', line, re.IGNORECASE)
    if time_match or 'TBD' in line.upper():
        if 'TBD' in line.upper():
            time_24h = None
        else:
            time_24h = parse_time(line)
        
        i += 1
        
        # Skip tournament/event names
        skip_keywords = ['Field of 68', 'Hall of Fame', 'Armed Forces', 'Dick Vitale', 
                         'Champions Classic', 'Players Era', 'Battle 4', 'Maui Invitational',
                         'Paradise Jam', 'Shriners', 'Charleston Classic', 'ESPN Events',
                         'Rady Children', 'Acrisure', 'Baha Mar', 'Emerald Coast',
                         'Orange Bowl', 'Never Forget', 'CBS Sports', 'Greenbrier',
                         'Live Oak Bank', 'Jerry Colangelo', 'Music City', 'Holiday Hoopsgiving',
                         'Coast to Coast', 'Jimmy V', 'MGM Springfield', 'Chris Paul',
                         'Revocruit', 'CareSource', 'Cleveland Hoops', 'Compete 4 Cause',
                         'C.M. Newton', 'Bad Boy Mowers', 'The Battleground', 'Basketball Hall of Fame']
        
        while i < len(lines) and any(kw in lines[i] for kw in skip_keywords):
            i += 1
        
        # Get away team
        away_team = ""
        while i < len(lines):
            candidate = lines[i].strip()
            if not candidate:
                i += 1
                continue
            if candidate.lower() == 'vs':
                break
            if re.match(r'^\d+$', candidate):  # Skip standalone numbers
                i += 1
                continue
            if any(kw in candidate for kw in skip_keywords):
                i += 1
                continue
            if re.match(r'^[A-Z]{2,3}$', candidate):  # State codes
                i += 1
                continue
            if ',' in candidate and re.search(r', [A-Z]{2}$', candidate):  # Location
                i += 1
                continue
            if is_channel_line(candidate):
                break
            # Remove leading ranking number
            away_team = re.sub(r'^\d+\s+', '', candidate).strip()
            i += 1
            break
        
        if not away_team:
            continue
        
        # Skip "vs"
        if i < len(lines) and lines[i].strip().lower() == 'vs':
            i += 1
        
        # Skip ranking number after vs
        if i < len(lines) and re.match(r'^\d+$', lines[i].strip()):
            i += 1
        
        # Get home team
        home_team = ""
        while i < len(lines):
            candidate = lines[i].strip()
            if not candidate:
                i += 1
                continue
            if candidate.lower() == 'vs':
                i += 1
                continue
            if re.match(r'^\d+$', candidate):  # Skip numbers
                i += 1
                continue
            if ',' in candidate and re.search(r', [A-Z]{2}$', candidate):  # Location
                i += 1
                continue
            if re.match(r'^[A-Z]{2,3}$', candidate):  # State codes
                i += 1
                continue
            if is_channel_line(candidate):
                break
            if any(kw in candidate for kw in skip_keywords):
                i += 1
                continue
            # Remove leading ranking number
            home_team = re.sub(r'^\d+\s+', '', candidate).strip()
            i += 1
            break
        
        if not home_team:
            continue
        
        # Skip location lines
        while i < len(lines):
            loc_line = lines[i].strip()
            if not loc_line:
                i += 1
                continue
            if ',' in loc_line and re.search(r', [A-Z]{2}$', loc_line):
                i += 1
                continue
            if re.match(r'^[A-Z]{2,3}$', loc_line):
                i += 1
                continue
            if is_channel_line(loc_line):
                break
            i += 1
            break
        
        # Get channel
        channel = "TBD"
        if i < len(lines):
            channel_line = lines[i].strip()
            if is_channel_line(channel_line):
                channel = get_first_channel(channel_line)
                i += 1
        
        if away_team and home_team and current_date:
            # Skip if time is None (TBD) for now, or include it
            if time_24h is None:
                time_24h = "TBD"
            
            games.append({
                'date': current_date,
                'time': time_24h,
                'away': away_team,
                'home': home_team,
                'channel': channel
            })
        continue
    
    i += 1

# Output CSV
print("Date,Time,Away Team,Home Team,Channel")
for game in games:
    print(f"{game['date']},{game['time']},{game['away']},{game['home']},{game['channel']}")

