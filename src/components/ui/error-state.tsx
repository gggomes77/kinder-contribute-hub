import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState = ({ 
  title = "Si è verificato un errore",
  message = "Non è stato possibile caricare i dati. Riprova.",
  onRetry,
  className 
}: ErrorStateProps) => {
  return (
    <div className={cn("text-center py-12 px-4", className)}>
      <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          Riprova
        </Button>
      )}
    </div>
  );
};