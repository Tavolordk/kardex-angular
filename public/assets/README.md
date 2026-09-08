# Figma assets

The application references only local files under `/assets` at runtime.
Run `npm run assets:figma` once to download the original exported Figma PNG/SVG files into this directory.
`npm start` runs this sync automatically before Angular starts and skips files that already exist.
