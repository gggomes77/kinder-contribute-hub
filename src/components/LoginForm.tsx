import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Leaf, Users } from 'lucide-react';

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast({
        title: "Errore",
        description: "Inserisci il nome della famiglia",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const result = await login(username.trim());
    
    if (!result.success) {
      toast({
        title: "Errore di accesso",
        description: result.error || "Nome famiglia non valido",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Accesso effettuato",
        description: "Benvenuto nella dashboard!",
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Leaf className="w-8 h-8 text-green-600" />
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Giardino della Fenice
          </h1>
          <p className="text-gray-600">
            Dashboard della Comunità
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Accesso Famiglia</CardTitle>
            <CardDescription>
              Inserisci il nome della tua famiglia per accedere alla dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="username">Nome Famiglia</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="es. rossi, bianchi, verdi..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Accesso in corso..." : "Accedi"}
              </Button>
            </form>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-sm text-blue-900 mb-2">
                Famiglie disponibili:
              </h3>
              <p className="text-xs text-blue-800">
                rossi, bianchi, verdi, ferrari, romano
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginForm;