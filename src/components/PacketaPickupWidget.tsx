import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PacketaPoint {
  id: string;
  name: string;
  address: string;
  zip: string;
  city: string;
}

interface PacketaWidgetPoint {
  id?: string;
  carrierId?: string;
  name?: string;
  street?: string;
  zip?: string;
  city?: string;
  formatedValue?: string;
}

interface PacketaWidgetOptions {
  country: string;
  language: string;
  valueFormat: string;
  view: string;
  vendors: Array<{
    country: string;
    group: string;
    selected: boolean;
  }>;
  defaultCurrency: string;
  defaultPrice: string;
}

interface PacketaWidget {
  Widget: {
    pick: (
      apiKey: string,
      callback: (point: PacketaWidgetPoint | null) => void,
      options: PacketaWidgetOptions
    ) => void;
  };
}

declare global {
  interface Window {
    Packeta?: PacketaWidget;
    packetaOptions?: PacketaWidgetOptions;
    packetaApiKey?: string;
    showSelectedPickupPoint?: (point: PacketaWidgetPoint | null) => void;
  }
}

interface PacketaPickupWidgetProps {
  onSelect: (point: PacketaPoint) => void;
  selectedPoint?: PacketaPoint | null;
}

const PacketaPickupWidget = ({ onSelect, selectedPoint }: PacketaPickupWidgetProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const valueRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load the Packeta widget script
    if (!window.Packeta && !document.getElementById('packeta-widget-script')) {
      const script = document.createElement('script');
      script.id = 'packeta-widget-script';
      script.src = 'https://widget.packeta.com/v6/www/js/library.js';
      script.async = true;
      
      script.onload = () => {
        console.log('Packeta widget script loaded successfully');
        setLoading(false);
        
        // Initialize Packeta options after script loads
        const packetaOptions: PacketaWidgetOptions = {
          country: "cz", 
          language: "cs", 
          valueFormat: "\"Packeta\",id,carrierId,carrierPickupPointId,name,city,street", 
          view: "modal", 
          vendors: [
            { 
              country: "cz", 
              group: "zbox", 
              selected: true
            }
          ], 
          defaultCurrency: "usd", 
          defaultPrice: "100"
        };

        // Define the callback function
        window.showSelectedPickupPoint = (point: PacketaWidgetPoint | null) => {
          if (valueRef.current) {
            valueRef.current.innerText = '';
            if (point) {
              console.log("Selected point", point);
              valueRef.current.innerText = "Address: " + (point.formatedValue || '');
              
              // Transform the point data to match our interface
              const selectedPoint: PacketaPoint = {
                id: point.id || point.carrierId || 'unknown',
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
          }
        };

        // Store options and API key in window object as per Packeta's example
        window.packetaOptions = packetaOptions;
        window.packetaApiKey = import.meta.env.VITE_PACKETA_API_KEY;
      };
      
      script.onerror = (e) => {
        console.error('Failed to load Packeta widget script:', e);
        setError('Failed to load Packeta widget script. Please try again later.');
        setLoading(false);
      };
      
      setLoading(true);
      document.body.appendChild(script);
    }
  }, [onSelect, toast]);

  const openPacketaWidget = () => {
    try {
      if (!window.Packeta || !window.packetaApiKey || !window.packetaOptions || !window.showSelectedPickupPoint) {
        throw new Error('Packeta widget not loaded');
      }

      // Use the exact code from Packeta's example
      window.Packeta.Widget.pick(
        window.packetaApiKey,
        window.showSelectedPickupPoint,
        window.packetaOptions
      );
    } catch (err) {
      console.error('Error opening Packeta widget:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError('Error opening Packeta widget: ' + errorMessage);
      toast({
        title: 'Widget Error',
        description: 'Failed to open pickup points widget.',
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
      
      <button 
        className="packeta-selector-open w-full px-4 py-2 border rounded-md hover:bg-gray-50"
        onClick={openPacketaWidget}
        disabled={loading}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            Loading pickup points...
          </div>
        ) : (
          selectedPoint ? 'Change Pickup Point' : 'Select Pickup Point'
        )}
      </button>
      
      <div ref={valueRef} className="packeta-selector-value"></div>
      
      {selectedPoint && (
        <div className="p-3 border rounded-md bg-gray-50">
          <h4 className="font-medium">{selectedPoint.name}</h4>
          <p className="text-sm text-gray-600">
            {selectedPoint.address}, {selectedPoint.zip} {selectedPoint.city}
          </p>
        </div>
      )}
    </div>
  );
};

export default PacketaPickupWidget;
