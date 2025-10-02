#!/bin/bash

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if env-scaffold.json exists
if [ ! -f "env-scaffold.json" ]; then
    echo -e "${RED}Error: env-scaffold.json not found in the current directory${NC}"
    exit 1
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is not installed. Please install jq first.${NC}"
    echo "Install with: brew install jq (macOS) or apt-get install jq (Linux)"
    exit 1
fi

echo -e "${BLUE}🔧 Starting environment setup...${NC}\n"

# Function to write env file
write_env_file() {
    local dir=$1
    local swap_db_urls=$2
    shift 2
    local keys=("$@")

    # Create directory if it doesn't exist
    mkdir -p "$dir"

    local env_file="$dir/.env"

    # Clear or create the .env file
    > "$env_file"

    echo -e "${BLUE}📝 Writing $env_file${NC}"

    # Write each key-value pair
    for key in "${keys[@]}"; do
        local lookup_key="$key"

        # Swap DATABASE_URL and DIRECT_URL for edge runtime (apps/web)
        if [ "$swap_db_urls" = "true" ]; then
            if [ "$key" = "DATABASE_URL" ]; then
                lookup_key="DIRECT_URL"
            elif [ "$key" = "DIRECT_URL" ]; then
                lookup_key="DATABASE_URL"
            fi
        fi

        value=$(jq -r ".env.${lookup_key}" env-scaffold.json)

        # Handle boolean values (convert to lowercase)
        if [ "$value" = "true" ] || [ "$value" = "false" ]; then
            value=$(echo "$value" | tr '[:upper:]' '[:lower:]')
        fi

        echo "${key}=${value}" >> "$env_file"
    done

    echo -e "${GREEN}✓ Created $env_file${NC}\n"
}

# apps/web (SWAP DATABASE_URL and DIRECT_URL for Prisma Accelerate/edge)
write_env_file "apps/web" "true" \
    "ENCRYPTION_KEY" \
    "GITHUB_CLIENT_ID" \
    "GITHUB_CLIENT_SECRET" \
    "BETTER_AUTH_URL" \
    "BETTER_AUTH_SECRET" \
    "NEXT_PUBLIC_WS_URL" \
    "DATABASE_URL" \
    "DATABASE_API_KEY" \
    "DIRECT_URL"

# apps/ws-server (standard mapping)
write_env_file "apps/ws-server" "false" \
    "ENCRYPTION_KEY" \
    "IS_PROD" \
    "DATABASE_URL" \
    "DATABASE_API_KEY" \
    "DIRECT_URL" \
    "OPENAI_API_KEY"

# packages/key-validator
write_env_file "packages/key-validator" "false" \
    "OPENAI_API_KEY"

# packages/encryption
write_env_file "packages/encryption" "false" \
    "ENCRYPTION_KEY"

# packages/db
write_env_file "packages/db" "false" \
    "DATABASE_URL" \
    "DATABASE_API_KEY" \
    "DIRECT_URL"

# packages/types
write_env_file "packages/types" "false" \
    "OPENAI_API_KEY"

# Root directory
write_env_file "." "false" \
    "ENCRYPTION_KEY" \
    "DATABASE_URL" \
    "DATABASE_API_KEY" \
    "DIRECT_URL" \
    "OPENAI_API_KEY"

echo -e "${GREEN}✅ All .env files created successfully!${NC}\n"

# Ask if user wants to delete the scaffold file
read -p "Delete env-scaffold.json? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm env-scaffold.json
    echo -e "${GREEN}🗑️  env-scaffold.json deleted${NC}"
else
    echo -e "${BLUE}📋 env-scaffold.json preserved${NC}"
fi

echo -e "\n${GREEN}🎉 Environment setup complete!${NC}"
