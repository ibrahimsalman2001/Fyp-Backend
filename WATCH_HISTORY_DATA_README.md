# YouTube Watch History Data Processing

This document describes the process of extracting and processing YouTube watch history data from the HTML file and generating realistic dummy data for the FYP application.

## 📁 Files Generated

### Core Data Files
- `extracted-videos.json` - Raw video data extracted from HTML
- `database-data.json` - Complete database-ready data structure
- `users.json` - User data for database import
- `videos-db.json` - Video data for database import  
- `watch-history-db.json` - Watch history data for database import

### Import Scripts
- `mongo-import.sh` - Linux/Mac MongoDB import script
- `mongo-import.bat` - Windows MongoDB import script

### Processing Scripts
- `parse-watch-history.js` - Extracts video data from HTML file
- `generate-database-data.js` - Generates database-ready data structure
- `insert-videos.js` - Direct database insertion script (requires MongoDB)

## 📊 Generated Data Statistics

- **Total Videos**: 50 videos extracted from watch history
- **Total Watch History Entries**: 97 entries (multiple sessions per video)
- **Total Views**: 124,526,194 views across all videos
- **Total Watch Time**: 12 hours of watch history
- **Categories**: 43 Entertainment, 7 Music videos
- **Age Ratings**: All videos rated "All Ages"

## 🎯 Sample Videos

1. **Coke Studio Season 10| Latthay Di Chaadar| Quratulain Balouch & Farhan Saeed**
   - Channel: Coke Studio Pakistan
   - Views: 26,163,536
   - Duration: 14 minutes 9 seconds

2. **Bayaan - Nahin Milta (Official Video)**
   - Channel: Bayaan  
   - Views: 50,315
   - Duration: 24 minutes 54 seconds

3. **React Course - Beginner's Tutorial for React JavaScript Library [2022]**
   - Channel: freeCodeCamp.org
   - Views: 1,234,567 (estimated)
   - Duration: 8 hours 30 minutes

## 🛠️ How to Use the Generated Data

### Option 1: Import to MongoDB
```bash
# Using the provided script
./mongo-import.sh

# Or manually
mongoimport --db fyp-database --collection users --file users.json --jsonArray
mongoimport --db fyp-database --collection videos --file videos-db.json --jsonArray
mongoimport --db fyp-database --collection watchhistories --file watch-history-db.json --jsonArray
```

### Option 2: Use Mock Data API
The backend now includes mock data endpoints that serve the generated data without requiring a database:

```bash
# Start the backend server
npm start

# Access the mock data endpoints:
GET /api/mock-data - Complete data structure
GET /api/mock-data/videos - All videos (with pagination)
GET /api/mock-data/watch-history - Watch history (with pagination)
GET /api/mock-data/analytics - Analytics data
GET /api/mock-data/stats - Basic statistics
GET /api/mock-data/videos/:videoId - Specific video
```

### Option 3: Direct JSON Import
Use the generated JSON files directly in your frontend application or import them into any database system.

## 🏗️ Data Structure

### Video Schema
```json
{
  "videoId": "SCOKysMnH50",
  "title": "Coke Studio Season 10| Latthay Di Chaadar| Quratulain Balouch & Farhan Saeed",
  "description": "Generated description...",
  "channelTitle": "Coke Studio Pakistan",
  "channelId": "UCM1VesJtJ9vTXcMLLr_FfdQ",
  "duration": "PT14M9S",
  "durationSeconds": 849,
  "thumbnails": {
    "default": "https://img.youtube.com/vi/SCOKysMnH50/default.jpg",
    "medium": "https://img.youtube.com/vi/SCOKysMnH50/mqdefault.jpg",
    "high": "https://img.youtube.com/vi/SCOKysMnH50/hqdefault.jpg"
  },
  "publishedAt": "2024-10-14T22:51:56.062Z",
  "tags": ["studio", "season", "latthay", "chaadar", "farhan"],
  "categoryId": 15,
  "viewCount": 26163536,
  "classification": {
    "category": "Entertainment",
    "ageRating": "All Ages", 
    "confidence": 0.9272659045948106,
    "flags": [],
    "processedAt": "2025-10-16T22:51:56.071Z"
  }
}
```

### Watch History Schema
```json
{
  "userId": "test-user-id",
  "videoId": "video-object-id",
  "youtubeVideoId": "SCOKysMnH50",
  "watchDuration": 425,
  "videoDuration": 849,
  "completionPercentage": 50,
  "watchedAt": "2025-03-15T10:30:00.000Z",
  "sessionId": "session_1234567890_0_0",
  "source": "web_app"
}
```

## 🎨 Data Generation Logic

### Realistic Data Generation
- **Duration**: Random 1-30 minutes for most videos, longer for educational content
- **View Counts**: Based on channel popularity (T-Series: 1M-50M, Educational: 100K-2M, Others: 1K-1M)
- **Categories**: Determined by title keywords (Educational, Entertainment, Music, News, Vlogs)
- **Age Ratings**: Based on content analysis (All Ages, 7+, 13+, 18+)
- **Watch Duration**: Random percentage of total video length
- **Completion Rate**: Calculated based on watch duration vs total duration

### Classification System
- **Educational**: React, tutorial, course, programming keywords
- **Entertainment**: Cricket, sports, general content
- **Music**: Music, song keywords
- **News**: News, interview keywords  
- **Vlogs**: Vlog, family keywords

## 🚀 Next Steps

1. **Database Setup**: Set up MongoDB and run the import scripts
2. **Frontend Integration**: Connect frontend to mock data API endpoints
3. **Data Validation**: Verify data accuracy and add more sophisticated classification
4. **Real-time Updates**: Implement real YouTube API integration for live data
5. **Analytics Enhancement**: Add more detailed analytics and reporting features

## 📝 Notes

- All generated data is based on the actual video titles and channels from your watch history
- View counts and engagement metrics are realistic estimates based on channel types
- The data maintains referential integrity between videos and watch history
- Classification system can be enhanced with more sophisticated ML models
- All timestamps are recent (within last 30 days) for realistic testing scenarios
