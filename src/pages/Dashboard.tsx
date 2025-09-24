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
          src="/src/assets/waldorf-community-banner.jpg" 
          alt="Comunità Waldorf" 
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <div className="text-center text-white">
            <h1 className="text-4xl font-bold mb-2">Comunità Waldorf</h1>
            <p className="text-xl">Crescere insieme in armonia</p>
          </div>
        </div>
        {/* Logout button */}
        <div className="absolute top-4 right-4">
          <Button 
            onClick={logout}
            variant="secondary"
            className="bg-white/10 text-white border border-white/20 hover:bg-white/20"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Esci
          </Button>
        </div>
      </div>

      {/* Welcome Card */}
      <div className="container mx-auto px-4 py-8">
        <Card className="card-waldorf mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-waldorf-earth">
              Benvenuto, {currentFamily.display_name}! 👋
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Insieme costruiamo una comunità dove ogni famiglia contribuisce con il proprio tempo e le proprie energie. 
              Ogni piccolo gesto conta per creare un ambiente di apprendimento e crescita per i nostri bambini.
              La bellezza nasce dalla collaborazione e dall'amore che mettiamo in tutto ciò che facciamo.
            </p>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-card border border-border rounded-2xl p-2">
            <TabsTrigger 
              value="time-tracker" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              Registro Ore
            </TabsTrigger>
            <TabsTrigger 
              value="tasks" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl flex items-center gap-2"
            >
              <CheckSquare className="h-4 w-4" />
              Compiti da Svolgere
            </TabsTrigger>
            <TabsTrigger 
              value="cleaning-calendar" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-xl flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Calendario Pulizie
            </TabsTrigger>
          </TabsList>

          <TabsContent value="time-tracker" className="space-y-6">
            <TimeTracker />
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <TaskManager />
          </TabsContent>

          <TabsContent value="cleaning-calendar" className="space-y-6">
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