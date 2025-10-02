import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Plus, Clock, Users, BarChart3, Trash2, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface TimeEntry {
  id: string;
  family_id: string;
  hours: number;
  activity: string;
  date: string;
  families?: {
    display_name: string;
  };
}

export const TimeTracker = () => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [hours, setHours] = useState('');
  const [activity, setActivity] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { currentFamily } = useAuth();

  // Load data from Supabase on component mount
  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    if (!currentFamily) return;
    
    try {
      setError(null);
      // Ensure session configuration is set before database operation
      const { error: configError } = await supabase.rpc('set_config', {
        setting_name: 'app.current_family',
        setting_value: currentFamily.username
      });

      if (configError) {
        console.error('Config error:', configError);
        throw new Error('Errore di configurazione');
      }

      const { data, error } = await supabase
        .from('time_contributions')
        .select(`
          *,
          families (
            display_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error loading entries:', error);
      setError('Non è stato possibile caricare i contributi');
      toast({
        title: "Errore nel caricamento",
        description: "Non è stato possibile caricare i contributi",
        variant: "destructive",
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('=== STARTING CONTRIBUTION SUBMISSION ===');
    console.log('Hours:', hours);
    console.log('Activity:', activity);
    console.log('Current family:', currentFamily);
    
    if (!hours || !activity) {
      console.log('Missing hours or activity');
      toast({
        title: "Compila tutti i campi",
        variant: "destructive",
      });
      return;
    }

    if (!currentFamily) {
      console.log('No current family');
      toast({
        title: "Errore di autenticazione",
        description: "Per favore effettua il login",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Setting config for family:', currentFamily.username);
      // Ensure session configuration is set before database operation
      const { error: configError } = await supabase.rpc('set_config', {
        setting_name: 'app.current_family',
        setting_value: currentFamily.username
      });

      if (configError) {
        console.error('Config error:', configError);
        throw new Error('Failed to set session configuration');
      }
      console.log('Config set successfully');

      console.log('Inserting contribution with data:', {
        family_id: currentFamily.id,
        hours: parseFloat(hours),
        activity,
      });

      const { error } = await supabase
        .from('time_contributions')
        .insert({
          family_id: currentFamily.id,
          hours: parseFloat(hours),
          activity,
        });

      if (error) {
        console.error('Insert error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw error;
      }
      
      console.log('Insert successful!');

      setHours('');
      setActivity('');
      await loadEntries(); // Reload to get updated data
      
      toast({
        title: "Contributo aggiunto!",
        description: `Grazie per aver contribuito ${hours} ore!`,
      });
    } catch (error) {
      console.error('Error adding contribution:', error);
      toast({
        title: "Errore",
        description: "Non è stato possibile aggiungere il contributo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!currentFamily?.is_admin) {
      toast({
        title: "Accesso negato",
        description: "Solo gli amministratori possono eliminare i contributi",
        variant: "destructive",
      });
      return;
    }

    try {
      // Set config before delete operation
      await supabase.rpc('set_config', {
        setting_name: 'app.current_family',
        setting_value: currentFamily.username
      });

      const { error } = await supabase
        .from('time_contributions')
        .delete()
        .eq('id', entryId);

      if (error) throw error;

      await loadEntries(); // Reload to get updated data
      
      toast({
        title: "Contributo eliminato",
        description: "Il contributo è stato eliminato con successo",
      });
    } catch (error) {
      console.error('Error deleting contribution:', error);
      toast({
        title: "Errore",
        description: "Non è stato possibile eliminare il contributo",
        variant: "destructive",
      });
    }
  };

  const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
  const uniqueParents = new Set(entries.map(entry => entry.families?.display_name)).size;

  // Prepare chart data - group by family
  const familyContributions = entries.reduce((acc, entry) => {
    const familyName = entry.families?.display_name || 'Sconosciuto';
    if (!acc[familyName]) {
      acc[familyName] = 0;
    }
    acc[familyName] += entry.hours;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(familyContributions)
    .map(([name, hours]) => ({
      famiglia: name,
      ore: hours,
    }))
    .sort((a, b) => b.ore - a.ore);

  if (initialLoading) {
    return <LoadingState message="Caricamento contributi..." />;
  }

  if (error) {
    return (
      <Card className="card-waldorf">
        <CardContent className="p-6">
          <ErrorState message={error} onRetry={loadEntries} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <Card className="card-waldorf">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">Ore Totali</p>
              <p className="text-3xl font-bold text-waldorf-earth">{totalHours}</p>
            </div>
            <Clock className="w-8 h-8 text-waldorf-moss" />
          </CardContent>
        </Card>
        
        <Card className="card-waldorf">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">Famiglie Partecipanti</p>
              <p className="text-3xl font-bold text-waldorf-earth">{uniqueParents}</p>
            </div>
            <Users className="w-8 h-8 text-waldorf-moss" />
          </CardContent>
        </Card>
      </div>

      {/* Family Contributions Chart */}
      {chartData.length > 0 ? (
        <Card className="card-waldorf">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-waldorf-earth text-base md:text-lg">
              <BarChart3 className="w-4 h-4 md:w-5 md:h-5" />
              Contributi per Famiglia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 md:h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="famiglia" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                    fontSize={10}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelFormatter={(label) => `Famiglia: ${label}`}
                    formatter={(value) => [`${value} ore`, 'Ore Contribuite']}
                  />
                  <Bar 
                    dataKey="ore" 
                    fill="hsl(var(--waldorf-moss))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="card-waldorf">
          <CardContent className="p-6">
            <EmptyState 
              icon={TrendingUp}
              title="Nessun dato disponibile"
              description="Aggiungi il tuo primo contributo per visualizzare le statistiche"
            />
          </CardContent>
        </Card>
      )}

      {/* Add Time Form */}
      <Card className="card-waldorf">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-waldorf-earth text-base md:text-lg">
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
            Aggiungi il Tuo Contributo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-2">
                <Label htmlFor="family">Famiglia</Label>
                <Input
                  id="family"
                  value={currentFamily?.display_name || ''}
                  disabled
                  className="input-waldorf bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hours">Ore Contribuite</Label>
                <Input
                  id="hours"
                  type="number"
                  step="0.5"
                  min="0"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="es. 2.5"
                  className="input-waldorf"
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="activity">Descrizione Attività</Label>
              <Input
                id="activity"
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                placeholder="es. Manutenzione giardino, pulizie aula, preparazione eventi"
                className="input-waldorf"
              />
            </div>
            <Button type="submit" className="btn-waldorf" disabled={loading}>
              {loading ? 'Aggiungendo...' : 'Aggiungi Contributo'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Recent Entries */}
      <Card className="card-waldorf">
        <CardHeader>
          <CardTitle className="font-serif text-waldorf-earth text-base md:text-lg">Contributi Recenti</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 md:space-y-3">
            {entries.length === 0 ? (
              <EmptyState 
                icon={Clock}
                title="Nessun contributo ancora"
                description="Sii il primo ad aggiungere il tuo tempo!"
              />
            ) : (
              entries.slice(0, 10).map(entry => (
                <div key={entry.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-waldorf-cream rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-waldorf-earth text-sm md:text-base">{entry.families?.display_name || 'Sconosciuto'}</p>
                    <p className="text-xs md:text-sm text-muted-foreground truncate">{entry.activity}</p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <div className="text-right">
                      <p className="font-semibold text-waldorf-moss text-sm md:text-base">{entry.hours}h</p>
                      <p className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleDateString('it-IT')}</p>
                    </div>
                    {currentFamily?.is_admin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(entry.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 p-2 flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};