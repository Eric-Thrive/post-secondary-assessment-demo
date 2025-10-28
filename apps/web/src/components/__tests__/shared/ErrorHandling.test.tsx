import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  AuthenticationErrorHandler,
  AuthorizationErrorHandler,
  NetworkErrorHandler,
  OfflineIndicator,
  useNetworkStatus,
  ContactSupportActions,
  DefaultUpgradeOptions,
} from "../../shared/ErrorHandling";
import type {
  AuthenticationError,
  AuthorizationError,
  NetworkError,
} from "../../shared/ErrorHandling";

// Mock window methods
const mockOpen = vi.fn();
Object.defineProperty(window, "open", {
  value: mockOpen,
  writable: true,
});

describe("AuthenticationErrorHandler", () => {
  const mockOnRetry = vi.fn();
  const mockOnForgotPassword = vi.fn();
  const mockOnContactSupport = vi.fn();
  const mockOnDismiss = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders invalid credentials error correctly", () => {
    const error: AuthenticationError = {
      type: "invalid_credentials",
      message: "Invalid username or password",
    };

    render(
      <AuthenticationErrorHandler
        error={error}
        onRetry={mockOnRetry}
        onForgotPassword={mockOnForgotPassword}
      />
    );

    expect(screen.getByText("Invalid Login Credentials")).toBeInTheDocument();
    expect(
      screen.getByText("The username or password you entered is incorrect.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /try again/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /reset password/i })
    ).toBeInTheDocument();
  });

  it("renders account locked error with retry timer", () => {
    const error: AuthenticationError = {
      type: "account_locked",
      message: "Account locked",
      retryAfter: 900, // 15 minutes in seconds
    };

    render(
      <AuthenticationErrorHandler
        error={error}
        onContactSupport={mockOnContactSupport}
      />
    );

    expect(screen.getByText("Account Temporarily Locked")).toBeInTheDocument();
    expect(screen.getByText(/please wait 15 minutes/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /contact support/i })
    ).toBeInTheDocument();
  });

  it("renders session expired error", () => {
    const error: AuthenticationError = {
      type: "session_expired",
      message: "Session expired",
    };

    render(<AuthenticationErrorHandler error={error} onRetry={mockOnRetry} />);

    expect(screen.getByText("Session Expired")).toBeInTheDocument();
    expect(
      screen.getByText("Your login session has expired for security reasons.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in again/i })
    ).toBeInTheDocument();
  });

  it("renders rate limited error", () => {
    const error: AuthenticationError = {
      type: "rate_limited",
      message: "Too many attempts",
      retryAfter: 300,
      attemptsRemaining: 0,
    };

    render(<AuthenticationErrorHandler error={error} />);

    expect(
      screen.getByRole("heading", { name: /too many attempts/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/please wait 5 minutes/i)).toBeInTheDocument();
  });

  it("shows attempts remaining badge", () => {
    const error: AuthenticationError = {
      type: "invalid_credentials",
      message: "Invalid credentials",
      attemptsRemaining: 3,
    };

    render(<AuthenticationErrorHandler error={error} />);

    expect(screen.getByText("3 attempts remaining")).toBeInTheDocument();
  });

  it("handles retry action", () => {
    const error: AuthenticationError = {
      type: "invalid_credentials",
      message: "Invalid credentials",
    };

    render(<AuthenticationErrorHandler error={error} onRetry={mockOnRetry} />);

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it("handles forgot password action", () => {
    const error: AuthenticationError = {
      type: "invalid_credentials",
      message: "Invalid credentials",
    };

    render(
      <AuthenticationErrorHandler
        error={error}
        onForgotPassword={mockOnForgotPassword}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /reset password/i }));
    expect(mockOnForgotPassword).toHaveBeenCalledTimes(1);
  });
});

describe("AuthorizationErrorHandler", () => {
  const mockOnDismiss = vi.fn();
  const mockOnContactAdmin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders insufficient permissions error", () => {
    const error: AuthorizationError = {
      type: "insufficient_permissions",
      message: "Access denied",
      currentRole: "Customer",
      requiredRole: "Admin",
    };

    render(
      <AuthorizationErrorHandler
        error={error}
        onContactAdmin={mockOnContactAdmin}
      />
    );

    expect(screen.getByText("Access Denied")).toBeInTheDocument();
    expect(screen.getByText("Customer")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /contact administrator/i })
    ).toBeInTheDocument();
  });

  it("renders demo limitation error with upgrade options", () => {
    const mockUpgradeAction = vi.fn();
    const error: AuthorizationError = {
      type: "demo_limitation",
      message: "Demo limitation",
      upgradeOptions: [
        {
          title: "Upgrade Now",
          description: "Get full access",
          action: mockUpgradeAction,
        },
      ],
    };

    render(<AuthorizationErrorHandler error={error} />);

    expect(screen.getByText("Demo Account Limitation")).toBeInTheDocument();
    expect(screen.getByText("Upgrade Options:")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /upgrade now/i })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /upgrade now/i }));
    expect(mockUpgradeAction).toHaveBeenCalledTimes(1);
  });

  it("renders subscription required error", () => {
    const error: AuthorizationError = {
      type: "subscription_required",
      message: "Subscription required",
    };

    render(<AuthorizationErrorHandler error={error} />);

    expect(screen.getByText("Subscription Required")).toBeInTheDocument();
    expect(
      screen.getByText("This feature requires an active subscription.")
    ).toBeInTheDocument();
  });

  it("handles contact admin action", () => {
    const error: AuthorizationError = {
      type: "insufficient_permissions",
      message: "Access denied",
    };

    render(
      <AuthorizationErrorHandler
        error={error}
        onContactAdmin={mockOnContactAdmin}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /contact administrator/i })
    );
    expect(mockOnContactAdmin).toHaveBeenCalledTimes(1);
  });
});

