import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, CalendarCheck, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CleaningSlot {
  id: string;
  date: string;
  time: string;
  area: string;
  parentName: string;
  maxSlots: number;
  currentSlots: number;
}

const CLEANING_AREAS = [
  'Main Classroom',
  'Art Room',
  'Music Room',
  'Library',
  'Kitchen',
  'Playground',
  'Garden',
  'Entrance Hall',
];

export const CleaningCalendar = () => {
  const [slots, setSlots] = useState<CleaningSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [parentName, setParentName] = useState('');
  const { toast } = useToast();

  // Initialize with some sample slots
  useEffect(() => {
    const savedSlots = localStorage.getItem('waldorf-cleaning-slots');
    if (savedSlots) {
      setSlots(JSON.parse(savedSlots));
    } else {
      // Create some initial cleaning slots for the next 14 days
      const initialSlots: CleaningSlot[] = [];
      const today = new Date();
      
      for (let i = 1; i <= 14; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Create morning and afternoon slots for different areas
        const morningAreas = CLEANING_AREAS.slice(0, 4);
        const afternoonAreas = CLEANING_AREAS.slice(4);
        
        morningAreas.forEach((area, index) => {
          if (Math.random() > 0.3) { // 70% chance of creating a slot
            initialSlots.push({
              id: `${dateStr}-morning-${index}`,
              date: dateStr,
              time: '09:00',
              area,
              parentName: '',
              maxSlots: 2,
              currentSlots: 0,
            });
          }
        });
        
        afternoonAreas.forEach((area, index) => {
          if (Math.random() > 0.3) { // 70% chance of creating a slot
            initialSlots.push({
              id: `${dateStr}-afternoon-${index}`,
              date: dateStr,
              time: '15:00',
              area,
              parentName: '',
              maxSlots: 2,
              currentSlots: 0,
            });
          }
        });
      }
      
      setSlots(initialSlots);
    }
  }, []);

  // Save to localStorage whenever slots change
  useEffect(() => {
    localStorage.setItem('waldorf-cleaning-slots', JSON.stringify(slots));
  }, [slots]);

  const handleSignUp = (slotId: string) => {
    if (!parentName.trim()) {
      toast({
        title: "Please enter your name first",
        variant: "destructive",
      });
      return;
    }

    setSlots(prev => prev.map(slot => {
      if (slot.id === slotId && slot.currentSlots < slot.maxSlots) {
        const updatedSlot = {
          ...slot,
          currentSlots: slot.currentSlots + 1,
          parentName: slot.parentName ? `${slot.parentName}, ${parentName}` : parentName,
        };
        
        toast({
          title: "Successfully signed up!",
          description: `You're signed up for ${slot.area} cleaning on ${new Date(slot.date).toLocaleDateString()}`,
        });
        
        return updatedSlot;
      }
      return slot;
    }));
  };

  const createNewSlot = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime || !selectedArea) {
      toast({
        title: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const newSlot: CleaningSlot = {
      id: `${selectedDate}-${selectedTime}-${selectedArea}`,
      date: selectedDate,
      time: selectedTime,
      area: selectedArea,
      parentName: '',
      maxSlots: 2,
      currentSlots: 0,
    };

    setSlots(prev => [...prev, newSlot]);
    setSelectedDate('');
    setSelectedTime('');
    setSelectedArea('');
    
    toast({
      title: "New cleaning slot created!",
      description: `Added ${selectedArea} cleaning slot for ${new Date(selectedDate).toLocaleDateString()}`,
    });
  };

  const availableSlots = slots.filter(slot => slot.currentSlots < slot.maxSlots);
  const upcomingSlots = availableSlots
    .filter(slot => new Date(slot.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 12);

  return (
    <div className="space-y-6">
      {/* Name Input */}
      <Card className="card-waldorf">
        <CardContent className="p-6">
          <div className="space-y-2">
            <Label htmlFor="signupName">Your Name (for signing up)</Label>
            <Input
              id="signupName"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              placeholder="Enter your name to sign up for cleaning slots"
              className="input-waldorf"
            />
          </div>
        </CardContent>
      </Card>

      {/* Available Cleaning Slots */}
      <Card className="card-waldorf">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-waldorf-earth">
            <Calendar className="w-5 h-5" />
            Available Cleaning Slots
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingSlots.length === 0 ? (
              <p className="text-muted-foreground text-center py-8 col-span-full">
                No available cleaning slots. Create a new one below!
              </p>
            ) : (
              upcomingSlots.map(slot => (
                <div key={slot.id} className="p-4 bg-waldorf-cream rounded-lg border border-border">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-waldorf-moss" />
                      <span className="font-medium text-waldorf-earth">{slot.area}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(slot.date).toLocaleDateString()} at {slot.time}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {slot.currentSlots}/{slot.maxSlots} slots filled
                    </p>
                    {slot.parentName && (
                      <p className="text-xs text-waldorf-moss">
                        Signed up: {slot.parentName}
                      </p>
                    )}
                    <Button
                      onClick={() => handleSignUp(slot.id)}
                      disabled={slot.currentSlots >= slot.maxSlots}
                      className="w-full btn-waldorf-secondary"
                      size="sm"
                    >
                      {slot.currentSlots >= slot.maxSlots ? 'Full' : 'Sign Up'}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create New Slot */}
      <Card className="card-waldorf">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-waldorf-earth">
            <CalendarCheck className="w-5 h-5" />
            Create New Cleaning Slot
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createNewSlot} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="input-waldorf"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="input-waldorf"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="area">Area</Label>
                <select
                  id="area"
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="input-waldorf w-full"
                >
                  <option value="">Select area...</option>
                  {CLEANING_AREAS.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>
            </div>
            <Button type="submit" className="btn-waldorf">
              Create Cleaning Slot
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};