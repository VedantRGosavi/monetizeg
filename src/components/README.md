# MonetizeG Component Architecture

This document outlines the component architecture and patterns used in the MonetizeG application.

## Directory Structure

```
src/
├── components/                    # Shared/Global Components
│   ├── ui/                       # Base UI Components
│   ├── features/                 # Feature-specific Components
│   │   ├── analytics/
│   │   ├── campaigns/
│   │   ├── repositories/
│   │   └── intelligent-ads/
│   ├── layout/                   # Layout Components
│   └── providers/                # Context Providers
└── app/                          # App Router Pages
    └── dashboard/
        ├── _components/          # Dashboard-specific Components
        ├── analytics/
        │   └── _components/      # Analytics Page Components
        ├── campaigns/
        │   └── _components/      # Campaign Page Components
        └── ...
```

## Component Patterns

### Server vs Client Components

- **Server Components (Default)**
  - Data fetching
  - Static content
  - SEO-important content
  - No client-side interactivity

- **Client Components**
  - Add 'use client' directive
  - Interactive elements
  - State management
  - Browser APIs
  - Event handlers

### Component Categories

1. **Base UI Components** (`/components/ui/`)
   - Low-level, reusable UI primitives
   - No business logic
   - Highly composable
   - Example: Button, Card, Input

2. **Feature Components** (`/components/features/`)
   - Business-specific components
   - Shared across multiple pages
   - Grouped by feature domain
   - Example: CampaignList, RepositoryCard

3. **Layout Components** (`/components/layout/`)
   - Application structure
   - Navigation elements
   - Consistent across pages
   - Example: Header, Sidebar

4. **Page Components** (`/app/**/page.tsx`)
   - Route-specific components
   - Compose other components
   - Handle page-level logic

5. **Private Components** (`/app/**/_components/`)
   - Used only within specific routes
   - Co-located with their pages
   - Not exported for reuse

## Naming Conventions

### Files
- `kebab-case.tsx` - Component files
- `kebab-case.types.ts` - Type definitions
- `index.ts` - Barrel exports

### Components
- PascalCase for component names
- Descriptive and specific
- Suffix with purpose (e.g., Card, List, Form)

## Type Safety

- Strong TypeScript typing
- Shared interfaces in `/types/`
- Props interfaces with components
- No implicit any types

## State Management

- Local state with useState
- Server state with React Query
- Context for global state
- Props for component state

## Best Practices

1. **Component Organization**
   - Co-locate related code
   - Keep components focused
   - Use composition over inheritance

2. **Props**
   - Clear prop interfaces
   - Default values when appropriate
   - Optional props with `?`
   - Consistent naming

3. **Performance**
   - Lazy loading when needed
   - Memoization for expensive operations
   - Proper key usage in lists

4. **Accessibility**
   - Semantic HTML
   - ARIA attributes
   - Keyboard navigation
   - Color contrast

5. **Testing**
   - Component unit tests
   - Integration tests
   - Storybook stories

## Examples

### Feature Component
```tsx
// src/components/features/campaigns/campaign-list.tsx
interface CampaignListProps {
  campaigns: Campaign[]
  onCampaignClick?: (id: string) => void
}

export function CampaignList({ campaigns, onCampaignClick }: CampaignListProps) {
  return (
    <div className="space-y-4">
      {campaigns.map((campaign) => (
        <CampaignCard
          key={campaign.id}
          campaign={campaign}
          onClick={() => onCampaignClick?.(campaign.id)}
        />
      ))}
    </div>
  )
}
```

### Page Component
```tsx
// src/app/dashboard/campaigns/page.tsx
import { CampaignDashboard } from './_components/campaign-dashboard'

export default async function CampaignsPage() {
  const campaigns = await getCampaigns()
  return <CampaignDashboard campaigns={campaigns} />
}
```

## Migration Guide

When working with existing components:

1. Identify the component's category
2. Move to appropriate directory
3. Update imports
4. Add proper typing
5. Split into server/client if needed
6. Add to barrel exports
7. Update documentation

## Adding New Components

1. Determine the component category
2. Create in appropriate directory
3. Use consistent naming
4. Add TypeScript types
5. Add to barrel exports
6. Document usage
7. Add tests/stories

This architecture ensures:
- Clear organization
- Consistent patterns
- Type safety
- Reusability
- Maintainability
- Performance
- Scalability 