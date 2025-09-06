@echo off
REM SynergySphere Development Setup Script for Windows

echo 🚀 Setting up SynergySphere for development...

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed. Please install npm first.
    exit /b 1
)

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Check if .env.local exists
if not exist ".env.local" (
    echo ⚙️  Creating environment file...
    copy env.example .env.local
    echo 📝 Please update .env.local with your Supabase credentials before running the app.
    echo    You can find these in your Supabase project settings.
)

echo ✅ Setup complete!
echo.
echo Next steps:
echo 1. Update .env.local with your Supabase URL and API key
echo 2. Run the setup.sql script in your Supabase SQL editor
echo 3. Start the development server with: npm run dev
echo.
echo 📚 Check README.md for detailed instructions.

pause
