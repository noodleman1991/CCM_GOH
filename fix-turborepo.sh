#!/bin/bash

# Fix Turborepo Script
# This will create a working monorepo structure from your current state

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

# Check current state
check_current_state() {
    log_info "Checking current project state..."

    if [ -d "apps" ]; then
        log_info "Found apps directory"
    else
        log_warning "No apps directory found"
    fi

    if [ -d "packages" ]; then
        log_info "Found packages directory"
    else
        log_warning "No packages directory found"
    fi

    if [ -f "pnpm-workspace.yaml" ]; then
        log_info "Found workspace config"
    else
        log_warning "No workspace config found"
    fi
}

# Create complete directory structure
create_structure() {
    log_info "Creating/ensuring directory structure..."

    # Create all directories
    mkdir -p apps/web
    mkdir -p apps/studio
    mkdir -p packages/typescript-config
    mkdir -p packages/sanity-config/src
    mkdir -p packages/ui/src

    log_success "Directory structure created"
}

# Create workspace configuration
create_workspace_config() {
    log_info "Creating workspace configuration..."

    cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'apps/*'
  - 'packages/*'
EOF

    log_success "Workspace config created"
}

# Create root package.json
create_root_package() {
    log_info "Creating root package.json..."

    cat > package.json << 'EOF'
{
  "name": "monorepo",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "start": "turbo run start",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.8.3"
  },
  "packageManager": "pnpm@9.15.4",
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

    log_success "Root package.json created"
}

# Create turbo config
create_turbo_config() {
    log_info "Creating turbo.json..."

    cat > turbo.json << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "cache": false
    }
  }
}
EOF

    log_success "Turbo config created"
}

# Setup typescript-config package
setup_typescript_config() {
    log_info "Setting up typescript-config package..."

    # Create package.json
    cat > packages/typescript-config/package.json << 'EOF'
{
  "name": "typescript-config",
  "version": "1.0.0",
  "private": true,
  "files": ["*.json"]
}
EOF

    # Create base config
    cat > packages/typescript-config/base.json << 'EOF'
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Default",
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "moduleResolution": "node",
    "preserveWatchOutput": true,
    "skipLibCheck": true,
    "strict": true,
    "resolveJsonModule": true
  },
  "exclude": ["node_modules"]
}
EOF

    # Create Next.js config
    cat > packages/typescript-config/next.json << 'EOF'
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Next.js",
  "extends": "./base.json",
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "noEmit": true,
    "module": "esnext",
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{"name": "next"}]
  }
}
EOF

    log_success "typescript-config package created"
}

# Setup sanity-config package
setup_sanity_config() {
    log_info "Setting up sanity-config package..."

    # Create package.json
    cat > packages/sanity-config/package.json << 'EOF'
{
  "name": "sanity-config",
  "version": "1.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "files": ["src"],
  "dependencies": {
    "@sanity/client": "^6.29.0",
    "@sanity/image-url": "^1.1.0",
    "sanity": "3.99.0"
  },
  "devDependencies": {
    "typescript": "^5.8.3"
  }
}
EOF

    # Create a minimal index.ts
    cat > packages/sanity-config/src/index.ts << 'EOF'
// Export Sanity configuration
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '';
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01';

// Re-export any schemas, queries, etc. that exist
export * from './env';
EOF

    # Create env.ts if it doesn't exist
    if [ ! -f "packages/sanity-config/src/env.ts" ]; then
        cat > packages/sanity-config/src/env.ts << 'EOF'
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '';
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01';
EOF
    fi

    # Create tsconfig
    cat > packages/sanity-config/tsconfig.json << 'EOF'
{
  "extends": "../typescript-config/base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "jsx": "react-jsx"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
EOF

    log_success "sanity-config package created"
}

# Setup UI package
setup_ui_package() {
    log_info "Setting up ui package..."

    # Create package.json
    cat > packages/ui/package.json << 'EOF'
{
  "name": "ui",
  "version": "1.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "files": ["src"],
  "dependencies": {
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.1",
    "typescript": "^5.8.3"
  },
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0"
  }
}
EOF

    # Create index.ts
    cat > packages/ui/src/index.ts << 'EOF'
export * from './utils';
EOF

    # Create utils.ts if it doesn't exist
    if [ ! -f "packages/ui/src/utils.ts" ]; then
        cat > packages/ui/src/utils.ts << 'EOF'
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
EOF
    fi

    # Create tsconfig
    cat > packages/ui/tsconfig.json << 'EOF'
{
  "extends": "../typescript-config/base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "jsx": "react-jsx"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
EOF

    log_success "ui package created"
}

# Setup web app if it doesn't have package.json
setup_web_app() {
    log_info "Checking web app..."

    if [ ! -f "apps/web/package.json" ]; then
        log_info "Creating web app package.json..."

        cat > apps/web/package.json << 'EOF'
{
  "name": "web",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@clerk/nextjs": "^6.18.0",
    "next": "15.3.1",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "sanity-config": "workspace:*",
    "typescript-config": "workspace:*",
    "ui": "workspace:*"
  },
  "devDependencies": {
    "@types/node": "^22.14.1",
    "@types/react": "^19.1.2",
    "@types/react-dom": "^19.1.2",
    "typescript": "^5.8.3"
  }
}
EOF

        log_success "Web app package.json created"
    fi

    # Ensure web has a tsconfig
    if [ ! -f "apps/web/tsconfig.json" ]; then
        cat > apps/web/tsconfig.json << 'EOF'
{
  "extends": "typescript-config/next.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
EOF
    fi
}

# Setup studio app if it doesn't have package.json
setup_studio_app() {
    log_info "Checking studio app..."

    if [ ! -f "apps/studio/package.json" ]; then
        log_info "Creating studio app package.json..."

        cat > apps/studio/package.json << 'EOF'
{
  "name": "studio",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3333",
    "build": "next build",
    "start": "next start -p 3333",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@clerk/nextjs": "^6.18.0",
    "@sanity/vision": "3.99.0",
    "next": "15.3.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "sanity": "3.99.0",
    "sanity-config": "workspace:*",
    "typescript-config": "workspace:*"
  },
  "devDependencies": {
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.1",
    "typescript": "^5.8.3"
  },
  "overrides": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  }
}
EOF

        log_success "Studio app package.json created"
    fi

    # Ensure studio has a tsconfig
    if [ ! -f "apps/studio/tsconfig.json" ]; then
        cat > apps/studio/tsconfig.json << 'EOF'
{
  "extends": "typescript-config/next.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
EOF
    fi
}

