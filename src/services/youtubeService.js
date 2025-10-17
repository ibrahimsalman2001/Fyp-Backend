const axios = require('axios');

class YouTubeService {
  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY;
    this.baseURL = 'https://www.googleapis.com/youtube/v3';
  }

  // Get video details by video ID
  async getVideoDetails(videoId) {
    try {
      const response = await axios.get(`${this.baseURL}/videos`, {
        params: {
          part: 'snippet,contentDetails,statistics',
          id: videoId,
          key: this.apiKey
        }
      });

      if (!response.data.items || response.data.items.length === 0) {
        throw new Error('Video not found');
      }

      const video = response.data.items[0];
      return {
        videoId: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        channelTitle: video.snippet.channelTitle,
        channelId: video.snippet.channelId,
        duration: video.contentDetails.duration,
        thumbnails: {
          default: video.snippet.thumbnails.default?.url,
          medium: video.snippet.thumbnails.medium?.url,
          high: video.snippet.thumbnails.high?.url
        },
        publishedAt: new Date(video.snippet.publishedAt),
        tags: video.snippet.tags || [],
        categoryId: video.snippet.categoryId,
        viewCount: parseInt(video.statistics.viewCount) || 0
      };
    } catch (error) {
      console.error('YouTube API error:', error.response?.data || error.message);
      throw new Error('Failed to fetch video details from YouTube');
    }
  }

  // Get channel details
  async getChannelDetails(channelId) {
    try {
      const response = await axios.get(`${this.baseURL}/channels`, {
        params: {
          part: 'snippet,statistics',
          id: channelId,
          key: this.apiKey
        }
      });

      if (!response.data.items || response.data.items.length === 0) {
        throw new Error('Channel not found');
      }

      const channel = response.data.items[0];
      return {
        channelId: channel.id,
        title: channel.snippet.title,
        description: channel.snippet.description,
        thumbnails: channel.snippet.thumbnails,
        subscriberCount: parseInt(channel.statistics.subscriberCount) || 0,
        videoCount: parseInt(channel.statistics.videoCount) || 0
      };
    } catch (error) {
      console.error('YouTube API error:', error.response?.data || error.message);
      throw new Error('Failed to fetch channel details from YouTube');
    }
  }

  // Search videos
  async searchVideos(query, options = {}) {
    try {
      const {
        maxResults = 10,
        order = 'relevance',
        type = 'video'
      } = options;

      const response = await axios.get(`${this.baseURL}/search`, {
        params: {
          part: 'snippet',
          q: query,
          type,
          order,
          maxResults,
          key: this.apiKey
        }
      });

      return response.data.items.map(item => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        channelTitle: item.snippet.channelTitle,
        channelId: item.snippet.channelId,
        thumbnails: item.snippet.thumbnails,
        publishedAt: new Date(item.snippet.publishedAt)
      }));
    } catch (error) {
      console.error('YouTube search error:', error.response?.data || error.message);
      throw new Error('Failed to search videos on YouTube');
    }
  }

  // Extract video ID from YouTube URL
  extractVideoId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    throw new Error('Invalid YouTube URL or video ID');
  }

  // Validate API key
  async validateApiKey() {
    try {
      await axios.get(`${this.baseURL}/videos`, {
        params: {
          part: 'snippet',
          id: 'dQw4w9WgXcQ', // Rick Roll video ID for testing
          key: this.apiKey
        }
      });
      return true;
    } catch (error) {
      console.error('YouTube API key validation failed:', error.response?.data);
      return false;
    }
  }
}

module.exports = new YouTubeService();