describe("NetworkErrorHandler", () => {
  const mockOnRetry = vi.fn();
  const mockOnDismiss = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders offline error", () => {
    const error: NetworkError = {
      type: "offline",
      message: "No connection",
      isOnline: false,
    };

    render(<NetworkErrorHandler error={error} onRetry={mockOnRetry} />);

    expect(screen.getByText("You're Offline")).toBeInTheDocument();
    expect(
      screen.getByText("No internet connection detected.")
    ).toBeInTheDocument();
    expect(screen.getByText("Offline")).toBeInTheDocument();
  });

  it("renders timeout error", () => {
    const error: NetworkError = {
      type: "timeout",
      message: "Request timeout",
      isOnline: true,
    };

    render(<NetworkErrorHandler error={error} />);

    expect(screen.getByText("Request Timeout")).toBeInTheDocument();
    expect(screen.getByText("Online")).toBeInTheDocument();
  });

  it("shows last successful connection time", () => {
    const lastConnection = new Date("2023-01-01T12:00:00Z");
    const error: NetworkError = {
      type: "connection_lost",
      message: "Connection lost",
      isOnline: false,
      lastSuccessfulConnection: lastConnection,
    };

    render(<NetworkErrorHandler error={error} />);

    expect(screen.getByText(/last successful connection/i)).toBeInTheDocument();
  });

  it("handles retry action", () => {
    const error: NetworkError = {
      type: "offline",
      message: "No connection",
      isOnline: false,
    };

    render(<NetworkErrorHandler error={error} onRetry={mockOnRetry} />);

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it("opens connection test in new tab", () => {
    const error: NetworkError = {
      type: "offline",
      message: "No connection",
      isOnline: false,
    };

    render(<NetworkErrorHandler error={error} />);

    fireEvent.click(screen.getByRole("button", { name: /test connection/i }));
    expect(mockOpen).toHaveBeenCalledWith("https://www.google.com", "_blank");
  });
});

describe("OfflineIndicator", () => {
  it("renders when offline", () => {
    render(<OfflineIndicator isOnline={false} />);

    expect(screen.getByText(/you're currently offline/i)).toBeInTheDocument();
  });

  it("does not render when online", () => {
    render(<OfflineIndicator isOnline={true} />);

    expect(
      screen.queryByText(/you're currently offline/i)
    ).not.toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <OfflineIndicator isOnline={false} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });
});

describe("ContactSupportActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens email client", () => {
    ContactSupportActions.email();
    expect(mockOpen).toHaveBeenCalledWith(
      "mailto:support@thrive-assessment.com?subject=Login%20Support%20Request",
      "_blank"
    );
  });

  it("opens phone dialer", () => {
    ContactSupportActions.phone();
    expect(mockOpen).toHaveBeenCalledWith("tel:+1-800-THRIVE-1", "_blank");
  });

  it("opens help page", () => {
    ContactSupportActions.help();
    expect(mockOpen).toHaveBeenCalledWith("/help", "_blank");
  });
});

describe("DefaultUpgradeOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("has contact sales option", () => {
    const contactSales = DefaultUpgradeOptions.find(
      (option) => option.title === "Contact Sales"
    );
    expect(contactSales).toBeDefined();

    contactSales?.action();
    expect(mockOpen).toHaveBeenCalledWith(
      "mailto:sales@thrive-assessment.com?subject=Upgrade%20Request",
      "_blank"
    );
  });

  it("has view plans option", () => {
    const viewPlans = DefaultUpgradeOptions.find(
      (option) => option.title === "View Plans"
    );
    expect(viewPlans).toBeDefined();

    viewPlans?.action();
    expect(mockOpen).toHaveBeenCalledWith("/pricing", "_blank");
  });

  it("has call us option", () => {
    const callUs = DefaultUpgradeOptions.find(
      (option) => option.title === "Call Us"
    );
    expect(callUs).toBeDefined();

    callUs?.action();
    expect(mockOpen).toHaveBeenCalledWith("tel:+1-800-THRIVE-1", "_blank");
  });
});

// Mock component to test useNetworkStatus hook
const NetworkStatusTestComponent = () => {
  const { isOnline, lastOnline } = useNetworkStatus();
  return (
    <div>
      <div data-testid="online-status">{isOnline ? "online" : "offline"}</div>
      <div data-testid="last-online">
        {lastOnline?.toISOString() || "never"}
      </div>
    </div>
  );
};

describe("useNetworkStatus", () => {
  beforeEach(() => {
    // Reset navigator.onLine
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: true,
    });
  });

  it("returns initial online status", () => {
    render(<NetworkStatusTestComponent />);

    expect(screen.getByTestId("online-status")).toHaveTextContent("online");
    expect(screen.getByTestId("last-online")).not.toHaveTextContent("never");
  });

  it("updates status when going offline", async () => {
    render(<NetworkStatusTestComponent />);

    // Simulate going offline
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: false,
    });

    fireEvent(window, new Event("offline"));

    await waitFor(() => {
      expect(screen.getByTestId("online-status")).toHaveTextContent("offline");
    });
  });

  it("updates status when coming back online", async () => {
    // Start offline
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: false,
    });

    render(<NetworkStatusTestComponent />);

    expect(screen.getByTestId("online-status")).toHaveTextContent("offline");

    // Go online
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: true,
    });

    fireEvent(window, new Event("online"));

    await waitFor(() => {
      expect(screen.getByTestId("online-status")).toHaveTextContent("online");
    });
  });
});
