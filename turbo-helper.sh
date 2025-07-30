#!/bin/bash

# Turborepo Helper Script
# Provides common commands for managing your monorepo

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Show help
show_help() {
    echo "Turborepo Helper Script"
    echo ""
    echo "Usage: ./turbo-helper.sh [command]"
    echo ""
    echo "Commands:"
    echo "  clean           Clean all build artifacts and caches"
    echo "  reset           Full reset (clean + reinstall)"
    echo "  check-ports     Check if required ports are available"
    echo "  sync-env        Sync environment files between apps"
    echo "  add-package     Create a new shared package"
    echo "  update-imports  Update import paths across the monorepo"
    echo "  validate        Validate monorepo structure"
    echo "  deps            Show dependency graph"
    echo "  help            Show this help message"
}

# Clean build artifacts and caches
clean_build() {
    log_info "Cleaning build artifacts and caches..."

    # Clean Next.js build artifacts
    find . -name ".next" -type d -exec rm -rf {} + 2>/dev/null || true

    # Clean Turbo cache
    rm -rf .turbo

    # Clean node_modules (optional)
    read -p "Also clean node_modules? (y/N) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
    fi

    # Clean other artifacts
    find . -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
    find . -name "*.tsbuildinfo" -type f -delete 2>/dev/null || true

    log_success "Clean completed!"
}

# Full reset
full_reset() {
    log_info "Performing full reset..."

    clean_build

    log_info "Reinstalling dependencies..."
    pnpm install

    log_success "Reset completed!"
}

# Check if required ports are available
check_ports() {
    log_info "Checking required ports..."

    local ports=(3000 3333)
    local all_clear=true

    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            log_error "Port $port is already in use"
            all_clear=false
        else
            log_success "Port $port is available"
        fi
    done

    if [ "$all_clear" = true ]; then
        log_success "All required ports are available!"
    else
        log_error "Some ports are in use. Please free them before starting the apps."
        exit 1
    fi
}

# Sync environment files
sync_env() {
    log_info "Syncing environment files..."

    # Check if web .env exists
    if [ ! -f "apps/web/.env" ]; then
        log_error "apps/web/.env not found!"
        exit 1
    fi

    # Copy to studio
    cp apps/web/.env apps/studio/
    log_success "Copied .env to studio"

    # Copy .env.local if exists
    if [ -f "apps/web/.env.local" ]; then
        cp apps/web/.env.local apps/studio/
        log_success "Copied .env.local to studio"
    fi

    # Copy other env files
    for env_file in apps/web/.env.*; do
        if [ -f "$env_file" ]; then
            filename=$(basename "$env_file")
            cp "$env_file" "apps/studio/$filename"
            log_success "Copied $filename to studio"
        fi
    done

    log_success "Environment files synced!"
}

# Create a new package
add_package() {
    read -p "Enter package name: " package_name

    if [ -z "$package_name" ]; then
        log_error "Package name cannot be empty!"
        exit 1
    fi

    if [ -d "packages/$package_name" ]; then
        log_error "Package $package_name already exists!"
        exit 1
    fi

    log_info "Creating package: $package_name"

    # Create package structure
    mkdir -p "packages/$package_name/src"

    # Create package.json
    cat > "packages/$package_name/package.json" << EOF
{
  "name": "$package_name",
  "version": "1.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.8.3",
    "typescript-config": "workspace:*"
  }
}
EOF

    # Create tsconfig.json
    cat > "packages/$package_name/tsconfig.json" << EOF
{
  "extends": "typescript-config/base.json",
  "compilerOptions": {
    "baseUrl": "."
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
EOF

    # Create index.ts
    cat > "packages/$package_name/src/index.ts" << EOF
// Export your package contents here
export {};
EOF

    log_success "Package $package_name created!"
    log_info "Don't forget to:"
    echo "  1. Add dependencies to the package"
    echo "  2. Export your modules from src/index.ts"
    echo "  3. Add '$package_name': 'workspace:*' to consuming apps"
}

# Update import paths
update_imports() {
    log_info "Updating import paths across the monorepo..."

    # Update @/sanity imports to sanity-config
    find apps packages -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
        -not -path "*/node_modules/*" \
        -not -path "*/.next/*" \
        -exec sed -i.bak \
        -e 's|from "@/sanity/|from "sanity-config/|g' \
        -e 's|from "@/sanity"|from "sanity-config"|g' \
        -e 's|from "@/lib/utils"|from "ui"|g' \
        {} +

    # Clean up backup files
    find apps packages -name "*.bak" -delete

    log_success "Import paths updated!"
}

# Validate monorepo structure
validate_structure() {
    log_info "Validating monorepo structure..."

    local issues=()

    # Check required directories
    local required_dirs=(
        "apps/web"
        "apps/studio"
        "packages/sanity-config"
        "packages/typescript-config"
        "packages/ui"
    )

    for dir in "${required_dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            issues+=("Missing directory: $dir")
        fi
    done

    # Check required files
    local required_files=(
        "turbo.json"
        "pnpm-workspace.yaml"
        "package.json"
        "apps/web/package.json"
        "apps/studio/package.json"
    )

    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            issues+=("Missing file: $file")
        fi
    done

    # Check for common issues
    if [ -d "sanity-studio" ]; then
        issues+=("Old sanity-studio directory still exists")
    fi

    if [ -d "sanity" ]; then
        issues+=("Old sanity directory still exists")
    fi

    # Report results
    if [ ${#issues[@]} -eq 0 ]; then
        log_success "Monorepo structure is valid!"
    else
        log_error "Found ${#issues[@]} issues:"
        for issue in "${issues[@]}"; do
            echo "  - $issue"
        done
        exit 1
    fi
}

# Show dependency graph
show_deps() {
    log_info "Analyzing dependencies..."

    # Check if turbo is installed
    if ! command -v turbo &> /dev/null; then
        log_error "Turbo is not installed globally. Install with: npm install -g turbo"
        exit 1
    fi

    # Run turbo graph
    turbo run build --graph
}

# Main command handler
case "${1:-help}" in
    clean)
        clean_build
        ;;
    reset)
        full_reset
        ;;
    check-ports)
        check_ports
        ;;
    sync-env)
        sync_env
        ;;
    add-package)
        add_package
        ;;
    update-imports)
        update_imports
        ;;
    validate)
        validate_structure
        ;;
    deps)
        show_deps
        ;;
    help)
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
