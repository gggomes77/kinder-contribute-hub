import React, { useState, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { UserBadgeList } from "@/components/ui/user-badge-list";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Plus, Clock, MapPin, Users, Calendar as CalendarIconEmpty } from "lucide-react";
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

const ITEMS_PER_PAGE = 30;

const CleaningCalendar = () => {
  const [slots, setSlots] = useState<CleaningSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [newSlot, setNewSlot] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    area: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const { currentFamily } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadSlots();
  }, []);

  const loadSlots = async (append = false) => {
    if (!currentFamily) return;
    
    try {
      setError(null);
      await supabase.rpc('set_config', {
        setting_name: 'app.current_family',
        setting_value: currentFamily.username
      });

      // Only load future slots (server-side filtering)
      const today = format(new Date(), 'yyyy-MM-dd');
      const offset = append ? slots.length : 0;

      const { data, error, count } = await supabase
        .from('cleaning_slots')
        .select(`
          *,
          assignments:cleaning_assignments(
            id,
            family_id,
            families(display_name)
          )
        `, { count: 'exact' })
        .gte('date', today)
        .order('date', { ascending: true })
        .range(offset, offset + ITEMS_PER_PAGE - 1);

      if (error) throw error;
      
      const newSlots = append ? [...slots, ...(data || [])] : (data || []);
      setSlots(newSlots);
      setHasMore((count || 0) > newSlots.length);
    } catch (error) {
      console.error('Error loading slots:', error);
      setError('Impossibile caricare gli slot di pulizia');
      toast({
        title: "Errore",
        description: "Impossibile caricare gli slot di pulizia",
        variant: "destructive"
      });
    } finally {
      setInitialLoading(false);
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
      const { error: configError } = await supabase.rpc('set_config', {
        setting_name: 'app.current_family',
        setting_value: currentFamily.username
      });

      if (configError) {
        console.error('Config error:', configError);
        throw configError;
      }

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
    
    if (!newSlot.area) {
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
          time: '09:00',
          area: newSlot.area,
          max_slots: 2
        });

      if (error) throw error;

      setNewSlot({
        date: format(new Date(), 'yyyy-MM-dd'),
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

  if (initialLoading) {
    return <LoadingState message="Caricamento turni di pulizia..." />;
  }

  if (error) {
    return (
      <Card className="card-waldorf">
        <CardContent className="p-6">
          <ErrorState message={error} onRetry={loadSlots} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-waldorf-earth mb-2">Calendario delle Pulizie</h2>
        <p className="text-sm md:text-base text-muted-foreground">Visualizza i turni disponibili e iscriviti</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Calendar Section */}
        <Card className="card-waldorf">
          <CardHeader>
            <CardTitle className="text-waldorf-moss text-base md:text-lg">Calendario</CardTitle>
            <div className="flex flex-wrap gap-3 md:gap-4 text-xs md:text-sm">
              <div className="flex items-center gap-1 md:gap-2">
                <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-green-500"></div>
                <span>Disponibile</span>
              </div>
              <div className="flex items-center gap-1 md:gap-2">
                <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-yellow-500"></div>
                <span>Parziale</span>
              </div>
              <div className="flex items-center gap-1 md:gap-2">
                <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-red-500"></div>
                <span>Completo</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border pointer-events-auto w-full"
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

        {/* All Available Slots */}
        <Card className="card-waldorf">
          <CardHeader>
            <CardTitle className="text-waldorf-moss text-base md:text-lg">
              Tutti i Turni Disponibili
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-80 md:max-h-96 overflow-y-auto">
            {slots.length === 0 ? (
              <EmptyState 
                icon={CalendarIconEmpty}
                title="Nessun turno disponibile"
                description="Crea il primo turno di pulizia per la comunità"
              />
            ) : (
              <div className="space-y-3 md:space-y-4">
                {slots.map((slot) => (
                  <div key={slot.id} className="border border-border rounded-xl p-3 md:p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2 md:gap-4">
                          <span className="text-xs md:text-sm text-muted-foreground">
                            {format(new Date(slot.date), 'dd/MM/yyyy')}
                          </span>
                          <span className="flex items-center gap-1 font-medium text-xs md:text-sm">
                            <Clock className="h-3 w-3 md:h-4 md:w-4" />
                            {slot.time}
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground text-xs md:text-sm">
                            <MapPin className="h-3 w-3 md:h-4 md:w-4" />
                            {slot.area}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                          <span className="text-xs md:text-sm">
                            {slot.assignments?.length || 0}/{slot.max_slots} posti occupati
                          </span>
                        </div>

                        {slot.assignments && slot.assignments.length > 0 && (
                          <UserBadgeList 
                            users={slot.assignments.map(a => ({ 
                              id: a.id, 
                              display_name: a.families.display_name 
                            }))}
                            maxDisplay={3}
                          />
                        )}
                      </div>

                      {(slot.assignments?.length || 0) < slot.max_slots && (
                        <Button
                          onClick={() => handleSignUp(slot.id)}
                          className="btn-waldorf text-xs md:text-sm w-full sm:w-auto"
                          size="sm"
                        >
                          Iscriviti
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {hasMore && (
                  <Button
                    onClick={() => loadSlots(true)}
                    variant="outline"
                    className="w-full mt-2"
                    disabled={isLoading}
                  >
                    Carica altri turni
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create New Slot Section */}
      <Card className="card-waldorf">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-waldorf-moss text-base md:text-lg">
            <Plus className="h-4 w-4 md:h-5 md:w-5" />
            Crea Nuovo Slot
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createNewSlot} className="space-y-3 md:space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
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