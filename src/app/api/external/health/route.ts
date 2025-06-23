import { successResponse } from '@/lib/api-helpers'

/**
 * @swagger
 * /api/external/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Public endpoint to check API health and status
 *     tags:
 *       - External
 *       - Health
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/HealthCheck'
 */
export async function GET() {
  return Response.json(
    successResponse({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      environment: process.env.NODE_ENV,
    })
  )
}
