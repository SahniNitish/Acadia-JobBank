import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createClient();
    
    // Check database connection
    const { data: dbCheck, error: dbError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (dbError) {
      throw new Error(`Database connection failed: ${dbError.message}`);
    }
    
    // Check authentication service
    const { data: authCheck, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      throw new Error(`Auth service failed: ${authError.message}`);
    }
    
    // Check storage service
    const { data: storageCheck, error: storageError } = await supabase.storage
      .from('resumes')
      .list('', { limit: 1 });
    
    if (storageError) {
      throw new Error(`Storage service failed: ${storageError.message}`);
    }
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'operational',
        authentication: 'operational',
        storage: 'operational',
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
    
    return NextResponse.json(healthStatus, { status: 200 });
    
  } catch (error) {
    const errorStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.NODE_ENV || 'development',
    };
    
    return NextResponse.json(errorStatus, { status: 503 });
  }
}