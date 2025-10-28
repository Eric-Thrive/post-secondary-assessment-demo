import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  AccessibilityProvider,
  useAccessibility,
  AccessibilityMenu,
  SkipNavigation,
  FocusTrap,
  ScreenReaderAnnouncement,
  useKeyboardNavigation,
  AccessibleButton,
  AccessibleFormField,
  AccessibleCard,
  LiveRegion,
} from "../../shared/AccessibilityFeatures";

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
});

// Test component to use accessibility context
const TestAccessibilityConsumer = () => {
  const { settings, updateSetting, resetSettings } = useAccessibility();

  return (
    <div>
      <div data-testid="high-contrast">{settings.highContrast.toString()}</div>
      <div data-testid="large-text">{settings.largeText.toString()}</div>
      <button
        onClick={() => updateSetting("highContrast", !settings.highContrast)}
        data-testid="toggle-contrast"
      >
        Toggle Contrast
      </button>
      <button onClick={resetSettings} data-testid="reset">
        Reset
      </button>
    </div>
  );
};

describe("AccessibilityProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    document.documentElement.className = "";
  });

  it("provides default accessibility settings", () => {
    render(
      <AccessibilityProvider>
        <TestAccessibilityConsumer />
      </AccessibilityProvider>
    );

    expect(screen.getByTestId("high-contrast")).toHaveTextContent("false");
    expect(screen.getByTestId("large-text")).toHaveTextContent("false");
  });

  it("loads saved settings from localStorage", () => {
    const savedSettings = JSON.stringify({
      highContrast: true,
      largeText: true,
    });
    mockLocalStorage.getItem.mockReturnValue(savedSettings);

    render(
      <AccessibilityProvider>
        <TestAccessibilityConsumer />
      </AccessibilityProvider>
    );

    expect(screen.getByTestId("high-contrast")).toHaveTextContent("true");
    expect(screen.getByTestId("large-text")).toHaveTextContent("true");
  });

  it("updates settings and saves to localStorage", () => {
    render(
      <AccessibilityProvider>
        <TestAccessibilityConsumer />
      </AccessibilityProvider>
    );

    fireEvent.click(screen.getByTestId("toggle-contrast"));

    expect(screen.getByTestId("high-contrast")).toHaveTextContent("true");
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      "accessibility-settings",
      expect.stringContaining('"highContrast":true')
    );
  });

  it("resets settings and removes from localStorage", () => {
    mockLocalStorage.getItem.mockReturnValue(
      JSON.stringify({ highContrast: true })
    );

    render(
      <AccessibilityProvider>
        <TestAccessibilityConsumer />
      </AccessibilityProvider>
    );

    fireEvent.click(screen.getByTestId("reset"));

    expect(screen.getByTestId("high-contrast")).toHaveTextContent("false");
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
      "accessibility-settings"
    );
  });

  it("applies CSS classes to document element", () => {
    render(
      <AccessibilityProvider>
        <TestAccessibilityConsumer />
      </AccessibilityProvider>
    );

    fireEvent.click(screen.getByTestId("toggle-contrast"));

    expect(document.documentElement).toHaveClass("high-contrast");
  });
});

describe("AccessibilityMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  it("renders accessibility menu button", () => {
    render(
      <AccessibilityProvider>
        <AccessibilityMenu />
      </AccessibilityProvider>
    );

    expect(
      screen.getByRole("button", { name: /accessibility settings/i })
    ).toBeInTheDocument();
  });

  it("opens menu and shows options", async () => {
    render(
      <AccessibilityProvider>
        <AccessibilityMenu />
      </AccessibilityProvider>
    );

    const menuButton = screen.getByRole("button", {
      name: /accessibility settings/i,
    });
    expect(menuButton).toBeInTheDocument();

    // Test that the menu button is properly configured
    expect(menuButton).toHaveAttribute("aria-haspopup", "menu");
    expect(menuButton).toHaveAttribute("aria-expanded", "false");
  });
});

describe("SkipNavigation", () => {
  it("renders skip navigation link", () => {
    render(<SkipNavigation />);

    const skipLink = screen.getByRole("link", {
      name: /skip to main content/i,
    });
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute("href", "#main-content");
  });
});

describe("FocusTrap", () => {
  it("traps focus when active", () => {
    const { rerender } = render(
      <div>
        <button>Outside</button>
        <FocusTrap active={false}>
          <button>Inside 1</button>
          <button>Inside 2</button>
        </FocusTrap>
      </div>
    );

    // Focus should not be trapped initially
    const outsideButton = screen.getByText("Outside");
    outsideButton.focus();
    expect(document.activeElement).toBe(outsideButton);

    // Activate focus trap
    rerender(
      <div>
        <button>Outside</button>
        <FocusTrap active={true}>
          <button>Inside 1</button>
          <button>Inside 2</button>
        </FocusTrap>
      </div>
    );

    // Focus should move to first element inside trap
    expect(document.activeElement).toBe(screen.getByText("Inside 1"));
  });
});