# Verify all packages exist
verify_packages() {
    log_info "Verifying all packages..."

    local all_good=true

    # Check each required package
    for pkg in "typescript-config" "sanity-config" "ui"; do
        if [ -f "packages/$pkg/package.json" ]; then
            local pkg_name=$(node -p "require('./packages/$pkg/package.json').name" 2>/dev/null)
            if [ "$pkg_name" = "$pkg" ]; then
                log_success "✓ Package '$pkg' is correctly configured"
            else
                log_error "✗ Package '$pkg' has incorrect name: '$pkg_name'"
                all_good=false
            fi
        else
            log_error "✗ Package '$pkg' is missing package.json"
            all_good=false
        fi
    done

    # Check apps
    for app in "web" "studio"; do
        if [ -f "apps/$app/package.json" ]; then
            log_success "✓ App '$app' exists"
        else
            log_error "✗ App '$app' is missing package.json"
            all_good=false
        fi
    done

    if [ "$all_good" = true ]; then
        log_success "All packages verified successfully!"
        return 0
    else
        log_error "Some packages are missing or misconfigured"
        return 1
    fi
}

# Clean install
clean_install() {
    log_info "Cleaning old installations..."

    # Remove all node_modules and lock files
    find . -name "node_modules" -type d -prune -exec rm -rf {} + 2>/dev/null || true
    rm -f pnpm-lock.yaml

    log_info "Installing dependencies..."
    pnpm install

    if [ $? -eq 0 ]; then
        log_success "Dependencies installed successfully!"
        return 0
    else
        log_error "Failed to install dependencies"
        return 1
    fi
}

# Main execution
main() {
    echo "=========================================="
    echo "Turborepo Fix Script"
    echo "=========================================="
    echo ""

    check_current_state
    echo ""

    create_structure
    create_workspace_config
    create_root_package
    create_turbo_config

    setup_typescript_config
    setup_sanity_config
    setup_ui_package
    setup_web_app
    setup_studio_app

    echo ""
    if verify_packages; then
        echo ""
        clean_install

        if [ $? -eq 0 ]; then
            echo ""
            echo "=========================================="
            echo -e "${GREEN}SUCCESS! Monorepo is ready!${NC}"
            echo "=========================================="
            echo ""
            echo "You should now be able to run:"
            echo "  pnpm dev        - Run all apps"
            echo "  pnpm dev:web    - Run web app only"
            echo "  pnpm dev:studio - Run studio only"
            echo ""
            echo "Apps will be available at:"
            echo "  Web:    http://localhost:3000"
            echo "  Studio: http://localhost:3333"
            echo ""
        else
            echo ""
            echo "=========================================="
            echo -e "${RED}PARTIAL SUCCESS${NC}"
            echo "=========================================="
            echo ""
            echo "Structure created but dependency installation failed."
            echo "This might be due to:"
            echo "1. Missing dependencies in your original project"
            echo "2. Network issues"
            echo "3. Version conflicts"
            echo ""
            echo "Try running: pnpm install --force"
            echo ""
        fi
    else
        echo ""
        echo "=========================================="
        echo -e "${RED}FAILED${NC}"
        echo "=========================================="
        echo ""
        echo "Package structure verification failed."
        echo "Please check the errors above."
        echo ""
    fi
}

# Run main
main "$@"
