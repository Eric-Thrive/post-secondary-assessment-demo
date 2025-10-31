import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { DemoModeBanner } from "../DemoModeBanner";
import { RegistrationPage } from "../RegistrationPage";
import { EmailVerificationPending } from "../EmailVerificationPending";
import { EmailVerificationSuccess } from "../EmailVerificationSuccess";
import { EmailVerificationError } from "../EmailVerificationError";

// Mock the THRIVE colors
vi.mock("@/config/modules", () => ({
  THRIVE_COLORS: {
    NAVY: "#1297d2",
    SKY_BLUE: "#96d7e1",
    ORANGE: "#f89e54",
    YELLOW: "#fde677",
  },
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

// Mock fetch globally
global.fetch = vi.fn();

describe("Registration Components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
  });

  describe("DemoModeBanner", () => {
    it("renders demo mode banner with contact sales button", () => {
      const mockOnContactSales = vi.fn();
      render(
        <DemoModeBanner
          onContactSales={mockOnContactSales}
          showPricingLink={false}
        />
      );

      expect(screen.getByText("Demo Mode")).toBeInTheDocument();
      expect(screen.getByTestId("contact-sales-button")).toBeInTheDocument();
      expect(
        screen.getByText(/This platform is currently in demonstration mode/i)
      ).toBeInTheDocument();
    });

    it("calls onContactSales when button is clicked", () => {
      const mockOnContactSales = vi.fn();
      render(
        <DemoModeBanner
          onContactSales={mockOnContactSales}
          showPricingLink={false}
        />
      );

      fireEvent.click(screen.getByTestId("contact-sales-button"));
      expect(mockOnContactSales).toHaveBeenCalledTimes(1);
    });

    it("shows pricing link when showPricingLink is true", () => {
      const mockOnContactSales = vi.fn();
      render(
        <DemoModeBanner
          onContactSales={mockOnContactSales}
          showPricingLink={true}
        />
      );

      expect(screen.getByTestId("pricing-link")).toBeInTheDocument();
    });

    it("hides pricing link when showPricingLink is false", () => {
      const mockOnContactSales = vi.fn();
      render(
        <DemoModeBanner
          onContactSales={mockOnContactSales}
          showPricingLink={false}
        />
      );

      expect(screen.queryByTestId("pricing-link")).not.toBeInTheDocument();
    });

    it("shows dismiss button when dismissible is true", () => {
      const mockOnContactSales = vi.fn();
      const mockOnDismiss = vi.fn();
      render(
        <DemoModeBanner
          onContactSales={mockOnContactSales}
          showPricingLink={false}
          dismissible={true}
          onDismiss={mockOnDismiss}
        />
      );

      const dismissButton = screen.getByTestId("dismiss-banner-button");
      expect(dismissButton).toBeInTheDocument();
      fireEvent.click(dismissButton);
      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe("RegistrationPage", () => {
    it("renders registration form with all required fields", () => {
      renderWithRouter(<RegistrationPage demoMode={false} />);

      expect(screen.getByTestId("input-email")).toBeInTheDocument();
      expect(screen.getByTestId("input-username")).toBeInTheDocument();
      expect(screen.getByTestId("input-password")).toBeInTheDocument();
      expect(screen.getByTestId("input-confirm-password")).toBeInTheDocument();
      expect(screen.getByTestId("input-organization")).toBeInTheDocument();
      expect(screen.getByTestId("button-create-account")).toBeInTheDocument();
    });

    it("displays demo mode banner when demoMode is true", () => {
      renderWithRouter(<RegistrationPage demoMode={true} />);

      expect(screen.getByText("Demo Mode")).toBeInTheDocument();
    });

    it("hides demo mode banner when demoMode is false", () => {
      renderWithRouter(<RegistrationPage demoMode={false} />);

      expect(screen.queryByText("Demo Mode")).not.toBeInTheDocument();
    });

    it("shows password strength indicator when password is entered", () => {
      renderWithRouter(<RegistrationPage demoMode={false} />);

      const passwordInput = screen.getByTestId("input-password");
      fireEvent.change(passwordInput, { target: { value: "Test123!" } });

      expect(screen.getByTestId("password-strength-label")).toBeInTheDocument();
    });

    it("renders email input with proper type attribute for validation", () => {
      renderWithRouter(<RegistrationPage demoMode={false} />);

      const emailInput = screen.getByTestId("input-email") as HTMLInputElement;

      // Verify email input has correct type for browser validation
      expect(emailInput).toHaveAttribute("type", "email");
      expect(emailInput).toHaveAttribute("required");
    });

    it("validates password match and shows error when passwords don't match", async () => {
      renderWithRouter(<RegistrationPage demoMode={false} />);

      const emailInput = screen.getByTestId("input-email");
      const usernameInput = screen.getByTestId("input-username");
      const passwordInput = screen.getByTestId("input-password");
      const confirmPasswordInput = screen.getByTestId("input-confirm-password");
      const submitButton = screen.getByTestId("button-create-account");

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(usernameInput, { target: { value: "testuser" } });
      fireEvent.change(passwordInput, { target: { value: "Test123!" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "Different123!" },
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getAllByText(/Passwords do not match/i).length
        ).toBeGreaterThan(0);
      });
    });

    it("validates required fields and shows error when fields are empty", async () => {
      renderWithRouter(<RegistrationPage demoMode={false} />);

      const emailInput = screen.getByTestId("input-email") as HTMLInputElement;
      const usernameInput = screen.getByTestId(
        "input-username"
      ) as HTMLInputElement;
      const passwordInput = screen.getByTestId(
        "input-password"
      ) as HTMLInputElement;
      const confirmPasswordInput = screen.getByTestId(
        "input-confirm-password"
      ) as HTMLInputElement;
      const submitButton = screen.getByTestId("button-create-account");

      // Remove required attributes to bypass browser validation
      emailInput.removeAttribute("required");
      usernameInput.removeAttribute("required");
      passwordInput.removeAttribute("required");
      confirmPasswordInput.removeAttribute("required");

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Please fill in all required fields/i)
        ).toBeInTheDocument();
      });
    });

    it("validates password strength and shows error for weak password", async () => {
      renderWithRouter(<RegistrationPage demoMode={false} />);

      const emailInput = screen.getByTestId("input-email");
      const usernameInput = screen.getByTestId("input-username");
      const passwordInput = screen.getByTestId("input-password");
      const confirmPasswordInput = screen.getByTestId("input-confirm-password");
      const submitButton = screen.getByTestId("button-create-account");

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(usernameInput, { target: { value: "testuser" } });
      fireEvent.change(passwordInput, { target: { value: "weak" } });
      fireEvent.change(confirmPasswordInput, { target: { value: "weak" } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Password is too weak/i)).toBeInTheDocument();
      });
    });

    it("shows password requirements checklist", () => {
      renderWithRouter(<RegistrationPage demoMode={false} />);

      const passwordInput = screen.getByTestId("input-password");
      fireEvent.change(passwordInput, { target: { value: "Test" } });

      expect(screen.getByText(/At least 8 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/One uppercase letter/i)).toBeInTheDocument();
      expect(screen.getByText(/One lowercase letter/i)).toBeInTheDocument();
      expect(screen.getByText(/One number/i)).toBeInTheDocument();
      expect(screen.getByText(/One special character/i)).toBeInTheDocument();
    });

    it("successfully submits registration form with valid data", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, email: "test@example.com" }),
      });

      const mockOnSuccess = vi.fn();
      renderWithRouter(
        <RegistrationPage
          demoMode={false}
          onRegistrationSuccess={mockOnSuccess}
        />
      );

      const emailInput = screen.getByTestId("input-email");
      const usernameInput = screen.getByTestId("input-username");
      const passwordInput = screen.getByTestId("input-password");
      const confirmPasswordInput = screen.getByTestId("input-confirm-password");
      const submitButton = screen.getByTestId("button-create-account");

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(usernameInput, { target: { value: "testuser" } });
      fireEvent.change(passwordInput, { target: { value: "Test123!@#" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "Test123!@#" },
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith("test@example.com");
      });
    });

    it("handles registration API error", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Email already exists" }),
      });

      renderWithRouter(<RegistrationPage demoMode={false} />);

      const emailInput = screen.getByTestId("input-email");
      const usernameInput = screen.getByTestId("input-username");
      const passwordInput = screen.getByTestId("input-password");
      const confirmPasswordInput = screen.getByTestId("input-confirm-password");
      const submitButton = screen.getByTestId("button-create-account");

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(usernameInput, { target: { value: "testuser" } });
      fireEvent.change(passwordInput, { target: { value: "Test123!@#" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "Test123!@#" },
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Email already exists/i)).toBeInTheDocument();
      });
    });

    it("shows loading state during form submission", async () => {
      (global.fetch as any).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({
                    success: true,
                    email: "test@example.com",
                  }),
                }),
              100
            )
          )
      );

      renderWithRouter(<RegistrationPage demoMode={false} />);

      const emailInput = screen.getByTestId("input-email");
      const usernameInput = screen.getByTestId("input-username");
      const passwordInput = screen.getByTestId("input-password");
      const confirmPasswordInput = screen.getByTestId("input-confirm-password");
      const submitButton = screen.getByTestId("button-create-account");

      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(usernameInput, { target: { value: "testuser" } });
      fireEvent.change(passwordInput, { target: { value: "Test123!@#" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "Test123!@#" },
      });
      fireEvent.click(submitButton);

      expect(screen.getByText(/Creating Account.../i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  describe("EmailVerificationPending", () => {
    it("renders verification pending message", () => {
      renderWithRouter(<EmailVerificationPending email="test@example.com" />);

      expect(screen.getByText("Check Your Email")).toBeInTheDocument();
      expect(screen.getByTestId("email-display")).toHaveTextContent(
        "test@example.com"
      );
    });

    it("shows resend button", () => {
      renderWithRouter(<EmailVerificationPending email="test@example.com" />);

      expect(screen.getByTestId("button-resend-email")).toBeInTheDocument();
    });

    it("shows contact support link", () => {
      renderWithRouter(<EmailVerificationPending email="test@example.com" />);

      expect(screen.getByTestId("link-contact-support")).toBeInTheDocument();
    });

    it("displays verification instructions", () => {
      renderWithRouter(<EmailVerificationPending email="test@example.com" />);

      expect(screen.getByText(/Next Steps:/i)).toBeInTheDocument();
      expect(screen.getByText(/Check your email inbox/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Click the verification link/i)
      ).toBeInTheDocument();
    });

    it("successfully resends verification email", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      renderWithRouter(<EmailVerificationPending email="test@example.com" />);

      const resendButton = screen.getByTestId("button-resend-email");
      fireEvent.click(resendButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Verification email resent successfully/i)
        ).toBeInTheDocument();
      });
    });

    it("handles resend email error", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Rate limit exceeded" }),
      });

      renderWithRouter(<EmailVerificationPending email="test@example.com" />);

      const resendButton = screen.getByTestId("button-resend-email");
      fireEvent.click(resendButton);

      await waitFor(() => {
        expect(screen.getByText(/Rate limit exceeded/i)).toBeInTheDocument();
      });
    });

    it("shows loading state during resend", async () => {
      (global.fetch as any).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ success: true }),
                }),
              100
            )
          )
      );

      renderWithRouter(<EmailVerificationPending email="test@example.com" />);

      const resendButton = screen.getByTestId("button-resend-email");
      fireEvent.click(resendButton);

      expect(screen.getByText(/Resending.../i)).toBeInTheDocument();
      expect(resendButton).toBeDisabled();
    });

    it("calls custom onResendEmail handler when provided", async () => {
      const mockOnResend = vi.fn().mockResolvedValue(undefined);
      renderWithRouter(
        <EmailVerificationPending
          email="test@example.com"
          onResendEmail={mockOnResend}
        />
      );

      const resendButton = screen.getByTestId("button-resend-email");
      fireEvent.click(resendButton);

      await waitFor(() => {
        expect(mockOnResend).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("EmailVerificationSuccess", () => {
    it("renders success message", () => {
      renderWithRouter(<EmailVerificationSuccess />);

      expect(screen.getByText("Email Verified!")).toBeInTheDocument();
      expect(
        screen.getByText("Your account has been successfully activated")
      ).toBeInTheDocument();
    });

    it("shows go to login button", () => {
      renderWithRouter(<EmailVerificationSuccess />);

      expect(screen.getByTestId("button-go-to-login")).toBeInTheDocument();
    });

    it("displays welcome message and next steps", () => {
      renderWithRouter(<EmailVerificationSuccess />);

      expect(screen.getByText(/Welcome to THRIVE!/i)).toBeInTheDocument();
      expect(screen.getByText(/What's next\?/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Sign in with your credentials/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Complete your profile setup/i)
      ).toBeInTheDocument();
    });

    it("calls custom onGoToLogin handler when provided", () => {
      const mockOnGoToLogin = vi.fn();
      renderWithRouter(
        <EmailVerificationSuccess onGoToLogin={mockOnGoToLogin} />
      );

      const loginButton = screen.getByTestId("button-go-to-login");
      fireEvent.click(loginButton);

      expect(mockOnGoToLogin).toHaveBeenCalledTimes(1);
    });
  });

  describe("EmailVerificationError", () => {
    it("renders error message for expired token", () => {
      renderWithRouter(
        <EmailVerificationError
          errorType="expired"
          errorMessage="Token expired"
          email="test@example.com"
        />
      );

      expect(screen.getByText("Verification Link Expired")).toBeInTheDocument();
      expect(
        screen.getByText(/Verification links are valid for 24 hours/i)
      ).toBeInTheDocument();
    });

    it("renders error message for invalid token", () => {
      renderWithRouter(
        <EmailVerificationError
          errorType="invalid"
          errorMessage="Invalid token"
          email="test@example.com"
        />
      );

      expect(screen.getByText("Invalid Verification Link")).toBeInTheDocument();
    });

    it("renders error message for already verified", () => {
      renderWithRouter(
        <EmailVerificationError
          errorType="already_verified"
          errorMessage="Already verified"
          email="test@example.com"
        />
      );

      expect(screen.getByText("Already Verified")).toBeInTheDocument();
      expect(
        screen.getByText(/has already been verified/i)
      ).toBeInTheDocument();
    });

    it("renders error message for unknown error type", () => {
      renderWithRouter(
        <EmailVerificationError
          errorType="unknown"
          errorMessage="Unknown error"
          email="test@example.com"
        />
      );

      expect(screen.getByText("Verification Failed")).toBeInTheDocument();
    });

    it("shows resend button for expired/invalid errors", () => {
      renderWithRouter(
        <EmailVerificationError
          errorType="expired"
          errorMessage="Token expired"
          email="test@example.com"
        />
      );

      expect(
        screen.getByTestId("button-resend-verification")
      ).toBeInTheDocument();
    });

    it("hides resend button for already verified error", () => {
      renderWithRouter(
        <EmailVerificationError
          errorType="already_verified"
          errorMessage="Already verified"
          email="test@example.com"
        />
      );

      expect(
        screen.queryByTestId("button-resend-verification")
      ).not.toBeInTheDocument();
    });

    it("shows go to login button for already verified error", () => {
      renderWithRouter(
        <EmailVerificationError
          errorType="already_verified"
          errorMessage="Already verified"
          email="test@example.com"
        />
      );

      expect(screen.getByTestId("button-go-to-login")).toBeInTheDocument();
    });

    it("displays error details including email", () => {
      renderWithRouter(
        <EmailVerificationError
          errorType="expired"
          errorMessage="Token expired"
          email="test@example.com"
        />
      );

      expect(screen.getByText(/Token expired/i)).toBeInTheDocument();
      expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
    });

    it("successfully resends verification email", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      renderWithRouter(
        <EmailVerificationError
          errorType="expired"
          errorMessage="Token expired"
          email="test@example.com"
        />
      );

      const resendButton = screen.getByTestId("button-resend-verification");
      fireEvent.click(resendButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Verification email resent successfully/i)
        ).toBeInTheDocument();
      });
    });

    it("handles resend email error", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Failed to send email" }),
      });

      renderWithRouter(
        <EmailVerificationError
          errorType="expired"
          errorMessage="Token expired"
          email="test@example.com"
        />
      );

      const resendButton = screen.getByTestId("button-resend-verification");
      fireEvent.click(resendButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to send email/i)).toBeInTheDocument();
      });
    });

    it("shows loading state during resend", async () => {
      (global.fetch as any).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ success: true }),
                }),
              100
            )
          )
      );

      renderWithRouter(
        <EmailVerificationError
          errorType="expired"
          errorMessage="Token expired"
          email="test@example.com"
        />
      );

      const resendButton = screen.getByTestId("button-resend-verification");
      fireEvent.click(resendButton);

      expect(screen.getByText(/Resending.../i)).toBeInTheDocument();
      expect(resendButton).toBeDisabled();
    });

    it("shows contact support link", () => {
      renderWithRouter(
        <EmailVerificationError
          errorType="expired"
          errorMessage="Token expired"
          email="test@example.com"
        />
      );

      expect(screen.getByTestId("link-contact-support")).toBeInTheDocument();
    });

    it("calls custom onResendEmail handler when provided", async () => {
      const mockOnResend = vi.fn().mockResolvedValue(undefined);
      renderWithRouter(
        <EmailVerificationError
          errorType="expired"
          errorMessage="Token expired"
          email="test@example.com"
          onResendEmail={mockOnResend}
        />
      );

      const resendButton = screen.getByTestId("button-resend-verification");
      fireEvent.click(resendButton);

      await waitFor(() => {
        expect(mockOnResend).toHaveBeenCalledTimes(1);
      });
    });
  });
});
