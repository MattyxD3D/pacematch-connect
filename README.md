# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/509862a0-abc0-4388-a16b-4865e8a41c11

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/509862a0-abc0-4388-a16b-4865e8a41c11) and start prompting.

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

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Google Maps API Key (required for map features)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# OpenWeatherMap API Key (required for weather widget on feed)
# Get your free API key at: https://openweathermap.org/api
# Free tier: 1,000 calls/day
VITE_OPENWEATHER_API_KEY=your_openweather_api_key_here
```

### Getting an OpenWeatherMap API Key

1. Sign up at [OpenWeatherMap](https://openweathermap.org/api)
2. Navigate to API Keys section
3. Generate a new API key (free tier available)
4. Copy the key and add it to your `.env` file as `VITE_OPENWEATHER_API_KEY`

**Note**: The weather widget will gracefully fail if the API key is not configured (it simply won't display).

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

Simply open [Lovable](https://lovable.dev/projects/509862a0-abc0-4388-a16b-4865e8a41c11) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
