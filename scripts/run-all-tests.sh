#!/bin/bash

# Comprehensive Test Runner Script
# Runs all tests in the correct order and generates reports

set -e

echo "🚀 Starting Comprehensive Test Suite"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to run command with error handling
run_command() {
    local description=$1
    local command=$2
    
    print_status $YELLOW "Running: $description"
    
    if eval $command; then
        print_status $GREEN "✅ $description completed successfully"
        return 0
    else
        print_status $RED "❌ $description failed"
        return 1
    fi
}

# Initialize test results tracking
UNIT_TESTS_PASSED=false
COMPONENT_TESTS_PASSED=false
E2E_TESTS_PASSED=false
LINT_PASSED=false
TYPE_CHECK_PASSED=false

# Clean previous test results
echo "🧹 Cleaning previous test results..."
rm -rf apps/server/coverage
rm -rf apps/web/coverage
rm -rf test-results
rm -rf playwright-report

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status $YELLOW "Installing dependencies..."
    npm ci
fi

# Install Playwright browsers if needed
if [ ! -d "node_modules/@playwright" ]; then
    print_status $YELLOW "Installing Playwright browsers..."
    npx playwright install --with-deps
fi

# Run linting
if run_command "Linting" "npm run lint"; then
    LINT_PASSED=true
fi

# Run type checking
if run_command "Type Checking" "npm run check"; then
    TYPE_CHECK_PASSED=true
fi

# Run unit tests (server)
if run_command "Server Unit Tests" "cd apps/server && npm run test:coverage"; then
    UNIT_TESTS_PASSED=true
fi

# Run component tests (web)
if run_command "Web Component Tests" "cd apps/web && npm run test:coverage"; then
    COMPONENT_TESTS_PASSED=true
fi

# Build applications for E2E tests
if run_command "Building Applications" "npm run build"; then
    # Run E2E tests
    if run_command "End-to-End Tests" "npm run test:e2e"; then
        E2E_TESTS_PASSED=true
    fi
fi

# Generate test report
print_status $YELLOW "Generating test report..."
npm run test:report

# Print final summary
echo ""
echo "📊 FINAL TEST SUMMARY"
echo "====================="

if [ "$LINT_PASSED" = true ]; then
    print_status $GREEN "✅ Linting: PASSED"
else
    print_status $RED "❌ Linting: FAILED"
fi

if [ "$TYPE_CHECK_PASSED" = true ]; then
    print_status $GREEN "✅ Type Checking: PASSED"
else
    print_status $RED "❌ Type Checking: FAILED"
fi

if [ "$UNIT_TESTS_PASSED" = true ]; then
    print_status $GREEN "✅ Unit Tests: PASSED"
else
    print_status $RED "❌ Unit Tests: FAILED"
fi

if [ "$COMPONENT_TESTS_PASSED" = true ]; then
    print_status $GREEN "✅ Component Tests: PASSED"
else
    print_status $RED "❌ Component Tests: FAILED"
fi

if [ "$E2E_TESTS_PASSED" = true ]; then
    print_status $GREEN "✅ E2E Tests: PASSED"
else
    print_status $RED "❌ E2E Tests: FAILED"
fi

# Determine overall success
if [ "$LINT_PASSED" = true ] && [ "$TYPE_CHECK_PASSED" = true ] && [ "$UNIT_TESTS_PASSED" = true ] && [ "$COMPONENT_TESTS_PASSED" = true ] && [ "$E2E_TESTS_PASSED" = true ]; then
    print_status $GREEN "🎉 ALL TESTS PASSED! Ready for deployment."
    exit 0
else
    print_status $RED "❌ SOME TESTS FAILED! Please fix issues before deployment."
    exit 1
fi