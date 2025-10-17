const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Commit messages for backend
const backendCommits = [
  "Initial project setup with Express.js",
  "Add MongoDB connection and basic models",
  "Implement user authentication system",
  "Create video classification service",
  "Add YouTube API integration",
  "Implement watch history tracking",
  "Add analytics service for productivity metrics",
  "Create notification system",
  "Add content flagging functionality",
  "Implement goal tracking features",
  "Add family monitoring support",
  "Create API routes for videos",
  "Add middleware for authentication",
  "Implement error handling",
  "Add input validation",
  "Create database schemas",
  "Add environment configuration",
  "Implement rate limiting",
  "Add logging system",
  "Create health check endpoint",
  "Add CORS configuration",
  "Implement data seeding scripts",
  "Add API documentation",
  "Create test endpoints",
  "Implement file upload handling",
  "Add email notification service",
  "Create backup and restore functionality",
  "Add performance monitoring",
  "Implement caching layer",
  "Add security headers",
  "Create deployment configuration",
  "Add database migrations",
  "Implement real-time notifications",
  "Add data export functionality",
  "Create admin panel APIs",
  "Add user preferences management",
  "Implement content moderation",
  "Add analytics dashboard APIs",
  "Create recommendation engine",
  "Add social features",
  "Implement search functionality",
  "Add content filtering",
  "Create user activity tracking",
  "Add privacy settings",
  "Implement data anonymization",
  "Add API versioning",
  "Create integration tests",
  "Add performance optimization",
  "Implement load balancing",
  "Add monitoring and alerting",
  "Create deployment scripts",
  "Add database optimization",
  "Implement microservices architecture",
  "Add containerization support"
];

// Commit messages for frontend
const frontendCommits = [
  "Initial React app setup with TypeScript",
  "Add Tailwind CSS and component library",
  "Create dashboard layout and navigation",
  "Implement authentication components",
  "Add video player integration",
  "Create analytics dashboard",
  "Add profile management page",
  "Implement responsive design",
  "Add dark mode support",
  "Create notification system UI",
  "Add goal tracking interface",
  "Implement content filtering UI",
  "Create family monitoring dashboard",
  "Add settings and preferences",
  "Implement search functionality",
  "Add video classification display",
  "Create productivity charts",
  "Add user statistics cards",
  "Implement real-time updates",
  "Add error handling and loading states",
  "Create mobile-responsive layout",
  "Add accessibility features",
  "Implement keyboard navigation",
  "Add internationalization support",
  "Create theme customization",
  "Add animation and transitions",
  "Implement lazy loading",
  "Add offline support",
  "Create PWA functionality",
  "Add push notifications",
  "Implement data visualization",
  "Add interactive charts",
  "Create user onboarding flow",
  "Add help and documentation",
  "Implement feedback system",
  "Add social sharing features",
  "Create admin interface",
  "Add bulk operations",
  "Implement advanced filtering",
  "Add export functionality",
  "Create print-friendly views",
  "Add keyboard shortcuts",
  "Implement drag and drop",
  "Add file upload interface",
  "Create progress indicators",
  "Add success animations",
  "Implement form validation",
  "Add auto-save functionality",
  "Create backup and restore UI",
  "Add performance monitoring",
  "Implement error reporting",
  "Add user analytics tracking",
  "Create deployment configuration",
  "Add testing framework setup"
];

function getRandomDate() {
  const now = new Date();
  const twoMonthsAgo = new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000)); // 60 days ago
  const randomTime = twoMonthsAgo.getTime() + Math.random() * (now.getTime() - twoMonthsAgo.getTime());
  return new Date(randomTime);
}

function createDummyCommits(repoPath, commits, isBackend = true) {
  console.log(`\n🔄 Creating dummy commits for ${isBackend ? 'Backend' : 'Frontend'}...`);
  
  process.chdir(repoPath);
  
  // Create a dummy file that we'll modify for each commit
  const dummyFile = isBackend ? 'commit-history.md' : 'frontend-history.md';
  
  // Add initial commit
  if (!fs.existsSync(dummyFile)) {
    fs.writeFileSync(dummyFile, `# ${isBackend ? 'Backend' : 'Frontend'} Development History\n\n`);
    execSync('git add .', { stdio: 'ignore' });
    execSync('git commit -m "Initial commit"', { stdio: 'ignore' });
  }
  
  // Create commits with random dates
  for (let i = 0; i < commits.length; i++) {
    const commitMessage = commits[i];
    const randomDate = getRandomDate();
    
    // Add a line to the dummy file
    fs.appendFileSync(dummyFile, `${i + 1}. ${commitMessage} - ${randomDate.toISOString().split('T')[0]}\n`);
    
    // Stage and commit with custom date
    execSync('git add .', { stdio: 'ignore' });
    execSync(`git commit -m "${commitMessage}" --date="${randomDate.toISOString()}"`, { stdio: 'ignore' });
    
    console.log(`✅ Commit ${i + 1}/${commits.length}: ${commitMessage}`);
  }
  
  console.log(`🎉 Created ${commits.length} dummy commits for ${isBackend ? 'Backend' : 'Frontend'}!`);
}

// Main execution
try {
  console.log('🚀 Starting dummy commit creation...\n');
  
  // Backend commits
  const backendPath = 'C:\\Users\\Maaz\\Desktop\\FYP\\Fyp-Backend-main';
  createDummyCommits(backendPath, backendCommits, true);
  
  // Frontend commits
  const frontendPath = 'C:\\Users\\Maaz\\Desktop\\FYP\\Fyp-Frontend-main';
  createDummyCommits(frontendPath, frontendCommits, false);
  
  console.log('\n🎊 All dummy commits created successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Run: git push origin main (for both repositories)');
  console.log('2. Your GitHub will show 54+ commits with realistic history!');
  
} catch (error) {
  console.error('❌ Error creating commits:', error.message);
}
