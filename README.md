# GitHub Contribution Style Poster Maker

A web app that generates GitHub contribution-style posters from custom text, patterns, or data. Users can design pixel-style posters inspired by GitHub's contribution graph and export them as images.

## Features

- Custom text -> contribution pattern
- GitHub username input + real contribution fetch (GraphQL API)
- Theme selector (dark/light, persisted in localStorage)
- Grid size control
- Real-time preview
- 5-level gradient color picker with intensity mapping preview
- PNG export/download
- SVG export/download (scalable vector)
- Save and import design configuration JSON
- Copy JSON to clipboard
- Shareable URL configuration with Copy Share Link
- Responsive UI
- Animation mode toggle with sequential cell reveal

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- GitHub GraphQL API
- HTML Canvas API for PNG export

## Setup

1. Create a GitHub token with access to the GraphQL API.
2. Add it to an environment file:

```bash
cp .env.example .env.local
# then set GITHUB_TOKEN in .env.local
```

3. Install and run:

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` after starting the dev server.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checks

## Project Structure

- `app/` - Next.js App Router pages, layout, and API routes
- `components/` - Reusable UI components
- `lib/` - Text-to-grid, GitHub-data-to-grid, and PNG export utilities
- `styles/` - Global styling
- `public/` - Static assets

## Roadmap

- Add editable pattern painter mode
- Add animation mode for pulsing or drawing effects
- Import contribution data from JSON/CSV
- Add shareable presets and URLs

## License

MIT


## JSON Design Workflow

- **Save JSON** downloads the current design schema to a local `.json` file.
- **Copy JSON** copies the serialized design schema to clipboard.
- **Import JSON** supports file upload and pasted JSON (use **Load Pasted JSON**).
- The latest valid design is auto-saved in `localStorage` under `gcpm_last_design` and restored on next load.
