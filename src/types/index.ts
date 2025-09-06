// src/types/index.ts

export interface Project {
  id: string;
  name: string;
  description?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  priority?: 'low' | 'medium' | 'high';
  due_date: string | null;
  project_id: string;
  assigned_to?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MyTask {
  id: string;
  title: string;
  due_date: string | null;
  status: string;
  // FIX: This now correctly expects 'projects' to be an array of project objects.
  projects: {
    name: string;
  }[];
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}