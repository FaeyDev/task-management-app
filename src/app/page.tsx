'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/authStore';
import { useTaskStore } from '@/store/taskStore';
import { io, Socket } from 'socket.io-client';
import {
  LayoutDashboard,
  Plus,
  Upload,
  FileText,
  Video,
  MessageSquare,
  LogOut,
  User,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Trash2,
  Download,
  Play
} from 'lucide-react';

const SOCKET_URL = '/?XTransformPort=3001';

export default function TaskManagementApp() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('MEDIUM');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [commentInput, setCommentInput] = useState('');
  const [youtubeTitle, setYoutubeTitle] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);

  const { user, isAuthenticated, setAuth, logout } = useAuthStore();
  const {
    tasks,
    selectedTask,
    setTasks,
    setSelectedTask,
    addTask,
    updateTask,
    deleteTask,
    addComment,
    addFile,
    addVideo,
  } = useTaskStore();

  const { toast } = useToast();

  // Initialize Socket.io
  useEffect(() => {
    if (isAuthenticated && !socket) {
      const newSocket = io(SOCKET_URL);
      setSocket(newSocket);

      newSocket.on('task-created', (task) => {
        addTask(task);
        toast({ title: 'Tugas baru dibuat', description: task.title });
      });

      newSocket.on('task-updated', (task) => {
        updateTask(task.id, task);
        toast({ title: 'Tugas diperbarui', description: task.title });
      });

      newSocket.on('task-deleted', (taskId) => {
        deleteTask(taskId);
        toast({ title: 'Tugas dihapus' });
      });

      newSocket.on('comment-added', (data) => {
        addComment(data.taskId, data.comment);
      });

      newSocket.on('file-uploaded', (data) => {
        addFile(data.taskId, data.file);
      });

      newSocket.on('video-added', (data) => {
        addVideo(data.taskId, data.video);
      });

      return () => {
        newSocket.close();
      };
    }
  }, [isAuthenticated, socket]);

  // Join task room when task is selected
  useEffect(() => {
    if (socket && selectedTask) {
      socket.emit('join-task', selectedTask.id);
      return () => {
        socket.emit('leave-task', selectedTask.id);
      };
    }
  }, [socket, selectedTask]);

  // Fetch tasks when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchTasks();
    }
  }, [isAuthenticated, user]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin
        ? { email, password }
        : { email, password, name };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setAuth(data.user, 'dummy-token');
      toast({
        title: isLogin ? 'Login berhasil' : 'Registrasi berhasil',
        description: `Selamat datang, ${data.user.name || data.user.email}`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks', {
        headers: {
          'x-user-id': user?.id || '',
        },
      });
      const data = await res.json();
      if (res.ok) {
        setTasks(data.tasks);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({
          title: newTaskTitle,
          description: newTaskDescription,
          priority: newTaskPriority,
          dueDate: newTaskDueDate,
          authorId: user?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      addTask(data.task);
      setIsDialogOpen(false);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskPriority('MEDIUM');
      setNewTaskDueDate('');
      toast({ title: 'Tugas berhasil dibuat' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      updateTask(taskId, data.task);
      toast({ title: 'Status tugas diperbarui' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !selectedTask) return;

    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({
          content: commentInput,
          authorId: user?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      addComment(selectedTask.id, data.comment);
      setCommentInput('');
      toast({ title: 'Komentar ditambahkan' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTask) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploadedBy', user?.id || '');

    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}/files`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      addFile(selectedTask.id, data.file);
      toast({ title: 'File berhasil diupload' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl || !youtubeTitle || !selectedTask) return;

    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}/videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({
          title: youtubeTitle,
          youtubeUrl: youtubeUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      addVideo(selectedTask.id, data.video);
      setYoutubeTitle('');
      setYoutubeUrl('');
      toast({ title: 'Video berhasil ditambahkan' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': user?.id || '' },
      });

      if (!res.ok) throw new Error('Failed to delete task');

      deleteTask(taskId);
      if (selectedTask?.id === taskId) setSelectedTask(null);
      toast({ title: 'Tugas dihapus' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      PENDING: { label: 'Menunggu', color: 'bg-yellow-500' },
      IN_PROGRESS: { label: 'Sedang Proses', color: 'bg-blue-500' },
      COMPLETED: { label: 'Selesai', color: 'bg-green-500' },
      CANCELLED: { label: 'Dibatalkan', color: 'bg-red-500' },
    };
    const statusInfo = statusMap[status] || statusMap.PENDING;
    return (
      <Badge className={statusInfo.color}>
        {statusInfo.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap: Record<string, { label: string; color: string }> = {
      LOW: { label: 'Rendah', color: 'bg-gray-500' },
      MEDIUM: { label: 'Sedang', color: 'bg-blue-500' },
      HIGH: { label: 'Tinggi', color: 'bg-orange-500' },
      URGENT: { label: 'Urgent', color: 'bg-red-500' },
    };
    const priorityInfo = priorityMap[priority] || priorityMap.MEDIUM;
    return (
      <Badge className={priorityInfo.color}>
        {priorityInfo.label}
      </Badge>
    );
  };

  // Auth Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {isLogin ? 'Selamat Datang' : 'Daftar Akun'}
            </CardTitle>
            <CardDescription className="text-center">
              {isLogin ? 'Masuk ke Task Management' : 'Buat akun baru'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Nama</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full">
                {isLogin ? 'Masuk' : 'Daftar'}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline"
              >
                {isLogin ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main App
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Faey - Task</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar || undefined} />
                <AvatarFallback>
                  {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:inline">
                {user?.name || user?.email}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Task List */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Daftar Tugas</h2>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Tugas Baru
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Buat Tugas Baru</DialogTitle>
                    <DialogDescription>
                      Isi detail tugas yang ingin dibuat
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateTask} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Judul</Label>
                      <Input
                        id="title"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Deskripsi</Label>
                      <Textarea
                        id="description"
                        value={newTaskDescription}
                        onChange={(e) => setNewTaskDescription(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="priority">Prioritas</Label>
                        <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                          <SelectTrigger id="priority">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LOW">Rendah</SelectItem>
                            <SelectItem value="MEDIUM">Sedang</SelectItem>
                            <SelectItem value="HIGH">Tinggi</SelectItem>
                            <SelectItem value="URGENT">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dueDate">Tanggal Deadline</Label>
                        <Input
                          id="dueDate"
                          type="date"
                          value={newTaskDueDate}
                          onChange={(e) => setNewTaskDueDate(e.target.value)}
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full">
                      Buat Tugas
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <ScrollArea className="h-[calc(100vh-12rem)]">
              <div className="space-y-3">
                {tasks.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      <p>Belum ada tugas</p>
                      <p className="text-sm">Klik "Tugas Baru" untuk memulai</p>
                    </CardContent>
                  </Card>
                ) : (
                  tasks.map((task) => (
                    <Card
                      key={task.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedTask?.id === task.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedTask(task)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base line-clamp-2">
                            {task.title}
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(task.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <CardDescription className="line-clamp-2">
                          {task.description || 'Tidak ada deskripsi'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {getStatusBadge(task.status)}
                          {getPriorityBadge(task.priority)}
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span className="truncate max-w-[120px]">
                              {task.author?.name || task.author?.email}
                            </span>
                          </div>
                          {task.dueDate && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {new Date(task.dueDate).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Task Detail */}
          <div className="lg:col-span-2">
            {selectedTask ? (
              <div className="space-y-6">
                {/* Task Header */}
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-2xl mb-2">
                          {selectedTask.title}
                        </CardTitle>
                        <CardDescription className="text-base">
                          {selectedTask.description || 'Tidak ada deskripsi'}
                        </CardDescription>
                      </div>
                      <Select
                        value={selectedTask.status}
                        onValueChange={(value) => handleStatusChange(selectedTask.id, value)}
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PENDING">Menunggu</SelectItem>
                          <SelectItem value="IN_PROGRESS">Sedang Proses</SelectItem>
                          <SelectItem value="COMPLETED">Selesai</SelectItem>
                          <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {getStatusBadge(selectedTask.status)}
                      {getPriorityBadge(selectedTask.priority)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Separator className="mb-4" />
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={selectedTask.author?.avatar || undefined} />
                          <AvatarFallback className="text-xs">
                            {selectedTask.author?.name?.charAt(0).toUpperCase() ||
                             selectedTask.author?.email?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {selectedTask.author?.name || selectedTask.author?.email}
                          </p>
                          <p className="text-xs text-muted-foreground">Pembuat</p>
                        </div>
                      </div>
                      {selectedTask.dueDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {new Date(selectedTask.dueDate).toLocaleDateString('id-ID', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </p>
                            <p className="text-xs text-muted-foreground">Deadline</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Tabs */}
                <Tabs defaultValue="files" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="files">
                      <FileText className="h-4 w-4 mr-2" />
                      Files ({selectedTask.files?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="videos">
                      <Video className="h-4 w-4 mr-2" />
                      Videos ({selectedTask.videos?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="comments">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Komentar ({selectedTask.comments?.length || 0})
                    </TabsTrigger>
                  </TabsList>

                  {/* Files Tab */}
                  <TabsContent value="files" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Upload className="h-5 w-5" />
                          Upload File
                        </CardTitle>
                        <CardDescription>
                          Upload gambar, PDF, Excel, atau dokumen lainnya
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Input
                          type="file"
                          onChange={handleFileUpload}
                          className="cursor-pointer"
                        />
                      </CardContent>
                    </Card>

                    {selectedTask.files && selectedTask.files.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>File yang Diupload</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ScrollArea className="max-h-96">
                            <div className="space-y-2">
                              {selectedTask.files.map((file) => (
                                <div
                                  key={file.id}
                                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                                >
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                    <div className="min-w-0">
                                      <p className="font-medium truncate">{file.filename}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {(file.filesize / 1024).toFixed(2)} KB
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    asChild
                                  >
                                    <a href={file.filepath} download={file.filename}>
                                      <Download className="h-4 w-4" />
                                    </a>
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  {/* Videos Tab */}
                  <TabsContent value="videos" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Video className="h-5 w-5" />
                          Tambah Video YouTube
                        </CardTitle>
                        <CardDescription>
                          Tambah link video pembelajaran dari YouTube
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleAddVideo} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="youtubeTitle">Judul Video</Label>
                            <Input
                              id="youtubeTitle"
                              placeholder="Tutorial Next.js"
                              value={youtubeTitle}
                              onChange={(e) => setYoutubeTitle(e.target.value)}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="youtubeUrl">Link YouTube</Label>
                            <Input
                              id="youtubeUrl"
                              placeholder="https://youtube.com/watch?v=..."
                              value={youtubeUrl}
                              onChange={(e) => setYoutubeUrl(e.target.value)}
                              required
                            />
                          </div>
                          <Button type="submit">
                            <Plus className="h-4 w-4 mr-2" />
                            Tambah Video
                          </Button>
                        </form>
                      </CardContent>
                    </Card>

                    {selectedTask.videos && selectedTask.videos.length > 0 && (
                      <div className="space-y-4">
                        {selectedTask.videos.map((video) => (
                          <Card key={video.id}>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Play className="h-5 w-5" />
                                {video.title}
                              </CardTitle>
                              {video.description && (
                                <CardDescription>{video.description}</CardDescription>
                              )}
                            </CardHeader>
                            <CardContent>
                              <div className="aspect-video rounded-lg overflow-hidden">
                                <iframe
                                  width="100%"
                                  height="100%"
                                  src={`https://www.youtube.com/embed/${video.youtubeId}`}
                                  title={video.title}
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                  className="border-0"
                                />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Comments Tab */}
                  <TabsContent value="comments" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="h-5 w-5" />
                          Tambah Komentar
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleAddComment} className="space-y-4">
                          <Textarea
                            placeholder="Tulis komentar Anda..."
                            value={commentInput}
                            onChange={(e) => setCommentInput(e.target.value)}
                            rows={3}
                          />
                          <Button type="submit" disabled={!commentInput.trim()}>
                            Kirim Komentar
                          </Button>
                        </form>
                      </CardContent>
                    </Card>

                    {selectedTask.comments && selectedTask.comments.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Komentar</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ScrollArea className="max-h-96">
                            <div className="space-y-4">
                              {selectedTask.comments.map((comment) => (
                                <div
                                  key={comment.id}
                                  className="flex gap-3 p-3 rounded-lg bg-accent/50"
                                >
                                  <Avatar className="h-8 w-8 flex-shrink-0">
                                    <AvatarImage src={comment.author?.avatar || undefined} />
                                    <AvatarFallback className="text-xs">
                                      {comment.author?.name?.charAt(0).toUpperCase() ||
                                       comment.author?.email?.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="font-medium text-sm">
                                        {comment.author?.name || comment.author?.email}
                                      </p>
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(comment.createdAt).toLocaleString('id-ID', {
                                          day: 'numeric',
                                          month: 'short',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </span>
                                    </div>
                                    <p className="text-sm break-words">{comment.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <LayoutDashboard className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">Pilih Tugas</p>
                  <p className="text-muted-foreground">
                    Klik salah satu tugas dari daftar untuk melihat detail
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
