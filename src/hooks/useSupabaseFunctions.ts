import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FunctionOptions {
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
}

export function useSupabaseFunctions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invokeFunction = async <T = unknown>(
    functionName: string, 
    method: 'GET' | 'POST' = 'POST', // Default to POST to match most common API patterns
    options?: FunctionOptions
  ): Promise<{ data: T | null; error: string | null }> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Invoking function ${functionName} with method ${method}`, options?.body);
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        method,
        body: options?.body,
        headers: {
          ...options?.headers,
          'Content-Type': 'application/json',
        }
      });

      if (error) {
        console.error(`Error invoking function ${functionName}:`, error);
        setError(error.message || 'Unknown error calling function');
        return { data: null, error: error.message || 'Unknown error calling function' };
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
  const get = <T = unknown>(functionName: string, options?: FunctionOptions) => 
    invokeFunction<T>(functionName, 'GET', options);
  
  const post = <T = unknown>(functionName: string, options?: FunctionOptions) => 
    invokeFunction<T>(functionName, 'POST', options);

  return {
    invokeFunction,
    get,
    post,
    isLoading,
    error,
    clearError: () => setError(null)
  };
} 