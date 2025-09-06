'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  // This prop is still required by the parent but not used directly here
  onStatusChange: (taskId: string, newStatus: 'todo' | 'in_progress' | 'done') => void;
}

export default function TaskCard({ task, onDelete, onEdit }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent drag-and-drop when clicking the button
    if (window.confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent drag-and-drop when clicking the button
    onEdit(task);
  };
  
  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners} // Make the entire card draggable
      className={`group p-4 mb-3 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 relative touch-none cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50 rotate-3 scale-105 z-50' : ''
      }`}
    >
      <div>
        <h4 className="font-semibold text-gray-900 mb-2 leading-tight">
          {task.title}
        </h4>
        
        {task.description && (
          <p className="text-sm text-gray-600 mb-3 break-words leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-2 mt-4 pt-2 border-t border-gray-100">
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
