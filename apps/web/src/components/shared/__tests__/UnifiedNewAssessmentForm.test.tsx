import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import UnifiedNewAssessmentForm from "../UnifiedNewAssessmentForm";
import { AuthProvider } from "@/contexts/AuthContext";
import { ModuleProvider } from "@/contexts/ModuleContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <ModuleProvider>{children}</ModuleProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

describe("UnifiedNewAssessmentForm", () => {
  it("renders student information form", () => {
    render(
      <TestWrapper>
        <UnifiedNewAssessmentForm />
      </TestWrapper>
    );

    expect(
      screen.getByText("Student Information & Report Details")
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Unique ID/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Report Author/)).toBeInTheDocument();
  });

  it("renders sidebar navigation", () => {
    render(
      <TestWrapper>
        <UnifiedNewAssessmentForm />
      </TestWrapper>
    );

    expect(screen.getByText("Assessment Info")).toBeInTheDocument();
    expect(screen.getByText("Document Upload")).toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });
});
