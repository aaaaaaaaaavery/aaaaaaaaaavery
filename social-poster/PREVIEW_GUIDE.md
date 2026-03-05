# Design Preview Guide

Preview your social media post designs before deploying!

## Quick Preview

### 1. Generate a Single Preview

```bash
cd social-poster
npm install  # First time only
npm run preview
```

This will:
- Use today's featured games (or mock data if none exist)
- Generate a preview image with the **neon** theme
- Save it to `previews/preview-neon-latest.png`

### 2. Preview Specific Theme

```bash
npm run preview neon
npm run preview cyberpunk
npm run preview electric
npm run preview classic
```

### 3. Preview All Themes at Once

```bash
npm run preview:all
```

This generates previews for all 4 themes so you can compare them side-by-side.

### 4. Use Mock Data (No Firebase Required)

If you want to preview without connecting to Firebase:

```bash
npm run preview:mock
```

This uses sample game data (Lakers vs Warriors, Cowboys vs Eagles, etc.)

## Viewing Previews

### Option 1: Open Image Files Directly

1. Navigate to `social-poster/previews/` folder
2. Open any `.png` file in your image viewer
3. Files are 1080x1080 pixels (Instagram/Twitter optimal size)

### Option 2: Use HTML Preview Page

1. Generate previews: `npm run preview:all`
2. Open `preview-html.html` in your browser
3. See all themes side-by-side

## Preview File Locations

All previews are saved to:
```
social-poster/previews/
├── preview-neon-latest.png
├── preview-cyberpunk-latest.png
├── preview-electric-latest.png
├── preview-classic-latest.png
└── preview-{theme}-{timestamp}.png (timestamped versions)
```

## Design Themes

### Neon (Default)
- Green (#00ff41) and pink (#ff00ff) neon colors
- Glowing text effects
- Grid pattern background
- **Best for**: Bold, eye-catching posts

### Cyberpunk
- Pink (#ff0080) and green (#00ff80) cyberpunk palette
- Futuristic glow effects
- Dark background
- **Best for**: Tech/gaming audience

### Electric
- Blue (#58a6ff) and red (#f85149) electric colors
- High contrast
- Clean design
- **Best for**: Professional sports

### Classic
- Black and white
- No glow effects
- Minimalist design
- **Best for**: Clean, professional look

## Customizing the Preview

### Change Number of Games

Edit `preview.js` and modify the `mockGames` array:

```javascript
const mockGames = [
  {
    homeTeam: 'Your Team',
    awayTeam: 'Opponent',
    league: 'NBA',
    channel: 'ESPN',
    timeString: '8:00 PM',
    order: 0
  },
  // Add more games...
];
```

### Adjust Design

Edit `index.js` in the `generateSocialImage` function to:
- Change font sizes
- Adjust colors
- Modify spacing
- Add/remove effects

## Troubleshooting

### "No games found"
- Use `--mock` flag: `npm run preview:mock`
- Or ensure Firebase is configured and today has featured games

### "Canvas error"
- Make sure you ran `npm install`
- Canvas requires system dependencies (handled in Dockerfile for Cloud Run)

### Preview looks different from production
- Previews use the exact same code as production
- If using mock data, real games may have different text lengths
- Check that fonts are available (Arial is default)

## Next Steps

1. ✅ Generate previews for all themes
2. ✅ Compare designs side-by-side
3. ✅ Choose your favorite theme
4. ✅ Deploy with that theme: `./deploy.sh`
5. ✅ Update Cloud Scheduler with your chosen theme

## Tips

- **Instagram**: Images are square (1080x1080) - perfect!
- **Twitter**: Also supports square images
- **Text length**: Long team names auto-truncate
- **Multiple games**: Design scales automatically

