# Cyrus News Tracker

A modern news aggregation platform that tracks Iran-focused news from multiple RSS sources using Next.js and Supabase.

## Features

- 📰 Aggregates news from 26+ RSS sources including Iran-specific outlets
- 🔍 Real-time search and filtering
- 📱 Responsive design with modern UI
- ⚡ Supabase Edge Functions for RSS processing
- 🎯 Category-based news organization
- 🔄 Automatic RSS feed updates

## Prerequisites

- Node.js 18+ 
- Supabase account
- Git

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/ayyzad/CyrusNT.git
cd cyrus-news-tracker
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Configuration

Create a `.env.local` file in the project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
# Firecrawl API Configuration
FIRECRAWL_API_KEY=your_firecrawl_api_key
```

**To get these values:**
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to Settings → API
4. Copy the Project URL for `NEXT_PUBLIC_SUPABASE_URL`
5. Copy the anon/public key for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Copy the service_role key for `SUPABASE_SERVICE_ROLE_KEY`
7. Get your Firecrawl API key from the Firecrawl dashboard

### 4. Database Setup

Run the Supabase migrations to set up your database:

```bash
# Initialize Supabase (if not already done)
npx supabase init

# Link to your project
npx supabase link --project-ref your-project-ref

# Run migrations
npx supabase db push
```

### 5. Deploy Edge Functions

Deploy the RSS processing Edge Function:

```bash
npx supabase functions deploy fetch-rss
```

### 6. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### 7. Test RSS Processing

You can manually trigger RSS processing by visiting:
```
http://localhost:54321/functions/v1/fetch-rss?action=fetch
```

## Project Structure

```
├── app/                    # Next.js app directory
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── news-feed.tsx     # Main news feed component
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
│   ├── supabase.ts      # Supabase client configuration
│   └── articleService.ts # Article data service
├── supabase/             # Supabase configuration
│   ├── functions/        # Edge Functions
│   └── migrations/       # Database migrations
└── .env.local           # Environment variables (create this)
```

## RSS Sources

The platform aggregates news from 26+ sources including:

**Iran-Specific Sources:**
- Radio Farda
- VOA Iran
- IranWire
- Tehran Times
- IRNA
- Financial Tribune
- Tasnim News Agency
- Iran Front Page
- Iran Times
- And more...

**International Sources:**
- BBC World News
- Reuters
- CNN
- Associated Press
- Al Jazeera
- And more...

## Development

### Running Edge Functions Locally

```bash
npx supabase functions serve
```

### Database Migrations

```bash
# Create a new migration
npx supabase migration new migration_name

# Apply migrations
npx supabase db push
```

### Environment Variables

All environment variables should be added to `.env.local` (never commit this file).

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Supabase Edge Functions

Deploy functions using:
```bash
npx supabase functions deploy
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
