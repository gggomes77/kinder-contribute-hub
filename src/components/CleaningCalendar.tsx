import React, { useState, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Plus, Clock, MapPin, Users } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";

interface CleaningSlot {
  id: string;
  date: string;
  time: string;
  area: string;
  max_slots: number;
  assignments?: Array<{
    id: string;
    family_id: string;
    families: {
      display_name: string;
    };
  }>;
}

const CLEANING_AREAS = [
  "Cucina", "Bagni", "Aule", "Corridoi", "Giardino", "Mensa"
];

const CleaningCalendar = () => {
  const [slots, setSlots] = useState<CleaningSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [newSlot, setNewSlot] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '',
    area: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { currentFamily } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadSlots();
  }, []);

  const loadSlots = async () => {
    if (!currentFamily) return;
    
    try {
      await supabase.rpc('set_config', {
        setting_name: 'app.current_family',
        setting_value: currentFamily.username
      });

      const { data, error } = await supabase
        .from('cleaning_slots')
        .select(`
          *,
          assignments:cleaning_assignments(
            id,
            family_id,
            families(display_name)
          )
        `)
        .order('date', { ascending: true });

      if (error) throw error;
      setSlots(data || []);
    } catch (error) {
      console.error('Error loading slots:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare gli slot di pulizia",
        variant: "destructive"
      });
    }
  };

  const handleSignUp = async (slotId: string) => {
    if (!currentFamily) return;

    const slot = slots.find(s => s.id === slotId);
    if (!slot) return;

    // Check if user is already signed up
    const isAlreadySignedUp = slot.assignments?.some(
      assignment => assignment.family_id === currentFamily.id
    );

    if (isAlreadySignedUp) {
      toast({
        title: "Attenzione",
        description: "Sei già iscritto a questo slot!",
        variant: "destructive"
      });
      return;
    }

    // Check if slot is full
    if ((slot.assignments?.length || 0) >= slot.max_slots) {
      toast({
        title: "Slot pieno",
        description: "Questo slot è già completo",
        variant: "destructive"
      });
      return;
    }

    try {
      await supabase.rpc('set_config', {
        setting_name: 'app.current_family',
        setting_value: currentFamily.username
      });

      const { error } = await supabase
        .from('cleaning_assignments')
        .insert({
          cleaning_slot_id: slotId,
          family_id: currentFamily.id
        });

      if (error) throw error;

      await loadSlots();
      toast({
        title: "Successo",
        description: "Ti sei iscritto allo slot con successo!"
      });
    } catch (error) {
      console.error('Error signing up for slot:', error);
      toast({
        title: "Errore",
        description: "Impossibile iscriversi allo slot",
        variant: "destructive"
      });
    }
  };

  const createNewSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newSlot.time || !newSlot.area) {
      toast({
        title: "Errore",
        description: "Compila tutti i campi obbligatori",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await supabase.rpc('set_config', {
        setting_name: 'app.current_family',
        setting_value: currentFamily?.username || ''
      });

      const { error } = await supabase
        .from('cleaning_slots')
        .insert({
          date: newSlot.date,
          time: newSlot.time,
          area: newSlot.area,
          max_slots: 2
        });

      if (error) throw error;

      setNewSlot({
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '',
        area: ''
      });

      await loadSlots();
      toast({
        title: "Successo",
        description: "Nuovo slot creato con successo!"
      });
    } catch (error) {
      console.error('Error creating slot:', error);
      toast({
        title: "Errore",
        description: "Impossibile creare il nuovo slot",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get slots for a specific date
  const getSlotsForDate = (date: Date) => {
    return slots.filter(slot => isSameDay(new Date(slot.date), date));
  };

  // Determine day status for calendar styling
  const getDayStatus = (date: Date) => {
    const daySlots = getSlotsForDate(date);
    if (daySlots.length === 0) return 'none';
    
    const totalAvailable = daySlots.reduce((sum, slot) => sum + slot.max_slots, 0);
    const totalOccupied = daySlots.reduce((sum, slot) => sum + (slot.assignments?.length || 0), 0);
    
    if (totalOccupied >= totalAvailable) return 'full';
    if (totalOccupied > 0) return 'partial';
    return 'available';
  };

  // Get selected date slots
  const selectedDateSlots = selectedDate ? getSlotsForDate(selectedDate) : [];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-waldorf-earth mb-2">Calendario delle Pulizie</h2>
        <p className="text-muted-foreground">Seleziona una data per vedere i turni disponibili</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar Section */}
        <Card className="card-waldorf">
          <CardHeader>
            <CardTitle className="text-waldorf-moss">Calendario</CardTitle>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Disponibile</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span>Parziale</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Completo</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border pointer-events-auto"
              modifiers={{
                available: (date) => getDayStatus(date) === 'available',
                partial: (date) => getDayStatus(date) === 'partial', 
                full: (date) => getDayStatus(date) === 'full'
              }}
              modifiersStyles={{
                available: { backgroundColor: 'rgba(34, 197, 94, 0.3)' },
                partial: { backgroundColor: 'rgba(234, 179, 8, 0.3)' },
                full: { backgroundColor: 'rgba(239, 68, 68, 0.3)' }
              }}
            />
          </CardContent>
        </Card>

        {/* Selected Date Slots */}
        <Card className="card-waldorf">
          <CardHeader>
            <CardTitle className="text-waldorf-moss">
              Turni per {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : 'Seleziona una data'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateSlots.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nessun turno disponibile per questa data.
              </p>
            ) : (
              <div className="space-y-4">
                {selectedDateSlots.map((slot) => (
                  <div key={slot.id} className="border border-border rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="h-4 w-4" />
                            {slot.time}
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            {slot.area}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {slot.assignments?.length || 0}/{slot.max_slots} posti occupati
                          </span>
                        </div>

                        {slot.assignments && slot.assignments.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            <span className="text-sm text-muted-foreground">Iscritti:</span>
                            {slot.assignments.map((assignment) => (
                              <Badge key={assignment.id} variant="secondary">
                                {assignment.families.display_name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {(slot.assignments?.length || 0) < slot.max_slots && (
                        <Button
                          onClick={() => handleSignUp(slot.id)}
                          className="btn-waldorf"
                          size="sm"
                        >
                          Iscriviti
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create New Slot Section */}
      <Card className="card-waldorf">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-waldorf-moss">
            <Plus className="h-5 w-5" />
            Crea Nuovo Slot
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createNewSlot} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium mb-2">
                  Data
                </label>
                <Input
                  id="date"
                  type="date"
                  value={newSlot.date}
                  onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
                  className="input-waldorf"
                  required
                />
              </div>

              <div>
                <label htmlFor="time" className="block text-sm font-medium mb-2">
                  Orario
                </label>
                <Input
                  id="time"
                  type="time"
                  value={newSlot.time}
                  onChange={(e) => setNewSlot({ ...newSlot, time: e.target.value })}
                  className="input-waldorf"
                  required
                />
              </div>

              <div>
                <label htmlFor="area" className="block text-sm font-medium mb-2">
                  Area
                </label>
                <Select
                  value={newSlot.area}
                  onValueChange={(value) => setNewSlot({ ...newSlot, area: value })}
                >
                  <SelectTrigger className="input-waldorf">
                    <SelectValue placeholder="Seleziona area" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLEANING_AREAS.map((area) => (
                      <SelectItem key={area} value={area}>
                        {area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="btn-waldorf">
              <Plus className="h-4 w-4 mr-2" />
              Crea Slot
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CleaningCalendar;