import { NextRequest, NextResponse } from 'next/server';

// API Keys configuration
const API_KEYS = {
  HUB_KEY: process.env.HUB_API_KEY,
  WEBSITE_KEY: process.env.WEBSITE_API_KEY,
  DEV_KEY: process.env.DEV_API_KEY,
} as const;

// Access levels for each API key
const ACCESS_LEVELS: Record<string, RouteType[]> = {
  [API_KEYS.HUB_KEY || '']: ['internal', 'external'],
  [API_KEYS.WEBSITE_KEY || '']: ['external'],
  [API_KEYS.DEV_KEY || '']: ['internal', 'external'],
} as const;

// Allowed origins for each API key
const ALLOWED_ORIGINS: Record<string, string[]> = {
  [API_KEYS.HUB_KEY || '']: [
    'http://localhost:3000',           // Hub development
    'https://hub.alohawaii.com',       // Hub production
  ],
  [API_KEYS.WEBSITE_KEY || '']: [
    'http://localhost:3001',           // Website development
    'https://alohawaii.com',           // Website production
    'https://www.alohawaii.com',       // Website production (www)
  ],
  [API_KEYS.DEV_KEY || '']: [
    'http://localhost:*',              // Any localhost for development
  ],
};

export type RouteType = 'internal' | 'external';

export function validateApiAccess(
  request: NextRequest,
  routeType: RouteType
): { isValid: boolean; error?: string; apiKey?: string } {
  // Skip validation in development if no API keys are set
  if (process.env.NODE_ENV === 'development' && !process.env.HUB_API_KEY) {
    console.log('⚠️ API key validation skipped in development mode');
    return { isValid: true };
  }

  // Get API key from header
  const apiKey = request.headers.get('X-API-Key') || request.headers.get('x-api-key');
  
  if (!apiKey) {
    return { 
      isValid: false, 
      error: 'API key required. Please include X-API-Key header.' 
    };
  }

  // Check if API key is valid
  const allowedRoutes = ACCESS_LEVELS[apiKey];
  if (!allowedRoutes) {
    return { 
      isValid: false, 
      error: 'Invalid API key provided.' 
    };
  }

  // Check if API key has access to this route type
  if (!allowedRoutes.includes(routeType)) {
    return { 
      isValid: false, 
      error: `API key does not have access to ${routeType} routes.` 
    };
  }

  // Validate origin (optional but recommended)
  const origin = request.headers.get('origin') || request.headers.get('referer');
  const allowedOrigins = ALLOWED_ORIGINS[apiKey];
  
  if (origin && allowedOrigins) {
    const isOriginAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        // Handle wildcard patterns like localhost:*
        const pattern = allowedOrigin.replace('*', '\\d+');
        return new RegExp(pattern).test(origin);
      }
      return origin.startsWith(allowedOrigin);
    });

    if (!isOriginAllowed) {
      console.warn(`⚠️ Origin ${origin} not allowed for API key`);
      // Don't fail on origin mismatch in development, just warn
      if (process.env.NODE_ENV === 'production') {
        return { 
          isValid: false, 
          error: 'Origin not allowed for this API key.' 
        };
      }
    }
  }

  return { isValid: true, apiKey };
}

export function createApiAuthMiddleware(routeType: RouteType) {
  return function apiAuthMiddleware(request: NextRequest) {
    const validation = validateApiAccess(request, routeType);
    
    if (!validation.isValid) {
      console.error(`🚫 API access denied: ${validation.error}`);
      return NextResponse.json(
        { 
          success: false, 
          error: validation.error,
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      );
    }

    console.log(`✅ API access granted for ${routeType} route`);
    return null; // Continue to the actual route handler
  };
}

// Helper function to get API key info for logging
export function getApiKeyInfo(apiKey: string): string {
  switch (apiKey) {
    case API_KEYS.HUB_KEY:
      return 'HUB';
    case API_KEYS.WEBSITE_KEY:
      return 'WEBSITE';
    case API_KEYS.DEV_KEY:
      return 'DEV';
    default:
      return 'UNKNOWN';
  }
}
