import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TimeTracker } from '@/components/TimeTracker';
import { CleaningCalendar } from '@/components/CleaningCalendar';
import { Clock, Calendar, Heart, TreePine } from 'lucide-react';
import bannerImage from '@/assets/waldorf-community-banner.jpg';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('time-tracker');

  return (
    <div className="min-h-screen bg-waldorf-warm">
      {/* Header with Banner */}
      <header className="relative overflow-hidden">
        <div 
          className="h-48 md:h-64 bg-cover bg-center relative"
          style={{ backgroundImage: `url(${bannerImage})` }}
        >
          <div className="absolute inset-0 bg-waldorf-gradient opacity-80"></div>
          <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
            <div className="text-center w-full">
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-white mb-2">
              Giardino della Fenice Dashboard
            </h1>
            <p className="text-lg md:text-xl text-white/90 font-medium">
              Insieme coltiviamo l'ambiente di apprendimento dei nostri bambini
            </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Card */}
          <Card className="card-waldorf mb-8">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Heart className="w-6 h-6 text-waldorf-moss" />
                <TreePine className="w-6 h-6 text-waldorf-earth" />
                <Heart className="w-6 h-6 text-waldorf-moss" />
              </div>
              <h2 className="text-2xl font-serif text-waldorf-earth mb-2">
                Benvenuti nel Nostro Spazio Comunitario
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Questa dashboard aiuta la nostra comunità di genitori a coordinare il tempo di volontariato e gli orari delle pulizie. 
                I vostri contributi, grandi o piccoli, aiutano a creare l'ambiente accogliente in cui i nostri bambini prosperano.
              </p>
            </CardContent>
          </Card>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-card border border-border rounded-2xl p-1">
              <TabsTrigger 
                value="time-tracker" 
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Clock className="w-4 h-4" />
                Contributi di Tempo
              </TabsTrigger>
              <TabsTrigger 
                value="cleaning-calendar" 
                className="flex items-center gap-2 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Calendar className="w-4 h-4" />
                Calendario Pulizie
              </TabsTrigger>
            </TabsList>

            <TabsContent value="time-tracker" className="space-y-6">
              <TimeTracker />
            </TabsContent>

            <TabsContent value="cleaning-calendar" className="space-y-6">
              <CleaningCalendar />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-waldorf-gradient text-white py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="flex items-center justify-center gap-2 mb-2">
            <TreePine className="w-5 h-5" />
            <span className="font-serif">Comunità Genitori Giardino della Fenice</span>
            <TreePine className="w-5 h-5" />
          </p>
          <p className="text-white/80 text-sm">
            Costruiamo comunità attraverso responsabilità condivisa e cura
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;