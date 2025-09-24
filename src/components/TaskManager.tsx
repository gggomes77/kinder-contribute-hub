import React, { useState, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Plus, Calendar as CalendarIcon, Users, Trash2 } from "lucide-react";
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
  const { currentFamily } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    if (!currentFamily) return;
    
    try {
      await supabase.rpc('set_config', {
        setting_name: 'app.current_family',
        setting_value: currentFamily.username
      });

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
      toast({
        title: "Errore",
        description: "Impossibile caricare i compiti",
        variant: "destructive"
      });
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

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-waldorf-earth mb-2">Compiti da Svolgere</h2>
        <p className="text-muted-foreground">Gestione dei compiti della comunità</p>
      </div>

      {currentFamily?.is_admin && (
        <Card className="card-waldorf">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-waldorf-moss">
              <Plus className="h-5 w-5" />
              Crea Nuovo Compito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createTask} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      <div className="grid gap-4">
        {tasks.map((task) => (
          <Card key={task.id} className="card-waldorf">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-waldorf-earth mb-2">{task.title}</h3>
                  {task.description && (
                    <p className="text-muted-foreground mb-3">{task.description}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {format(new Date(task.date), 'dd/MM/yyyy')}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {task.assignments?.length || 0}/{task.max_assignees}
                    </Badge>
                  </div>

                  {task.assignments && task.assignments.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-2">Iscritti:</h4>
                      <div className="flex flex-wrap gap-2">
                        {task.assignments.map((assignment) => (
                          <Badge key={assignment.id} variant="default">
                            {assignment.families.display_name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  {canSignUp(task) && (
                    <Button 
                      onClick={() => signUpForTask(task.id)}
                      className="btn-waldorf"
                      size="sm"
                    >
                      Iscriviti
                    </Button>
                  )}
                  {isUserSignedUp(task) && (
                    <Badge variant="default">Iscritto</Badge>
                  )}
                  {currentFamily?.is_admin && (
                    <Button
                      onClick={() => deleteTask(task.id)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tasks.length === 0 && (
        <Card className="card-waldorf">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Nessun compito disponibile al momento.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TaskManager;