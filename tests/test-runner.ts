/**
 * Modern Test Setup and Execution Script
 *
 * 🧠 LEARNING: Why replace shell scripts with Node.js?
 *
 * ✅ Cross-platform compatibility (Windows, macOS, Linux)
 * ✅ Better error handling and logging
 * ✅ Integration with existing Node.js toolchain
 * ✅ Easier to maintain and extend
 * ✅ Type safety with TypeScript
 * ✅ Rich ecosystem of testing utilities
 * ✅ Consistent with project technology stack
 *
 * This script replaces test-setup.sh and provides:
 * - Environment setup
 * - Database management
 * - Test execution
 * - Cleanup
 * - CI/CD integration
 */

import { execSync, spawn, ChildProcess } from "child_process";
import { existsSync, writeFileSync } from "fs";
import { join } from "path";

interface TestConfig {
  testType: "unit" | "integration" | "e2e" | "all";
  watch: boolean;
  coverage: boolean;
  verbose: boolean;
  ci: boolean;
  cleanup: boolean;
  setupDatabase: boolean;
}

class TestRunner {
  private config: TestConfig;
  private processes: ChildProcess[] = [];

  constructor(config: TestConfig) {
    this.config = config;
  }

  /**
   * 🧠 LEARNING: Environment Setup
   *
   * Why setup environment programmatically?
   * - Ensures consistent test conditions
   * - Prevents conflicts with development environment
   * - Easy to modify for different test scenarios
   * - Better error handling than shell scripts
   */
  private setupEnvironment(): void {
    console.log("🔧 Setting up test environment...");

    // Set test environment variables
    (process.env as any).NODE_ENV = "test";
    process.env.NEXTAUTH_URL = "http://localhost:4001";
    process.env.NEXTAUTH_SECRET = "test-secret-key-for-testing";
    process.env.GOOGLE_CLIENT_ID = "mock-google-client-id";
    process.env.GOOGLE_CLIENT_SECRET = "mock-google-client-secret";
    process.env.API_DOMAIN_WHITELIST = "testcompany.com,example.org";

    // Database URLs
    process.env.DATABASE_URL =
      "postgresql://test:test@localhost:5433/alohawaii_test";
    process.env.TEST_DATABASE_URL =
      "postgresql://test:test@localhost:5433/alohawaii_test";

    console.log("✅ Environment configured for testing");
  }

  /**
   * 🧠 LEARNING: Database Management
   *
   * Automated database setup:
   * - Start test database container
   * - Wait for database to be ready
   * - Run migrations
   * - Seed test data
   */
  private async setupDatabase(): Promise<void> {
    if (!this.config.setupDatabase) {
      console.log("⏭️  Skipping database setup");
      return;
    }

    console.log("🗄️  Setting up test database...");

    try {
      // Check if test database is already running
      try {
        execSync(
          'docker ps --filter "name=alohawaii-test-db" --filter "status=running" --quiet',
          { stdio: "pipe" }
        );
        console.log("✅ Test database already running");
      } catch {
        console.log("🚀 Starting test database...");
        execSync(
          "docker-compose -f ../../docker-compose.test.yml up -d test-db",
          { stdio: "inherit" }
        );
      }

      // Wait for database to be ready
      console.log("⏳ Waiting for database to be ready...");
      await this.waitForDatabase();

      // Run migrations
      console.log("🔧 Running database migrations...");
      execSync("npx prisma migrate deploy", {
        stdio: "inherit",
        env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL },
      });

      // Seed database with test data
      console.log("🌱 Seeding test database...");
      execSync("npx prisma db seed", {
        stdio: "inherit",
        env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL },
      });

