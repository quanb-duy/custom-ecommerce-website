
import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PacketaPoint {
  id: string;
  name: string;
  address: string;
  zip: string;
  city: string;
}

interface PacketaPickupWidgetProps {
  onSelect: (point: PacketaPoint) => void;
  selectedPoint?: PacketaPoint | null;
}

declare global {
  interface Window {
    Packeta?: {
      Widget: new (options: any) => {
        open: () => void;
      };
    };
  }
}

const PacketaPickupWidget = ({ onSelect, selectedPoint }: PacketaPickupWidgetProps) => {
  const [loading, setLoading] = useState(false);
  const [widgetLoaded, setWidgetLoaded] = useState(false);
  const [pickupPoints, setPickupPoints] = useState<PacketaPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const widgetRef = useRef<any>(null);

  // Load the Packeta widget script
  useEffect(() => {
    if (!window.Packeta && !document.getElementById('packeta-widget-script')) {
      const script = document.createElement('script');
      script.id = 'packeta-widget-script';
      script.src = 'https://widget.packeta.com/v6/www/js/packeta.js';
      script.async = true;
      script.onload = () => {
        setWidgetLoaded(true);
      };
      script.onerror = () => {
        setError('Failed to load Packeta widget script');
        console.error('Failed to load Packeta widget script');
      };
      document.body.appendChild(script);
    } else if (window.Packeta) {
      setWidgetLoaded(true);
    }
  }, []);

  // Fetch pickup points
  useEffect(() => {
    const fetchPickupPoints = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase.functions.invoke('packeta-points');
        
        if (error) {
          throw new Error(error.message || 'Failed to load pickup points');
        }
        
        if (data?.pickupPoints) {
          setPickupPoints(data.pickupPoints);
        } else {
          // Fallback to hardcoded pickup points if API returns no data
          setPickupPoints([
            {
              id: "fallback-1001",
              name: "Packeta Point - City Center (Fallback)",
              address: "123 Main St, Prague",
              zip: "11000",
              city: "Prague"
            },
            {
              id: "fallback-1002",
              name: "Packeta Point - Shopping Mall (Fallback)",
              address: "456 Commerce Ave, Brno",
              zip: "60200",
              city: "Brno"
            }
          ]);
        }
      } catch (err: any) {
        console.error('Failed to fetch pickup points:', err);
        setError('Failed to load pickup points: ' + (err.message || 'Unknown error'));
        // Fallback to hardcoded pickup points in case of error
        setPickupPoints([
          {
            id: "fallback-1001",
            name: "Packeta Point - City Center (Fallback)",
            address: "123 Main St, Prague",
            zip: "11000",
            city: "Prague"
          },
          {
            id: "fallback-1002",
            name: "Packeta Point - Shopping Mall (Fallback)",
            address: "456 Commerce Ave, Brno",
            zip: "60200",
            city: "Brno"
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchPickupPoints();
  }, [toast]);

  const openPacketaWidget = () => {
    if (widgetLoaded && window.Packeta) {
      try {
        if (!widgetRef.current) {
          widgetRef.current = new window.Packeta.Widget({
            appIdentity: 'EcommerceShop',
            language: 'en',
            country: 'US', // Change according to your default country
            defaultExpanded: true,
            // In production, we would use real API credentials
            apiKey: 'test-key', // This would be replaced with the real key at runtime
            showInfo: true,
            callback: (point: any) => {
              // Process the selected pickup point
              const selectedPoint: PacketaPoint = {
                id: point.id || 'unknown-id',
                name: point.name || 'Unknown Location',
                address: point.street || 'Unknown Address',
                zip: point.zip || 'Unknown Zip',
                city: point.city || 'Unknown City'
              };
              onSelect(selectedPoint);
              toast({
                title: 'Pickup Point Selected',
                description: `${selectedPoint.name}, ${selectedPoint.address}`,
              });
            }
          });
        }
        
        widgetRef.current.open();
      } catch (err: any) {
        console.error('Error opening Packeta widget:', err);
        setError('Error opening Packeta widget: ' + (err.message || 'Unknown error'));
        toast({
          title: 'Widget error',
          description: 'Failed to open pickup points widget. Please try selecting from the list below.',
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Widget not ready',
        description: 'Please wait while we load the pickup points widget or select from the list below.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Button 
        type="button" 
        variant="outline" 
        onClick={openPacketaWidget}
        disabled={loading || !widgetLoaded}
        className="w-full"
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            Loading pickup points...
          </div>
        ) : (
          selectedPoint ? 'Change Pickup Point' : 'Select Pickup Point'
        )}
      </Button>
      
      {selectedPoint && (
        <div className="p-3 border rounded-md bg-gray-50">
          <h4 className="font-medium">{selectedPoint.name}</h4>
          <p className="text-sm text-gray-600">
            {selectedPoint.address}, {selectedPoint.zip} {selectedPoint.city}
          </p>
        </div>
      )}
      
      {!selectedPoint && pickupPoints.length > 0 && (
        <div className="max-h-60 overflow-y-auto space-y-2">
          {pickupPoints.map(point => (
            <div 
              key={point.id}
              onClick={() => onSelect(point)}
              className="p-2 border rounded cursor-pointer hover:bg-gray-50"
            >
              <div className="font-medium">{point.name}</div>
              <div className="text-sm text-gray-600">
                {point.address}, {point.zip} {point.city}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PacketaPickupWidget;
