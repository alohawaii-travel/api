import {
  validateAdminAuth,
  isAdminRole,
  isManagerRole,
  isStaffRole,
} from "@/lib/admin-auth";
import { UserRole } from "@/types/database";

/**
 * Test script to validate the admin authentication helpers
 */

describe("Admin Auth Helper Functions", () => {
  describe("Role hierarchy functions", () => {
    describe("isStaffRole", () => {
      it("should return true for STAFF role", () => {
        expect(isStaffRole(UserRole.STAFF)).toBe(true);
      });

      it("should return true for MANAGER role", () => {
        expect(isStaffRole(UserRole.MANAGER)).toBe(true);
      });

      it("should return true for ADMIN role", () => {
        expect(isStaffRole(UserRole.ADMIN)).toBe(true);
      });

      it("should return false for USER role", () => {
        expect(isStaffRole(UserRole.USER)).toBe(false);
      });
    });

    describe("isManagerRole", () => {
      it("should return true for MANAGER role", () => {
        expect(isManagerRole(UserRole.MANAGER)).toBe(true);
      });

      it("should return true for ADMIN role", () => {
        expect(isManagerRole(UserRole.ADMIN)).toBe(true);
      });

      it("should return false for STAFF role", () => {
        expect(isManagerRole(UserRole.STAFF)).toBe(false);
      });

      it("should return false for USER role", () => {
        expect(isManagerRole(UserRole.USER)).toBe(false);
      });
    });

    describe("isAdminRole", () => {
      it("should return true for ADMIN role", () => {
        expect(isAdminRole(UserRole.ADMIN)).toBe(true);
      });

      it("should return false for MANAGER role", () => {
        expect(isAdminRole(UserRole.MANAGER)).toBe(false);
      });

      it("should return false for STAFF role", () => {
        expect(isAdminRole(UserRole.STAFF)).toBe(false);
      });

      it("should return false for USER role", () => {
        expect(isAdminRole(UserRole.USER)).toBe(false);
      });
    });
  });
});
