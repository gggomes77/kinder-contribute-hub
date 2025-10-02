import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  className?: string;
  fullScreen?: boolean;
}

export const LoadingState = ({ 
  message = "Caricamento...", 
  className,
  fullScreen = false 
}: LoadingStateProps) => {
  const containerClass = fullScreen 
    ? "min-h-screen flex items-center justify-center" 
    : "flex items-center justify-center py-12";

  return (
    <div className={cn(containerClass, className)}>
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};