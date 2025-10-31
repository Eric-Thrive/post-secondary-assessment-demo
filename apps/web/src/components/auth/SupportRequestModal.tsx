import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  AlertCircleIcon,
} from "lucide-react";

export interface SupportRequest {
  name: string;
  email: string;
  subject: string;
  description: string;
  urgency: "low" | "medium" | "high";
  category: "technical" | "account" | "billing" | "other";
}

export interface SupportRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: SupportRequest) => Promise<void>;
  userEmail?: string;
}

const URGENCY_OPTIONS = [
  {
    value: "low",
    label: "Low",
    description: "General questions, not time-sensitive",
    icon: HelpCircle,
    color: "text-blue-600",
  },
  {
    value: "medium",
    label: "Medium",
    description: "Important but not blocking work",
    icon: AlertTriangle,
    color: "text-yellow-600",
  },
  {
    value: "high",
    label: "High",
    description: "Urgent issue blocking critical work",
    icon: AlertCircleIcon,
    color: "text-red-600",
  },
];

const CATEGORY_OPTIONS = [
  { value: "technical", label: "Technical Issue" },
  { value: "account", label: "Account & Access" },
  { value: "billing", label: "Billing & Subscription" },
  { value: "other", label: "Other" },
];

export const SupportRequestModal: React.FC<SupportRequestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  userEmail,
}) => {
  const [formData, setFormData] = useState<SupportRequest>({
    name: "",
    email: userEmail || "",
    subject: "",
    description: "",
    urgency: "medium",
    category: "technical",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof SupportRequest, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof SupportRequest, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.trim().length < 10) {
      newErrors.description =
        "Please provide more details (at least 10 characters)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setIsSuccess(true);

      // Reset form after 2 seconds and close
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error("Failed to submit support request:", error);
      setErrors({ description: "Failed to submit request. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      email: userEmail || "",
      subject: "",
      description: "",
      urgency: "medium",
      category: "technical",
    });
    setErrors({});
    setIsSuccess(false);
    onClose();
  };

  if (isSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Request Submitted!</h3>
              <p className="text-sm text-muted-foreground">
                Your support request has been received. Our team will respond to
                you via email shortly.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const selectedUrgency = URGENCY_OPTIONS.find(
    (opt) => opt.value === formData.urgency
  );
  const UrgencyIcon = selectedUrgency?.icon || HelpCircle;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Request Support
          </DialogTitle>
          <DialogDescription>
            Describe your issue and our support team will assist you as soon as
            possible.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Contact Information</h3>

            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Your full name"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="your.email@example.com"
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Issue Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Issue Details</h3>

            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="urgency">
                Urgency Level <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.urgency}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, urgency: value })
                }
              >
                <SelectTrigger id="urgency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {URGENCY_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${option.color}`} />
                          <span className="font-medium">{option.label}</span>
                          <span className="text-xs text-muted-foreground">
                            - {option.description}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {selectedUrgency && (
                <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                  <UrgencyIcon className={`h-4 w-4 ${selectedUrgency.color}`} />
                  <span className="text-sm text-muted-foreground">
                    {selectedUrgency.description}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">
                Subject <span className="text-red-500">*</span>
              </Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                placeholder="Brief summary of your issue"
                className={errors.subject ? "border-red-500" : ""}
              />
              {errors.subject && (
                <p className="text-sm text-red-500">{errors.subject}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Please provide detailed information about your issue, including any error messages or steps to reproduce..."
                rows={6}
                className={errors.description ? "border-red-500" : ""}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description}</p>
              )}
              <p className="text-xs text-muted-foreground">
                The more details you provide, the faster we can help resolve
                your issue.
              </p>
            </div>
          </div>

          {/* Response Time Info */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Expected Response Time:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• High urgency: Within 4 hours during business hours</li>
                <li>• Medium urgency: Within 24 hours</li>
                <li>• Low urgency: Within 48 hours</li>
              </ul>
            </AlertDescription>
          </Alert>

          {errors.description &&
            typeof errors.description === "string" &&
            errors.description.includes("Failed") && (
              <Alert variant="destructive">
                <AlertDescription>{errors.description}</AlertDescription>
              </Alert>
            )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