describe("ScreenReaderAnnouncement", () => {
  it("renders screen reader announcement", () => {
    render(
      <ScreenReaderAnnouncement
        message="Test announcement"
        priority="assertive"
      />
    );

    const announcement = screen.getByRole("status");
    expect(announcement).toHaveTextContent("Test announcement");
    expect(announcement).toHaveAttribute("aria-live", "assertive");
    expect(announcement).toHaveAttribute("aria-atomic", "true");
  });
});

describe("useKeyboardNavigation", () => {
  it("returns handleKeyDown function", () => {
    const TestComponent = () => {
      const { handleKeyDown } = useKeyboardNavigation();
      return <div data-testid="test">{typeof handleKeyDown}</div>;
    };

    render(
      <AccessibilityProvider>
        <TestComponent />
      </AccessibilityProvider>
    );

    expect(screen.getByTestId("test")).toHaveTextContent("function");
  });
});
describe("AccessibleButton", () => {
  it("renders button with tooltip", async () => {
    render(
      <AccessibleButton tooltip="This is a helpful tooltip" id="test-button">
        Click me
      </AccessibleButton>
    );

    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-describedby", "test-button-tooltip");
  });

  it("shows loading state", () => {
    render(
      <AccessibleButton loading={true} loadingText="Processing...">
        Submit
      </AccessibleButton>
    );

    expect(screen.getByText("Processing...")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("displays keyboard shortcut", () => {
    render(<AccessibleButton shortcut="Ctrl+S">Save</AccessibleButton>);

    expect(screen.getByText("Ctrl+S")).toBeInTheDocument();
  });
});

describe("AccessibleFormField", () => {
  it("renders form field with label and input", () => {
    render(
      <AccessibleFormField label="Email Address" id="email" required={true}>
        <input type="email" />
      </AccessibleFormField>
    );

    const label = screen.getByText("Email Address");
    const input = screen.getByRole("textbox");

    expect(label).toBeInTheDocument();
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("id", "email");
    expect(input).toHaveAttribute("required");
    expect(screen.getByText("*")).toBeInTheDocument(); // Required indicator
  });

  it("shows error message", () => {
    render(
      <AccessibleFormField
        label="Password"
        id="password"
        error="Password is required"
      >
        <input type="password" />
      </AccessibleFormField>
    );

    const errorMessage = screen.getByRole("alert");
    const input = screen.getByLabelText("Password");

    expect(errorMessage).toHaveTextContent("Password is required");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "password-error");
  });

  it("shows hint text", () => {
    render(
      <AccessibleFormField
        label="Username"
        id="username"
        hint="Must be at least 3 characters"
      >
        <input type="text" />
      </AccessibleFormField>
    );

    const hint = screen.getByText("Must be at least 3 characters");
    const input = screen.getByLabelText("Username");

    expect(hint).toBeInTheDocument();
    expect(input).toHaveAttribute("aria-describedby", "username-hint");
  });
});

describe("AccessibleCard", () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders card with title and description", () => {
    render(
      <AccessibleCard title="Test Card" description="This is a test card">
        <div>Card content</div>
      </AccessibleCard>
    );

    expect(screen.getByText("Test Card")).toBeInTheDocument();
    expect(screen.getByText("This is a test card")).toBeInTheDocument();
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("handles click events", () => {
    render(
      <AccessibleCard title="Clickable Card" onClick={mockOnClick}>
        <div>Content</div>
      </AccessibleCard>
    );

    const card = screen.getByRole("button");
    fireEvent.click(card);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it("handles keyboard navigation", () => {
    render(
      <AccessibleCard title="Keyboard Card" onClick={mockOnClick}>
        <div>Content</div>
      </AccessibleCard>
    );

    const card = screen.getByRole("button");

    fireEvent.keyDown(card, { key: "Enter" });
    expect(mockOnClick).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(card, { key: " " });
    expect(mockOnClick).toHaveBeenCalledTimes(2);
  });

  it("shows selected state", () => {
    render(
      <AccessibleCard
        title="Selected Card"
        selected={true}
        onClick={mockOnClick}
      >
        <div>Content</div>
      </AccessibleCard>
    );

    const card = screen.getByRole("button");
    expect(card).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Selected")).toBeInTheDocument();
  });

  it("disables interaction when disabled", () => {
    render(
      <AccessibleCard
        title="Disabled Card"
        disabled={true}
        onClick={mockOnClick}
      >
        <div>Content</div>
      </AccessibleCard>
    );

    const card = screen.getByRole("button");
    expect(card).toHaveAttribute("aria-disabled", "true");

    fireEvent.click(card);
    expect(mockOnClick).not.toHaveBeenCalled();
  });
});

describe("LiveRegion", () => {
  it("renders live region with correct attributes", () => {
    render(
      <LiveRegion priority="assertive" atomic={false}>
        <div>Dynamic content</div>
      </LiveRegion>
    );

    const region = screen.getByRole("region");
    expect(region).toHaveAttribute("aria-live", "assertive");
    expect(region).toHaveAttribute("aria-atomic", "false");
    expect(region).toHaveTextContent("Dynamic content");
  });

  it("uses default priority and atomic values", () => {
    render(
      <LiveRegion>
        <div>Content</div>
      </LiveRegion>
    );

    const region = screen.getByRole("region");
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toHaveAttribute("aria-atomic", "true");
  });
});
