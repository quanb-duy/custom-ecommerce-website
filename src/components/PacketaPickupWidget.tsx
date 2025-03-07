import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  const [scriptError, setScriptError] = useState(false);
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
        setScriptError(false);
      };
      script.onerror = () => {
        console.error('Failed to load Packeta widget script');
        setScriptError(true);
        setWidgetLoaded(false);
      };
      document.body.appendChild(script);
    } else if (window.Packeta) {
      setWidgetLoaded(true);
      setScriptError(false);
    }
  }, []);

  // Fetch pickup points
  useEffect(() => {
    const fetchPickupPoints = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.functions.invoke('packeta-points');
        
        if (error) {
          throw new Error(error.message || 'Failed to load pickup points');
        }
        
        if (data?.pickupPoints) {
          setPickupPoints(data.pickupPoints);
        }
      } catch (err: any) {
        console.error('Failed to fetch pickup points:', err);
        toast({
          title: 'Error',
          description: 'Failed to load pickup points. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPickupPoints();
  }, [toast]);

  const openPacketaWidget = () => {
    if (widgetLoaded && window.Packeta) {
      if (!widgetRef.current) {
        try {
          const apiKey = import.meta.env.VITE_PACKETA_API_KEY || 'test-key';
          widgetRef.current = new window.Packeta.Widget({
            appIdentity: 'EcommerceShop',
            language: 'en_GB',
            country: 'CZ', // Using Czech Republic based on your locale settings
            defaultExpanded: true,
            apiKey: apiKey,
            showInfo: true,
            callback: (point: any) => {
              if (!point) {
                console.error('Invalid point data returned from Packeta widget');
                toast({
                  title: 'Error',
                  description: 'Failed to select pickup point',
                  variant: 'destructive',
                });
                return;
              }
              
              // Process the selected pickup point
              const selectedPoint: PacketaPoint = {
                id: point.id,
                name: point.name,
                address: point.street,
                zip: point.zip,
                city: point.city
              };
              onSelect(selectedPoint);
              toast({
                title: 'Pickup Point Selected',
                description: `${selectedPoint.name}, ${selectedPoint.address}`,
              });
            }
          });
        } catch (error) {
          console.error('Failed to initialize Packeta widget:', error);
          toast({
            title: 'Error',
            description: 'Failed to initialize pickup points widget',
            variant: 'destructive',
          });
          setWidgetLoaded(false);
          return;
        }
      }
      
      try {
        widgetRef.current.open();
      } catch (error) {
        console.error('Failed to open Packeta widget:', error);
        toast({
          title: 'Error',
          description: 'Failed to open pickup points widget',
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Widget not ready',
        description: scriptError ? 
          'Failed to load pickup points widget. Please try again later.' : 
          'Please wait while we load the pickup points widget.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
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
