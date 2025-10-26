type DemoEnvironmentKey = "post-secondary-demo" | "k12-demo" | "tutoring-demo";
type UserRoleKey = "system_admin" | "customer_admin" | "tutor" | string;

interface RedirectOptions {
  role?: string | null;
  demoPermissions?: unknown;
}

interface RedirectResult {
  url: string;
  source: "demo" | "role" | "default";
  matchedKey?: string;
}

const sanitizeUrl = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed;
};

const DEFAULT_REDIRECT_URL =
  sanitizeUrl(process.env.LOGIN_REDIRECT_DEFAULT_URL) ?? "/";

const DEMO_REDIRECTS: Record<DemoEnvironmentKey, string | undefined> = {
  "post-secondary-demo":
    sanitizeUrl(process.env.LOGIN_REDIRECT_POST_SECONDARY_DEMO_URL) ??
    "/post-secondary-demo",
  "k12-demo":
    sanitizeUrl(process.env.LOGIN_REDIRECT_K12_DEMO_URL) ?? "/k12-demo",
  "tutoring-demo":
    sanitizeUrl(process.env.LOGIN_REDIRECT_TUTORING_DEMO_URL) ?? "/tutoring-demo",
};

const ROLE_REDIRECTS: Record<UserRoleKey, string | undefined> = {
  system_admin:
    sanitizeUrl(process.env.LOGIN_REDIRECT_ROLE_SYSTEM_ADMIN_URL) ?? "/admin",
  customer_admin:
    sanitizeUrl(process.env.LOGIN_REDIRECT_ROLE_CUSTOMER_ADMIN_URL) ??
    "/post-secondary-reports",
  tutor:
    sanitizeUrl(process.env.LOGIN_REDIRECT_ROLE_TUTOR_URL) ??
    "/post-secondary-reports",
};

const ALLOWED_REDIRECTS = new Set(
  [
    DEFAULT_REDIRECT_URL,
    ...Object.values(DEMO_REDIRECTS),
    ...Object.values(ROLE_REDIRECTS),
  ].filter((url): url is string => Boolean(url)),
);

const isAllowedRedirect = (url: string): boolean => {
  if (!url) return false;
  if (ALLOWED_REDIRECTS.has(url)) return true;
  // Allow relative URLs that start with "/" to keep compatibility
  return url.startsWith("/");
};

export const normalizeDemoPermissions = (
  raw: unknown,
): Record<string, boolean> => {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return normalizeDemoPermissions(parsed);
    } catch {
      return {};
    }
  }

  if (typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }

  return Object.entries(raw).reduce<Record<string, boolean>>(
    (accumulator, [key, value]) => {
      if (typeof value === "boolean") {
        accumulator[key] = value;
      } else if (typeof value === "string") {
        accumulator[key] = value.toLowerCase() === "true";
      }
      return accumulator;
    },
    {},
  );
};

/**
 * Determine the best redirect target for a user after login.
 * Priority: demo permissions → role-based → default.
 */
export const resolvePostLoginRedirect = (
  options: RedirectOptions,
): RedirectResult => {
  const demoPermissions = normalizeDemoPermissions(options.demoPermissions);

  const demoPriority: DemoEnvironmentKey[] = [
    "post-secondary-demo",
    "k12-demo",
    "tutoring-demo",
  ];

  for (const key of demoPriority) {
    if (demoPermissions[key]) {
      const target = DEMO_REDIRECTS[key];
      if (target && isAllowedRedirect(target)) {
        return { url: target, source: "demo", matchedKey: key };
      }
    }
  }

  const roleKey = options.role ?? "";
  const roleTarget = ROLE_REDIRECTS[roleKey];
  if (roleTarget && isAllowedRedirect(roleTarget)) {
    return { url: roleTarget, source: "role", matchedKey: roleKey };
  }

  return { url: DEFAULT_REDIRECT_URL, source: "default" };
};
