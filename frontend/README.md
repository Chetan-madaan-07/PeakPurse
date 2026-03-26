# PeakPurse Frontend

Next.js-based frontend application for the PeakPurse intelligent personal finance platform.

## Overview

A modern, responsive web application built with Next.js 14, TypeScript, and Tailwind CSS. The frontend provides an intuitive interface for users to manage their finances, track expenses, file taxes, and get personalized recommendations.

## Architecture

### Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **State Management**: Zustand for global state
- **Data Fetching**: React Query with Axios
- **Forms**: React Hook Form with Zod validation
- **UI Components**: Headless UI + custom components
- **Charts**: Recharts and Chart.js
- **Icons**: Lucide React
- **Animations**: Framer Motion

### Key Features

- **Responsive Design**: Mobile-first approach with desktop optimization
- **Real-time Updates**: WebSocket integration for live data
- **Progressive Web App**: Offline support and installable
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Optimized bundle size and loading strategies

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env.local

# Update .env.local with your configuration
```

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:3001
```

### Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm start

# Export static files (if needed)
npm run export
```

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── dashboard/      # Dashboard components
│   ├── finance/        # Finance management components
│   ├── tax/           # Tax filing components
│   ├── ca/            # CA directory components
│   ├── chatbot/       # Chat interface components
│   ├── investment/    # Investment planning components
│   └── common/        # Shared components
├── contexts/           # React contexts
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
├── types/              # TypeScript type definitions
├── utils/              # Helper functions
└── styles/             # Global styles and CSS
```

## Key Components

### Authentication

- **Login/Registration**: Secure forms with validation
- **2FA Setup**: TOTP QR code generation and verification
- **Password Reset**: Email-based password recovery
- **Session Management**: Automatic token refresh

### Dashboard

- **Financial Overview**: Health score and key metrics
- **Recent Transactions**: Paginated transaction list
- **Budget Progress**: Visual budget utilization
- **Goal Tracking**: Progress bars and milestones
- **Quick Actions**: Common tasks and shortcuts

### Finance Management

- **Transaction Categorization**: Interactive categorization with ML suggestions
- **Budget Creation**: Step-by-step budget setup wizard
- **Goal Planning**: Goal creation with feasibility analysis
- **Subscription Tracking**: Detected subscriptions with management options
- **Reports**: Interactive charts and exportable reports

### Tax Filing

- **Tax Profile Setup**: Guided tax information collection
- **Deduction Discovery**: Smart deduction recommendations
- **Regime Comparison**: Old vs new tax regime analysis
- **Export Options**: Download tax summaries for filing

### Investment Planning

- **Risk Profiling**: Interactive questionnaire
- **Goal Mapping**: Link goals to investment strategies
- **Portfolio Recommendations**: Asset category allocations
- **Tax Benefits**: 80C/80CCD optimization suggestions

### Chat Interface

- **Natural Language Queries**: Ask questions about finances
- **Action Orchestration**: Trigger workflows through chat
- **Context Awareness**: Maintains conversation history
- **Voice Support**: Speech-to-text input (optional)

## State Management

### Global State (Zustand)

```typescript
// Example auth store
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}
```

### Server State (React Query)

```typescript
// Example transaction query
const { data: transactions, isLoading, error } = useQuery({
  queryKey: ['transactions', { page, filters }],
  queryFn: () => fetchTransactions(page, filters),
});
```

## Styling System

### Design Tokens

```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: { /* custom color palette */ },
      // ... other design tokens
    },
    animation: {
      'fade-in': 'fadeIn 0.5s ease-in-out',
      // ... custom animations
    }
  }
}
```

### Component Variants

Using clsx and tailwind-merge for conditional styling:

```typescript
const buttonVariants = {
  variant: {
    primary: 'bg-primary-600 text-white hover:bg-primary-700',
    secondary: 'bg-secondary-100 text-secondary-900 hover:bg-secondary-200',
    // ... other variants
  },
  size: {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    // ... other sizes
  }
};
```

## Data Fetching

### API Client

```typescript
// lib/api.ts
class ApiClient {
  async get<T>(url: string, params?: any): Promise<T> {
    // Implementation with error handling and auth
  }
  
  async post<T>(url: string, data?: any): Promise<T> {
    // Implementation
  }
}
```

### React Query Hooks

```typescript
// hooks/useTransactions.ts
export function useTransactions(page: number, filters: TransactionFilters) {
  return useQuery({
    queryKey: ['transactions', page, filters],
    queryFn: () => apiClient.get<Transaction[]>(`/transactions`, { page, ...filters }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

## Form Handling

### Validation Schema

```typescript
// schemas/transaction.ts
const transactionSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  categoryId: z.string().uuid('Invalid category'),
  date: z.date(),
  merchantName: z.string().min(1, 'Merchant name is required'),
});
```

### Form Component

```typescript
// components/forms/TransactionForm.tsx
export function TransactionForm() {
  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
  });
  
  // Form implementation
}
```

## Testing

```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Storybook
npm run storybook
```

## Performance Optimization

### Code Splitting

- Automatic route-based code splitting
- Dynamic imports for heavy components
- Lazy loading of images and data

### Bundle Optimization

- Tree shaking for unused code
- Image optimization with Next.js Image
- Font optimization with next/font

### Caching Strategy

- React Query for server state caching
- Service Worker for offline caching
- CDN for static assets

## Accessibility

- Semantic HTML5 elements
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus management

## Internationalization

Ready for multi-language support:

```typescript
// i18n configuration
const resources = {
  en: { translation: require('./locales/en.json') },
  hi: { translation: require('./locales/hi.json') },
};
```

## Environment Variables

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000

# Feature Flags
NEXT_PUBLIC_ENABLE_CHATBOT=true
NEXT_PUBLIC_ENABLE_BENCHMARKING=true

# Third-party Services
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Docker

```bash
# Build image
docker build -t peakpurse-frontend .

# Run container
docker run -p 3001:3001 peakpurse-frontend
```

### Static Export

```bash
# Export static files
npm run build
npm run export

# Deploy to any static hosting
```

## Monitoring

- **Performance**: Web Vitals monitoring
- **Errors**: Sentry integration
- **Analytics**: Google Analytics
- **User Behavior**: Hotjar (optional)

## Contributing

1. Follow the component naming conventions
2. Use TypeScript strictly
3. Write tests for new components
4. Follow accessibility guidelines
5. Optimize for mobile first
6. Use semantic HTML

## Support

For frontend-specific issues:
- Check the component documentation
- Review the Storybook stories
- Create an issue with reproduction steps
- Contact the frontend team
