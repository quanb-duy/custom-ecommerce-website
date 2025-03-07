import React, { useEffect, useState } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { isSupabaseInitialized } from '@/integrations/supabase/client';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ServiceStatus {
  name: string;
  available: boolean;
  critical: boolean;
}

const ServiceStatusCheck: React.FC = () => {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);

  const checkServices = async () => {
    setLoading(true);
    
    const serviceChecks: ServiceStatus[] = [
      // Check Supabase initialization
      {
        name: 'Database',
        available: isSupabaseInitialized(),
        critical: true,
      },
      
      // Check Stripe availability
      {
        name: 'Payment System',
        available: Boolean(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY),
        critical: true,
      },
      
      // Check Packeta availability
      {
        name: 'Shipping System',
        available: Boolean(import.meta.env.VITE_PACKETA_API_KEY),
        critical: false, // Non-critical service
      }
    ];
    
    setServices(serviceChecks);
    
    // Check if any critical service is unavailable
    const hasCriticalServiceIssue = serviceChecks
      .some(service => service.critical && !service.available);
      
    setShowAlert(hasCriticalServiceIssue);
    setLoading(false);
  };

  useEffect(() => {
    checkServices();
  }, []);

  if (!showAlert) {
    return null;
  }

  const unavailableServices = services
    .filter(service => !service.available)
    .map(service => service.name)
    .join(', ');

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Service Unavailable</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>
          Some critical services are currently unavailable: {unavailableServices}.
          This may be due to missing configuration or server issues.
        </p>
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-1"
            onClick={checkServices} 
            disabled={loading}
          >
            {loading && <RefreshCw className="h-3 w-3 animate-spin" />}
            Retry
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default ServiceStatusCheck; 