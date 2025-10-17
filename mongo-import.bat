@echo off
REM MongoDB Import Script for Windows
REM Run this script to import the generated data into your MongoDB database

echo 🚀 Starting MongoDB import process...

REM Set your database name here
set DB_NAME=fyp-database

REM Import users
echo 📥 Importing users...
mongoimport --db %DB_NAME% --collection users --file users.json --jsonArray

REM Import videos
echo 📥 Importing videos...
mongoimport --db %DB_NAME% --collection videos --file videos-db.json --jsonArray

REM Import watch history
echo 📥 Importing watch history...
mongoimport --db %DB_NAME% --collection watchhistories --file watch-history-db.json --jsonArray

echo ✅ Import completed successfully!
echo 📊 Summary:
echo    Users: 1
echo    Videos: 50
echo    Watch History Entries: 97
pause