      console.log("✅ Database setup complete");
    } catch (error) {
      console.error("❌ Database setup failed:", error);
      throw error;
    }
  }

  /**
   * 🧠 LEARNING: Async Process Management
   *
   * Why wait for database programmatically?
   * - More reliable than fixed delays
   * - Faster test execution
   * - Better error reporting
   * - Cross-platform compatibility
   */
  private async waitForDatabase(maxAttempts: number = 30): Promise<void> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        execSync(
          "docker exec alohawaii-test-db pg_isready -U test -d alohawaii_test",
          { stdio: "pipe" }
        );
        return;
      } catch {
        if (attempt === maxAttempts) {
          throw new Error("Database failed to start after maximum attempts");
        }
        console.log(
          `⏳ Waiting for database... (attempt ${attempt}/${maxAttempts})`
        );
        await this.sleep(2000);
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 🧠 LEARNING: Test Execution Strategy
   *
   * Different test types need different configurations:
   * - Unit tests: Fast, isolated, mocked dependencies
   * - Integration tests: Real database, real API calls
   * - E2E tests: Full application stack, real HTTP requests
   */
  private async runTests(): Promise<void> {
    console.log(`🧪 Running ${this.config.testType} tests...`);

    const jestConfig: string[] = ["npx", "jest"];

    // Configure Jest based on test type
    if (this.config.testType !== "all") {
      jestConfig.push(`--testPathPatterns=tests/${this.config.testType}`);
    }

    if (this.config.watch) {
      jestConfig.push("--watch");
    }

    if (this.config.coverage) {
      jestConfig.push("--coverage");
    }

    if (this.config.verbose) {
      jestConfig.push("--verbose");
    }

    if (this.config.ci) {
      jestConfig.push("--ci", "--watchAll=false", "--passWithNoTests");
    }

    // Add performance optimizations
    if (this.config.testType === "unit") {
      jestConfig.push("--maxWorkers=4", "--detectOpenHandles");
    }

    try {
      execSync(jestConfig.join(" "), {
        stdio: "inherit",
        env: process.env,
        shell: "/bin/zsh",
      });
      console.log("✅ Tests completed successfully");
    } catch (error) {
      console.error("❌ Tests failed");
      throw error;
    }
  }

  /**
   * 🧠 LEARNING: Cleanup Strategy
   *
   * Why automated cleanup?
   * - Prevents resource leaks
   * - Ensures clean state for next test run
   * - Stops background processes
   * - Removes temporary data
   */
  async cleanup(): Promise<void> {
    if (!this.config.cleanup) {
      console.log("⏭️  Skipping cleanup");
      return;
    }

    console.log("🧹 Cleaning up test environment...");

    try {
      // Stop test containers
      execSync("docker-compose -f ../../docker-compose.test.yml down", {
        stdio: "inherit",
      });

      // Kill any remaining processes
      this.processes.forEach((process) => {
        if (!process.killed) {
          process.kill();
        }
      });

      console.log("✅ Cleanup complete");
    } catch (error) {
      console.error("⚠️  Cleanup had some issues:", error);
      // Don't throw here, as cleanup failures shouldn't fail the tests
    }
  }

  /**
   * 🧠 LEARNING: Test Report Generation
   *
   * Generate useful reports for:
   * - CI/CD pipelines
   * - Code coverage analysis
   * - Performance tracking
   * - Test result history
   */
  private generateTestReport(): void {
    console.log("📊 Generating test report...");

    const report = {
      timestamp: new Date().toISOString(),
      testType: this.config.testType,
      environment: "test",
      node_version: process.version,
      coverage: this.config.coverage,
      // Add more metadata as needed
    };

    const reportPath = join(
      process.cwd(),
      "api",
      "test-results",
      "test-report.json"
    );

    try {
      writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`✅ Test report saved to ${reportPath}`);
    } catch (error) {
      console.error("⚠️  Failed to save test report:", error);
    }
  }

  /**
   * Main execution method
   */
  async run(): Promise<void> {
    console.log("🧪 Starting Test Runner...");
    console.log(`📋 Configuration:`, this.config);

    try {
      this.setupEnvironment();
      await this.setupDatabase();
      await this.runTests();
      this.generateTestReport();
    } catch (error) {
      console.error("❌ Test run failed:", error);
      process.exit(1);
    } finally {
      await this.cleanup();
    }

    console.log("🎉 Test run completed successfully!");
  }
}

/**
 * 🧠 LEARNING: Command Line Interface
 *
 * Parse command line arguments to configure test execution
 * Similar to how shell scripts use $1, $2, etc.
 */
function parseCliArguments(): TestConfig {
  const args = process.argv.slice(2);

  const config: TestConfig = {
    testType: "all",
    watch: false,
    coverage: false,
    verbose: false,
    ci: false,
    cleanup: true,
    setupDatabase: true,
  };

  // Parse arguments
  args.forEach((arg, index) => {
    switch (arg) {
      case "--unit":
        config.testType = "unit";
        break;
      case "--integration":
        config.testType = "integration";
        break;
      case "--e2e":
        config.testType = "e2e";
        break;
      case "--watch":
        config.watch = true;
        break;
      case "--coverage":
        config.coverage = true;
        break;
      case "--verbose":
        config.verbose = true;
        break;
      case "--ci":
        config.ci = true;
        break;
      case "--no-cleanup":
        config.cleanup = false;
        break;
      case "--no-db":
        config.setupDatabase = false;
        break;
      case "--help":
        printHelp();
        process.exit(0);
        break;
    }
  });

  return config;
}

function printHelp(): void {
  console.log(`
🧪 Modern Test Runner

Usage: npm run test:setup [options]

Options:
  --unit          Run only unit tests
  --integration   Run only integration tests  
  --e2e           Run only E2E tests
  --watch         Run tests in watch mode
  --coverage      Generate coverage report
  --verbose       Verbose test output
  --ci            CI mode (no watch, exit on completion)
  --no-cleanup    Skip cleanup after tests
  --no-db         Skip database setup
  --help          Show this help message

Examples:
  npm run test:setup --unit --coverage
  npm run test:setup --integration --verbose
  npm run test:setup --e2e --ci
  npm run test:setup --watch --no-cleanup

Environment Variables:
  TEST_DATABASE_URL   Override test database URL
  CI                  Automatically enables --ci mode
  `);
}

// 🧠 LEARNING: Main execution
// Handle the script being run directly vs imported
if (require.main === module) {
  // Check if we're in CI environment
  if (process.env.CI) {
    process.argv.push("--ci");
  }

  const config = parseCliArguments();
  const runner = new TestRunner(config);

  // Handle process signals for graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\n🛑 Received interrupt signal, cleaning up...");
    await runner.cleanup();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("\n🛑 Received termination signal, cleaning up...");
    await runner.cleanup();
    process.exit(0);
  });

  runner.run();
}

export { TestRunner };
export type { TestConfig };

/**
 * 🧠 LEARNING: Benefits of Modern Test Setup
 *
 * vs Shell Scripts:
 * ✅ Cross-platform compatibility
 * ✅ Better error handling
 * ✅ Type safety
 * ✅ Easier maintenance
 * ✅ Integration with Node.js ecosystem
 * ✅ Rich logging and reporting
 * ✅ Async/await for better control flow
 * ✅ Easy to extend and customize
 *
 * When to use Shell vs Node.js:
 * - Shell: Simple tasks, system administration
 * - Node.js: Complex logic, cross-platform, integration with app
 *
 * Testing Best Practices Implemented:
 * ✅ Isolated test environment
 * ✅ Automated setup and teardown
 * ✅ Configurable test execution
 * ✅ Proper cleanup
 * ✅ CI/CD integration
 * ✅ Clear error reporting
 * ✅ Performance optimization
 */
