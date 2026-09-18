# LifeLog Frontend

**LifeLog — A Unified Personal Activity Intelligence Database**

This version is a frontend-only demo. It now includes:

- Daily + Weekly Progress page
- Add / edit / delete activities
- Add / edit / delete expenses
- Add / delete study sessions
- Add / delete meals
- Add / delete transport trips
- Add / delete screen-time entries
- Add / delete mood & sleep entries
- Create / update / delete goals
- Clickable daily timeline dates
- Dashboard navigation buttons
- Local browser persistence using `localStorage`

## Run

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal.

## Important

No backend is connected yet. Data entered through the forms is stored only in the browser using `localStorage`. When the Express + MySQL backend is built, the local store can be replaced with API calls without changing the overall UI structure.

## Project architecture

React + Vite + Tailwind CSS + Recharts

Planned final architecture:

`React → Express REST API → MySQL`
