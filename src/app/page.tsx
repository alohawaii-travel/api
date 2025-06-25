export default function HomePage() {
  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "3rem", margin: "0 0 1rem 0" }}>
          🌺 Alohawaii API
        </h1>
        <p style={{ fontSize: "1.2rem", color: "#666", marginBottom: "2rem" }}>
          Tour platform API with Google authentication and domain whitelisting
        </p>

        <div
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <a
            href="/docs"
            style={{
              backgroundColor: "#0070f3",
              color: "white",
              padding: "12px 24px",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            📚 Interactive API Docs
          </a>
          <a
            href="/api/docs"
            style={{
              backgroundColor: "#666",
              color: "white",
              padding: "12px 24px",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            📄 OpenAPI Spec
          </a>
          <a
            href="/api/external/health"
            style={{
              backgroundColor: "#10b981",
              color: "white",
              padding: "12px 24px",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            ❤️ Health Check
          </a>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "2rem",
        }}
      >
        {/* Authentication Section */}
        <div
          style={{
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            padding: "1.5rem",
          }}
        >
          <h2 style={{ color: "#0070f3", marginTop: "0" }}>
            🔐 Authentication
          </h2>
          <p style={{ color: "#666", marginBottom: "1rem" }}>
            Google OAuth with domain whitelisting
          </p>
          <ul style={{ listStyle: "none", padding: "0" }}>
            <li style={{ marginBottom: "0.5rem" }}>
              <code
                style={{
                  backgroundColor: "#f5f5f5",
                  padding: "2px 6px",
                  borderRadius: "3px",
                }}
              >
                GET /api/auth/signin
              </code>
              <span style={{ marginLeft: "8px", color: "#666" }}>
                Google OAuth login
              </span>
            </li>
            <li style={{ marginBottom: "0.5rem" }}>
              <code
                style={{
                  backgroundColor: "#f5f5f5",
                  padding: "2px 6px",
                  borderRadius: "3px",
                }}
              >
                GET /api/auth/signout
              </code>
              <span style={{ marginLeft: "8px", color: "#666" }}>Logout</span>
            </li>
            <li>
              <code
                style={{
                  backgroundColor: "#f5f5f5",
                  padding: "2px 6px",
                  borderRadius: "3px",
                }}
              >
                GET /api/auth/session
              </code>
              <span style={{ marginLeft: "8px", color: "#666" }}>
                Current session
              </span>
            </li>
          </ul>
        </div>

        {/* Internal API Section */}
        <div
          style={{
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            padding: "1.5rem",
          }}
        >
          <h2 style={{ color: "#dc2626", marginTop: "0" }}>🛡️ Internal API</h2>
          <p style={{ color: "#666", marginBottom: "1rem" }}>
            Protected admin routes (authentication required)
          </p>
          <ul style={{ listStyle: "none", padding: "0" }}>
            <li style={{ marginBottom: "0.5rem" }}>
              <code
                style={{
                  backgroundColor: "#f5f5f5",
                  padding: "2px 6px",
                  borderRadius: "3px",
                }}
              >
                GET /api/internal/users/me
              </code>
              <span style={{ marginLeft: "8px", color: "#666" }}>
                Get profile
              </span>
            </li>
            <li>
              <code
                style={{
                  backgroundColor: "#f5f5f5",
                  padding: "2px 6px",
                  borderRadius: "3px",
                }}
              >
                PUT /api/internal/users/me
              </code>
              <span style={{ marginLeft: "8px", color: "#666" }}>
                Update profile
              </span>
            </li>
          </ul>
        </div>

        {/* External API Section */}
        <div
          style={{
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            padding: "1.5rem",
          }}
        >
          <h2 style={{ color: "#10b981", marginTop: "0" }}>🌐 External API</h2>
          <p style={{ color: "#666", marginBottom: "1rem" }}>
            Public routes for website integration
          </p>
          <ul style={{ listStyle: "none", padding: "0" }}>
            <li>
              <code
                style={{
                  backgroundColor: "#f5f5f5",
                  padding: "2px 6px",
                  borderRadius: "3px",
                }}
              >
                GET /api/external/health
              </code>
              <span style={{ marginLeft: "8px", color: "#666" }}>
                Health check
              </span>
            </li>
          </ul>
        </div>

        {/* Features Section */}
        <div
          style={{
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            padding: "1.5rem",
          }}
        >
          <h2 style={{ color: "#7c3aed", marginTop: "0" }}>✨ Features</h2>
          <ul style={{ color: "#666", paddingLeft: "1.2rem" }}>
            <li>Google OAuth authentication</li>
            <li>Domain-based user whitelisting</li>
            <li>Role-based access control</li>
            <li>JWT session management</li>
            <li>TypeScript with full type safety</li>
            <li>Custom database interface with PostgreSQL</li>
            <li>OpenAPI documentation</li>
          </ul>
        </div>
      </div>

      <div
        style={{
          marginTop: "3rem",
          padding: "1.5rem",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
        }}
      >
        <h3 style={{ marginTop: "0", color: "#333" }}>🚀 Quick Start</h3>
        <ol style={{ color: "#666" }}>
          <li>
            Configure Google OAuth credentials in <code>.env.local</code>
          </li>
          <li>
            Start the development server with <code>npm run dev</code>
          </li>
          <li>
            Visit{" "}
            <a href="/docs" style={{ color: "#0070f3" }}>
              /docs
            </a>{" "}
            for interactive API documentation
          </li>
          <li>Test authentication with a whitelisted domain email</li>
        </ol>
      </div>
    </div>
  );
}
