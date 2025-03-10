import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSupabaseFunctions } from '@/hooks/useSupabaseFunctions';

interface PacketaPoint {
  id: string;
  name: string;
  address: string;
  zip: string;
  city: string;
}

interface PacketaWidgetCallbackPoint {
  id: string;
  name: string;
  street: string;
  zip: string;
  city: string;
}

interface PacketaWidgetInstance {
  open: () => void;
}

interface PacketaWidgetOptions {
  appIdentity: string;
  language: string;
  country: string;
  defaultExpanded: boolean;
  apiKey: string;
  showInfo: boolean;
  invoiceLocale?: string;
  callback: (point: PacketaWidgetCallbackPoint) => void;
}

interface PacketaPickupWidgetProps {
  onSelect: (point: PacketaPoint) => void;
  selectedPoint?: PacketaPoint | null;
}

declare global {
  interface Window {
    Packeta?: {
      Widget: new (options: PacketaWidgetOptions) => PacketaWidgetInstance;
    };
  }
}

const PacketaPickupWidget = ({ onSelect, selectedPoint }: PacketaPickupWidgetProps) => {
  const [loading, setLoading] = useState(false);
  const [widgetLoaded, setWidgetLoaded] = useState(false);
  const [pickupPoints, setPickupPoints] = useState<PacketaPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const widgetRef = useRef<PacketaWidgetInstance | null>(null);
  const { get: invokeGetFunction } = useSupabaseFunctions();

  // Load the Packeta widget script
  useEffect(() => {
    if (!window.Packeta && !document.getElementById('packeta-widget-script')) {
      console.log('Loading Packeta widget script...');
      const script = document.createElement('script');
      script.id = 'packeta-widget-script';
      // Use the official URL from Packeta documentation
      script.src = 'https://widget.packeta.com/v6/www/js/libpacketa.js';
      script.async = true;
      script.onload = () => {
        console.log('Packeta widget script loaded successfully');
        setWidgetLoaded(true);
      };
      script.onerror = (e) => {
        console.error('Failed to load Packeta widget script:', e);
        setError('Failed to load Packeta widget script. Please try again later.');
      };
      document.body.appendChild(script);
    } else if (window.Packeta) {
      console.log('Packeta widget already loaded');
      setWidgetLoaded(true);
    }
  }, []);

  // Fetch pickup points
  useEffect(() => {
    const fetchPickupPoints = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await invokeGetFunction('packeta-points');
        
        if (error) {
          throw new Error(error || 'Failed to load pickup points');
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
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('Failed to fetch pickup points:', err);
        setError('Failed to load pickup points: ' + errorMessage);
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
  }, []);

  const openPacketaWidget = () => {
    if (widgetLoaded && window.Packeta) {
      try {
        console.log('Opening Packeta widget with API key:', import.meta.env.VITE_PACKETA_API_KEY ? 'Available' : 'Not available');
        
        if (!widgetRef.current) {
          widgetRef.current = new window.Packeta.Widget({
            appIdentity: 'EcommerceShop',
            language: 'en_GB', // Set API locale to en_GB as specified
            country: 'CZ',     // Czech Republic
            defaultExpanded: true,
            apiKey: import.meta.env.VITE_PACKETA_API_KEY || '',
            invoiceLocale: 'cs_CZ', // Set invoice locale to cs_CZ as specified
            showInfo: true,
            callback: (point: PacketaWidgetCallbackPoint) => {
              console.log('Packeta point selected:', point);
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
      } catch (err) {
        console.error('Error opening Packeta widget:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError('Error opening Packeta widget: ' + errorMessage);
        toast({
          title: 'Widget error',
          description: 'Failed to open pickup points widget. Please try selecting from the list below.',
          variant: 'destructive',
        });
      }
    } else {
      console.error('Packeta widget not ready. Widget loaded:', widgetLoaded, 'Packeta available:', !!window.Packeta);
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
