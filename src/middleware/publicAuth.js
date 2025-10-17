const User = require('../models/User');

// Public auth middleware that automatically uses test user
const publicAuth = async (req, res, next) => {
  try {
    // Always use test user for public routes
    const testUser = await User.findOne({ email: 'test@example.com' });
    
    if (!testUser) {
      return res.status(404).json({
        success: false,
        message: 'Test user not found'
      });
    }

    req.user = testUser;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = { publicAuth };
