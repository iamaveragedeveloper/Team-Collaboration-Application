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
  onDelete,
  onEdit
}: {
  id: string;
  title: string;
  tasks: Task[];
  onAddTask: () => void;
  onStatusChange: (taskId: string, newStatus: 'todo' | 'in_progress' | 'done') => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
}) => {
  const { setNodeRef } = useDroppable({ id });
  const getColumnColor = () => id === 'todo' ? 'bg-gray-100' : id === 'in_progress' ? 'bg-blue-50' : 'bg-green-50';
  const getButtonColor = () => id === 'todo' ? 'text-gray-600 border-gray-300 hover:bg-gray-50' : id === 'in_progress' ? 'text-blue-600 border-blue-300 hover:bg-blue-100' : 'text-green-600 border-green-300 hover:bg-green-100';

  return (
    <div ref={setNodeRef} className={`${getColumnColor()} rounded-xl p-4 min-h-[600px] flex flex-col`}>
      <ColumnHeader title={title} count={tasks.length} color={id === 'todo' ? 'bg-gray-400' : id === 'in_progress' ? 'bg-blue-400' : 'bg-green-400'} />
      <div className="flex-grow">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <TaskCard 
                key={task.id} 
                task={task}
                onStatusChange={onStatusChange}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            ))}
        </SortableContext>
      </div>
      <button onClick={onAddTask} className={`mt-4 w-full px-3 py-2 text-sm font-medium border-2 border-dashed rounded-lg transition-colors flex items-center justify-center space-x-2 ${getButtonColor()}`}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        <span>Add Task</span>
      </button>
    </div>
  );
};

export default function TaskBoard({ project, onBack }: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultStatusForModal, setDefaultStatusForModal] = useState<'todo' | 'in_progress' | 'done'>('todo');
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const fetchTasks = useCallback(async () => {
    const { data, error } = await supabase.from('tasks').select('*').eq('project_id', project.id).order('created_at', { ascending: true });
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
    const channel = supabase.channel(`tasks-for-project-${project.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${project.id}` }, () => fetchTasks()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [project.id, fetchTasks]);

  const handleOpenCreateModal = (status: 'todo' | 'in_progress' | 'done') => {
    setDefaultStatusForModal(status);
    setEditingTask(null);
    setShowModal(true);
  };
  
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowModal(true);
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTask(null);
  };

  const handleTaskCreated = (newTask: Task) => {
    setTasks(prev => [...prev, newTask]);
  };

  const handleTaskUpdated = (updatedTask: Task) => {
    setTasks(prev => prev.map(task => task.id === updatedTask.id ? updatedTask : task));
  };
  
  const handleStatusChange = async (taskId: string, newStatus: 'todo' | 'in_progress' | 'done') => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    await supabase.from('tasks').delete().eq('id', taskId);
  };

  const handleDragStart = (event: DragStartEvent) => setActiveTask(tasks.find(t => t.id === event.active.id) || null);
  
  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const task = tasks.find(t => t.id === active.id);
    if (!task) return;
    const overId = over.id.toString();
    const newStatus = ['todo', 'in_progress', 'done'].includes(overId) ? overId as 'todo' | 'in_progress' | 'done' : tasks.find(t => t.id === over.id)?.status;
    if (newStatus && task.status !== newStatus) {
      await handleStatusChange(task.id, newStatus);
    }
  };

  const columns = {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    done: tasks.filter(t => t.status === 'done'),
  };

  if (loading) return <p>Loading tasks...</p>;

  return (
    <>
      {showModal && (
        <CreateTaskModal
          project={project}
          defaultStatus={defaultStatusForModal}
          taskToEdit={editingTask}
          onClose={handleCloseModal}
          onTaskCreated={handleTaskCreated}
          onTaskUpdated={handleTaskUpdated}
        />
      )}
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DroppableColumn id="todo" title="To-Do" tasks={columns.todo} onAddTask={() => handleOpenCreateModal('todo')} onStatusChange={handleStatusChange} onDelete={handleDeleteTask} onEdit={handleEditTask} />
          <DroppableColumn id="in_progress" title="In Progress" tasks={columns.in_progress} onAddTask={() => handleOpenCreateModal('in_progress')} onStatusChange={handleStatusChange} onDelete={handleDeleteTask} onEdit={handleEditTask} />
          <DroppableColumn id="done" title="Done" tasks={columns.done} onAddTask={() => handleOpenCreateModal('done')} onStatusChange={handleStatusChange} onDelete={handleDeleteTask} onEdit={handleEditTask} />
        </div>
        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} onStatusChange={() => {}} onDelete={() => {}} onEdit={() => {}} /> : null}
        </DragOverlay>
      </DndContext>
    </>
  );
}

