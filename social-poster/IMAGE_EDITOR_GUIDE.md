# Image Text Editor Guide

Add text to any image with customizable styling!

## Quick Start

```bash
cd social-poster
npm install  # First time only

# Basic usage
node add-text-to-image.js input.jpg "Your Text" output.png
```

## Examples

### 1. Simple Centered Text

```bash
node add-text-to-image.js photo.jpg "Hello World" output.png
```

### 2. Custom Position and Size

```bash
node add-text-to-image.js photo.jpg "Title" output.png \
  --x 100 --y 50 --size 72
```

### 3. Neon Glow Effect

```bash
node add-text-to-image.js photo.jpg "FEATURED GAMES" output.png \
  --color "#00ff41" --shadow --shadow-blur 30
```

### 4. Text with Background Box

```bash
node add-text-to-image.js photo.jpg "Bottom Text" output.png \
  --y 900 --align center --bg "#000000" --padding 20
```

### 5. Text with Outline

```bash
node add-text-to-image.js photo.jpg "Bold Text" output.png \
  --color "#ffffff" --stroke "#000000" --stroke-width 3
```

### 6. Multiple Lines (Auto-wrap)

```bash
node add-text-to-image.js photo.jpg "This is a long text that will wrap automatically" output.png \
  --max-width 500 --x 540 --y 200
```

## All Options

| Option | Description | Default | Example |
|--------|-------------|---------|---------|
| `--x` | X position (pixels from left) | Center | `--x 100` |
| `--y` | Y position (pixels from top) | Center | `--y 200` |
| `--size` | Font size in pixels | 48 | `--size 72` |
| `--color` | Text color (hex) | #ffffff | `--color "#00ff41"` |
| `--font` | Font family | Arial | `--font "Helvetica"` |
| `--align` | Text alignment | center | `--align left` |
| `--stroke` | Outline color | None | `--stroke "#000000"` |
| `--stroke-width` | Outline width | 0 | `--stroke-width 3` |
| `--shadow` | Add glow/shadow | false | `--shadow` |
| `--shadow-color` | Shadow color | Text color | `--shadow-color "#00ff41"` |
| `--shadow-blur` | Shadow blur amount | 20 | `--shadow-blur 30` |
| `--bg` | Background box color | None | `--bg "#000000"` |
| `--padding` | Background padding | 10 | `--padding 20` |
| `--max-width` | Auto-wrap at width | None | `--max-width 500` |

## Position Reference

- **Top-left**: `--x 0 --y 0`
- **Top-center**: `--x 540 --y 0` (for 1080px wide image)
- **Top-right**: `--x 1080 --y 0 --align right`
- **Center**: (default, no x/y needed)
- **Bottom-center**: `--y 1000` (for 1080px tall image)
- **Bottom-left**: `--x 0 --y 1000 --align left`
- **Bottom-right**: `--x 1080 --y 1000 --align right`

## Color Examples

- White: `#ffffff`
- Black: `#000000`
- Neon Green: `#00ff41`
- Neon Pink: `#ff00ff`
- Cyan: `#00ffff`
- Red: `#ff0000`
- Blue: `#0000ff`

## Common Use Cases

### Add Title to Image

```bash
node add-text-to-image.js image.jpg "TODAY'S GAMES" output.png \
  --x 540 --y 100 --size 80 --color "#00ff41" --shadow
```

### Add Watermark

```bash
node add-text-to-image.js image.jpg "thporth.com" output.png \
  --x 1000 --y 1000 --size 24 --color "#888888" --align right
```

### Add Caption with Background

```bash
node add-text-to-image.js image.jpg "Game of the Day" output.png \
  --x 540 --y 50 --size 48 --color "#ffffff" \
  --bg "#000000" --padding 15 --align center
```

### Add Multiple Text Elements

Run the command multiple times, using the previous output as input:

```bash
# First text
node add-text-to-image.js original.jpg "Title" temp1.png --x 540 --y 100

# Second text
node add-text-to-image.js temp1.png "Subtitle" final.png --x 540 --y 200
```

## Tips

1. **Positioning**: Use image editing software to find exact pixel coordinates
2. **Fonts**: Arial is default, but you can use any system font
3. **Colors**: Use hex codes with quotes: `"#00ff41"`
4. **Testing**: Start with center position, then adjust x/y
5. **Multiple texts**: Chain commands or use the script programmatically

## Programmatic Usage

You can also use this in your own scripts:

```javascript
const { addTextToImage } = require('./add-text-to-image');

await addTextToImage('input.jpg', 'Hello', 'output.png', {
  x: 100,
  y: 200,
  fontSize: 48,
  color: '#00ff41',
  shadow: true
});
```

## Supported Formats

- Input: JPEG, PNG, GIF, WebP
- Output: PNG (always)

## Troubleshooting

**"Cannot find module 'canvas'"**
- Run `npm install` first

**Text position is wrong**
- Remember: x=0 is left edge, y=0 is top edge
- Use `--align center` and `--x` for horizontal centering

**Text is cut off**
- Increase image size or reduce font size
- Use `--max-width` for auto-wrapping

**Colors not working**
- Use hex format with quotes: `"#00ff41"`
- Include the `#` symbol

