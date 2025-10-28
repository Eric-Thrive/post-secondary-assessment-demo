# Unified Login Dashboard System

This directory contains the implementation of the unified login and dashboard system for the THRIVE platform.

## Project Structure

```
apps/web/src/
├── components/
│   ├── auth/                    # Authentication components
│   │   ├── types.ts            # Auth component types
│   │   └── index.ts            # Barrel export
│   ├── dashboard/              # Dashboard components
│   │   ├── types.ts            # Dashboard component types
│   │   └── index.ts            # Barrel export
│   └── shared/                 # Shared components
│       ├── types.ts            # Shared component types
│       └── index.ts            # Barrel export
├── config/
│   ├── routes.ts               # Route configuration
│   └── modules.ts              # Module configuration
├── contexts/
│   └── NavigationContext.tsx   # Navigation state management
├── hooks/
│   ├── useUnifiedAuth.ts       # Unified authentication hook
│   └── useUnifiedRouting.ts    # Unified routing hook
├── types/
│   ├── unified-auth.ts         # Core authentication types
│   └── index.ts                # Types barrel export
├── utils/
│   ├── routing.ts              # Routing utilities
│   └── auth-adapter.ts         # Legacy user adapter
└── unified-auth/
    ├── index.ts                # Main barrel export
    └── README.md               # This file
```

## Core Interfaces

### AuthenticatedUser

Main user interface with module access and preferences.

### ModuleAccess

Defines user access levels and permissions for each module.

### NavigationState

Manages navigation state and redirect handling.

## Key Features

- **Unified Authentication**: Single login interface for all modules
- **Intelligent Routing**: Automatic routing based on user permissions
- **Module Dashboard**: Multi-module selection interface
- **Legacy Compatibility**: Adapter for existing user types
- **THRIVE Branding**: Consistent visual identity

## Usage

```typescript
import { useUnifiedAuth, useUnifiedRouting } from "@/unified-auth";

const MyComponent = () => {
  const { user, login, logout } = useUnifiedAuth();
  const { navigateToModule } = useUnifiedRouting();

  // Component logic here
};
```

## Requirements Addressed

- **1.1**: Module-agnostic authentication interface
- **1.2**: Professional THRIVE branding without module-specific text
- **1.3**: Universal entry point for all user types
