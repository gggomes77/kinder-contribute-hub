import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Clock, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
        title: "Please fill in all fields",
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
      title: "Time contribution added!",
      description: `Thank you ${parentName} for contributing ${hours} hours!`,
    });
  };

  const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
  const uniqueParents = new Set(entries.map(entry => entry.parentName)).size;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="card-waldorf">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Hours</p>
              <p className="text-3xl font-bold text-waldorf-earth">{totalHours}</p>
            </div>
            <Clock className="w-8 h-8 text-waldorf-moss" />
          </CardContent>
        </Card>
        
        <Card className="card-waldorf">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">Contributing Parents</p>
              <p className="text-3xl font-bold text-waldorf-earth">{uniqueParents}</p>
            </div>
            <Users className="w-8 h-8 text-waldorf-moss" />
          </CardContent>
        </Card>
      </div>

      {/* Add Time Form */}
      <Card className="card-waldorf">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-waldorf-earth">
            <Plus className="w-5 h-5" />
            Add Your Time Contribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parentName">Your Name</Label>
                <Input
                  id="parentName"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="Enter your name"
                  className="input-waldorf"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hours">Hours Contributed</Label>
                <Input
                  id="hours"
                  type="number"
                  step="0.5"
                  min="0"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="e.g., 2.5"
                  className="input-waldorf"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="activity">Activity Description</Label>
              <Input
                id="activity"
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                placeholder="e.g., Garden maintenance, classroom cleaning, event setup"
                className="input-waldorf"
              />
            </div>
            <Button type="submit" className="btn-waldorf">
              Add Contribution
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Recent Entries */}
      <Card className="card-waldorf">
        <CardHeader>
          <CardTitle className="font-serif text-waldorf-earth">Recent Contributions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {entries.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No contributions yet. Be the first to add your time!
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