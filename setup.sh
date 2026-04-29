#!/bin/bash
# AxM Quick Setup

echo "AxM Setup"
echo "--------"

# Check Node version
node_version=$(node -v)
echo "Node $node_version"

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
  echo "npm install failed"
  exit 1
fi
echo "Dependencies installed"

# Setup .env
echo ""
echo "Setting up environment..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo ".env created (update with your credentials)"
  echo "  - VITE_SUPABASE_URL"
  echo "  - SUPABASE_SERVICE_ROLE_KEY"
  echo "  - CLAUDE_API_KEY"
else
  echo ".env already exists"
fi

echo ""
echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Fill in .env file with Supabase + Claude credentials"
echo "2. Deploy migrations/001_core_tables.sql to Supabase"
echo "3. Deploy migrations/002_feature_tables.sql to Supabase"
echo "4. npm run dev:api (start server on port 3001)"
