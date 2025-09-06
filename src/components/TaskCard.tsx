'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '../types';

interface TaskCardProps {
  task: Task;
  // The onDelete and onStatusChange props are not used in the UI part of this component,
  // but they are required by the TaskBoard, so we keep them.
  onStatusChange: (taskId: string, newStatus: 'todo' | 'in_progress' | 'done') => void;
  onDelete: (taskId: string) => void;
}

export default function TaskCard({ task }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
  };

  const priorityStyles = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };

  const getDueDateInfo = (dateString: string | null) => {
    if (!dateString) return { text: 'No due date', color: 'text-gray-500' };
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: 'Overdue', color: 'text-red-600' };
    if (diffDays === 0) return { text: 'Due today', color: 'text-orange-600' };
    return { text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), color: 'text-gray-600' };
  };

  const dueDate = getDueDateInfo(task.due_date);

  // FIX: This ensures task.priority is a valid key before being used.
  const priority = task.priority && (task.priority in priorityStyles) ? task.priority : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`group p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow relative touch-manipulation ${
        isDragging ? 'opacity-75 shadow-2xl rotate-3 z-50' : ''
      }`}
    >
      <div className="flex justify-between items-start">
        <h4 className="font-semibold text-gray-800 pr-8 leading-snug">{task.title}</h4>
        {/* Drag Handle */}
        <div {...listeners} className="cursor-grab active:cursor-grabbing p-1 -mt-1 -mr-1 text-gray-400 hover:text-gray-700">
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
        </div>
      </div>

      {task.description && (
        <p className="text-sm text-gray-600 my-2 break-words">{task.description}</p>
      )}

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center space-x-2">
          {/* This block is now fully type-safe */}
          {priority && (
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${priorityStyles[priority]}`}>
              {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </span>
          )}
          {task.due_date && (
            <div className={`flex items-center space-x-1 text-xs font-medium ${dueDate.color}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>{dueDate.text}</span>
            </div>
          )}
        </div>
        
        <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center border-2 border-white">
          <span className="text-xs font-bold text-gray-600">
            {task.assigned_to ? 'A' : '?'}
          </span>
        </div>
      </div>
    </div>
  );
}