# DoneThisApp

**DoneThisApp** is a modern, AI-assisted to-do/task management web application that combats procrastination and boosts productivity. Built with Nuxt.js (Vue 3) and powered by Supabase, it combines AI-driven features with a clear, motivating user interface and a focus on getting your tasks *done*. The app can be previewed at [done-this-app.vercel.app](https://done-this-app.vercel.app).

Developed as part of the "Studio Web 1" module at Lucerne University of Applied Sciences and Arts.

---

## 🚩 What the Project Does

DoneThisApp helps users manage tasks from idea inception to completion with features like AI-assisted task entry (by typing or speaking), an interactive task board, distraction-free Focus Mode, and end-to-end task management—from creation and editing to archiving completed jobs. The experience is designed for engagement and clarity.

---

## ✨ Key Features & Benefits

- **AI-Assisted Task Creation**: Input tasks via voice or text; an AI assistant transcribes and drafts full task details (name, description, subtasks, category, and due dates).
- **Interactive Task Board**: Manage tasks on a dynamic board where each card has a unique, procedurally generated background. Quickly filter by customizable categories.
- **Focus Mode**: Dedicate your attention to a single objective in a distraction-free view showing only the current goal and its subtasks.
- **Comprehensive Task Management**:
  - *Edit*: Flip a task card to update details, add/remove subtasks, or change metadata.
  - *Complete*: Mark as done with a satisfying animation; move to the archive.
  - *Archive*: Browse completed tasks and reset any to reactivate.
- **Authentication**: Secure sign-in handled by Supabase supporting both email magic link and Google OAuth.
- **Engaging Animations**: Integrated Lottie animations enliven the interface for loading and AI interactions.
- **Accessible Setup**: Simple local development and modern deployment, with a unified backend (Supabase) for auth, data, and storage.
- **All-in-one Solution**: Both server-side and API endpoints are integrated using Nuxt and Supabase.

---

## 🛠️ Technology Stack

**Frontend:**
- **Nuxt.js (Vue 3):** Main app framework.
- **Tailwind CSS:** Utility-first responsive styling.
- **Lottie / Nuxt-Lottie:** For engaging animations and delightful UI feedback.

**Backend:**
- **Nuxt Server Engine:** Handles custom backend endpoints.
- **Supabase:** One-stop backend for:
  - **Database:** PostgreSQL storage for all app data.
  - **Auth:** Secure, multi-provider authentication.
  - **Storage:** Save audio recordings for AI tasks.

**AI & Machine Learning:**
- **Replicate API:** Runs models for:
  - **Transcription:** Converts voice recordings to text.
  - **Task Drafting:** Processes transcripts and conversation history for smart, structured task suggestions.

---

## 🗂️ Project Structure

- `/app/` – Nuxt application
  - `/components/` – Reusable Vue components (`TaskCard`, `CategoryCard`, `EditCard`, etc.)
  - `/composables/` – Core logic and state management (`useTasks`, `useAudioRecorder`, etc.)
  - `/pages/` – Main app pages/views (`/mytasks`, `/taskcreator`, `/focus`, etc.)
  - `/middleware/` – Route guards (e.g. `auth.ts`)
  - `/assets/` – Styles & static assets
  - `/types/` – TypeScript types
- `/server/api/` – Backend endpoints for Supabase & Replicate AI
- `/public/` – Static assets, fonts, and card backgrounds
- `/supabase/` – Supabase configuration for local development

---

## 🌐 Live Demo

Visit: [https://done-this-app.vercel.app](https://done-this-app.vercel.app)

---

**Built with ❤️ using Nuxt, Vue, Supabase, and AI.**
