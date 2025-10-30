# Implementation Plan

- [ ] 1. Set up database schema and migrations

  - Create migration file to add email verification columns to users table (email_verified, email_verification_token, email_verification_expiry)
  - Create support_requests table with all required fields
  - Create sales_inquiries table with all required fields
  - Add database indexes for performance optimization
  - Set existing users to email_verified = true for backward compatibility
  - _Requirements: 2.3, 4.5, 10.2_

- [ ] 2. Implement email verification service

  - [ ] 2.1 Create email verification token generation and validation

    - Write cryptographically secure token generation using crypto.randomBytes
    - Implement token hashing with bcrypt
    - Create token validation logic with expiry checking
    - Build verification link generation function
    - _Requirements: 3.2, 10.1, 10.2, 10.3_

  - [ ] 2.2 Create email verification service module

    - Implement generateVerificationToken function
    - Implement hashToken function
    - Implement validateToken function
    - Implement createVerificationLink function
    - _Requirements: 3.2, 10.1_

  - [ ]\* 2.3 Write unit tests for token generation and validation
    - Test token uniqueness
    - Test token expiry validation
    - Test hash verification
    - Test link generation
    - _Requirements: 10.1, 10.2, 10.3_

- [ ] 3. Extend SendGrid email service

  - [ ] 3.1 Create email template generation functions

    - Implement generateVerificationEmail template with HTML/text versions
    - Implement generateAdminRegistrationNotification template
    - Implement generateAdminSupportNotification template
    - Implement generateAdminSalesNotification template
    - _Requirements: 3.3, 5.2, 6.2, 7.2, 9.2_

  - [ ] 3.2 Add email sending functions for new templates

    - Extend SendGrid service to support verification emails
    - Add admin notification email sending
    - Implement email retry logic for failed sends
    - Add email delivery logging
    - _Requirements: 3.1, 9.1, 9.4_

  - [ ]\* 3.3 Test email template rendering
    - Verify all placeholders are replaced correctly
    - Test HTML rendering
    - Validate responsive design
    - _Requirements: 9.2_

- [ ] 4. Create admin notification service

  - [ ] 4.1 Implement system admin retrieval

    - Write query to fetch all users with system_admin role
    - Add caching for admin list (5-minute TTL)
    - Handle case where no admins exist
    - _Requirements: 5.1, 5.3, 5.4_

  - [ ] 4.2 Implement notification sending functions

    - Create sendRegistrationNotification function
    - Create sendSupportRequestNotification function
    - Create sendSalesInquiryNotification function
    - Ensure notifications don't block user operations
    - _Requirements: 5.1, 5.5, 6.1, 7.1_

  - [ ]\* 4.3 Write unit tests for admin notification service
    - Test admin retrieval
    - Test notification sending to multiple admins
    - Test handling of missing admins
    - _Requirements: 5.3, 5.4_

- [ ] 5. Implement registration API endpoints

  - [ ] 5.1 Create POST /api/auth/register endpoint

    - Validate registration form data (email, password, username)
    - Check for duplicate email addresses
    - Create pending user account with email_verified = false
    - Generate verification token and store hashed version
    - Send verification email to user
    - Send admin notification asynchronously
    - Return success response with instructions
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.5, 5.1_

  - [ ] 5.2 Create GET /api/auth/verify-email endpoint

    - Extract and validate token from query parameters
    - Check token expiry
    - Update user email_verified status to true
    - Invalidate verification token
    - Return success response with redirect URL
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ] 5.3 Create POST /api/auth/resend-verification endpoint

    - Validate email address
    - Check if user exists and is unverified
    - Generate new verification token
    - Invalidate old token
    - Send new verification email
    - Implement rate limiting (3 requests per hour)
    - _Requirements: 3.4, 8.3_

  - [ ] 5.4 Add email verification check to login endpoint

    - Check email_verified status during login
    - Deny access for unverified users
    - Return appropriate error message with resend option
    - _Requirements: 8.1, 8.2, 8.5_

  - [ ]\* 5.5 Write integration tests for registration flow
    - Test complete registration and verification flow
    - Test duplicate email handling
    - Test expired token handling
    - Test resend verification flow
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 4.1_

