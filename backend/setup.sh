#!/bin/bash

# FoodRescue S1 - Quick Start Script for Backend
# This script automates the backend setup process

set -e  # Exit on error

echo "🍽️  FoodRescue S1 - Backend Quick Start"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check Python version
echo "Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3.9 or higher."
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d ' ' -f 2)
print_success "Python $PYTHON_VERSION found"

# Check PostgreSQL
echo ""
echo "Checking PostgreSQL installation..."
if ! command -v psql &> /dev/null; then
    print_error "PostgreSQL is not installed."
    print_info "Install PostgreSQL with: sudo apt install postgresql postgresql-contrib"
    exit 1
fi

POSTGRES_VERSION=$(psql --version | awk '{print $3}')
print_success "PostgreSQL $POSTGRES_VERSION found"

# Create virtual environment
echo ""
echo "Setting up Python virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    print_success "Virtual environment created"
else
    print_info "Virtual environment already exists"
fi

# Activate virtual environment
source venv/bin/activate
print_success "Virtual environment activated"

# Install dependencies
echo ""
echo "Installing Python dependencies..."
pip install --upgrade pip > /dev/null 2>&1
pip install -r requirements.txt
print_success "Dependencies installed"

# Database configuration
echo ""
echo "Database Configuration"
echo "====================="
read -p "Enter database name [foodrescue_db]: " DB_NAME
DB_NAME=${DB_NAME:-foodrescue_db}

read -p "Enter database user [foodrescue_user]: " DB_USER
DB_USER=${DB_USER:-foodrescue_user}

read -sp "Enter database password: " DB_PASSWORD
echo ""

# Update database URL in main.py
echo ""
echo "Updating database configuration..."
sed -i.bak "s|postgresql://.*@localhost:5432/.*\"|postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}\"|" main.py
print_success "Database configuration updated"

# Check if database exists
echo ""
echo "Checking database..."
if psql -U postgres -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    print_info "Database $DB_NAME already exists"
else
    print_info "Creating database..."
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;"
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    print_success "Database created"
fi

# Initialize database schema
echo ""
echo "Initializing database schema..."
export PGPASSWORD=$DB_PASSWORD
psql -U $DB_USER -d $DB_NAME -f init_db.sql > /dev/null 2>&1
unset PGPASSWORD
print_success "Database schema initialized"

# Verify sample data
echo ""
echo "Verifying sample data..."
DONATION_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM donations;" | xargs)
print_success "$DONATION_COUNT sample donations loaded"

echo ""
echo "======================================"
echo -e "${GREEN}✓ Backend setup complete!${NC}"
echo ""
echo "To start the server:"
echo "  1. Activate virtual environment: source venv/bin/activate"
echo "  2. Run: python main.py"
echo ""
echo "Server will be available at: http://localhost:8000"
echo "API documentation: http://localhost:8000/docs"
echo ""
echo "Test the API:"
echo "  curl http://localhost:8000/health"
echo "  curl http://localhost:8000/api/donations/available"
echo ""
