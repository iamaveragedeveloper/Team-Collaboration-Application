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
    transition,
  };

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

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`p-4 mb-3 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 relative touch-none ${
        isDragging ? 'opacity-50 rotate-3 scale-105 z-50' : ''
      }`}
    >
      <div className="pr-8">
        <h4 className="font-semibold text-gray-900 mb-2 leading-tight">
          {task.title}
        </h4>
        
        {task.description && (
          <p className="text-sm text-gray-600 mb-3 break-words leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      {/* Drag Handle */}
      <div 
        {...listeners}
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        style={{ zIndex: 1 }}
      />

      {/* Action Menu Button -- Made permanently visible */}
      <button 
        onClick={(e) => {
          e.stopPropagation(); // Prevent drag from firing on click
          setMenuOpen(!menuOpen);
        }}
        className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 transition-opacity duration-200"
        style={{ zIndex: 10 }}
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
                task.status === status ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700'
              }`}
              disabled={task.status === status}
            >
              {getStatusLabel(status)}
            </button>
          ))}
          
          <div className="border-t border-gray-100 my-1"></div>
          
          <button
            onClick={handleDelete}
            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            Delete Task
          </button>
        </div>
      )}
    </div>
  );
}