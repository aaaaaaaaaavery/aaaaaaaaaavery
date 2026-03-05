#!/usr/bin/env python3
import re
from datetime import datetime

schedule_text = """Monday, November 3 

Time	Game / TV
8:00 am	
Field of 68 Opening Day Marathon
Queens
 vs 
Winthrop
Rock Hill, SC
YouTube
11:00 am	
Field of 68 Opening Day Marathon
Bradley
 vs 
St. Bonaventure
Rock Hill, SC
YouTube
11:30 am	
Arlington Baptist
 vs 
East Texas A&M
ESPN+, ESPN Select/Unlimited
12:00 pm	
Binghamton
 vs 
Syracuse
ACCNX, ESPN Unlimited
12:00 pm	
Texas A&M-San Antonio
 vs 
Lamar
ESPN+, ESPN Select/Unlimited
1:30 pm	
Field of 68 Opening Day Marathon
Murray State
 vs 
Omaha
Sioux Falls, SD
YouTube
3:00 pm	
Millsaps
 vs 
Stephen F. Austin
ESPN+, ESPN Select/Unlimited
4:00 pm	
Field of 68 Opening Day Marathon
Drake
 vs 
Northern Arizona
Sioux Falls, SD
YouTube
5:00 pm	
Thomas-ME
 vs 
Stonehill
NEC Front Row
6:00 pm	
Johnson and Wales
 vs 
VMI
ESPN+, ESPN Select/Unlimited
6:00 pm	
Widener
 vs 
Drexel
FloHoops
6:30 pm	
Hall of Fame Series
Maryland
 vs 
Coppin State
Baltimore, MD
BTN, FOX One
6:30 pm	
Field of 68 Opening Day Marathon
High Point
 vs 
Furman
Rock Hill, SC
YouTube
6:30 pm	
Quinnipiac
 vs 
5
St. John's
FS1, FOX One
6:30 pm	
IU Indianapolis
 vs 
Ohio State
B1G+
6:30 pm	
High Point
 vs 
Furman
ESPN+, ESPN Select/Unlimited
6:30 pm	
Morgan State
 vs 
Georgetown
ESPN+, ESPN Select/Unlimited
6:30 pm	
Southern Miss
 vs 
Buffalo
ESPN+, ESPN Select/Unlimited
6:30 pm	
Georgia State
 vs 
Eastern Michigan
ESPN+, ESPN Select/Unlimited
6:31 pm	
Farmingdale State
 vs 
Stony Brook
FloHoops
7:00 pm	
Hall of Fame Series
13
Arizona
 vs 
3
Florida
Las Vegas, NV
TNT, HBO Max
7:00 pm	
New Hampshire
 vs 
Clemson
ACCNX, ESPN Unlimited
7:00 pm	
NC Central
 vs 
NC State
ACCNX, ESPN Unlimited
7:00 pm	
Binghamton
 vs 
Syracuse
ACCNX, ESPN Unlimited
7:00 pm	
Rider
 vs 
Virginia
ACCNX, ESPN Unlimited
7:00 pm	
Long Island
 vs 
Notre Dame
ACCNX, ESPN Unlimited
7:00 pm	
Charleston Southern
 vs 
Virginia Tech
ACCNX, ESPN Unlimited
7:00 pm	
Colgate
 vs 
22
Michigan State
B1G+
7:00 pm	
Fairfield
 vs 
Penn State
B1G+
7:00 pm	
Florida National
 vs 
FIU
ESPN+, ESPN Select/Unlimited
7:00 pm	
Paine College
 vs 
Kennesaw State
ESPN+, ESPN Select/Unlimited
7:00 pm	
Vermont State Johnson
 vs 
Central Connecticut
NEC Front Row
7:00 pm	
SUNY Cobleskill
 vs 
Le Moyne
NEC Front Row
7:00 pm	
Delaware
 vs 
Bucknell
ESPN+, ESPN Select/Unlimited
7:00 pm	
New College-FL
 vs 
Florida Gulf Coast
ESPN+, ESPN Select/Unlimited
7:00 pm	
Southern
 vs 
14
Arkansas
SEC Network, ESPN Unlimited
7:00 pm	
Erskine
 vs 
The Citadel
ESPN+, ESPN Select/Unlimited
7:00 pm	
Union (KY)
 vs 
Chattanooga
ESPN+, ESPN Select/Unlimited
7:00 pm	
North Carolina Central
 vs 
NC State
ACCNX, ESPN Unlimited
7:00 pm	
Long Island University
 vs 
Notre Dame
ACCNX, ESPN Unlimited
7:00 pm	
Youngstown State
 vs 
Pittsburgh
ACCNX, ESPN Unlimited
7:00 pm	
Central Arkansas
 vs 
25
North Carolina
ACC Network, ESPN Unlimited
7:00 pm	
DeSales
 vs 
Davidson
ESPN+, ESPN Select/Unlimited
7:00 pm	
Canisius
 vs 
Dayton
ESPN+, ESPN Select/Unlimited
7:00 pm	
Wofford
 vs 
George Mason
ESPN+, ESPN Select/Unlimited
7:00 pm	
Western Carolina
 vs 
Cincinnati
ESPN+, ESPN Select/Unlimited
7:00 pm	
New Haven
 vs 
4
UConn
ESPN+, ESPN Select/Unlimited
7:00 pm	
Florida National
 vs 
Florida International
ESPN+, ESPN Select/Unlimited
7:00 pm	
Oakwood
 vs 
Jacksonville State
ESPN+, ESPN Select/Unlimited
7:00 pm	
Paine
 vs 
Kennesaw State
ESPN+, ESPN Select/Unlimited
7:00 pm	
Kentucky Christian
 vs 
Liberty
ESPN+, ESPN Select/Unlimited
7:00 pm	
UC Clermont
 vs 
Northern Kentucky
ESPN+, ESPN Select/Unlimited
7:00 pm	
Franklin College
 vs 
Wright State
ESPN+, ESPN Select/Unlimited
7:00 pm	
Louisiana
 vs 
Ball State
ESPN+, ESPN Select/Unlimited
7:00 pm	
Arkansas State
 vs 
Ohio
ESPN+, ESPN Select/Unlimited
7:00 pm	
South Alabama
 vs 
Toledo
ESPN+, ESPN Select/Unlimited
7:00 pm	
Missouri
 vs 
Howard
ESPN+, ESPN Select/Unlimited
7:00 pm	
Union College (KY)
 vs 
Chattanooga
ESPN+, ESPN Select/Unlimited
7:00 pm	
Boston College
 vs 
Florida Atlantic
ESPNU, ESPN Unlimited
7:00 pm	
Mercer
 vs 
18
Tennessee
SECN+, ESPN Unlimited
7:00 pm	
Rivier
 vs 
UMass Lowell
ESPN+, ESPN Select/Unlimited
7:00 pm	
Western New England
 vs 
Vermont
ESPN+, ESPN Select/Unlimited
7:00 pm	
Midway
 vs 
Morehead State
ESPN+, ESPN Select/Unlimited
7:00 pm	
Bryant
 vs 
Siena
ESPN+, ESPN Select/Unlimited
7:00 pm	
Niagara
 vs 
Duquesne
ESPN+, ESPN Select/Unlimited
7:00 pm	
Stetson
 vs 
Rhode Island
ESPN+, ESPN Select/Unlimited
7:00 pm	
Lafayette
 vs 
Saint Joseph's
ESPN+, ESPN Select/Unlimited
7:00 pm	
Wagner
 vs 
VCU
ESPN+, ESPN Select/Unlimited
7:00 pm	
Mary Baldwin
 vs 
Longwood
ESPN+, ESPN Select/Unlimited
7:00 pm	
Navy
 vs 
Presbyterian
ESPN+, ESPN Select/Unlimited
7:00 pm	
Western Illinois
 vs 
Radford
ESPN+, ESPN Select/Unlimited
7:00 pm	
Troy
 vs 
Kent State
ESPN+, ESPN Select/Unlimited
7:00 pm	
Appalachian State
 vs 
Central Michigan
ESPN+, ESPN Select/Unlimited
7:00 pm	
James Madison
 vs 
Akron
ESPN+, ESPN Select/Unlimited
7:00 pm	
Old Dominion
 vs 
Miami-OH
ESPN+, ESPN Select/Unlimited
7:00 pm	
Marshall
 vs 
UMass
ESPN+, ESPN Select/Unlimited
7:00 pm	
Texas State
 vs 
Bowling Green
ESPN+, ESPN Select/Unlimited
7:00 pm	
Coastal Carolina
 vs 
Western Michigan
ESPN+, ESPN Select/Unlimited
7:00 pm	
Tusculum
 vs 
Charleston
FloHoops
7:00 pm	
Mount Olive
 vs 
UNC Wilmington
FloHoops
7:15 pm	
Holy Cross
 vs 
Providence
ESPN+, ESPN Select/Unlimited
7:15 pm	
Marist
 vs 
Xavier
ESPN+, ESPN Select/Unlimited
7:30 pm	
Mississipi Valley State
 vs 
UAB
ESPN+, ESPN Select/Unlimited
7:30 pm	
Maryland-Eastern Shore
 vs 
Georgia Tech
ACCNX, ESPN Unlimited
7:30 pm	
Mississippi Valley State
 vs 
UAB
ESPN+, ESPN Select/Unlimited
7:30 pm	
Saint Peter's
 vs 
Seton Hall
ESPN+, ESPN Select/Unlimited
7:30 pm	
LeTourneau
 vs 
Sam Houston
ESPN+, ESPN Select/Unlimited
7:30 pm	
Tennessee Tech
 vs 
Western Kentucky
ESPN+, ESPN Select/Unlimited
7:30 pm	
Air Force
 vs 
Belmont
ESPN+, ESPN Select/Unlimited
7:30 pm	
Bellarmine
 vs 
Georgia
SECN+, ESPN Unlimited
7:30 pm	
Boston University
 vs 
Northeastern
FloHoops
8:00 pm	
Florida A&M
 vs 
South Florida
ESPN+, ESPN Select/Unlimited
8:00 pm	
UTRGV
 vs 
Baylor
ESPN+, ESPN Select/Unlimited
8:00 pm	
Lehigh
 vs 
2
Houston
CBSSN
8:00 pm	
Tarleton State
 vs 
SMU
ACCNX, ESPN Unlimited
8:00 pm	
American
 vs 
Wake Forest
ACCNX, ESPN Unlimited
8:00 pm	
Chicago State
 vs 
DePaul
ESPN+, ESPN Select/Unlimited
8:00 pm	
Gardner-Webb
 vs 
Minnesota
B1G+
8:00 pm	
West Ga.
 vs 
Nebraska
B1G+
8:00 pm	
Mercyhurst
 vs 
Northwestern
B1G+
8:00 pm	
Campbell
 vs 
24
Wisconsin
B1G+
8:00 pm	
Jacksonville
 vs 
Miami
ACCNX, ESPN Unlimited
8:00 pm	
Tarleton
 vs 
SMU
ACCNX, ESPN Unlimited
8:00 pm	
American University
 vs 
Wake Forest
ACCNX, ESPN Unlimited
8:00 pm	
Indiana State
 vs 
Charlotte
ESPN+, ESPN Select/Unlimited
8:00 pm	
Oklahoma Christian
 vs 
Tulsa
ESPN+, ESPN Select/Unlimited
8:00 pm	
Maine
 vs 
George Washington
ESPN+, ESPN Select/Unlimited
8:00 pm	
Southern Arkansas
 vs 
Houston Christian
ESPN+, ESPN Select/Unlimited
8:00 pm	
UT Rio Grande Valley
 vs 
Baylor
ESPN+, ESPN Select/Unlimited
8:00 pm	
Fairleigh Dickinson
 vs 
16
Iowa State
ESPN+, ESPN Select/Unlimited
8:00 pm	
Green Bay
 vs 
19
Kansas
ESPN+, ESPN Select/Unlimited
8:00 pm	
New Orleans
 vs 
TCU
ESPN+, ESPN Select/Unlimited
8:00 pm	
Hofstra
 vs 
UCF
ESPN+, ESPN Select/Unlimited
8:00 pm	
Albany
 vs 
Marquette
ESPN+, ESPN Select/Unlimited
8:00 pm	
Menlo
 vs 
UC Davis
ESPN+, ESPN Select/Unlimited
8:00 pm	
Hampton
 vs 
Milwaukee
ESPN+, ESPN Select/Unlimited
8:00 pm	
SUNY Maritime
 vs 
Army
ESPN+, ESPN Select/Unlimited
8:00 pm	
North Dakota
 vs 
15
Alabama
SECN+, ESPN Unlimited
8:00 pm	
Bethune-Cookman
 vs 
20
Auburn
SECN+, ESPN Unlimited
8:00 pm	
SE Louisiana
 vs 
Ole Miss
SECN+, ESPN Unlimited
8:00 pm	
Northwestern State
 vs 
Texas A&M
SECN+, ESPN Unlimited
8:00 pm	
Lipscomb
 vs 
Vanderbilt
SECN+, ESPN Unlimited
8:00 pm	
Fisk
 vs 
Tennessee State
ESPN+, ESPN Select/Unlimited
8:00 pm	
UNT Dallas
 vs 
UT Arlington
ESPN+, ESPN Select/Unlimited
8:00 pm	
Cleveland State
 vs 
Loyola Chicago
ESPN+, ESPN Select/Unlimited
8:00 pm	
Southeast Missouri State
 vs 
Saint Louis
ESPN+, ESPN Select/Unlimited
8:00 pm	
McKendree
 vs 
Southern Illinois
ESPN+, ESPN Select/Unlimited
8:00 pm	
Detroit Mercy
 vs 
UIC
ESPN+, ESPN Select/Unlimited
8:00 pm	
UL Monroe
 vs 
Northern Illinois
ESPN+, ESPN Select/Unlimited
8:30 pm	
New Mexico Highlands
 vs 
North Texas
ESPN+, ESPN Select/Unlimited
8:30 pm	
Samford
 vs 
Tulane
ESPN+, ESPN Select/Unlimited
8:30 pm	
Jackson State
 vs 
17
Illinois
BTN, FOX One
8:30 pm	
Oakland
 vs 
7
Michigan
FS1, FOX One
8:30 pm	
LeTourneau
 vs 
Sam Houston
ESPN+, ESPN Select/Unlimited
8:30 pm	
Northern State
 vs 
Wyoming
MW Network
8:30 pm	
Utah Tech
 vs 
South Dakota
Midco Sports Plus
8:30 pm	
Saint Francis (PA)
 vs 
Oklahoma
SECN+, ESPN Unlimited
8:30 pm	
Bryan
 vs 
Austin Peay
ESPN+, ESPN Select/Unlimited
8:30 pm	
Trinity
 vs 
Texas A&M-Corpus Christi
ESPN+, ESPN Select/Unlimited
9:00 pm	
Hall of Fame Series
Towson
 vs 
Loyola Maryland
Baltimore, MD
MNMT
9:00 pm	
Field of 68 Opening Day Marathon
South Dakota State
 vs 
Merrimack
Sioux Falls, SD
YouTube
9:00 pm	
UTPB
 vs 
UTEP
ESPN+, ESPN Select/Unlimited
9:00 pm	
Westminster
 vs 
Utah State
MW Network
9:00 pm	
Purdue Fort Wayne
 vs 
Grand Canyon
MW Network
9:00 pm	
Incarnate Word
 vs 
Colorado State
MW Network
9:00 pm	
Hawai'i Pacific
 vs 
Boise State
MW Network
9:00 pm	
Texas Southern University
 vs 
21
Gonzaga
ESPN+, ESPN Select/Unlimited
9:00 pm	
South Carolina State
 vs 
11
Louisville
ACC Network, ESPN Unlimited
9:00 pm	
West Coast Baptist
 vs 
Weber State
ESPN+, ESPN Select/Unlimited
9:00 pm	
Montana State
 vs 
Colorado
ESPN+, ESPN Select/Unlimited
9:00 pm	
San Jose State
 vs 
Utah
ESPN+, ESPN Select/Unlimited
9:00 pm	
Texas Southern
 vs 
21
Gonzaga
ESPN+, ESPN Select/Unlimited
9:00 pm	
Life Pacific
 vs 
Pepperdine
ESPN+, ESPN Select/Unlimited
9:00 pm	
McMurry
 vs 
Abilene Christian
ESPN+, ESPN Select/Unlimited
9:00 pm	
Northwest Indian
 vs 
Montana
ESPN+, ESPN Select/Unlimited
9:30 pm	
Hall of Fame Series
8
BYU
 vs 
Villanova
Las Vegas, NV
TNT, HBO Max
9:30 pm	
Cal Poly
 vs 
USC
B1G+
9:30 pm	
North Dakota State University
 vs 
Oregon State
ESPN+, ESPN Select/Unlimited
9:30 pm	
University of Idaho
 vs 
Washington State
ESPN+, ESPN Select/Unlimited
9:30 pm	
North Dakota State
 vs 
Oregon State
ESPN+, ESPN Select/Unlimited
9:30 pm	
Idaho
 vs 
Washington State
ESPN+, ESPN Select/Unlimited
9:30 pm	
Colorado College
 vs 
Northern Colorado
ESPN+, ESPN Select/Unlimited
10:00 pm	
CSU Bakersfield
 vs 
California
ACCNX, ESPN Unlimited
10:00 pm	
University of Denver
 vs 
Seattle U
ESPN+, ESPN Select/Unlimited
10:00 pm	
Lincoln University CA
 vs 
Loyola Marymount
ESPN+, ESPN Select/Unlimited
10:00 pm	
Willamette University
 vs 
Portland
ESPN+, ESPN Select/Unlimited
10:00 pm	
St. Thomas
 vs 
Saint Mary's
ESPN+, ESPN Select/Unlimited
10:00 pm	
Cal State Bakersfield
 vs 
California
ACCNX, ESPN Unlimited
10:00 pm	
Lincoln (CA)
 vs 
Loyola Marymount
ESPN+, ESPN Select/Unlimited
10:00 pm	
Willamette
 vs 
Portland
ESPN+, ESPN Select/Unlimited
10:00 pm	
UC Santa Cruz
 vs 
San Francisco
ESPN+, ESPN Select/Unlimited
10:00 pm	
Denver
 vs 
Seattle U
ESPN+, ESPN Select/Unlimited
10:00 pm	
Bethesda
 vs 
UC Irvine
ESPN+, ESPN Select/Unlimited
10:00 pm	
La Verne
 vs 
UC San Diego
ESPN+, ESPN Select/Unlimited
10:00 pm	
La Sierra
 vs 
UC Riverside
ESPN+, ESPN Select/Unlimited
10:00 pm	
Cal Tech
 vs 
Cal State Fullerton
ESPN+, ESPN Select/Unlimited
10:00 pm	
Nobel University
 vs 
Cal State Northridge
ESPN+, ESPN Select/Unlimited
10:30 pm	
Eastern Washington
 vs 
12
UCLA
BTN, FOX One
10:30 pm	
Fresno Pacific
 vs 
Fresno State
MW Network
10:30 pm	
South Carolina Upstate
 vs 
California Baptist
ESPN+, ESPN Select/Unlimited
11:00 pm	
Arkansas-Pine Bluff
 vs 
Washington
B1G+
Tuesday, November 4 

Time	Game / TV
TBD	
Mount St. Mary's
 vs 
West Virginia
ESPN+, ESPN Select/Unlimited
TBD	
Lindenwood
 vs 
10
Texas Tech
ESPN+, ESPN Select/Unlimited
TBD	
Alcorn State
 vs 
Florida State
ACCNX, ESPN Unlimited
TBD	
Long Beach State
 vs 
San Diego State
MW Network
5:30 pm	
Armed Forces Classic
11
Louisville
 vs 
4
UConn
ESPN, ESPN Unlimited
6:00 pm	
Penn State York
 vs 
UMBC
ESPN+, ESPN Select/Unlimited
6:30 pm	
Evansville
 vs 
1
Purdue
BTN, FOX One
7:00 pm	
Alcorn State
 vs 
Florida State
ACCNX, ESPN Unlimited
7:00 pm	
Georgia Southern
 vs 
East Carolina
ESPN+, ESPN Select/Unlimited
7:00 pm	
NJIT
 vs 
Fordham
ESPN+, ESPN Select/Unlimited
7:00 pm	
St. Mary's
 vs 
West Virginia
ESPN+, ESPN Select/Unlimited
7:00 pm	
East West University
 vs 
SIU Edwardsville
ESPN+, ESPN Select/Unlimited
7:00 pm	
Nicholls
 vs 
9
Kentucky
SECN+, ESPN Unlimited
7:00 pm	
North Carolina A&T
 vs 
South Carolina
SECN+, ESPN Unlimited
7:00 pm	
St. Joseph's Brooklyn
 vs 
Manhattan
ESPN+, ESPN Select/Unlimited
7:00 pm	
Merchant Marine Academy
 vs 
Sacred Heart
ESPN+, ESPN Select/Unlimited
7:00 pm	
Converse
 vs 
East Tennessee State
ESPN+, ESPN Select/Unlimited
7:00 pm	
Caldwell
 vs 
Monmouth
FloHoops
7:30 pm	
UNC Asheville
 vs 
Wichita State
ESPN+, ESPN Select/Unlimited
8:00 pm	
Oral Roberts
 vs 
Oklahoma State
ESPN+, ESPN Select/Unlimited
8:00 pm	
College of Biblical Studies
 vs 
Rice
ESPN+, ESPN Select/Unlimited
8:00 pm	
UNC Greensboro
 vs 
Kansas State
ESPN+, ESPN Select/Unlimited
8:00 pm	
Lindenwood
 vs 
10
Texas Tech
ESPN+, ESPN Select/Unlimited
8:00 pm	
Missouri Southern
 vs 
Missouri State
ESPN+, ESPN Select/Unlimited
8:00 pm	
tbd
 vs 
tbd (MVC)
ESPN+, ESPN Select/Unlimited
8:00 pm	
Arkansas Baptist
 vs 
Little Rock
ESPN+, ESPN Select/Unlimited
8:00 pm	
West Coast Baptist
 vs 
Utah Valley
ESPN+, ESPN Select/Unlimited
8:30 pm	
Robert Morris
 vs 
Iowa
BTN, FOX One
8:45 pm	
Dick Vitale Invitational
Texas
 vs 
6
Duke
Charlotte, NC
ESPN, ESPN Unlimited
8:45 pm	
Dick Vitale Invitational
Texas
 vs 
6
Duke
ESPN, ESPN Unlimited
9:00 pm	
Southern Utah
 vs 
Arizona State
ESPN+, ESPN Select/Unlimited
9:00 pm	
San Francisco State
 vs 
UC Santa Barbara
ESPN+, ESPN Select/Unlimited
9:00 pm	
Adams State
 vs 
New Mexico State
ESPN+, ESPN Select/Unlimited
10:00 pm	
Portland State
 vs 
Stanford
ACCNX, ESPN Unlimited
10:00 pm	
UT Martin
 vs 
UNLV
MW Network
10:00 pm	
Louisiana Tech
 vs 
Nevada
MW Network
10:00 pm	
Occidental College
 vs 
San Diego
ESPN+, ESPN Select/Unlimited
10:00 pm	
Occidental
 vs 
San Diego
ESPN+, ESPN Select/Unlimited
10:00 pm	
Cal Poly Humboldt
 vs 
Santa Clara
ESPN+, ESPN Select/Unlimited
10:00 pm	
Park University
 vs 
Idaho State
ESPN+, ESPN Select/Unlimited
10:00 pm	
Dominican
 vs 
Sacramento State
ESPN+, ESPN Select/Unlimited
10:30 pm	
Hawaii
 vs 
Oregon
BTN, FOX One"""