- [ ] 6. Implement support and sales API endpoints

  - [ ] 6.1 Create POST /api/support/request endpoint

    - Validate support request data
    - Save request to support_requests table
    - Send admin notification
    - Return confirmation response
    - Implement rate limiting (10 requests per hour)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ] 6.2 Create POST /api/sales/inquiry endpoint

    - Validate sales inquiry data
    - Save inquiry to sales_inquiries table
    - Send admin notification
    - Return confirmation response
    - Implement rate limiting (10 requests per hour)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]\* 6.3 Write integration tests for support and sales endpoints
    - Test support request submission and notification
    - Test sales inquiry submission and notification
    - Test rate limiting
    - _Requirements: 6.1, 7.1_

- [ ] 7. Create frontend registration page components

  - [ ] 7.1 Build DemoModeBanner component

    - Create banner with demo mode messaging
    - Add "Contact Sales" call-to-action button
    - Style with light blue background and navy border
    - Make banner dismissible or persistent based on config
    - _Requirements: 1.1, 1.2, 1.5_

  - [ ] 7.2 Build RegistrationPage component

    - Create registration form with email, username, password, confirm password, organization fields
    - Add form validation (email format, password strength, required fields)
    - Display password strength indicator
    - Integrate DemoModeBanner at top of page
    - Handle form submission and error display
    - _Requirements: 1.1, 2.1, 2.2, 2.5_

  - [ ] 7.3 Build EmailVerificationPending component

    - Display "Check your email" message
    - Show user's email address
    - Add "Resend verification email" button
    - Add "Contact Support" link
    - Handle resend functionality with loading state
    - _Requirements: 3.5, 8.3_

  - [ ] 7.4 Build EmailVerificationSuccess component

    - Display success message
    - Add "Go to Login" button
    - Show welcome messaging
    - _Requirements: 4.3_

  - [ ] 7.5 Build EmailVerificationError component

    - Display error explanation
    - Add "Resend verification email" button
    - Add "Contact Support" link
    - Handle different error types (expired, invalid)
    - _Requirements: 4.4, 8.3_

  - [ ]\* 7.6 Write component tests for registration pages
    - Test form validation
    - Test demo banner display
    - Test verification pending state
    - Test success and error states
    - _Requirements: 1.1, 2.1, 3.5, 4.3, 4.4_

- [ ] 8. Create support and sales modal components

  - [ ] 8.1 Build SalesInquiryModal component

    - Create modal with contact form (name, email, organization, org size, interested modules, message)
    - Add inquiry type selection (pricing, demo, features, other)
    - Implement form validation
    - Handle form submission with loading state
    - Display success confirmation
    - _Requirements: 1.3, 7.1, 7.2, 7.3, 7.4_

  - [ ] 8.2 Build SupportRequestModal component

    - Create modal with support form (name, email, subject, description, urgency, category)
    - Add urgency level selection (low, medium, high)
    - Add category selection (technical, account, billing, other)
    - Implement form validation
    - Handle form submission with loading state
    - Display success confirmation
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]\* 8.3 Write component tests for modals
    - Test form validation
    - Test submission handling
    - Test success states
    - _Requirements: 1.3, 6.1, 7.1_

- [ ] 9. Implement rate limiting middleware

  - Create rate limiting middleware for registration endpoint (5 per hour per IP)
  - Create rate limiting middleware for resend verification endpoint (3 per hour per email)
  - Create rate limiting middleware for support/sales endpoints (10 per hour per IP)
  - Add rate limit headers to responses
  - Return appropriate error messages when limits exceeded
  - _Requirements: 10.4_

- [ ] 10. Add email verification routing and navigation

  - Create /register route with RegistrationPage
  - Create /verify-email-pending route with EmailVerificationPending
  - Create /verify-email route that handles token validation and shows success/error
  - Update login page to show error for unverified users
  - Add navigation guards to prevent unverified users from accessing protected routes
  - _Requirements: 4.3, 8.1, 8.2_

- [ ] 11. Configure environment variables and deployment settings

  - Add EMAIL_VERIFICATION_EXPIRY_HOURS to environment config
  - Add EMAIL_VERIFICATION_BASE_URL to environment config
  - Add rate limiting configuration variables
  - Add ADMIN_NOTIFICATION_ENABLED flag
  - Update deployment documentation with new environment variables
  - _Requirements: 3.2, 9.1_

- [ ]\* 12. Create end-to-end tests for critical user flows
  - Test complete registration → verification → login flow
  - Test registration → expired token → resend → verification flow
  - Test unverified user login attempt
  - Test support request submission and admin notification
  - Test sales inquiry submission and admin notification
  - _Requirements: 2.1, 3.1, 4.1, 6.1, 7.1, 8.1_
