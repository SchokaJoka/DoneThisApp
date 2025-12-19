# DoneThisApp

DoneThisApp is an intelligent task management web application that combines AI-driven features with a clear, motivating user interface. Built with Nuxt.js and Supabase, it guides users from idea inception to task completion with a focus on clarity and engagement. The project was developed as part of the "Studio Web 1" module at Lucerne University of Applied Sciences and Arts.

## Key Features

*   **AI-Assisted Task Creation**: Create tasks by speaking or typing. The app uses an AI assistant to transcribe voice input and draft task details, including name, description, subtasks, category, and due dates.
*   **Interactive Task Board**: View and manage your tasks on a dynamic board of cards. Tasks can be filtered by customizable categories, and each card features a unique, procedurally generated background.
*   **Focus Mode**: Dedicate your attention to a single task in a distraction-free view that highlights the current objective and subtasks.
*   **Comprehensive Task Management**:
    *   **Edit**: Flip task cards to edit details, add/remove subtasks, and change categories or deadlines.
    *   **Complete**: Mark tasks as done with a satisfying animation, moving them to the archive.
    *   **Archive**: Review all completed tasks. You can reset a task to move it back to your active list.
*   **Authentication**: Secure user authentication is handled by Supabase, supporting both email-based magic links and Google OAuth.

## Technology Stack

*   **Frontend**:
    *   **Nuxt.js**: A powerful Vue.js framework for building the user interface.
    *   **Tailwind CSS**: For modern, responsive, and utility-first styling.
    *   **Lottie**: Used for engaging animations throughout the app, such as the loading sequence and AI assistant interactions.

*   **Backend**:
    *   **Nuxt Server Engine**: Powers the server-side API endpoints.
    *   **Supabase**: The all-in-one backend solution for:
        *   **Database**: PostgreSQL for storing all application data.
        *   **Auth**: Manages user sign-up, login, and sessions.
        *   **Storage**: Stores audio recordings for AI transcription.

*   **AI & Machine Learning**:
    *   **Replicate API**: Used to run models for:
        *   **Transcription**: Converts user's voice recordings into text.
        *   **Task Drafting**: An AI assistant processes the transcript and conversation context to generate a structured task draft.

## Project Structure

The repository is organized into the following key directories:

*   `/app`: Contains the Nuxt.js frontend application.
    *   `/app/components`: Reusable Vue components like `TaskCard`, `CategoryCard`, and `EditCard`.
    *   `/app/composables`: The core application logic, including state management and API interactions (`useTasks`, `useAudioRecorder`, etc.).
    *   `/app/pages`: The main pages/views of the application, such as `/mytasks`, `/taskcreator`, and `/focus`.
    *   `/app/middleware`: Includes `auth.ts` for route protection.
*   `/server/api`: Backend API endpoints that interact with Supabase and the Replicate AI service.
*   `/public`: Static assets, including fonts and background images for task cards.
*   `/supabase`: Configuration for local Supabase development.

## Getting Started

### Prerequisites
*   Node.js (v18 or newer)
*   npm, pnpm, yarn, or bun
*   A Supabase account to get API keys.
*   A Replicate account to get an API token.
