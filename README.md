# Pomodoro Chrome Extension

A Chrome extension that implements the Pomodoro Technique to help you stay focused and productive. The extension features a 25-minute work timer followed by a 5-minute break timer that cycles continuously.

## Features

- 25-minute work timer
- 5-minute break timer
- Automatic cycling between work and break periods
- Simple START/STOP controls
- Clean and intuitive user interface

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/arunn/pomodoro-extension.git
   cd pomodoro-extension
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked"
   - Select the `build` directory from this project

## Development

To start the development server:
```bash
npm start
```

## Tech Stack

- React
- TypeScript
- Chrome Extensions API

## License

MIT
