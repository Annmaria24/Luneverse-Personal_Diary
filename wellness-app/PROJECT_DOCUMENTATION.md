# Luneverse - Women's Wellness App Documentation

## Project Overview

Luneverse is a comprehensive women's wellness application designed to provide a safe, private space for women to track their health, emotions, and personal journey. The app focuses on three core areas: digital journaling, mood tracking, and menstrual cycle monitoring.

## Technology Stack

- **Frontend**: React 18 with Vite
- **Styling**: CSS3 with CSS Custom Properties
- **Authentication**: Firebase Authentication
- **Database**: Firebase Firestore
- **Routing**: React Router v6
- **State Management**: React Context API
- **Icons**: Emoji-based icons for accessibility

## Project Structure

```
wellness-app/
├── src/
│   ├── components/
│   │   └── ProtectedRoute.jsx          # Route protection component
│   ├── context/
│   │   └── AuthContext.jsx             # Authentication context
│   ├── firebase/
│   │   └── config.js                   # Firebase configuration
│   ├── pages/
│   │   ├── LandingPage.jsx             # Home/landing page
│   │   ├── LoginPage.jsx               # User login
│   │   ├── SignupPage.jsx              # User registration
│   │   ├── Dashboard.jsx               # Main dashboard
│   │   ├── DiaryPage.jsx               # Digital journal
│   │   ├── MoodTrackerPage.jsx         # Mood tracking
│   │   ├── CycleTrackerPage.jsx        # Menstrual cycle tracking
│   │   ├── SettingsPage.jsx            # User settings
│   │   ├── EmailVerificationPage.jsx   # Email verification
│   │   ├── VerificationSuccessPage.jsx # Verification success
│   │   ├── ForgotPasswordPage.jsx      # Password reset
│   │   └── SetPasswordPage.jsx         # Password setting
│   ├── services/
│   │   └── userService.js              # User data services
│   └── styles/                         # CSS files for each page
```

## Core Features

### 1. Authentication System
- **Email/Password Registration**: Secure user registration with email verification
- **Login System**: Secure authentication with Firebase
- **Password Reset**: Forgot password functionality
- **Email Verification**: Two-step verification process for security
- **Protected Routes**: Authenticated access to app features

### 2. Digital Diary/Journal
- **Daily Entries**: Write and save journal entries with timestamps
- **Mood Integration**: Associate moods with journal entries
- **Date Navigation**: Browse entries by date
- **Search Functionality**: Search through journal entries
- **Character Counter**: Track entry length
- **Privacy**: All entries are private and encrypted

### 3. Mood Tracker
- **Mood Selection**: Choose from 10 different mood options with emojis
- **Mood History**: View past mood entries with timestamps
- **Analytics**: Track mood patterns and averages
- **Insights**: Get insights about mood trends
- **Notes**: Add optional notes to mood entries
- **Streak Tracking**: Monitor consecutive days of mood logging

### 4. Cycle Tracker
- **Calendar View**: Visual calendar showing cycle data
- **Flow Tracking**: Log menstrual flow levels (light, medium, heavy, spotting)
- **Symptom Logging**: Track 10+ common symptoms
- **Predictions**: Predict next period and ovulation
- **Cycle Insights**: Analytics on cycle regularity and patterns
- **Notes**: Add personal notes for each day

### 5. Settings & Profile
- **Profile Management**: Update personal information
- **Privacy Controls**: Manage data sharing preferences
- **Notification Settings**: Customize reminder preferences
- **Security**: Change password and account security
- **Data Management**: Export, import, or clear data
- **Account Deletion**: Secure account removal option

## Page Details

### Landing Page (`/`)
- **Purpose**: Welcome page and app introduction
- **Features**: Hero section, feature overview, call-to-action buttons
- **Navigation**: Links to login and signup

### Authentication Pages
- **Login** (`/login`): User authentication with email/password
- **Signup** (`/signup`): User registration with email verification
- **Email Verification** (`/verify-email`): Verification instructions
- **Verification Success** (`/verify-success`): Confirmation and redirect
- **Forgot Password** (`/forgot-password`): Password reset request
- **Set Password** (`/set-password`): New password creation

### Dashboard (`/dashboard`)
- **Purpose**: Main hub after login
- **Features**: 
  - Welcome message with personalized greeting
  - Quick stats overview (journal entries, mood logs, cycle info)
  - Feature cards with navigation to main functions
  - Recent activity summary
  - Settings access

### Diary Page (`/diary`)
- **Purpose**: Digital journaling interface
- **Features**:
  - Date navigation (previous/next day)
  - Mood selector with emoji options
  - Rich text entry area with character counter
  - Save/clear functionality
  - Previous entries display
  - Search functionality
  - Entry editing and deletion

