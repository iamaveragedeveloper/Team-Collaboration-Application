'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  // This prop is required by the parent but not used directly here
  onStatusChange: (taskId: string, newStatus: 'todo' | 'in_progress' | 'done') => void;
}

export default function TaskCard({ task, onDelete, onEdit }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleDelete = (e: React.MouseEvent) => {
    // Stop the event from bubbling up to the drag handle
    e.stopPropagation(); 
    if (window.confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    // Stop the event from bubbling up to the drag handle
    e.stopPropagation(); 
    onEdit(task);
  };
  
  return (
    // The main container gets the node reference for dnd-kit
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`group mb-3 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 relative touch-none flex flex-col ${
        isDragging ? 'opacity-50 rotate-3 scale-105 z-50' : ''
      }`}
    >
      {/* This top section is the DRAG HANDLE. 
        The {...listeners} from useSortable are applied here.
      */}
      <div 
        {...listeners} 
        className="p-4 cursor-grab active:cursor-grabbing"
      >
        <h4 className="font-semibold text-gray-900 mb-2 leading-tight">
          {task.title}
        </h4>
        
        {task.description && (
          <p className="text-sm text-gray-600 break-words leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      {/* This bottom section contains the BUTTONS.
        It does NOT have the drag listeners, so the buttons can be clicked safely.
      */}
      <div className="flex items-center justify-end space-x-2 px-4 py-2 border-t border-gray-100">
        <button
          onClick={handleEdit}
          className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={handleDelete}
          className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

