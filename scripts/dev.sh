#!/bin/bash

# SynergySphere Development Setup Script

echo "🚀 Setting up SynergySphere for development..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚙️  Creating environment file..."
    cp env.example .env.local
    echo "📝 Please update .env.local with your Supabase credentials before running the app."
    echo "   You can find these in your Supabase project settings."
fi

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your Supabase URL and API key"
echo "2. Run the setup.sql script in your Supabase SQL editor"
echo "3. Start the development server with: npm run dev"
echo ""
echo "📚 Check README.md for detailed instructions."
