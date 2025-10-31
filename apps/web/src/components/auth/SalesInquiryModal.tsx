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
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  Mail,
  Building2,
  Users,
  MessageSquare,
} from "lucide-react";

export interface SalesInquiry {
  name: string;
  email: string;
  organization: string;
  organizationSize?: string;
  interestedModules: string[];
  message: string;
  inquiryType: "pricing" | "demo" | "features" | "other";
}

export interface SalesInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (inquiry: SalesInquiry) => Promise<void>;
}

const MODULE_OPTIONS = [
  { value: "k12", label: "K-12 Assessment Reports" },
  { value: "post_secondary", label: "Post-Secondary Accommodation Reports" },
  { value: "tutoring", label: "Tutoring Support Reports" },
];

const ORG_SIZE_OPTIONS = [
  { value: "1-10", label: "1-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "201-500", label: "201-500 employees" },
  { value: "501+", label: "501+ employees" },
];

export const SalesInquiryModal: React.FC<SalesInquiryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<SalesInquiry>({
    name: "",
    email: "",
    organization: "",
    organizationSize: "",
    interestedModules: [],
    message: "",
    inquiryType: "pricing",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof SalesInquiry, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof SalesInquiry, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.organization.trim()) {
      newErrors.organization = "Organization name is required";
    }

    if (formData.interestedModules.length === 0) {
      newErrors.interestedModules = "Please select at least one module";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
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
      console.error("Failed to submit sales inquiry:", error);
      setErrors({ message: "Failed to submit inquiry. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      email: "",
      organization: "",
      organizationSize: "",
      interestedModules: [],
      message: "",
      inquiryType: "pricing",
    });
    setErrors({});
    setIsSuccess(false);
    onClose();
  };

  const handleModuleToggle = (moduleValue: string) => {
    setFormData((prev) => ({
      ...prev,
      interestedModules: prev.interestedModules.includes(moduleValue)
        ? prev.interestedModules.filter((m) => m !== moduleValue)
        : [...prev.interestedModules, moduleValue],
    }));
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
              <h3 className="text-lg font-semibold">Thank You!</h3>
              <p className="text-sm text-muted-foreground">
                Your inquiry has been submitted successfully. Our sales team
                will contact you shortly.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Contact Sales
          </DialogTitle>
          <DialogDescription>
            Tell us about your needs and our team will get back to you with
            pricing and information.
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

          {/* Organization Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Organization Information
            </h3>

            <div className="space-y-2">
              <Label htmlFor="organization">
                Organization Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="organization"
                value={formData.organization}
                onChange={(e) =>
                  setFormData({ ...formData, organization: e.target.value })
                }
                placeholder="Your organization name"
                className={errors.organization ? "border-red-500" : ""}
              />
              {errors.organization && (
                <p className="text-sm text-red-500">{errors.organization}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="organizationSize">
                <Users className="h-4 w-4 inline mr-1" />
                Organization Size
              </Label>
              <Select
                value={formData.organizationSize}
                onValueChange={(value) =>
                  setFormData({ ...formData, organizationSize: value })
                }
              >
                <SelectTrigger id="organizationSize">
                  <SelectValue placeholder="Select organization size" />
                </SelectTrigger>
                <SelectContent>
                  {ORG_SIZE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Inquiry Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Inquiry Details</h3>

            <div className="space-y-2">
              <Label htmlFor="inquiryType">
                What are you interested in?{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.inquiryType}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, inquiryType: value })
                }
              >
                <SelectTrigger id="inquiryType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pricing">Pricing Information</SelectItem>
                  <SelectItem value="demo">Request a Demo</SelectItem>
                  <SelectItem value="features">Feature Information</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Interested Modules <span className="text-red-500">*</span>
              </Label>
              <div className="space-y-2">
                {MODULE_OPTIONS.map((module) => (
                  <div
                    key={module.value}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`module-${module.value}`}
                      checked={formData.interestedModules.includes(
                        module.value
                      )}
                      onCheckedChange={() => handleModuleToggle(module.value)}
                    />
                    <Label
                      htmlFor={`module-${module.value}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {module.label}
                    </Label>
                  </div>
                ))}
              </div>
              {errors.interestedModules && (
                <p className="text-sm text-red-500">
                  {errors.interestedModules}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">
                <MessageSquare className="h-4 w-4 inline mr-1" />
                Message <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                placeholder="Tell us about your needs and any specific questions you have..."
                rows={4}
                className={errors.message ? "border-red-500" : ""}
              />
              {errors.message && (
                <p className="text-sm text-red-500">{errors.message}</p>
              )}
            </div>
          </div>

          {errors.message &&
            typeof errors.message === "string" &&
            errors.message.includes("Failed") && (
              <Alert variant="destructive">
                <AlertDescription>{errors.message}</AlertDescription>
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
              {isSubmitting ? "Submitting..." : "Submit Inquiry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
