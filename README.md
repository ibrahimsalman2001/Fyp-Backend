# TaskMind Backend

AI-powered YouTube productivity assistant backend built for one-night implementation.

## 🚀 Quick Start

### Prerequisites

- Node.js (v16+)
- MongoDB (local or cloud)
- YouTube Data API v3 key
- Google OAuth credentials

### Installation

1. **Clone and install dependencies:**

```bash
git clone <your-repo>
cd taskmind-backend
npm install
```

2. **Environment setup:**

```bash
cp .env.example .env
# Edit .env with your credentials
```

3. **Start the server:**

```bash
# Development
npm run dev

# Production
npm start
```

Server will run on http://localhost:3001

## 📋 Required Environment Variables

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/taskmind

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# YouTube API
YOUTUBE_API_KEY=your_youtube_api_key

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

## 🛠 API Endpoints

### Authentication

- `POST /api/auth/google` - Google OAuth login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Videos

- `POST /api/videos/classify` - Classify YouTube video
- `GET /api/videos/:videoId` - Get video details
- `POST /api/videos/watch-history` - Log video watch
- `GET /api/videos/watch-history` - Get watch history

### Analytics

- `GET /api/analytics/dashboard` - Dashboard data
- `GET /api/analytics/daily` - Daily analytics
- `GET /api/analytics/weekly` - Weekly analytics
- `GET /api/analytics/productivity` - Productivity trends
- `GET /api/analytics/goals` - Goal progress

### Notifications

- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

## 🏗 Architecture

### Database Collections

- **Users** - User profiles and settings
- **Videos** - YouTube video metadata + AI classification
- **WatchHistory** - User viewing logs
- **Notifications** - System notifications

### Services

- **YouTubeService** - YouTube API integration
- **ClassificationService** - AI video classification
- **AnalyticsService** - Data analysis and insights
- **NotificationService** - Notification management

## 🤖 AI Classification

Videos are classified into:

- **Categories**: Educational, Entertainment, Gaming, Music, News, Vlogs
- **Age Ratings**: All Ages, 7+, 13+, 18+
- **Content Flags**: Violence, Language, Adult Content, Inappropriate

Uses keyword-based classification with optional external ML service integration.

## 📊 Features Implemented

✅ Google OAuth authentication  
✅ YouTube API integration  
✅ Real-time video classification  
✅ Analytics and dashboard data  
✅ Goal tracking and progress  
✅ Notification system  
✅ Family monitoring support  
✅ Content flagging

## 🔧 Testing

### Health Check

```bash
curl http://localhost:3001/health
```

### Test Authentication

```bash
# Get Google OAuth token from frontend
curl -X POST http://localhost:3001/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"googleToken": "your_google_token"}'
```

### Test Video Classification

```bash
curl -X POST http://localhost:3001/api/videos/classify \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{"videoUrl": "https://youtube.com/watch?v=dQw4w9WgXcQ"}'
```

## 🚀 Deployment

### Docker (Optional)

```bash
# Build image
docker build -t taskmind-backend .

# Run container
docker run -p 3001:3001 --env-file .env taskmind-backend
```

### Environment Setup

- MongoDB Atlas for cloud database
- Heroku/Railway/Vercel for deployment
- Set all environment variables in deployment platform

## 📝 TODO for Production

- [ ] Add Redis caching
- [ ] Implement rate limiting
- [ ] Add comprehensive logging
- [ ] Set up monitoring
- [ ] Add API documentation (Swagger)
- [ ] Implement real ML service
- [ ] Add comprehensive tests
- [ ] Set up CI/CD pipeline

## 🤝 Development

### Project Structure

```
src/
├── config/         # Database and external service configs
├── controllers/    # Route handlers (not used in this simple version)
├── middleware/     # Auth, validation, error handling
├── models/         # MongoDB schemas
├── routes/         # API route definitions
├── services/       # Business logic and external integrations
└── app.js          # Main application file
```

### Adding New Features

1. Create model in `models/`
2. Add service logic in `services/`
3. Create routes in `routes/`
4. Add routes to `app.js`

## 📞 Support

For issues and questions:

- Check console logs for detailed errors
- Verify environment variables are set
- Ensure MongoDB is running
- Check YouTube API quota limits

---

**Built in one night for TaskMind AI-powered YouTube productivity assistant** 🌙✨
