'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Corrected import path
import type { Project, Task } from '../types';

interface CreateTaskModalProps {
  project: Project;
  defaultStatus: 'todo' | 'in_progress' | 'done';
  taskToEdit?: Task | null; // Optional: The task to be edited
  onClose: () => void;
  onTaskCreated: (task: Task) => void;
  onTaskUpdated: (task: Task) => void; // Callback for when a task is updated
}

export default function CreateTaskModal({ 
  project, 
  defaultStatus, 
  taskToEdit,
  onClose, 
  onTaskCreated,
  onTaskUpdated
}: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const isEditMode = !!taskToEdit;

  useEffect(() => {
    // If we are in edit mode, pre-fill the form fields
    if (isEditMode && taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      // Ensure due_date is correctly formatted for the input type="date"
      setDueDate(taskToEdit.due_date ? taskToEdit.due_date.split('T')[0] : '');
    }
  }, [taskToEdit, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);

    if (isEditMode && taskToEdit) {
      // Handle UPDATE logic
      const { data, error } = await supabase
        .from('tasks')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          due_date: dueDate || null,
        })
        .eq('id', taskToEdit.id)
        .select()
        .single();
      
      setLoading(false);
      if (error) {
        alert('Error updating task: ' + error.message);
      } else {
        onTaskUpdated(data);
        onClose();
      }
    } else {
      // Handle CREATE logic (existing logic)
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          project_id: project.id,
          title: title.trim(),
          description: description.trim() || null,
          due_date: dueDate || null,
          status: defaultStatus,
        })
        .select()
        .single();
      
      setLoading(false);
      if (error) {
        alert('Error creating task: ' + error.message);
      } else {
        onTaskCreated(data);
        onClose();
      }
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={handleBackdropClick}>
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">{isEditMode ? 'Edit Task' : 'Add New Task'}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="taskTitle" className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input id="taskTitle" type="text" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea id="taskDescription" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <div>
              <label htmlFor="taskDueDate" className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input id="taskDueDate" type="date" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50" disabled={loading || !title.trim()}>
                {loading ? 'Saving...' : (isEditMode ? 'Update Task' : 'Add Task')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

