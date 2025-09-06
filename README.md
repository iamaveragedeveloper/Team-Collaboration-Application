# SynergySphere - Team Collaboration Application

A modern, responsive team collaboration application built with Next.js, TypeScript, TailwindCSS, and Supabase. Features include user authentication, project management, and a Kanban-style task board.

## Features

- 🔐 **Unified Authentication** - Single page for both login and signup with Supabase Auth
- 📊 **Enhanced Project Dashboard** - Visual progress tracking with completion percentages
- 📈 **Progress Visualization** - Color-coded progress bars and task breakdowns
- ➕ **Project Creation** - Beautiful modal for creating new projects
- 📋 **Drag & Drop Kanban Board** - Interactive task management with smooth drag-and-drop
- 🎯 **Interactive Task Cards** - Click menu for status changes and task deletion
- 📅 **Due Date Tracking** - Visual indicators for overdue, due today, and upcoming tasks
- 💬 **Real-time Chat** - Live project discussions with instant message delivery
- 👥 **Team Management** - View project members and manage team access
- 🏠 **Project Hub** - Tabbed interface for Board, Chat, and Members
- 🔔 **Smart Notifications** - Toast notifications with auto-dismiss and different types
- ⚠️ **Deadline Warnings** - Proactive alerts for upcoming task deadlines
- 👤 **User Profile Management** - Update profile information and view personal deadlines
- 📝 **Personal Task View** - "My Tasks" section showing all your pending tasks
- 🧭 **Enhanced Navigation** - Top navigation bar with profile access
- ⚡ **Real-time Updates** - Live synchronization across all users
- 📱 **Fully Responsive** - Works on mobile, tablet, and desktop
- ⚡ **Modern Stack** - Next.js 14, TypeScript, TailwindCSS, dnd-kit
- 🎨 **Beautiful UI** - Modern design with smooth animations and loading states

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: TailwindCSS
- **Drag & Drop**: @dnd-kit/core, @dnd-kit/sortable
- **Backend**: Supabase (Authentication, Database)
- **Deployment**: Vercel (recommended)

## Prerequisites

- Node.js 18+ installed
- A Supabase account and project
- Git

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd synergy-sphere
npm install
```

### 2. Environment Setup

1. Copy the environment file:
```bash
cp env.example .env.local
```

2. Update `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup

Create the following tables in your Supabase database:

The complete database schema includes tables for projects, tasks, user profiles, real-time chat messages, and team member management. 

**Run the complete setup script** in your Supabase SQL editor:
- `scripts/setup.sql` - Contains all tables, policies, indexes, and triggers

**Key Tables:**
- **projects** - Project information and ownership
- **tasks** - Kanban board tasks with status tracking  
- **profiles** - User profile information (auto-created on signup)
- **messages** - Real-time chat messages for projects
- **project_members** - Team member roles and permissions

**Features:**
- **Row Level Security (RLS)** on all tables
- **Automatic profile creation** for new users
- **Real-time subscriptions** enabled for chat
- **Optimized indexes** for performance
- **Proper foreign key relationships** with cascade deletes

### 4. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
src/
├── app/
│   ├── globals.css          # Global styles with TailwindCSS
│   ├── layout.tsx           # Root layout component
│   └── page.tsx             # Main app component with auth logic
├── components/
│   ├── Auth.tsx             # Unified login/signup form
│   ├── ChatBox.tsx          # Real-time chat component
│   ├── CreateProjectModal.tsx # Modal for creating new projects
│   ├── CreateTaskModal.tsx  # Modal for creating new tasks
│   ├── Dashboard.tsx        # Enhanced project dashboard with progress visualization
│   ├── Members.tsx          # Team member management
│   ├── MyTasks.tsx          # Personal task overview component
│   ├── NotificationContainer.tsx # Toast notification display
│   ├── ProfilePage.tsx      # User profile and deadline management
│   ├── ProjectPage.tsx      # Project hub with tabbed interface
│   ├── TaskBoard.tsx        # Drag & drop Kanban board with real-time sync
│   └── TaskCard.tsx         # Interactive draggable task cards
├── context/
│   └── NotificationContext.tsx # Global notification state management
├── hooks/
│   ├── useClickOutside.ts   # Custom hook for detecting outside clicks
│   └── useRealtimeMessages.ts # Custom hook for real-time chat
├── lib/
│   └── supabaseClient.ts    # Supabase client configuration
└── types/
    └── index.ts             # Shared TypeScript interfaces
