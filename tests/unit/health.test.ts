/**
 * Unit Tests for Health Endpoint
 *
 * 🧠 LEARNING: What are Unit Tests?
 *
 * Unit tests are the foundation of testing:
 * ✅ Test individual functions/components in ISOLATION
 * ✅ No database, no external APIs, no file system
 * ✅ Fast execution (milliseconds per test)
 * ✅ Mock all dependencies
 * ✅ Easy to debug when they fail
 * ✅ Should be 80% of your test suite
 *
 * Unit Test Structure (AAA Pattern):
 * 1. ARRANGE: Set up test data and mocks
 * 2. ACT: Execute the function being tested
 * 3. ASSERT: Check the results match expectations
 *
 * Why test the health endpoint?
 * - Simple function to start with
 * - No authentication required
 * - Demonstrates basic testing patterns
 * - Essential for monitoring/alerting
 */

import { NextRequest } from "next/server";
import { GET } from "@/app/api/external/health/route";

describe("Health Endpoint Unit Tests", () => {
  beforeEach(() => {
    // 🧠 LEARNING: Reset mocks before each test
    // This ensures tests don't affect each other
    jest.clearAllMocks();
  });

  describe("GET /api/external/health", () => {
    it("should return healthy status with correct structure", async () => {
      // ARRANGE: Set up test data
      const request = new NextRequest(
        "http://localhost:4000/api/external/health"
      );

      // ACT: Execute the function we're testing
      const response = await GET();
      const data = await response.json();

      // ASSERT: Check the results
      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        message: "Success",
        data: {
          status: "healthy",
          timestamp: expect.any(String),
          version: "0.1.0",
          environment: "test",
        },
      });
    });

    it("should return valid timestamp", async () => {
      // ACT
      const response = await GET();
      const data = await response.json();

      // ASSERT: Verify timestamp is valid
      const timestamp = data.data.timestamp;
      expect(timestamp).toBeDefined();
      expect(new Date(timestamp)).toBeInstanceOf(Date);
      expect(new Date(timestamp).getTime()).toBeGreaterThan(Date.now() - 1000); // Within last second
    });

    it("should include all required health check fields", async () => {
      // ACT
      const response = await GET();
      const data = await response.json();

      // ASSERT: Test that all required fields are present
      expect(data.data).toHaveProperty("status");
      expect(data.data).toHaveProperty("timestamp");
      expect(data.data).toHaveProperty("version");
      expect(data.data).toHaveProperty("environment");

      // Test field types
      expect(typeof data.data.status).toBe("string");
      expect(typeof data.data.timestamp).toBe("string");
      expect(typeof data.data.version).toBe("string");
      expect(typeof data.data.environment).toBe("string");
    });

    it("should use test environment in NODE_ENV", async () => {
      // ACT
      const response = await GET();
      const data = await response.json();

      // ASSERT: Verify we're using test environment
      expect(data.data.environment).toBe("test");
    });
  });
});
