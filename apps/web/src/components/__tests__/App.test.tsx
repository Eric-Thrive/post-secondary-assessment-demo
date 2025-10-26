import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import App from "../../App";

// Mock the router to avoid navigation issues in tests
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="router">{children}</div>
    ),
    Routes: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="routes">{children}</div>
    ),
    Route: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="route">{children}</div>
    ),
    Navigate: () => <div data-testid="navigate" />,
  };
});

// Mock the contexts to avoid provider issues
vi.mock("@/contexts/ModuleContext", () => ({
  ModuleProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="module-provider">{children}</div>
  ),
  useModule: () => ({ activeModule: "post-secondary" }),
}));

vi.mock("@/contexts/EnvironmentContext", () => ({
  EnvironmentProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="environment-provider">{children}</div>
  ),
}));

vi.mock("@/contexts/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
}));

// Mock the config functions
vi.mock("@/config/deployment", () => ({
  getDefaultEnvironment: () => "development",
  shouldForceEnvironment: () => false,
}));

describe("App Component", () => {
  it("should render without crashing", () => {
    const { container } = render(<App />);
    expect(container).toBeInTheDocument();
  });

  it("should render the router structure", () => {
    const { getByTestId } = render(<App />);
    expect(getByTestId("router")).toBeInTheDocument();
  });

  it("should render with proper provider hierarchy", () => {
    const { getByTestId } = render(<App />);
    expect(getByTestId("module-provider")).toBeInTheDocument();
    expect(getByTestId("environment-provider")).toBeInTheDocument();
    expect(getByTestId("auth-provider")).toBeInTheDocument();
  });
});
