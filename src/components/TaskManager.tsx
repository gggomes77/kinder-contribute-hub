import React, { useState, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { UserBadgeList } from "@/components/ui/user-badge-list";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Plus, Calendar as CalendarIcon, Users, Trash2, CheckSquare } from "lucide-react";
import { format } from "date-fns";

interface Task {
  id: string;
  title: string;
  description: string | null;
  date: string;
  max_assignees: number;
  created_at: string;
  assignments?: Array<{
    id: string;
    family_id: string;
    families: {
      display_name: string;
    };
  }>;
}

const TaskManager = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    max_assignees: 1
  });
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentFamily } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setError(null);
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assignments:task_assignments(
            id,
            family_id,
            families(display_name)
          )
        `)
        .order('date', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setError('Impossibile caricare i compiti');
      toast({
        title: "Errore",
        description: "Impossibile caricare i compiti",
        variant: "destructive"
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentFamily?.is_admin) return;

    setIsLoading(true);
    try {
      const { error: configError } = await supabase.rpc('set_config', {
        setting_name: 'app.current_family',
        setting_value: currentFamily.username
      });

      if (configError) {
        console.error('Config error:', configError);
        throw configError;
      }

      const { error } = await supabase
        .from('tasks')
        .insert({
          title: newTask.title,
          description: newTask.description,
          date: newTask.date,
          max_assignees: newTask.max_assignees,
          created_by: currentFamily.id
        });

      if (error) throw error;

      setNewTask({
        title: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        max_assignees: 1
      });

      await loadTasks();
      toast({
        title: "Successo",
        description: "Compito creato con successo"
      });
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Errore",
        description: "Impossibile creare il compito",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signUpForTask = async (taskId: string) => {
    if (!currentFamily) return;

    try {
      const { error: configError } = await supabase.rpc('set_config', {
        setting_name: 'app.current_family',
        setting_value: currentFamily.username
      });

      if (configError) {
        console.error('Config error:', configError);
        throw configError;
      }

      const { error } = await supabase
        .from('task_assignments')
        .insert({
          task_id: taskId,
          family_id: currentFamily.id
        });

      if (error) throw error;

      await loadTasks();
      toast({
        title: "Successo",
        description: "Ti sei iscritto al compito con successo"
      });
    } catch (error) {
      console.error('Error signing up for task:', error);
      toast({
        title: "Errore",
        description: "Impossibile iscriversi al compito",
        variant: "destructive"
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!currentFamily?.is_admin) return;

    try {
      const { error: configError } = await supabase.rpc('set_config', {
        setting_name: 'app.current_family',
        setting_value: currentFamily.username
      });

      if (configError) {
        console.error('Config error:', configError);
        throw configError;
      }

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      await loadTasks();
      toast({
        title: "Successo",
        description: "Compito eliminato con successo"
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare il compito",
        variant: "destructive"
      });
    }
  };

  const isUserSignedUp = (task: Task) => {
    return task.assignments?.some(assignment => assignment.family_id === currentFamily?.id);
  };

  const canSignUp = (task: Task) => {
    return !isUserSignedUp(task) && (task.assignments?.length || 0) < task.max_assignees;
  };

  if (initialLoading) {
    return <LoadingState message="Caricamento compiti..." />;
  }

  if (error) {
    return (
      <Card className="card-waldorf">
        <CardContent className="p-6">
          <ErrorState message={error} onRetry={loadTasks} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-waldorf-earth mb-2">Compiti da Svolgere</h2>
        <p className="text-sm md:text-base text-muted-foreground">Gestione dei compiti della comunità</p>
      </div>

      {currentFamily?.is_admin && (
        <Card className="card-waldorf">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-waldorf-moss text-base md:text-lg">
              <Plus className="h-4 w-4 md:h-5 md:w-5" />
              Crea Nuovo Compito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createTask} className="space-y-3 md:space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Titolo</label>
                  <Input
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    placeholder="Titolo del compito"
                    required
                    className="input-waldorf"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Data</label>
                  <Input
                    type="date"
                    value={newTask.date}
                    onChange={(e) => setNewTask({...newTask, date: e.target.value})}
                    required
                    className="input-waldorf"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Descrizione</label>
                <Textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  placeholder="Descrizione del compito"
                  className="input-waldorf"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Numero massimo di persone</label>
                <Input
                  type="number"
                  min="1"
                  value={newTask.max_assignees}
                  onChange={(e) => setNewTask({...newTask, max_assignees: parseInt(e.target.value)})}
                  className="input-waldorf w-32"
                />
              </div>

              <Button type="submit" disabled={isLoading} className="btn-waldorf">
                <Plus className="h-4 w-4 mr-2" />
                Crea Compito
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 md:gap-4">
        {tasks.length === 0 ? (
          <Card className="card-waldorf">
            <CardContent className="p-6">
              <EmptyState 
                icon={CheckSquare}
                title="Nessun compito disponibile"
                description={currentFamily?.is_admin ? "Crea il primo compito per la comunità" : "Non ci sono compiti al momento"}
              />
            </CardContent>
          </Card>
        ) : (
          tasks.map((task) => (
            <Card key={task.id} className="card-waldorf">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <h3 className="text-base md:text-xl font-semibold text-waldorf-earth">{task.title}</h3>
                      <div className="flex gap-2 flex-shrink-0">
                        {canSignUp(task) && (
                          <Button 
                            onClick={() => signUpForTask(task.id)}
                            className="btn-waldorf text-xs md:text-sm"
                            size="sm"
                          >
                            Iscriviti
                          </Button>
                        )}
                        {isUserSignedUp(task) && (
                          <Badge variant="default" className="text-xs">Iscritto</Badge>
                        )}
                        {currentFamily?.is_admin && (
                          <Button
                            onClick={() => deleteTask(task.id)}
                            variant="destructive"
                            size="sm"
                          >
                            <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {task.description && (
                      <p className="text-sm md:text-base text-muted-foreground mb-3">{task.description}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                        <CalendarIcon className="h-3 w-3" />
                        {format(new Date(task.date), 'dd/MM/yyyy')}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1 text-xs">
                        <Users className="h-3 w-3" />
                        {task.assignments?.length || 0}/{task.max_assignees}
                      </Badge>
                    </div>

                    {task.assignments && task.assignments.length > 0 && (
                      <UserBadgeList 
                        users={task.assignments.map(a => ({ 
                          id: a.id, 
                          display_name: a.families.display_name 
                        }))}
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskManager;