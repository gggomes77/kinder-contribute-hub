import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Clock, Users, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TimeEntry {
  id: string;
  parentName: string;
  hours: number;
  activity: string;
  date: string;
}

export const TimeTracker = () => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [parentName, setParentName] = useState('');
  const [hours, setHours] = useState('');
  const [activity, setActivity] = useState('');
  const { toast } = useToast();

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedEntries = localStorage.getItem('waldorf-time-entries');
    if (savedEntries) {
      setEntries(JSON.parse(savedEntries));
    }
  }, []);

  // Save to localStorage whenever entries change
  useEffect(() => {
    localStorage.setItem('waldorf-time-entries', JSON.stringify(entries));
  }, [entries]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!parentName || !hours || !activity) {
      toast({
        title: "Compila tutti i campi",
        variant: "destructive",
      });
      return;
    }

    const newEntry: TimeEntry = {
      id: Date.now().toString(),
      parentName,
      hours: parseFloat(hours),
      activity,
      date: new Date().toLocaleDateString(),
    };

    setEntries(prev => [newEntry, ...prev]);
    setParentName('');
    setHours('');
    setActivity('');
    
    toast({
      title: "Contributo aggiunto!",
      description: `Grazie ${parentName} per aver contribuito ${hours} ore!`,
    });
  };

  const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
  const uniqueParents = new Set(entries.map(entry => entry.parentName)).size;

  // Prepare chart data - group by family
  const familyContributions = entries.reduce((acc, entry) => {
    const familyName = entry.parentName;
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
                <Label htmlFor="parentName">Nome Famiglia</Label>
                <Input
                  id="parentName"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="Inserisci il nome della famiglia"
                  className="input-waldorf"
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
            <Button type="submit" className="btn-waldorf">
              Aggiungi Contributo
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
                    <p className="font-medium text-waldorf-earth">{entry.parentName}</p>
                    <p className="text-sm text-muted-foreground">{entry.activity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-waldorf-moss">{entry.hours}h</p>
                    <p className="text-xs text-muted-foreground">{entry.date}</p>
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