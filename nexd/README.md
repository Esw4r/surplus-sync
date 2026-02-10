# Food Rescue Platform - Web Dashboard (NEXD)

A unified web dashboard for **Admins**, **Dispatchers**, and **NGOs** to manage food rescue operations. Built with Next.js 14 and Tailwind CSS.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
cd nexd
npm install
```

### Running Locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

- `src/app` - App Router pages and layouts
- `src/components` - Reusable UI components
- `src/lib` - Utility functions and API services
- `src/hooks` - Custom React hooks
- `public` - Static assets

## 🔑 Key Features

- **Admin Dashboard**: User management, system stats, task oversight.
- **Dispatcher Dashboard**: Real-time map view, task assignment, volunteer tracking.
- **NGO Portal**: Claim donations, manage verify pickups/deliveries.
- **Authentication**: Role-based access via backend API.

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Maps**: Google Maps API / Leaflet (Dispatcher view)
- **State**: React Context / Hooks
