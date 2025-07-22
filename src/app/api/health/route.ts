/**
 * ClínicAI - Asistente de IA para Notas Clínicas
 * 
 * Autor: Nicolas Ceballos Brito
 * Portfolio: https://nico2603.github.io/PersonalPage/
 * GitHub: https://github.com/Nico2603
 * LinkedIn: https://www.linkedin.com/in/nicolas-ceballos-brito/
 * 
 * Desarrollado para Teilur.ai
 */

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Verificar que la aplicación esté funcionando correctamente
    const healthCheck = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'notas-ai',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };

    return NextResponse.json(healthCheck, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
      },
      { status: 503 }
    );
  }
} 