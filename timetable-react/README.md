# AutoSchedule — React Frontend

A production-grade React frontend for the Automated Timetable backend.

## Tech Stack

- **React 18** with React Router v6
- **Axios** for API calls
- **React Hot Toast** for notifications
- **CSS Modules** for scoped styling
- **Google Fonts** — Syne (display) + JetBrains Mono + Nunito

## Project Structure

```
src/
├── api/
│   ├── client.js          # Axios instance
│   └── index.js           # All API functions
├── components/
│   ├── common/            # Reusable UI components
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── FormField.jsx
│   │   ├── Modal.jsx
│   │   ├── PageHeader.jsx
│   │   └── Table.jsx
│   ├── layout/            # App shell
│   │   ├── Layout.jsx
│   │   └── Sidebar.jsx
│   └── pages/             # Page components
│       ├── Dashboard.jsx
│       ├── Departments.jsx
│       ├── Courses.jsx
│       ├── Teachers.jsx
│       ├── Subjects.jsx
│       ├── Sections.jsx
│       ├── Buildings.jsx
│       ├── Rooms.jsx
│       ├── TimeSlots.jsx
│       ├── Assignments.jsx
│       ├── Generate.jsx
│       └── TimetableView.jsx
├── context/
│   └── AppContext.js      # Global state (departments, courses, etc.)
├── hooks/
│   └── useApi.js          # Generic data-fetching hook
└── utils/
    └── helpers.js         # formatTime, day constants
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure API URL

Edit `.env`:
```
REACT_APP_API_URL=http://localhost:5000/api/v1
```

### 3. Enable CORS on your backend

Add to your Express `app.js` **before** routes:
```js
import cors from 'cors';
app.use(cors({ origin: 'http://localhost:3000' }));
```

Install cors package:
```bash
npm install cors
```

### 4. Start both servers

Terminal 1 — Backend:
```bash
cd Server && node server.js
```

Terminal 2 — Frontend:
```bash
cd timetable-react && npm start
```

Frontend runs at: **http://localhost:3000**

## Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard with stats and quick links |
| `/departments` | CRUD for departments |
| `/courses` | CRUD for courses |
| `/teachers` | CRUD for teachers |
| `/subjects` | CRUD for subjects |
| `/sections` | CRUD for sections |
| `/buildings` | CRUD for buildings |
| `/rooms` | CRUD for rooms with type filter |
| `/timeslots` | CRUD for time slots |
| `/assignments` | Teacher-Subject mappings |
| `/generate` | Trigger timetable generation |
| `/timetable` | Visual timetable grid viewer |
