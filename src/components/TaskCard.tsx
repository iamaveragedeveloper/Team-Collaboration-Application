'use client';

import React, { useState, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import useClickOutside from '../hooks/useClickOutside';
import type { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, newStatus: 'todo' | 'in_progress' | 'done') => void;
  onDelete: (taskId: string) => void;
}

export default function TaskCard({ task, onStatusChange, onDelete }: TaskCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition, // Prevent transition during drag
  };

  useClickOutside(menuRef, () => setMenuOpen(false));

  const handleStatusChange = (newStatus: 'todo' | 'in_progress' | 'done') => {
    onStatusChange(task.id, newStatus);
    setMenuOpen(false);
  };

  const handleDelete = () => {
    onDelete(task.id);
    setMenuOpen(false);
  };

  // Priority styles using the new color palette
  const priorityStyles = {
    low: 'bg-primary-100 text-primary-800',
    medium: 'bg-warning-100 text-warning-800',
    high: 'bg-danger-100 text-danger-800',
  };

  const getDueDateInfo = (dateString: string | null) => {
    if (!dateString) return { text: 'No due date', color: 'text-gray-500' };
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: 'Overdue', color: 'text-danger-600' };
    if (diffDays === 0) return { text: 'Due today', color: 'text-warning-600' };
    return { text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), color: 'text-gray-600' };
  };

  const dueDate = getDueDateInfo(task.due_date);

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
        <h4 className="font-semibold text-gray-800 pr-8 leading-snug flex-1">{task.title}</h4>
        {/* Drag Handle */}
        <div {...listeners} className="cursor-grab active:cursor-grabbing p-1 -mt-1 -mr-1 text-gray-400 hover:text-gray-700 flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="5" r="1"/>
            <circle cx="12" cy="12" r="1"/>
            <circle cx="12" cy="19" r="1"/>
          </svg>
        </div>
      </div>

      {task.description && (
        <p className="text-sm text-gray-600 my-2 break-words leading-relaxed">{task.description}</p>
      )}

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center space-x-2">
          {/* Priority indicator - assuming task has priority field */}
          {(task as any).priority && (
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${priorityStyles[(task as any).priority] || priorityStyles.medium}`}>
              {((task as any).priority as string).charAt(0).toUpperCase() + ((task as any).priority as string).slice(1)}
            </span>
          )}
          
          {/* Due date with calendar icon */}
          {task.due_date && (
            <div className={`flex items-center space-x-1 text-xs font-medium ${dueDate.color}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>{dueDate.text}</span>
            </div>
          )}
        </div>
        
        {/* Avatar placeholder */}
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center border-2 border-white">
            <span className="text-xs font-bold text-primary-600">
              {(task as any).assigned_to ? 'A' : '?'}
            </span>
          </div>
          
          {/* Action Menu Button */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="p-1 rounded-full hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            aria-label="Task actions"
          >
            <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Action Menu Dropdown */}
      {menuOpen && (
        <div 
          ref={menuRef} 
          className="absolute right-0 top-10 z-50 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 animate-scale-in"
        >
          <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
            Move to
          </div>
          
          {['todo', 'in_progress', 'done'].map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status as 'todo' | 'in_progress' | 'done')}
              disabled={task.status === status}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                task.status === status ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700'
              }`}
            >
              {status === 'todo' ? 'To Do' : status === 'in_progress' ? 'In Progress' : 'Done'}
              {task.status === status && <span className="text-xs ml-2">(current)</span>}
            </button>
          ))}
          
          <div className="border-t border-gray-100 mt-1">
            <button
              onClick={handleDelete}
              className="w-full text-left px-3 py-2 text-sm text-danger-600 hover:bg-danger-50 transition-colors"
            >
              Delete Task
            </button>
          </div>
        </div>
      )}
    </div>
  );
}