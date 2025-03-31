#!/bin/bash

# --- startup.sh ---
#
# Purpose:
# This script automates the local development setup and startup process
# for the FitTrack MVP Next.js application. It ensures dependencies are
# installed and the development server is launched consistently.
#
# Requirements:
# - bash
# - Node.js (version compatible with Next.js 15, specified in package.json/engine ideally)
# - npm (installed with Node.js)
# - A configured .env file in the project root (copied from .env.example)
#
# Usage:
# 1. Ensure you have created and configured the .env file from .env.example.
# 2. Give the script execute permissions: chmod +x startup.sh
# 3. Run the script from the project root directory: ./startup.sh

# Exit immediately if a command exits with a non-zero status.
set -e
# Treat unset variables as an error when substituting.
set -u
# Pipelines fail if any command fails, not just the last one.
set -o pipefail

# --- Configuration ---
readonly ENV_FILE=".env"
readonly PACKAGE_JSON="package.json"
readonly NPM_INSTALL_CMD="npm install"
readonly NPM_RUN_DEV_CMD="npm run dev" # Uses the 'dev' script from package.json

# --- Helper Functions ---
log_info() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1"
}

log_error() {
  # Print error message to standard error
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1" >&2
}

# --- Script Start ---
log_info "Starting FitTrack MVP development environment setup..."

# 1. Check for required configuration files (.env)
log_info "Checking for required ${ENV_FILE} file..."
if [ ! -f "${ENV_FILE}" ]; then
  log_error "${ENV_FILE} file not found in the project root."
  log_error "Please copy '.env.example' to '${ENV_FILE}' and configure necessary variables (MONGODB_URI, JWT_SECRET) as per README.md."
  # Exit with a non-zero status code indicating failure
  exit 1
else
  log_info "Found ${ENV_FILE} file."
fi

# 2. Check for package.json
log_info "Checking for ${PACKAGE_JSON}..."
if [ ! -f "${PACKAGE_JSON}" ]; then
    log_error "${PACKAGE_JSON} not found in the current directory."
    log_error "Cannot proceed without ${PACKAGE_JSON}. Ensure you are in the project root."
    exit 1
fi
log_info "Found ${PACKAGE_JSON}."

# 3. Install Node.js dependencies
# Note: 'set -e' will cause the script to exit if npm install fails.
log_info "Installing dependencies via npm (using ${PACKAGE_JSON})..."
if ! ${NPM_INSTALL_CMD}; then
    log_error "Failed to install npm dependencies. Please check npm logs."
    exit 1
fi
log_info "Dependency installation completed."

# 4. Start the Next.js Development Server
# Note: 'set -e' will cause the script to exit if npm run dev fails immediately.
# This command will run in the foreground, displaying server logs.
# Use Ctrl+C to stop the server and the script.
log_info "Starting Next.js development server (${NPM_RUN_DEV_CMD})..."
log_info "Press Ctrl+C to stop the server."

# Execute the development server command
if ! ${NPM_RUN_DEV_CMD}; then
    log_error "Failed to start the Next.js development server. Check the output above for errors."
    # Although npm run dev might exit non-zero on Ctrl+C, we treat other non-zero exits as errors.
    # However, 'set -e' should handle this exit. This message is for clarity if needed.
    exit 1
fi

# The script effectively ends here when 'npm run dev' takes over the foreground process.
# If 'npm run dev' exits (e.g., due to an error or Ctrl+C), the script will terminate due to 'set -e' or natural exit.
log_info "Next.js development server exited."
exit 0 # Explicitly exit with success code if dev server finishes cleanly (unlikely unless stopped).