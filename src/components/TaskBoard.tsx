'use client';

import React, { useState, useEffect } from 'react';
import { DndContext, closestCorners, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { supabase } from '../lib/supabaseClient';
import CreateTaskModal from './CreateTaskModal';
import TaskCard from './TaskCard';
import type { Task, Project } from '../types';

interface TaskBoardProps {
  project: Project;
  onBack: () => void;
}

const ColumnHeader = ({ title, count, color }: { title: string; count: number; color: string }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center space-x-2">
      <div className={`w-3 h-3 rounded-full ${color}`}></div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
        {count}
      </span>
    </div>
    <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    </button>
  </div>
);

// Droppable Column component
const DroppableColumn = ({ 
  id, 
  title, 
  tasks, 
  onAddTask, 
  onStatusChange, 
  onDelete 
}: {
  id: string;
  title: string;
  tasks: Task[];
  onAddTask: () => void;
  onStatusChange: (taskId: string, newStatus: 'todo' | 'in_progress' | 'done') => void;
  onDelete: (taskId: string) => void;
}) => {
  const getColumnColor = () => {
    switch (id) {
      case 'todo': return 'bg-gray-100';
      case 'in_progress': return 'bg-blue-50';
      case 'done': return 'bg-green-50';
      default: return 'bg-gray-100';
    }
  };

  const getButtonColor = () => {
    switch (id) {
      case 'todo': return 'text-gray-600 border-gray-300 hover:border-gray-400 hover:bg-gray-50';
      case 'in_progress': return 'text-blue-600 border-blue-300 hover:border-blue-400 hover:bg-blue-100';
      case 'done': return 'text-green-600 border-green-300 hover:border-green-400 hover:bg-green-100';
      default: return 'text-gray-600 border-gray-300 hover:border-gray-400 hover:bg-gray-50';
    }
  };

  return (
    <div className={`${getColumnColor()} rounded-xl p-4 min-h-[600px]`}>
      <ColumnHeader title={title} count={tasks.length} color={id === 'todo' ? 'bg-gray-400' : id === 'in_progress' ? 'bg-blue-400' : 'bg-green-400'} />
      
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3 mb-4 min-h-[400px]">
          {tasks.map((task) => (
            <TaskCard 
              key={task.id} 
              task={task}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
            />
          ))}
          {tasks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p>No tasks {id === 'todo' ? 'to do' : id === 'in_progress' ? 'in progress' : 'completed'}</p>
            </div>
          )}
        </div>
      </SortableContext>
      
      <button
        onClick={onAddTask}
        className={`w-full px-3 py-2 text-sm font-medium border-2 border-dashed rounded-lg transition-colors flex items-center justify-center space-x-2 ${getButtonColor()}`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span>Add Task</span>
      </button>
    </div>
  );
};

export default function TaskBoard({ project, onBack }: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [defaultStatusForModal, setDefaultStatusForModal] = useState<'todo' | 'in_progress' | 'done'>('todo');
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const fetchTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('id, title, description, status, due_date, project_id, assigned_to, created_by, created_at, updated_at')
      .eq('project_id', project.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();

    // Real-time subscription for task changes
    const channel = supabase
      .channel(`tasks-for-project-${project.id}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'tasks', 
          filter: `project_id=eq.${project.id}` 
        },
        (payload) => {
          console.log('Real-time task change received!', payload);
          // Refetch all tasks to ensure consistency
          // A more advanced implementation could merge changes without a full refetch
          fetchTasks(); 
        }
      )
      .subscribe();

    // Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [project.id]);

  const handleOpenCreateModal = (status: 'todo' | 'in_progress' | 'done') => {
    setDefaultStatusForModal(status);
    setShowCreateTaskModal(true);
  };

  // Callback to add the new task to the state instantly
  const handleTaskCreated = (newTask: Task) => {
    setTasks([...tasks, newTask]);
  };

  // Handler for status changes
  const handleStatusChange = async (taskId: string, newStatus: 'todo' | 'in_progress' | 'done') => {
    // Update the local state immediately for a responsive feel
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    // Update the database in the background
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId);

    if (error) {
      alert('Could not update task status. Please try again.');
      // Revert the change in local state if the DB update fails
      fetchTasks();
    }
  };

  // Handler for task deletion
  const handleDeleteTask = async (taskId: string) => {
    // Optimistically remove the task from the UI
    setTasks(tasks.filter(t => t.id !== taskId));

    // Delete from the database
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      alert('Could not delete task. Please try again.');
      // Add the task back if the deletion fails
      fetchTasks();
    }
  };

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || active.id === over.id) return;

    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) return;

    // Determine the new status based on which column the task was dropped on
    let newStatus: 'todo' | 'in_progress' | 'done';
    
    // Check if dropped on a column or on another task
    const overId = over.id.toString();
    if (['todo', 'in_progress', 'done'].includes(overId)) {
      // Dropped directly on a column
      newStatus = overId as 'todo' | 'in_progress' | 'done';
    } else {
      // Dropped on another task, find which column that task is in
      const overTask = tasks.find(t => t.id === over.id);
      if (!overTask) return;
      newStatus = overTask.status;
    }

    if (activeTask.status !== newStatus) {
      // Call the existing status change handler
      await handleStatusChange(active.id.toString(), newStatus);
    }
  };

  // Filter tasks into columns based on status
  const columns = {
    todo: tasks.filter((t) => t.status === 'todo'),
    in_progress: tasks.filter((t) => t.status === 'in_progress'),
    done: tasks.filter((t) => t.status === 'done'),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modal for creating a task */}
      {showCreateTaskModal && (
        <CreateTaskModal
          project={project}
          defaultStatus={defaultStatusForModal}
          onClose={() => setShowCreateTaskModal(false)}
          onTaskCreated={handleTaskCreated}
        />
      )}
      
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div className="flex items-center space-x-4">
            <button 
              onClick={onBack} 
              className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{project.name}</h2>
              <p className="text-gray-600 mt-1">Task Board</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-600">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''} total
            </div>
          </div>
        </header>

        <DndContext 
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd} 
          collisionDetection={closestCorners}
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <DroppableColumn
              id="todo"
              title="To-Do"
              tasks={columns.todo}
              onAddTask={() => handleOpenCreateModal('todo')}
              onStatusChange={handleStatusChange}
              onDelete={handleDeleteTask}
            />
            <DroppableColumn
              id="in_progress"
              title="In Progress"
              tasks={columns.in_progress}
              onAddTask={() => handleOpenCreateModal('in_progress')}
              onStatusChange={handleStatusChange}
              onDelete={handleDeleteTask}
            />
            <DroppableColumn
              id="done"
              title="Done"
              tasks={columns.done}
              onAddTask={() => handleOpenCreateModal('done')}
              onStatusChange={handleStatusChange}
              onDelete={handleDeleteTask}
            />
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeTask ? (
              <div className="transform rotate-3 scale-105">
                <TaskCard 
                  task={activeTask}
                  onStatusChange={() => {}}
                  onDelete={() => {}}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
