# Rakshith360 Medical AI Assistant

A comprehensive medical AI assistant built with React and Express that provides intelligent symptom assessment, medical guidance, and nearby hospital recommendations through an interactive chat interface.

## Features

### 🚀 **Core Functionality**
- **Interactive Medical Consultation**: AI-powered medical conversations with dynamic follow-up questions
- **Flash Mode**: Quick emergency medical guidance for urgent situations
- **Hospital Finder**: Location-based hospital recommendations with addresses and distances
- **Medical Summaries**: Comprehensive case analysis with urgency levels and specialty recommendations
- **Multi-Key API System**: Automatic fallback between 4 API keys for uninterrupted service

### 🏥 **Medical Features**
- **Symptom Assessment**: Guided questionnaire system with dynamic follow-up questions
- **Specialty Recommendations**: AI-powered medical specialty suggestions
- **First Aid Guidance**: Critical first aid steps for emergency situations
- **Investigation Recommendations**: Suggested medical tests and examinations
- **Hospital Filtering**: Shows only actual hospitals (excludes pharmacies, nursing homes, clinics)

### 💻 **Technical Features**
- **Dark Theme**: Consistent dark mode throughout the application
- **Responsive Design**: Mobile-first approach with sidebar navigation
- **Real-time Chat**: Interactive messaging with typing indicators
- **Location Services**: Browser geolocation API for accurate hospital recommendations
- **Data Persistence**: localStorage-based chat history and session management

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **TanStack Query** for server state management
- **React Router** for client-side navigation

### Backend
- **Node.js** with Express.js
- **PostgreSQL** with Drizzle ORM
- **Neon** serverless PostgreSQL
- **Session Management** with PostgreSQL backing

### External APIs
- **Google Gemini AI** for medical consultations
- **Geoapify API** for hospital search and geocoding
- **OpenStreetMap** APIs for fallback hospital data

## Setup Instructions

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (Neon recommended)
- Google Gemini API keys
- Geoapify API key (optional, for enhanced hospital search)

### Environment Variables
Create a `.env` file in the root directory:

```env
DATABASE_URL=your_postgresql_connection_string
VITE_GEOAPIFY_API_KEY=your_geoapify_api_key
NODE_ENV=development
```

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/ajsavage123/RAKSHITH360ultimate.git
cd RAKSHITH360ultimate
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up the database**
```bash
npm run db:push
```

4. **Start the development server**
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

### API Key Configuration

The application uses a 4-key rotation system for Google Gemini API:

1. On first launch, you'll be prompted to enter your API keys
2. Keys are stored securely in localStorage
3. The system automatically cycles between keys when quotas are exceeded
4. Default keys are pre-configured for immediate testing

To get Google Gemini API keys:
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add multiple keys for better quota management

## Usage

### Normal Mode
1. **Login/Register**: Create an account or sign in
2. **Start Conversation**: Describe your medical concerns
3. **Follow Questions**: Answer AI-generated follow-up questions
4. **Get Analysis**: Receive comprehensive medical summary
5. **Find Hospitals**: View nearby hospitals based on recommended specialty

### Flash Mode
1. **Quick Access**: Click the Flash Mode button
2. **Emergency Input**: Describe your emergency situation briefly
3. **Instant Analysis**: Get immediate medical guidance including:
   - Case summary
   - Urgency level
   - Recommended specialty
   - First aid steps
   - Investigation recommendations
4. **Hospital Recommendations**: Find nearby hospitals for the recommended specialty

## Features in Detail

### Multi-Key API System
- **Automatic Rotation**: Cycles through 4 API keys (Key 1→2→3→4→1)
- **Quota Management**: Automatically switches when HTTP 429 errors occur
- **Shared State**: Both normal and Flash Mode share the same key rotation
- **Console Logging**: Shows which key is currently being used

### Hospital Recommendations
- **Location-Based**: Uses browser geolocation for accurate positioning
- **10km Radius**: Shows only nearby hospitals within 10km
- **Quality Filtering**: Excludes pharmacies, nursing homes, clinics
- **Complete Addresses**: Shows full addresses with street, city, state
- **Distance Sorting**: Hospitals sorted by proximity (closest first)
- **Multiple Sources**: Combines Geoapify, OpenStreetMap, and Nominatim data

### Medical Analysis
- **Structured Output**: Consistent formatting for medical summaries
- **Urgency Levels**: High/Medium/Low with reasoning
- **Specialty Matching**: Hospitals filtered by recommended medical specialty
- **Investigation Guide**: Suggests relevant medical tests
- **First Aid**: Critical immediate care instructions

## Architecture

### Data Flow
1. **User Input** → Chat interface captures medical complaints
2. **AI Processing** → Google Gemini API analyzes symptoms
3. **Specialty Extraction** → Parses recommended medical specialty
4. **Location Detection** → Browser geolocation API
5. **Hospital Search** → Multiple APIs find nearby hospitals
6. **Data Filtering** → Removes non-hospitals, sorts by distance
7. **Display** → Formatted results with complete information

### Storage Strategy
- **Primary**: PostgreSQL for user accounts and session data
- **Fallback**: localStorage for offline functionality and API keys
- **Session**: In-memory with PostgreSQL backup

## API Documentation

### Chat Endpoints
- `POST /api/chat` - Send message and get AI response
- `GET /api/sessions` - Get user chat sessions
- `DELETE /api/sessions/:id` - Delete chat session

### User Endpoints
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

## Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Environment-Specific Configuration
- **Development**: Hot module replacement with Vite
- **Production**: Optimized build with static asset serving
- **Database**: Automatic migrations with Drizzle

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue on GitHub or contact the development team.

## Changelog

- **June 29, 2025**: Initial release
- **June 29, 2025**: Added 4-key API rotation system
- **June 29, 2025**: Enhanced hospital filtering and address display
- **June 29, 2025**: Improved Flash Mode with dynamic specialty extraction
- **June 29, 2025**: Added comprehensive error handling and fallback systems

---

**⚠️ Medical Disclaimer**: This application is for informational purposes only and should not replace professional medical advice, diagnosis, or treatment. Always consult with qualified healthcare providers for medical decisions.