"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), {
  ssr: false,
  loading: () => (
    <p className="p-6 text-sm text-gray-500">
      Loading Atoll API documentation...
    </p>
  ),
});

export default function SwaggerUIClient() {
  return (
    <div className="swagger-container">
      <SwaggerUI
        url="/api/docs/openapi"
        docExpansion="list"
        displayRequestDuration
        filter
        tryItOutEnabled
        withCredentials
      />
    </div>
  );
}
