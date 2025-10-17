class ClassificationService {
  constructor() {
    // Educational keywords
    this.educationalKeywords = [
      'tutorial', 'learn', 'course', 'education', 'study', 'academic', 'science',
      'math', 'programming', 'coding', 'development', 'technology', 'engineering',
      'physics', 'chemistry', 'biology', 'history', 'language', 'skill', 'training',
      'how to', 'explained', 'documentary', 'lecture', 'research', 'analysis'
    ];

    // Entertainment keywords
    this.entertainmentKeywords = [
      'funny', 'comedy', 'entertainment', 'fun', 'joke', 'prank', 'meme',
      'reaction', 'challenge', 'vlog', 'lifestyle', 'travel', 'food',
      'cooking', 'review', 'unboxing', 'gaming', 'music', 'dance'
    ];

    // Gaming keywords
    this.gamingKeywords = [
      'gameplay', 'gaming', 'game', 'playthrough', 'walkthrough', 'review',
      'strategy', 'multiplayer', 'online', 'console', 'pc', 'mobile',
      'esports', 'tournament', 'stream', 'twitch', 'youtube gaming'
    ];

    // Music keywords
    this.musicKeywords = [
      'music', 'song', 'album', 'artist', 'band', 'concert', 'live',
      'performance', 'lyrics', 'instrumental', 'cover', 'remix',
      'music video', 'mv', 'audio', 'soundtrack'
    ];

    // News keywords
    this.newsKeywords = [
      'news', 'breaking', 'update', 'report', 'analysis', 'politics',
      'world', 'local', 'national', 'international', 'current events',
      'headlines', 'journalism', 'media', 'broadcast'
    ];

    // Vlog keywords
    this.vlogKeywords = [
      'vlog', 'daily', 'day in my life', 'lifestyle', 'personal',
      'my life', 'routine', 'morning', 'evening', 'weekend',
      'vacation', 'trip', 'adventure', 'experience'
    ];

    // Age rating keywords
    this.ageRatingKeywords = {
      '18+': ['adult', 'mature', 'explicit', 'nsfw', 'violence', 'blood', 'gore', 'sexual'],
      '13+': ['teen', 'adolescent', 'mild violence', 'language', 'suggestive'],
      '7+': ['kid', 'child', 'family', 'cartoon', 'animation', 'educational'],
      'All Ages': ['family friendly', 'safe', 'appropriate', 'educational']
    };

    // Content flags
    this.contentFlags = {
      'violence': ['fight', 'violence', 'blood', 'gore', 'weapon', 'war', 'battle'],
      'language': ['swear', 'curse', 'profanity', 'bad language', 'explicit language'],
      'adult_content': ['adult', 'mature', 'sexual', 'nsfw', 'explicit', 'adult themes'],
      'inappropriate': ['inappropriate', 'offensive', 'disturbing', 'controversial']
    };
  }

  // Classify video based on title, description, and tags
  async classifyVideo(videoDetails) {
    const { title, description, tags } = videoDetails;
    const text = `${title} ${description} ${(tags || []).join(' ')}`.toLowerCase();

    // Determine category
    const category = this.determineCategory(text);
    
    // Determine age rating
    const ageRating = this.determineAgeRating(text);
    
    // Determine content flags
    const flags = this.determineContentFlags(text);
    
    // Calculate confidence based on keyword matches
    const confidence = this.calculateConfidence(text, category);

    return {
      category,
      ageRating,
      confidence,
      flags,
      processedAt: new Date()
    };
  }

  determineCategory(text) {
    const categoryScores = {
      'Educational': this.getKeywordMatches(text, this.educationalKeywords),
      'Entertainment': this.getKeywordMatches(text, this.entertainmentKeywords),
      'Gaming': this.getKeywordMatches(text, this.gamingKeywords),
      'Music': this.getKeywordMatches(text, this.musicKeywords),
      'News': this.getKeywordMatches(text, this.newsKeywords),
      'Vlogs': this.getKeywordMatches(text, this.vlogKeywords)
    };

    // Find category with highest score
    const maxScore = Math.max(...Object.values(categoryScores));
    const category = Object.keys(categoryScores).find(key => categoryScores[key] === maxScore);

    return maxScore > 0 ? category : 'Entertainment'; // Default to Entertainment
  }

  determineAgeRating(text) {
    // Check for adult content first
    for (const [rating, keywords] of Object.entries(this.ageRatingKeywords)) {
      if (this.getKeywordMatches(text, keywords) > 0) {
        return rating;
      }
    }

    return 'All Ages'; // Default
  }

  determineContentFlags(text) {
    const flags = [];
    
    for (const [flag, keywords] of Object.entries(this.contentFlags)) {
      if (this.getKeywordMatches(text, keywords) > 0) {
        flags.push(flag);
      }
    }

    return flags;
  }

  getKeywordMatches(text, keywords) {
    let matches = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        matches++;
      }
    }
    return matches;
  }

  calculateConfidence(text, category) {
    const categoryKeywords = this.getCategoryKeywords(category);
    const matches = this.getKeywordMatches(text, categoryKeywords);
    const totalKeywords = categoryKeywords.length;
    
    // Confidence based on percentage of keyword matches
    const confidence = Math.min(matches / totalKeywords, 1);
    
    // Minimum confidence of 0.3, maximum of 0.95
    return Math.max(0.3, Math.min(0.95, confidence));
  }

  getCategoryKeywords(category) {
    switch (category) {
      case 'Educational': return this.educationalKeywords;
      case 'Entertainment': return this.entertainmentKeywords;
      case 'Gaming': return this.gamingKeywords;
      case 'Music': return this.musicKeywords;
      case 'News': return this.newsKeywords;
      case 'Vlogs': return this.vlogKeywords;
      default: return this.entertainmentKeywords;
    }
  }

  // Batch classify multiple videos
  async batchClassifyVideos(videoDetailsArray) {
    const results = [];
    
    for (const videoDetails of videoDetailsArray) {
      try {
        const classification = await this.classifyVideo(videoDetails);
        results.push({
          videoId: videoDetails.videoId,
          success: true,
          classification
        });
      } catch (error) {
        results.push({
          videoId: videoDetails.videoId,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }
}

module.exports = new ClassificationService();