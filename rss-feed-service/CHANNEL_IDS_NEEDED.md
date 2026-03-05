# YouTube Channel IDs Needed

Some bundles include YouTube channels that require channel IDs. Currently, placeholder channel IDs are used. We need to look up the actual channel IDs for these channels:

## Home Videos Bundle
- @NBA
- @Formula1
- @MLB
- @espncfb
- @CFBonFOX
- @LaLiga
- @seriea
- @NWSLsoccer
- @bundesliga
- @NHL
- @NFL
- @CBSSportsCFB

## Tennis Videos Bundle
- @WTA
- @TennisChannel
- @tennistv
- @ATPTour

## Soccer Videos Bundle
- @LaLiga
- @seriea
- @NWSLsoccer
- @bundesliga
- @Ligue1
- @thefacup
- @ligabbvamx
- @GermanFootball
- @cbssportsgolazo
- @CBSSportsGolazoEurope
- @golazoamerica

## NCAAF Videos Bundle
- @espncfb
- @CFBonFOX
- @CBSSportsCFB

## Boxing Videos Bundle
- @PremierBoxingChampions
- @toprank
- @MatchroomBoxing
- @DAZNBoxing

## How to Get Channel IDs

1. Visit the channel page on YouTube
2. View page source
3. Search for `"channelId"` or `"externalId"`
4. Copy the channel ID (starts with `UC`)

Or use a tool like:
- https://commentpicker.com/youtube-channel-id.php
- https://www.streamweasels.com/tools/youtube-channel-id-and-user-id-convertor/

## Update Bundle Configuration

Once you have the channel IDs, update `bundle-rss.js` and replace the placeholder channel IDs with the actual ones.

The format is:
```javascript
'https://www.youtube.com/feeds/videos.xml?channel_id=ACTUAL_CHANNEL_ID'
```

