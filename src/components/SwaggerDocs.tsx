"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

interface SwaggerDocsProps {
  spec: any;
}

export default function SwaggerDocs({ spec }: SwaggerDocsProps) {
  return (
    <div style={{ height: "100vh" }}>
      <SwaggerUI
        spec={spec}
        docExpansion="list"
        defaultModelsExpandDepth={2}
        tryItOutEnabled={true}
      />
    </div>
  );
}