# Month mapping
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
    if re.match(r'^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday), (January|February|March|April|May|June|July|August|September|October|November|December) \d+', line):
        parts = line.replace(',', '').split()
        month_name = parts[1]
        day = int(parts[2])
        month = month_map[month_name]
        current_date = f"{month}/{day}/2025"
        i += 1
        continue
    
    # Skip header lines
    if 'Time' in line and 'Game' in line:
        i += 1
        continue
    
    # Check if it's a time line
    time_match = re.match(r'^(\d{1,2}):(\d{2})\s*(am|pm)$', line, re.IGNORECASE)
    if time_match:
        hour = int(time_match.group(1))
        minute = int(time_match.group(2))
        am_pm = time_match.group(3).upper()
        
        if am_pm == 'PM' and hour != 12:
            hour += 12
        elif am_pm == 'AM' and hour == 12:
            hour = 0
        
        time_str = f"{hour:02d}:{minute:02d}"
        
        i += 1
        # Skip "Field of 68" or tournament name lines
        if i < len(lines) and ('Field of 68' in lines[i] or 'Hall of Fame' in lines[i] or 'Armed Forces' in lines[i] or 'Dick Vitale' in lines[i]):
            i += 1
        
        # Get away team
        away_team = ""
        if i < len(lines):
            away_team = lines[i].strip()
            i += 1
        
        # Skip "vs" line
        if i < len(lines) and 'vs' in lines[i]:
            i += 1
        
        # Skip ranking numbers
        if i < len(lines) and re.match(r'^\d+$', lines[i].strip()):
            i += 1
        
        # Get home team
        home_team = ""
        if i < len(lines):
            home_team = lines[i].strip()
            i += 1
        
        # Skip location lines
        while i < len(lines) and (',' in lines[i] or 'MD' in lines[i] or 'SC' in lines[i] or 'SD' in lines[i] or 'NV' in lines[i] or 'NC' in lines[i] or 'FL' in lines[i]):
            i += 1
        
        # Get channel (first one)
        channel = ""
        if i < len(lines):
            channel_line = lines[i].strip()
            # Extract first channel (before comma if multiple)
            if ',' in channel_line:
                channel = channel_line.split(',')[0].strip()
            else:
                channel = channel_line
            
            # Clean up channel names
            if 'ESPN+' in channel:
                channel = 'ESPN+'
            elif 'ESPN,' in channel:
                channel = 'ESPN'
            elif 'ESPNU' in channel:
                channel = 'ESPNU'
            elif 'ESPN2' in channel:
                channel = 'ESPN2'
            elif 'ACCNX' in channel:
                channel = 'ACCNX'
            elif 'ACCN' in channel or 'ACC Network' in channel:
                channel = 'ACC Network'
            elif 'SECN+' in channel:
                channel = 'SECN+'
            elif 'SEC Network' in channel:
                channel = 'SEC Network'
            elif 'B1G+' in channel:
                channel = 'B1G+'
            elif 'BTN' in channel:
                channel = 'BTN'
            elif 'CBSSN' in channel:
                channel = 'CBSSN'
            elif 'FS1' in channel:
                channel = 'FS1'
            elif 'FloHoops' in channel:
                channel = 'FloHoops'
            elif 'YouTube' in channel:
                channel = 'YouTube'
            elif 'MW Network' in channel:
                channel = 'MW Network'
            elif 'NEC Front Row' in channel:
                channel = 'NEC Front Row'
            elif 'MNMT' in channel:
                channel = 'MNMT'
            elif 'Midco Sports Plus' in channel:
                channel = 'Midco Sports Plus'
            elif 'TNT' in channel:
                channel = 'TNT'
            elif 'HBO Max' in channel:
                channel = 'HBO Max'
            
            i += 1
        
        if away_team and home_team and current_date:
            games.append({
                'date': current_date,
                'time': time_str,
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

