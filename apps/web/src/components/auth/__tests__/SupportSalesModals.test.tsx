import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SalesInquiryModal } from "../SalesInquiryModal";
import { SupportRequestModal } from "../SupportRequestModal";

describe("Support and Sales Modals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SalesInquiryModal", () => {
    it("renders sales inquiry form when open", () => {
      const mockOnClose = vi.fn();
      const mockOnSubmit = vi.fn();

      render(
        <SalesInquiryModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText("Contact Sales")).toBeInTheDocument();
      expect(screen.getByLabelText(/^Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Email/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Organization Name/)).toBeInTheDocument();
    });

    it("validates required fields", async () => {
      const mockOnClose = vi.fn();
      const mockOnSubmit = vi.fn();

      render(
        <SalesInquiryModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const submitButton = screen.getByRole("button", {
        name: /Submit Inquiry/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Name is required")).toBeInTheDocument();
        expect(screen.getByText("Email is required")).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("validates email format and prevents submission with invalid email", async () => {
      const mockOnClose = vi.fn();
      const mockOnSubmit = vi.fn();

      render(
        <SalesInquiryModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      // Fill in other required fields
      fireEvent.change(screen.getByLabelText(/^Name/), {
        target: { value: "John Doe" },
      });
      fireEvent.change(screen.getByLabelText(/^Email/), {
        target: { value: "invalid-email" },
      });
      fireEvent.change(screen.getByLabelText(/Organization Name/), {
        target: { value: "Test Org" },
      });
      fireEvent.change(screen.getByLabelText(/Message/), {
        target: { value: "Test message" },
      });

      // Select at least one module
      const k12Checkbox = screen.getByLabelText(/K-12 Assessment Reports/);
      fireEvent.click(k12Checkbox);

      const submitButton = screen.getByRole("button", {
        name: /Submit Inquiry/i,
      });
      fireEvent.click(submitButton);

      // Wait a bit for validation to run
      await waitFor(() => {
        // Verify submission was blocked
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    it("submits form with valid data", async () => {
      const mockOnClose = vi.fn();
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <SalesInquiryModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      // Fill in required fields
      fireEvent.change(screen.getByLabelText(/^Name/), {
        target: { value: "John Doe" },
      });
      fireEvent.change(screen.getByLabelText(/^Email/), {
        target: { value: "john@example.com" },
      });
      fireEvent.change(screen.getByLabelText(/Organization Name/), {
        target: { value: "Test Org" },
      });
      fireEvent.change(screen.getByLabelText(/Message/), {
        target: { value: "I am interested in your product" },
      });

      // Select at least one module
      const k12Checkbox = screen.getByLabelText(/K-12 Assessment Reports/);
      fireEvent.click(k12Checkbox);

      const submitButton = screen.getByRole("button", {
        name: /Submit Inquiry/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "John Doe",
            email: "john@example.com",
            organization: "Test Org",
            message: "I am interested in your product",
            interestedModules: expect.arrayContaining(["k12"]),
          })
        );
      });
    });

    it("displays success message after submission", async () => {
      const mockOnClose = vi.fn();
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <SalesInquiryModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      // Fill in required fields
      fireEvent.change(screen.getByLabelText(/^Name/), {
        target: { value: "John Doe" },
      });
      fireEvent.change(screen.getByLabelText(/^Email/), {
        target: { value: "john@example.com" },
      });
      fireEvent.change(screen.getByLabelText(/Organization Name/), {
        target: { value: "Test Org" },
      });
      fireEvent.change(screen.getByLabelText(/Message/), {
        target: { value: "I am interested" },
      });

      const k12Checkbox = screen.getByLabelText(/K-12 Assessment Reports/);
      fireEvent.click(k12Checkbox);

      const submitButton = screen.getByRole("button", {
        name: /Submit Inquiry/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Thank You!")).toBeInTheDocument();
      });
    });
  });

  describe("SupportRequestModal", () => {
    it("renders support request form when open", () => {
      const mockOnClose = vi.fn();
      const mockOnSubmit = vi.fn();

      render(
        <SupportRequestModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText("Request Support")).toBeInTheDocument();
      expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Subject/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
    });

    it("validates required fields", async () => {
      const mockOnClose = vi.fn();
      const mockOnSubmit = vi.fn();

      render(
        <SupportRequestModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const submitButton = screen.getByRole("button", {
        name: /Submit Request/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Name is required")).toBeInTheDocument();
        expect(screen.getByText("Email is required")).toBeInTheDocument();
        expect(screen.getByText("Subject is required")).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("validates description minimum length", async () => {
      const mockOnClose = vi.fn();
      const mockOnSubmit = vi.fn();

      render(
        <SupportRequestModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const descriptionInput = screen.getByLabelText(/Description/);
      fireEvent.change(descriptionInput, { target: { value: "short" } });

      const submitButton = screen.getByRole("button", {
        name: /Submit Request/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Please provide more details/)
        ).toBeInTheDocument();
      });
    });

    it("submits form with valid data", async () => {
      const mockOnClose = vi.fn();
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <SupportRequestModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      // Fill in required fields
      fireEvent.change(screen.getByLabelText(/Name/), {
        target: { value: "Jane Smith" },
      });
      fireEvent.change(screen.getByLabelText(/Email/), {
        target: { value: "jane@example.com" },
      });
      fireEvent.change(screen.getByLabelText(/Subject/), {
        target: { value: "Login Issue" },
      });
      fireEvent.change(screen.getByLabelText(/Description/), {
        target: { value: "I cannot log in to my account. Getting error 500." },
      });

      const submitButton = screen.getByRole("button", {
        name: /Submit Request/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Jane Smith",
            email: "jane@example.com",
            subject: "Login Issue",
            description: "I cannot log in to my account. Getting error 500.",
            urgency: "medium",
            category: "technical",
          })
        );
      });
    });

    it("displays success message after submission", async () => {
      const mockOnClose = vi.fn();
      const mockOnSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <SupportRequestModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      // Fill in required fields
      fireEvent.change(screen.getByLabelText(/Name/), {
        target: { value: "Jane Smith" },
      });
      fireEvent.change(screen.getByLabelText(/Email/), {
        target: { value: "jane@example.com" },
      });
      fireEvent.change(screen.getByLabelText(/Subject/), {
        target: { value: "Login Issue" },
      });
      fireEvent.change(screen.getByLabelText(/Description/), {
        target: { value: "I cannot log in to my account. Getting error 500." },
      });

      const submitButton = screen.getByRole("button", {
        name: /Submit Request/i,
      });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Request Submitted!")).toBeInTheDocument();
      });
    });

    it("pre-fills email when userEmail prop is provided", () => {
      const mockOnClose = vi.fn();
      const mockOnSubmit = vi.fn();

      render(
        <SupportRequestModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          userEmail="user@example.com"
        />
      );

      const emailInput = screen.getByLabelText(/Email/) as HTMLInputElement;
      expect(emailInput.value).toBe("user@example.com");
    });
  });
});
