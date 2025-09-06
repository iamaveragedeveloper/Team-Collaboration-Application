'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DndContext, closestCorners, DragEndEvent, DragOverlay, DragStartEvent, useDroppable } from '@dnd-kit/core';
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
    </div>
);

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
  const { setNodeRef } = useDroppable({ id });

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
    <div ref={setNodeRef} className={`${getColumnColor()} rounded-xl p-4 min-h-[600px]`}>
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

// Ensure the default export is the TaskBoard component
export default function TaskBoard({ project, onBack }: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [defaultStatusForModal, setDefaultStatusForModal] = useState<'todo' | 'in_progress' | 'done'>('todo');
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', project.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  }, [project.id]);

  useEffect(() => {
    fetchTasks();
    const channel = supabase
      .channel(`tasks-for-project-${project.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${project.id}` }, () => {
        fetchTasks(); 
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [project.id, fetchTasks]);

  const handleOpenCreateModal = (status: 'todo' | 'in_progress' | 'done') => {
    setDefaultStatusForModal(status);
    setShowCreateTaskModal(true);
  };

  const handleTaskCreated = (newTask: Task) => {
    setTasks(prevTasks => [...prevTasks, newTask]);
  };

  const handleStatusChange = async (taskId: string, newStatus: 'todo' | 'in_progress' | 'done') => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
    if (error) {
      alert('Could not update task status.');
      fetchTasks();
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) {
      alert('Could not delete task.');
      fetchTasks();
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;
    const activeTask = tasks.find(t => t.id === active.id);
    if (!activeTask) return;
    const overId = over.id.toString();
    const overIsColumn = ['todo', 'in_progress', 'done'].includes(overId);
    let newStatus: 'todo' | 'in_progress' | 'done';
    if (overIsColumn) {
      newStatus = overId as 'todo' | 'in_progress' | 'done';
    } else {
      const overTask = tasks.find(t => t.id === over.id);
      if (!overTask) return;
      newStatus = overTask.status;
    }
    if (activeTask.status !== newStatus) {
      await handleStatusChange(active.id.toString(), newStatus);
    }
  };

  const columns = {
    todo: tasks.filter((t) => t.status === 'todo'),
    in_progress: tasks.filter((t) => t.status === 'in_progress'),
    done: tasks.filter((t) => t.status === 'done'),
  };

  if (loading) {
    return <div className="text-center py-10">Loading tasks...</div>;
  }

  return (
    <div className="w-full">
      {showCreateTaskModal && (
        <CreateTaskModal
          project={project}
          defaultStatus={defaultStatusForModal}
          onClose={() => setShowCreateTaskModal(false)}
          onTaskCreated={handleTaskCreated}
        />
      )}
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <DroppableColumn id="todo" title="To-Do" tasks={columns.todo} onAddTask={() => handleOpenCreateModal('todo')} onStatusChange={handleStatusChange} onDelete={handleDeleteTask} />
          <DroppableColumn id="in_progress" title="In Progress" tasks={columns.in_progress} onAddTask={() => handleOpenCreateModal('in_progress')} onStatusChange={handleStatusChange} onDelete={handleDeleteTask} />
          <DroppableColumn id="done" title="Done" tasks={columns.done} onAddTask={() => handleOpenCreateModal('done')} onStatusChange={handleStatusChange} onDelete={handleDeleteTask} />
        </div>
        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} onStatusChange={() => {}} onDelete={() => {}} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}