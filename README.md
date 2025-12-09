# Content Moderation Dashboard

A modern, responsive content moderation dashboard built with React, TypeScript, TailwindCSS, and Zustand for state management.

## Features

### Day 1 - Core UI Build & Static Structure ✅
- ✅ **Responsive Dashboard UI** - Works on desktop and mobile devices
- ✅ **Moderation Card Component** - Display content with moderation status, confidence scores, and metadata
- ✅ **Metadata Panel Component** - Show content metadata, NLP analysis, and tagging information
- ✅ **Feedback Bar** - Interactive thumbs up/down buttons with comment box for user feedback
- ✅ **RL Confidence Progress Bar** - Visual representation of machine learning confidence scores
- ✅ **Filter Bar** - Advanced filtering by content type, confidence score, flagged status, and date range
- ✅ **Loading Skeletons** - Beautiful loading states for better user experience
- ✅ **Error States** - Comprehensive error handling with retry functionality
- ✅ **Pagination** - Smart pagination with mobile-responsive design
- ✅ **Search Functionality** - Real-time search across content

### Day 2 - Full API Integration + Adaptive Updates (Planned)
- 🔄 Connect to real backend endpoints:
  - `/moderate` (backend moderation service)
  - `/feedback` (feedback system → Akash & Omkar)
  - `/bhiv/analytics` (analytics service → Ashmit)
  - `/nlp/context` (NLP processing → Aditya)
  - `/tag` (content tagging → Vijay)
- 🔄 Real-time data display:
  - Moderation decisions with confidence scores
  - NLP topic analysis and sentiment analysis
  - Content tagging with confidence levels
  - Analytics (CTR, score trends)
- 🔄 Adaptive UI refresh when RL model updates confidence
- 🔄 Status badges for feedback updates and reward status

## Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Styling**: TailwindCSS with custom design system
- **State Management**: Zustand for global state
- **HTTP Client**: Axios for API communication
- **Icons**: Lucide React for consistent iconography
- **Build Tool**: Vite for fast development and building
- **Date Handling**: date-fns for date formatting and manipulation

## Project Structure

```
src/
├── components/           # React components
│   ├── Dashboard.tsx     # Main dashboard layout
│   ├── ModerationCard.tsx # Content moderation card
│   ├── FeedbackBar.tsx   # User feedback interface
│   ├── ConfidenceProgressBar.tsx # Confidence visualization
│   ├── FilterBar.tsx     # Advanced filtering
│   ├── LoadingSkeleton.tsx # Loading states
│   ├── ErrorState.tsx    # Error handling
│   └── Pagination.tsx    # Pagination controls
├── store/               # Zustand state management
│   └── moderationStore.ts # Main application store
├── services/            # API services
│   └── apiService.ts    # Axios configuration and API calls
├── types/               # TypeScript type definitions
│   └── index.ts         # All interface definitions
├── utils/               # Utility functions (planned)
├── App.tsx              # Root application component
├── main.tsx             # Application entry point
└── index.css            # Global styles and Tailwind imports
```

## Key Features

### 1. **Responsive Design**
- Mobile-first approach with TailwindCSS
- Adaptive layouts for different screen sizes
- Touch-friendly interface elements

### 2. **State Management**
- Centralized state with Zustand
- Optimistic updates for better UX
- Error handling and loading states

### 3. **Type Safety**
- Comprehensive TypeScript interfaces
- Type-safe API interactions
- Compile-time error checking

### 4. **User Experience**
- Loading skeletons for smooth transitions
- Error states with retry functionality
- Real-time feedback and interactions

### 5. **API Integration Ready**
- Axios-based HTTP client
- Request/response interceptors
- Authentication token handling
- Mock data for development

## Development Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   ```bash
   # Copy .env.example to .env
   VITE_API_BASE_URL=http://localhost:8000/api
   VITE_APP_TITLE=Content Moderation Dashboard
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

## API Integration

The dashboard is designed to integrate with a multi-service backend architecture:

- **Moderation Service**: Content analysis and decision making
- **Feedback Service**: User feedback collection and processing
- **Analytics Service**: Performance metrics and insights
- **NLP Service**: Natural language processing and sentiment analysis
- **Tagging Service**: Content categorization and labeling

## Mock Data

For development purposes, the application includes mock data that simulates:
- Content items with different moderation statuses
- Confidence scores and metadata
- User feedback and comments
- Analytics data and trends

## Next Steps

1. **Backend Integration**: Connect to real API endpoints
2. **Real-time Updates**: Implement WebSocket connections for live updates
3. **Advanced Analytics**: Add charts and visualization for trends
4. **User Authentication**: Add login/logout functionality
5. **Role-based Access**: Implement different user permissions
6. **Bulk Operations**: Add bulk approve/reject functionality

## Contributing

This project follows modern React development practices:
- Functional components with hooks
- TypeScript for type safety
- TailwindCSS for styling
- Zustand for state management
- ESLint for code quality

## License

This project is part of an accelerated frontend integration task and follows the team's coding standards and best practices.