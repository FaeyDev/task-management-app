import { create } from 'zustand';

interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: Date | null;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  author?: {
    id: string;
    name?: string | null;
    email: string;
    avatar?: string | null;
  };
  files?: File[];
  videos?: Video[];
  comments?: Comment[];
}

interface File {
  id: string;
  filename: string;
  filepath: string;
  filesize: number;
  mimetype: string;
  createdAt: Date;
}

interface Video {
  id: string;
  title: string;
  youtubeUrl: string;
  youtubeId: string;
  description?: string | null;
  createdAt: Date;
}

interface Comment {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  createdAt: Date;
  author?: {
    id: string;
    name?: string | null;
    email: string;
    avatar?: string | null;
  };
}

interface TaskState {
  tasks: Task[];
  selectedTask: Task | null;
  setTasks: (tasks: Task[]) => void;
  setSelectedTask: (task: Task | null) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  addComment: (taskId: string, comment: Comment) => void;
  addFile: (taskId: string, file: File) => void;
  addVideo: (taskId: string, video: Video) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  selectedTask: null,
  setTasks: (tasks) => set({ tasks }),
  setSelectedTask: (task) => set({ selectedTask: task }),
  addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),
  updateTask: (taskId, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, ...updates } : t
      ),
      selectedTask:
        state.selectedTask?.id === taskId
          ? { ...state.selectedTask, ...updates }
          : state.selectedTask,
    })),
  deleteTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
      selectedTask:
        state.selectedTask?.id === taskId ? null : state.selectedTask,
    })),
  addComment: (taskId, comment) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              comments: [...(t.comments || []), comment],
            }
          : t
      ),
      selectedTask:
        state.selectedTask?.id === taskId
          ? {
              ...state.selectedTask,
              comments: [
                ...(state.selectedTask.comments || []),
                comment,
              ],
            }
          : state.selectedTask,
    })),
  addFile: (taskId, file) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              files: [...(t.files || []), file],
            }
          : t
      ),
      selectedTask:
        state.selectedTask?.id === taskId
          ? {
              ...state.selectedTask,
              files: [
                ...(state.selectedTask.files || []),
                file,
              ],
            }
          : state.selectedTask,
    })),
  addVideo: (taskId, video) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              videos: [...(t.videos || []), video],
            }
          : t
      ),
      selectedTask:
        state.selectedTask?.id === taskId
          ? {
              ...state.selectedTask,
              videos: [
                ...(state.selectedTask.videos || []),
                video,
              ],
            }
          : state.selectedTask,
    })),
}));