### Mood Tracker (`/mood-tracker`)
- **Purpose**: Emotional wellness tracking
- **Features**:
  - Today/Week/Month view toggle
  - Statistics cards (average mood, streak, total entries)
  - 10 mood options with colors and emojis
  - Optional note addition
  - Mood history with timestamps
  - Insights and patterns analysis

### Cycle Tracker (`/cycle-tracker`)
- **Purpose**: Menstrual cycle monitoring
- **Features**:
  - Calendar/Insights view toggle
  - Cycle overview (current day, next period, averages)
  - Interactive calendar with month navigation
  - Flow level tracking (4 levels)
  - Symptom logging (10+ symptoms)
  - Personal notes for each day
  - Cycle predictions and insights
  - Visual indicators and legend

### Settings Page (`/settings`)
- **Purpose**: User preferences and account management
- **Tabs**:
  - **Profile**: Personal information, display name, email
  - **Privacy**: Data sharing, analytics, public profile settings
  - **Notifications**: Reminders for periods, moods, journal, reports
  - **Security**: Password change, account deletion
  - **Data**: Export, import, clear data options

## Design System

### Color Palette
- **Primary Purple**: #7133d6 (main brand color)
- **Secondary Pink**: #c82373 (accent color)
- **Neutral Colors**: Grayscale from #f9f9f9 to #333333
- **Status Colors**: Success (#10b981), Error (#ef4444), Warning (#f59e0b)

### Typography
- **Font Family**: Inter (Google Fonts)
- **Font Weights**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)
- **Responsive**: Scales appropriately on different screen sizes

### Spacing System
- **XS**: 0.5rem (8px)
- **SM**: 1rem (16px)
- **MD**: 1.5rem (24px)
- **LG**: 2rem (32px)
- **XL**: 3rem (48px)

### Border Radius
- **SM**: 8px
- **MD**: 12px
- **LG**: 16px
- **XL**: 20px

## Navigation Flow

```
Landing Page (/)
├── Login (/login) → Dashboard (/dashboard)
├── Signup (/signup) → Email Verification → Dashboard
└── Forgot Password → Set Password → Login

Dashboard (/dashboard)
├── Diary (/diary)
├── Mood Tracker (/mood-tracker)
├── Cycle Tracker (/cycle-tracker)
└── Settings (/settings)
```

## Security Features

1. **Email Verification**: Required before account activation
2. **Password Requirements**: Minimum 6 characters, 1 number, 1 special character
3. **Protected Routes**: Authentication required for app features
4. **Data Encryption**: All user data encrypted in Firebase
5. **Privacy Controls**: User-controlled data sharing settings
6. **Secure Logout**: Proper session termination

## Responsive Design

- **Mobile First**: Optimized for mobile devices
- **Breakpoints**: 
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px
- **Touch Friendly**: Large touch targets and intuitive gestures
- **Accessibility**: High contrast, readable fonts, semantic HTML

## Data Models

### User Profile
```javascript
{
  uid: string,
  email: string,
  displayName: string,
  dateOfBirth: date,
  location: string,
  createdAt: timestamp,
  lastLogin: timestamp
}
```

### Journal Entry
```javascript
{
  id: string,
  userId: string,
  date: date,
  content: string,
  mood: string,
  timestamp: timestamp
}
```

### Mood Entry
```javascript
{
  id: string,
  userId: string,
  date: date,
  mood: string,
  moodName: string,
  value: number,
  note: string,
  timestamp: timestamp
}
```

### Cycle Entry
```javascript
{
  id: string,
  userId: string,
  date: date,
  flow: string,
  symptoms: array,
  notes: string,
  type: string, // 'period', 'ovulation', 'symptoms'
  timestamp: timestamp
}
```

## Future Enhancements

1. **Data Visualization**: Charts and graphs for trends
2. **Export Features**: PDF reports, data backup
3. **Community Features**: Anonymous support groups
4. **AI Insights**: Pattern recognition and predictions
5. **Wearable Integration**: Sync with fitness trackers
6. **Multilingual Support**: Multiple language options
7. **Dark Mode**: Alternative color scheme
8. **Offline Support**: PWA capabilities

## Development Setup

1. **Prerequisites**: Node.js 16+, npm/yarn
2. **Installation**: `npm install`
3. **Development**: `npm run dev`
4. **Build**: `npm run build`
5. **Firebase Setup**: Configure Firebase project and keys

## Deployment

- **Platform**: Vercel/Netlify recommended
- **Environment Variables**: Firebase configuration
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

---

*This documentation serves as a comprehensive guide for understanding, maintaining, and extending the Luneverse wellness application.*
