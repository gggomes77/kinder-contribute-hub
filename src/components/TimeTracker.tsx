import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Clock, Users, BarChart3 } from 'lucide-react';
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
  const { toast } = useToast();
  const { currentFamily } = useAuth();

  // Load data from Supabase on component mount
  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
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
      toast({
        title: "Errore nel caricamento",
        description: "Non è stato possibile caricare i contributi",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hours || !activity) {
      toast({
        title: "Compila tutti i campi",
        variant: "destructive",
      });
      return;
    }

    if (!currentFamily) {
      toast({
        title: "Errore di autenticazione",
        description: "Per favore effettua il login",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('time_contributions')
        .insert({
          family_id: currentFamily.id,
          hours: parseFloat(hours),
          activity,
        });

      if (error) throw error;

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

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      {chartData.length > 0 && (
        <Card className="card-waldorf">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-waldorf-earth">
              <BarChart3 className="w-5 h-5" />
              Contributi per Famiglia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="famiglia" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                    fontSize={12}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
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
      )}

      {/* Add Time Form */}
      <Card className="card-waldorf">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-waldorf-earth">
            <Plus className="w-5 h-5" />
            Aggiungi il Tuo Contributo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <CardTitle className="font-serif text-waldorf-earth">Contributi Recenti</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {entries.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nessun contributo ancora. Sii il primo ad aggiungere il tuo tempo!
              </p>
            ) : (
              entries.slice(0, 10).map(entry => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-waldorf-cream rounded-lg">
                  <div>
                    <p className="font-medium text-waldorf-earth">{entry.families?.display_name || 'Sconosciuto'}</p>
                    <p className="text-sm text-muted-foreground">{entry.activity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-waldorf-moss">{entry.hours}h</p>
                    <p className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleDateString()}</p>
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