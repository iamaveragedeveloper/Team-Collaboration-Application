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

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // This hook will close the menu when you click outside of it
  useClickOutside(menuRef, () => setMenuOpen(false));

  const handleStatusChange = (newStatus: 'todo' | 'in_progress' | 'done') => {
    onStatusChange(task.id, newStatus);
    setMenuOpen(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id);
    }
    setMenuOpen(false);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'todo': return 'To-Do';
      case 'in_progress': return 'In Progress';
      case 'done': return 'Done';
      default: return status;
    }
  };

  const formatDueDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else {
      return `Due in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    }
  };

  const getDueDateColor = (dateString: string | null) => {
    if (!dateString) return 'text-gray-500';
    
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'text-red-600'; // Overdue
    if (diffDays === 0) return 'text-orange-600'; // Due today
    if (diffDays <= 3) return 'text-yellow-600'; // Due soon
    return 'text-gray-500'; // Future
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`group p-4 mb-3 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 relative touch-none ${
        isDragging ? 'opacity-50 rotate-3 scale-105 z-50' : ''
      }`}
    >
      <div className="pr-8"> {/* Add padding to avoid overlap with menu button */}
        <h4 className="font-semibold text-gray-900 mb-2 leading-tight">
          {task.title}
        </h4>
        
        {task.description && (
          <p className="text-sm text-gray-600 mb-3 break-words leading-relaxed">
            {task.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div className={`text-xs font-medium ${getDueDateColor(task.due_date)}`}>
            {formatDueDate(task.due_date)}
          </div>
          
          {/* Priority indicator (if we had priority field) */}
          <div className="flex items-center space-x-1">
            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600">
                {task.assigned_to ? 'A' : '?'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Drag Handle (invisible but covers most of the card) */}
      <div 
        {...listeners}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        style={{ zIndex: 1 }}
      />

      {/* Action Menu Button */}
      <button 
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen(!menuOpen);
        }}
        className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ zIndex: 10 }} // Ensure menu button is above drag handle
        aria-label="Task actions"
      >
        <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {/* Action Menu Dropdown */}
      {menuOpen && (
        <div 
          ref={menuRef} 
          className="absolute right-0 top-10 z-50 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1"
        >
          <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
            Move to
          </div>
          
          {['todo', 'in_progress', 'done'].map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status as 'todo' | 'in_progress' | 'done')}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                task.status === status 
                  ? 'text-indigo-600 bg-indigo-50' 
                  : 'text-gray-700'
              }`}
              disabled={task.status === status}
            >
              <div className="flex items-center justify-between">
                <span>{getStatusLabel(status)}</span>
                {task.status === status && (
                  <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </button>
          ))}
          
          <div className="border-t border-gray-100 my-1"></div>
          
          <button
            onClick={handleDelete}
            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Delete Task</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
