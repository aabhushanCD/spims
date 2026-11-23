/* eslint-disable react-refresh/only-export-components */
import type { ReactElement, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import { MemoryRouter } from "react-router";

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

interface ProvidersProps {
  children: ReactNode;
  client?: QueryClient;
  route?: string;
}

export function TestProviders({
  children,
  client,
  route = "/",
}: ProvidersProps) {
  const queryClient = client ?? createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
  client?: QueryClient;
  route?: string;
}

export function renderWithProviders(
  ui: ReactElement,
  { client, route, ...options }: RenderWithProvidersOptions = {},
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <TestProviders client={client} route={route}>
        {children}
      </TestProviders>
    ),
    ...options,
  });
}
