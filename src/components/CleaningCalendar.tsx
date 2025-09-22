import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, CalendarCheck, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CleaningSlot {
  id: string;
  date: string;
  time: string;
  area: string;
  max_slots: number;
  assignments?: Array<{
    families: {
      display_name: string;
    };
  }>;
}

const CLEANING_AREAS = [
  'Scuola',
  'Giardino',
  'Vetri',
  'Pavimento',
];

export const CleaningCalendar = () => {
  const [slots, setSlots] = useState<CleaningSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { currentFamily } = useAuth();

  // Load cleaning slots from Supabase
  useEffect(() => {
    loadSlots();
  }, []);

  const loadSlots = async () => {
    try {
      const { data, error } = await supabase
        .from('cleaning_slots')
        .select(`
          *,
          cleaning_assignments (
            families (
              display_name
            )
          )
        `)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date')
        .order('time');

      if (error) throw error;
      setSlots(data || []);
    } catch (error) {
      console.error('Error loading cleaning slots:', error);
      toast({
        title: "Errore nel caricamento",
        description: "Non è stato possibile caricare i turni di pulizie",
        variant: "destructive",
      });
    }
  };

  const handleSignUp = async (slotId: string) => {
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
      // Ensure session configuration is set before database operations
      const { error: configError } = await supabase.rpc('set_config', {
        setting_name: 'app.current_family',
        setting_value: currentFamily.username
      });

      if (configError) {
        console.error('Config error:', configError);
        throw new Error('Failed to set session configuration');
      }

      // Check if family is already signed up for this slot
      const { data: existingAssignment } = await supabase
        .from('cleaning_assignments')
        .select('id')
        .eq('family_id', currentFamily.id)
        .eq('cleaning_slot_id', slotId)
        .single();

      if (existingAssignment) {
        toast({
          title: "Già iscritto",
          description: "Sei già iscritto a questo turno di pulizie",
          variant: "destructive",
        });
        return;
      }

      // Check if slot is full
      const slot = slots.find(s => s.id === slotId);
      if (slot && slot.assignments && slot.assignments.length >= slot.max_slots) {
        toast({
          title: "Turno completo",
          description: "Questo turno di pulizie è già completo",
          variant: "destructive",
        });
        return;
      }

      // Create assignment
      const { error } = await supabase
        .from('cleaning_assignments')
        .insert({
          family_id: currentFamily.id,
          cleaning_slot_id: slotId,
        });

      if (error) throw error;

      await loadSlots(); // Reload to get updated data
      
      toast({
        title: "Iscrizione completata!",
        description: `Ti sei iscritto per le pulizie ${slot?.area} il ${slot ? new Date(slot.date).toLocaleDateString('it-IT') : ''}`,
      });
    } catch (error) {
      console.error('Error signing up for cleaning slot:', error);
      toast({
        title: "Errore",
        description: "Non è stato possibile iscriversi al turno di pulizie",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createNewSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime || !selectedArea) {
      toast({
        title: "Compila tutti i campi",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('cleaning_slots')
        .insert({
          date: selectedDate,
          time: selectedTime,
          area: selectedArea,
          max_slots: 2,
        });

      if (error) throw error;

      setSelectedDate('');
      setSelectedTime('');
      setSelectedArea('');
      await loadSlots(); // Reload to get updated data
      
      toast({
        title: "Nuovo turno di pulizie creato!",
        description: `Aggiunto turno pulizie ${selectedArea} per il ${new Date(selectedDate).toLocaleDateString('it-IT')}`,
      });
    } catch (error) {
      console.error('Error creating cleaning slot:', error);
      toast({
        title: "Errore",
        description: "Non è stato possibile creare il turno di pulizie",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const availableSlots = slots.filter(slot => 
    !slot.assignments || slot.assignments.length < slot.max_slots
  );
  const upcomingSlots = availableSlots.slice(0, 12);

  return (
    <div className="space-y-6">
      {/* Available Cleaning Slots */}
      <Card className="card-waldorf">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-waldorf-earth">
            <Calendar className="w-5 h-5" />
            Turni di Pulizie Disponibili
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingSlots.length === 0 ? (
              <p className="text-muted-foreground text-center py-8 col-span-full">
                Nessun turno di pulizie disponibile. Creane uno nuovo qui sotto!
              </p>
            ) : (
              upcomingSlots.map(slot => {
                const currentAssignments = slot.assignments?.length || 0;
                const assignedFamilies = slot.assignments?.map(a => a.families.display_name).join(', ') || '';
                const isUserSignedUp = slot.assignments?.some(a => 
                  currentFamily && a.families.display_name === currentFamily.display_name
                );
                
                return (
                  <div key={slot.id} className="p-4 bg-waldorf-cream rounded-lg border border-border">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-waldorf-moss" />
                        <span className="font-medium text-waldorf-earth">{slot.area}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(slot.date).toLocaleDateString('it-IT')} alle {slot.time}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {currentAssignments}/{slot.max_slots} posti occupati
                      </p>
                      {assignedFamilies && (
                        <p className="text-xs text-waldorf-moss">
                          Iscritti: {assignedFamilies}
                        </p>
                      )}
                      <Button
                        onClick={() => handleSignUp(slot.id)}
                        disabled={loading || currentAssignments >= slot.max_slots || isUserSignedUp}
                        className="w-full btn-waldorf-secondary"
                        size="sm"
                      >
                        {isUserSignedUp 
                          ? 'Già iscritto' 
                          : currentAssignments >= slot.max_slots 
                            ? 'Completo' 
                            : loading 
                              ? 'Caricamento...' 
                              : 'Iscriviti'
                        }
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create New Slot */}
      <Card className="card-waldorf">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-waldorf-earth">
            <CalendarCheck className="w-5 h-5" />
            Crea Nuovo Turno di Pulizie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createNewSlot} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
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
                <Label htmlFor="time">Orario</Label>
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
                  <option value="">Seleziona area...</option>
                  {CLEANING_AREAS.map(area => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>
            </div>
            <Button type="submit" className="btn-waldorf" disabled={loading}>
              {loading ? 'Creando...' : 'Crea Turno di Pulizie'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
