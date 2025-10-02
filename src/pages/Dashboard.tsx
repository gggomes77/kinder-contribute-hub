import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { TimeTracker } from "@/components/TimeTracker";
import CleaningCalendar from "@/components/CleaningCalendar";
import TaskManager from "@/components/TaskManager";
import { Clock, Calendar, Users, LogOut, CheckSquare } from "lucide-react";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("time-tracker");
  const { currentFamily, logout } = useAuth();

  if (!currentFamily) {
    console.error('Dashboard: No current family found in auth context');
    return <div>Error: Authentication required</div>;
  }

  return (
    <div className="min-h-screen bg-waldorf-warm">
      {/* Header with banner and logout */}
      <div className="relative">
        <img 
          src="/waldorf-community-banner.jpg" 
          alt="Comunità Waldorf" 
          className="w-full h-32 md:h-48 object-cover"
        />
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center px-4">
          <div className="text-center text-white">
            <h1 className="text-2xl md:text-4xl font-bold mb-1 md:mb-2">Comunità Waldorf</h1>
            <p className="text-sm md:text-xl">Crescere insieme in armonia</p>
          </div>
        </div>
        {/* Logout button */}
        <div className="absolute top-2 md:top-4 right-2 md:right-4">
          <Button 
            onClick={logout}
            variant="secondary"
            size="sm"
            className="bg-white/10 text-white border border-white/20 hover:bg-white/20 text-xs md:text-sm"
          >
            <LogOut className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">Esci</span>
          </Button>
        </div>
      </div>

      {/* Welcome Card */}
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        <Card className="card-waldorf mb-4 md:mb-8">
          <CardHeader>
            <CardTitle className="text-lg md:text-2xl text-waldorf-earth">
              Benvenuto, {currentFamily.display_name}! 👋
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm md:text-lg leading-relaxed">
              Insieme costruiamo una comunità dove ogni famiglia contribuisce con il proprio tempo e le proprie energie. 
              Ogni piccolo gesto conta per creare un ambiente di apprendimento e crescita per i nostri bambini.
              La bellezza nasce dalla collaborazione e dall'amore che mettiamo in tutto ciò che facciamo.
            </p>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-card border border-border rounded-xl md:rounded-2xl p-1">
            <TabsTrigger 
              value="time-tracker" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg md:rounded-xl flex items-center justify-center gap-1 text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 py-1.5 md:py-2"
            >
              <Clock className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden xs:inline">Banca Ore</span>
              <span className="xs:hidden">Ore</span>
            </TabsTrigger>
            <TabsTrigger 
              value="tasks" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg md:rounded-xl flex items-center justify-center gap-1 text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 py-1.5 md:py-2"
            >
              <CheckSquare className="h-3 w-3 md:h-4 md:w-4" />
              <span>Compiti</span>
            </TabsTrigger>
            <TabsTrigger 
              value="cleaning-calendar" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg md:rounded-xl flex items-center justify-center gap-1 text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 py-1.5 md:py-2"
            >
              <Calendar className="h-3 w-3 md:h-4 md:w-4" />
              <span>Pulizie</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="time-tracker">
            <TimeTracker />
          </TabsContent>

          <TabsContent value="tasks">
            <TaskManager />
          </TabsContent>

          <TabsContent value="cleaning-calendar">
            <CleaningCalendar />
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <footer className="bg-waldorf-gradient text-primary-foreground py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-xl font-semibold mb-2">Comunità Waldorf</h3>
          <p className="text-primary-foreground/80">
            Dove l'educazione incontra l'amore per la crescita umana
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;