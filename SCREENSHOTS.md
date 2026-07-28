# Screenshots for Tally

This guide shows where to add screenshots to showcase Tally.

## Where to add

Create a `screenshots/` folder in the repo root and add images there:
```
screenshots/
├── dashboard.png
├── receipt-scanning.png
├── mobile-view.png
├── categories.png
├── search-filter.png
└── settings.png
```

## What to screenshot

### 1. Dashboard (dashboard.png)
- Main expense list view
- Show several transactions with different categories
- Include the summary cards (total, balance)
- Demonstrates the core UI and expense tracking

### 2. Receipt Scanning (receipt-scanning.png)
- Modal or form showing AI-extracted receipt data
- Show how Gemini filled in merchant, amount, date, category
- Demonstrates the key AI feature

### 3. Mobile View (mobile-view.png)
- Dashboard on phone/mobile device
- Shows the app is responsive
- Screenshot from browser dev tools (375px width) or actual phone

### 4. Categories Page (categories.png)
- Categories list with custom colors
- 6-month trend chart
- Shows customization features

### 5. Search & Filter (search-filter.png)
- Search results or filter dropdown open
- Shows the search/filter UI
- Demonstrates discoverability features

### 6. Settings (settings.png)
- Settings menu open
- Currency selector
- Category customization
- Shows customization options

## How to add to README

Add this to the README after the "Features" section:

```markdown
## Screenshots

### Dashboard
![Tally Dashboard](screenshots/dashboard.png)

### Receipt Scanning
![Receipt Scanning with AI](screenshots/receipt-scanning.png)

### Mobile View
![Mobile Responsive Design](screenshots/mobile-view.png)

### Categories & Trends
![Categories with Spending Trends](screenshots/categories.png)
```

## Tips

- Use your deployed app: https://tally-kittinat.vercel.app
- Add some sample data for visual interest
- Keep screenshots clear and well-lit
- Resize to consistent width (1280px or 768px)
- Compress PNG files to reduce size
- Use a tool like Sharp or ImageMagick to batch resize:
  ```bash
  for file in *.png; do convert "$file" -resize 1280x "$file"; done
  ```

## Next steps

1. Take screenshots of the key features listed above
2. Save them to `screenshots/` folder
3. Update README with the screenshot markdown
4. Commit and push
5. GitHub release page will automatically show the best screenshot
