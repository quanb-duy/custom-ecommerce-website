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

interface PacketaPickupWidgetProps {
  onSelect: (point: PacketaPoint) => void;
  selectedPoint?: PacketaPoint | null;
}

// Use API key from environment or fallback to constant
const PACKETA_API_KEY = import.meta.env.VITE_PACKETA_API_KEY || '6a7673943d8ec270';

const PacketaPickupWidget = ({ onSelect, selectedPoint }: PacketaPickupWidgetProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const valueRef = useRef<HTMLDivElement>(null);
  const [isWidgetReady, setIsWidgetReady] = useState(false);
  const [widgetInitialized, setWidgetInitialized] = useState(false);

  // Setup global function and options for Packeta
  useEffect(() => {
    // Define the callback function for Packeta
    window.showSelectedPickupPoint = (point: any) => {
      if (valueRef.current) {
        valueRef.current.innerText = '';
        if (point) {
          console.log("Selected Packeta point (raw data):", point);
          valueRef.current.innerText = "Address: " + (point.formatedValue || '');
          
          // Make sure we have a valid ID - this is critical for the Packeta API
          const pointId = point.id || point.carrierId || '';
          if (!pointId) {
            console.error('No valid ID found in the Packeta point data:', point);
            toast({
              title: 'Pickup Point Error',
              description: 'Could not retrieve a valid pickup point ID. Please try selecting a different location.',
              variant: 'destructive',
            });
            return;
          }
          
          // Transform the point data to match our interface
          const selectedPoint: PacketaPoint = {
            id: pointId,
            name: point.name || 'Unknown Location',
            address: point.street || 'Unknown Address',
            zip: point.zip || 'Unknown Zip',
            city: point.city || 'Unknown City'
          };
          
          console.log("Formatted pickup point with ID:", selectedPoint);
          onSelect(selectedPoint);
          toast({
            title: 'Pickup Point Selected',
            description: `${selectedPoint.name}, ${selectedPoint.address}`,
          });
        }
      }
    };

    // Set the Packeta options according to the documentation
    window.packetaOptions = {
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

    // Store API key in global object as per Packeta's example
    window.packetaApiKey = PACKETA_API_KEY;

    console.log("Packeta setup initialized with API key:", PACKETA_API_KEY);

    return () => {
      // Cleanup global properties when component unmounts
      delete window.showSelectedPickupPoint;
      delete window.packetaOptions;
      delete window.packetaApiKey;
    };
  }, [onSelect, toast]);

  // Load Packeta widget script
  useEffect(() => {
    const scriptId = 'packeta-widget-script';
    
    if (!document.getElementById(scriptId)) {
      console.log('Loading Packeta widget script...');
      setLoading(true);
      
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://widget.packeta.com/v6/www/js/library.js';
      script.async = true;
      
      script.onload = () => {
        console.log('Packeta widget script loaded successfully');
        setLoading(false);
        setIsWidgetReady(true);
        setWidgetInitialized(true);
      };
      
      script.onerror = (e) => {
        console.error('Failed to load Packeta widget script:', e);
        setError('Failed to load Packeta widget script. Please try again later.');
        setLoading(false);
      };
      
      document.body.appendChild(script);
    } else {
      console.log('Packeta widget script already exists');
      setIsWidgetReady(true);
      if (window.Packeta) {
        setWidgetInitialized(true);
      }
    }
  }, []);

  // Retry initializing widget if window.Packeta becomes available
  useEffect(() => {
    if (isWidgetReady && !widgetInitialized) {
      const checkInterval = setInterval(() => {
        if (window.Packeta) {
          console.log("Window.Packeta is now available");
          setWidgetInitialized(true);
          clearInterval(checkInterval);
        }
      }, 500);
      
      return () => clearInterval(checkInterval);
    }
  }, [isWidgetReady, widgetInitialized]);

  const openPacketaWidget = () => {
    try {
      // Check if Packeta is defined in the global window object
      if (typeof window.Packeta === 'undefined') {
        console.error('Packeta widget not loaded yet');
        setError('Packeta widget not loaded yet. Please wait or refresh the page.');
        toast({
          title: 'Widget Not Ready',
          description: 'Packeta widget is still loading. Please wait a moment.',
          variant: 'destructive',
        });
        return;
      }

      console.log("Opening Packeta widget with:", {
        apiKey: window.packetaApiKey,
        callback: typeof window.showSelectedPickupPoint,
        options: window.packetaOptions
      });

      // Using the direct approach from documentation
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
        description: 'Failed to open pickup points widget: ' + errorMessage,
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
        disabled={loading || !widgetInitialized}
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

// Add these global declarations to make TypeScript happy
declare global {
  interface Window {
    Packeta: any;
    packetaOptions: any;
    packetaApiKey: string;
    showSelectedPickupPoint: (point: any) => void;
  }
}

export default PacketaPickupWidget;
