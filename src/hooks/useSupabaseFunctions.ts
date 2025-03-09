import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FunctionOptions {
  body?: Record<string, any>;
  headers?: Record<string, string>;
}

export function useSupabaseFunctions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invokeFunction = async <T = any>(
    functionName: string, 
    method: 'GET' | 'POST', 
    options?: FunctionOptions
  ): Promise<{ data: T | null; error: string | null }> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Invoking function ${functionName} with method ${method}`);
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        method,
        body: options?.body,
        headers: options?.headers
      });

      if (error) {
        console.error(`Error invoking function ${functionName}:`, error);
        setError(error.message);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error(`Exception invoking function ${functionName}:`, err);
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Convenience methods for GET and POST
  const get = <T = any>(functionName: string, options?: FunctionOptions) => 
    invokeFunction<T>(functionName, 'GET', options);
  
  const post = <T = any>(functionName: string, options?: FunctionOptions) => 
    invokeFunction<T>(functionName, 'POST', options);

  return {
    invokeFunction,
    get,
    post,
    isLoading,
    error
  };
} 