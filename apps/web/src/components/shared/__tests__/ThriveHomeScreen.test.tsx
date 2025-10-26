import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ThriveHomeScreen from "../ThriveHomeScreen";
import { AuthProvider } from "@/contexts/AuthContext";
import { ModuleProvider } from "@/contexts/ModuleContext";
import { EnvironmentProvider } from "@/contexts/EnvironmentContext";

// Mock the hooks
jest.mock("@/hooks/useModuleAssessmentData", () => ({
  useModuleAssessmentData: () => ({
    assessmentCases: [],
    isLoading: false,
    refreshCases: jest.fn(),
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <EnvironmentProvider>
        <AuthProvider>
          <ModuleProvider>{children}</ModuleProvider>
        </AuthProvider>
      </EnvironmentProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

describe("ThriveHomeScreen", () => {
  it("renders THRIVE logo", () => {
    render(
      <TestWrapper>
        <ThriveHomeScreen />
      </TestWrapper>
    );

    expect(screen.getByText("THRIVE")).toBeInTheDocument();
  });

  it("renders New Report card", () => {
    render(
      <TestWrapper>
        <ThriveHomeScreen />
      </TestWrapper>
    );

    expect(screen.getByText("New Report")).toBeInTheDocument();
    expect(screen.getByText("Start a new assessment")).toBeInTheDocument();
  });

  it("renders View Reports card", () => {
    render(
      <TestWrapper>
        <ThriveHomeScreen />
      </TestWrapper>
    );

    expect(screen.getByText("View Reports")).toBeInTheDocument();
    expect(screen.getByText("0 reports available")).toBeInTheDocument();
  });

  it("has correct test ids for navigation cards", () => {
    render(
      <TestWrapper>
        <ThriveHomeScreen />
      </TestWrapper>
    );

    expect(screen.getByTestId("card-new-report")).toBeInTheDocument();
    expect(screen.getByTestId("card-view-reports")).toBeInTheDocument();
  });
});
