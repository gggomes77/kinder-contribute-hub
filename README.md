# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/c569ec0a-83e2-409e-a692-9cf51ac34f41

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/c569ec0a-83e2-409e-a692-9cf51ac34f41) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Set up environment variables.
# Copy the .env.example file to .env and fill in your Supabase credentials
cp .env.example .env
# Then edit .env with your actual values

# Step 5: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## Environment Variables

This project requires Supabase configuration. To set up:

1. Copy `.env.example` to `.env`:
   ```sh
   cp .env.example .env
   ```

2. Fill in your Supabase credentials in `.env`:
   - `VITE_SUPABASE_PROJECT_ID`: Your Supabase project ID
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: Your Supabase anon/public key
   - `VITE_SUPABASE_URL`: Your Supabase project URL

You can find these values in your [Supabase project settings](https://supabase.com/dashboard/project/_/settings/api).

## Security Best Practices

**CRITICAL**: The `service_role` key has full admin access to your database and bypasses all Row Level Security (RLS) policies.

- ✅ **DO** use `service_role` keys only in serverless/edge functions on the backend
- ✅ **DO** use the `anon` (publishable) key in your frontend code
- ❌ **NEVER** expose `service_role` keys in frontend code, git repositories, or client-side applications
- ❌ **NEVER** commit `.env` files containing real secrets to version control

Using the `service_role` key in frontend code would allow anyone to access, modify, or delete any data in your database.

## Row Level Security (RLS) Policies

This application uses a **custom family-based authentication system** with comprehensive RLS policies:

### Authentication Model
- Users authenticate as "families" (not individual Supabase Auth users)
- The current family is tracked via `current_setting('app.current_family')` 
- Family membership is stored in `localStorage` and validated against the `families` table

### Security Rules
1. **Family Data Isolation**: Each family can only access and modify their own data
2. **Admin Privileges**: Families with `is_admin = true` have elevated permissions
3. **All tables have RLS enabled** with appropriate policies for SELECT, INSERT, UPDATE, and DELETE operations

### Policy Summary by Table
- **families**: Read-only for login; admins can create/update/delete families
- **tasks**: Admins can manage; all families can view
- **task_assignments**: Families can manage their own assignments
- **cleaning_slots**: All can view/create; admins can update/delete
- **cleaning_assignments**: Families can manage their own assignments
- **time_contributions**: Families can create/update/delete their own; admins have full access

All RLS policies are defined in the `supabase/migrations/` folder and applied automatically.

```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/c569ec0a-83e2-409e-a692-9cf51ac34f41) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
