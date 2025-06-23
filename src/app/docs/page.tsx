import { swaggerSpec } from "@/lib/swagger";
import SwaggerDocs from "@/components/SwaggerDocs";

export default function DocsPage() {
  return (
    <div>
      <SwaggerDocs spec={swaggerSpec} />
    </div>
  );
}
