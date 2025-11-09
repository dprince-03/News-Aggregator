# News Aggregator Frontend

A modern, responsive React frontend for the News Aggregator API.

## Features

- **User Authentication**: Register, login, and OAuth support
- **News Feed**: Browse latest news from multiple sources
- **Personalized Feed**: Get news based on your preferences
- **Search & Filter**: Find articles by keywords, sources, and categories
- **Save Articles**: Bookmark articles for later reading
- **User Preferences**: Customize sources, categories, and authors
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile

## Tech Stack

- **React 18**: Modern React with hooks
- **React Router 6**: Client-side routing
- **Vite**: Fast build tool and dev server
- **Axios**: HTTP client for API requests
- **CSS3**: Custom styling with CSS variables

## Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn
- Backend API running on `http://localhost:5080`

### Installation

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Update `.env` with your configuration:

```env
VITE_API_URL=http://localhost:5080/api
VITE_APP_NAME=News Aggregator
```

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Production Build

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## Project Structure

```
client/
├── src/
│   ├── components/         # Reusable components
│   │   ├── articles/       # Article-related components
│   │   ├── layout/         # Layout components (Header, Footer)
│   │   ├── PrivateRoute.jsx
│   │   ├── PublicRoute.jsx
│   │   └── SearchBar.jsx
│   ├── context/            # React Context (Auth)
│   ├── pages/              # Page components
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Profile.jsx
│   │   ├── Preferences.jsx
│   │   ├── Personalized.jsx
│   │   ├── Saved.jsx
│   │   ├── ArticleDetail.jsx
│   │   └── NotFound.jsx
│   ├── services/           # API service modules
│   │   ├── authService.js
│   │   ├── articleService.js
│   │   └── preferenceService.js
│   ├── utils/              # Utility functions
│   │   ├── api.js          # Axios configuration
│   │   └── helpers.js      # Helper functions
│   ├── App.jsx             # Main App component
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles
├── public/                 # Static files
├── index.html              # HTML template
├── vite.config.js          # Vite configuration
└── package.json
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features Breakdown

### Authentication
- Register with email/password
- Login with credentials
- OAuth support (Google, Facebook, Twitter)
- Profile management
- Password change

### Articles
- Browse all articles
- Search by keyword
- Filter by source, category, date
- View article details
- Save/bookmark articles
- Personalized feed

### Preferences
- Select preferred news sources
- Choose favorite categories
- Add favorite authors
- Customize news feed

## API Integration

The frontend communicates with the backend API using Axios. All API calls go through the centralized `api.js` utility which handles:

- Base URL configuration
- Request/response interceptors
- Authentication headers
- Error handling
- Token management

## Styling

The app uses a custom CSS design system with:

- CSS custom properties (variables)
- Responsive grid system
- Reusable utility classes
- Mobile-first approach
- Consistent spacing and colors

## Performance Optimizations

- Code splitting with React Router
- Lazy loading of images
- Debounced search input
- Optimized bundle size
- Production-ready build configuration

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

ISC
