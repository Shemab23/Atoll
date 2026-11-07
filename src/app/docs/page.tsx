import type { Metadata } from "next";
import SwaggerUIClient from "./swagger-ui-client";

export const metadata: Metadata = {
  title: "Atoll API Documentation",
  description: "Interactive API documentation for Atoll.",
};

export default function ApiDocumentationPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-8 text-gray-900">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold">Atoll API</h1>

          <p className="mt-2 text-sm text-gray-600">
            Interactive API reference and endpoint documentation.
          </p>
        </header>

        <SwaggerUIClient />
      </div>
    </main>
  );
}