```

## Features Ready for Extension

### 1. ✅ Project Creation (IMPLEMENTED)
- **Create New Projects**: Beautiful modal with name and description
- **Real-time Updates**: Projects appear immediately without page refresh
- **Form Validation**: Proper error handling and loading states

### 2. ✅ Complete Task Management (IMPLEMENTED)
- **Create Tasks**: Modal for adding tasks to any column (To-Do, In Progress, Done)
- **Status Changes**: Click task menu to move between columns
- **Task Deletion**: Delete tasks with confirmation dialog
- **Due Date Tracking**: Visual indicators for overdue and upcoming tasks
- **Optimistic Updates**: Instant UI updates with database sync
- **Form Validation**: Proper error handling and loading states

### 3. ✅ Real-time Chat & Project Hub (IMPLEMENTED)
- **Live Chat**: Real-time messaging with Supabase subscriptions
- **Message History**: Persistent chat history with user profiles
- **Project Hub**: Tabbed interface for Board, Chat, and Members
- **Auto-scroll**: Messages automatically scroll to latest
- **User Avatars**: Generated initials for user identification
- **Timestamps**: Smart time formatting (today, yesterday, dates)

### 4. ✅ Enhanced Dashboard & Notifications (IMPLEMENTED)
- **Progress Visualization**: Color-coded progress bars showing task completion
- **Project Status Badges**: Visual indicators (New, Planning, Active, Complete)
- **Task Breakdown**: Detailed view of todo, in-progress, and done tasks
- **Smart Notifications**: Toast notifications with success, error, warning, info types
- **Deadline Warnings**: Proactive alerts for tasks due today or tomorrow
- **Profile Management**: User profile editing with name updates
- **Navigation Bar**: Top navigation with profile access and logout

### 5. ✅ Drag & Drop Kanban Board (IMPLEMENTED)
- **Smooth Drag & Drop**: Powered by @dnd-kit for modern, accessible interactions
- **Visual Feedback**: Tasks rotate and scale during drag with overlay preview
- **Cross-Column Movement**: Drag tasks between To-Do, In Progress, and Done
- **Real-time Sync**: Changes instantly sync across all connected users
- **Touch Support**: Works perfectly on mobile devices with touch gestures
- **Optimistic Updates**: Immediate UI response with database synchronization

### 6. Real-time Collaboration
- Supabase real-time subscriptions for live updates
- Real-time chat integration
- Live cursor tracking

### 7. Team Management
- User invitations to projects
- Role-based permissions
- Team member avatars and profiles

## 🎮 How to Use

### **Drag & Drop Tasks**
1. **Navigate to any project** from the dashboard
2. **Click the "Task Board" tab** in the project hub
3. **Drag any task card** to move it between columns (To-Do ↔ In Progress ↔ Done)
4. **Watch real-time updates** - other users see changes instantly
5. **Use on mobile** - touch and drag works perfectly

### **Create and Manage Projects**
1. **Click "New Project"** on the dashboard
2. **Add project name and description**
3. **View progress visualization** on each project card
4. **Access project hub** with Board, Chat, and Members tabs

### **Real-time Collaboration**
1. **Open the same project** on multiple devices/browsers
2. **Drag tasks** on one device and see them move on others
3. **Chat in real-time** using the Discussion tab
4. **Get notifications** for important updates and deadlines

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- AWS Amplify
- DigitalOcean App Platform

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

---

Built with ❤️ using Next.js, TypeScript, and TailwindCSS
