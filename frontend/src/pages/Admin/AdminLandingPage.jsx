import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  useUser,
  useAuth,
  SignIn,
  UserButton,
} from "@clerk/react";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Copy,
  Check,
  RefreshCw,
  ArrowLeft,
  Calendar,
  MapPin,
  ExternalLink,
  Lock,
  User,
  AlertCircle,
  Compass,
  Sparkles,
  Plus,
} from "lucide-react";
import { getValidAdminToken } from "../../services/eventService.js";

export default function AdminLandingPage() {
  const { isLoaded: userLoaded, isSignedIn, user } = useUser();
  const { isLoaded: authLoaded, getToken } = useAuth();

  const [accessStatus, setAccessStatus] = useState("idle"); // idle | checking | authorized | forbidden | unauthorized | error
  const [accessMessage, setAccessMessage] = useState("");
  const [eventsCount, setEventsCount] = useState(null);
  const [copied, setCopied] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState("");

  const checkAdminAccess = useCallback(async () => {
    if (!isSignedIn) return;

    setAccessStatus("checking");
    setAccessMessage("Retrieving Clerk session token and verifying with backend...");

    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
    setApiBaseUrl(baseUrl);

    try {
      let token = await getValidAdminToken(getToken);

      if (!token) {
        setAccessStatus("unauthorized");
        setAccessMessage("Unable to retrieve session bearer token from Clerk.");
        return;
      }

      let res = await fetch(`${baseUrl}/api/admin/events/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // Transparent retry on 401 if cached token was stale/expired
      if (res.status === 401) {
        const freshToken = await getToken({ skipCache: true });
        if (freshToken && freshToken !== token) {
          token = freshToken;
          res = await fetch(`${baseUrl}/api/admin/events/`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
        }
      }

      if (res.status === 200) {
        const data = await res.json();
        const count =
          typeof data.count === "number"
            ? data.count
            : Array.isArray(data.results)
            ? data.results.length
            : Array.isArray(data)
            ? data.length
            : 0;

        setEventsCount(count);
        setAccessStatus("authorized");
        setAccessMessage(
          "Backend authorization confirmed. Your Clerk User ID is present in the server's CLERK_ADMIN_USER_IDS allowlist."
        );
      } else if (res.status === 403) {
        setAccessStatus("forbidden");
        setAccessMessage(
          "Access Denied (HTTP 403): You are signed in with Clerk, but your User ID is not present in the server's CLERK_ADMIN_USER_IDS allowlist."
        );
      } else if (res.status === 401) {
        let errorDetail = "";
        try {
          const errJson = await res.json();
          errorDetail = errJson.detail || errJson.error || "";
        } catch (_) {}

        setAccessStatus("unauthorized");
        setAccessMessage(
          errorDetail
            ? `Authentication Rejected (HTTP 401): ${errorDetail}`
            : "Authentication Rejected (HTTP 401): The Django server rejected the session token (signature, issuer, or expiration mismatch)."
        );
      } else {
        setAccessStatus("error");
        setAccessMessage(
          `Unexpected server response: HTTP ${res.status} ${res.statusText}`
        );
      }
    } catch (err) {
      console.error("[AdminLandingPage] Verification error:", err);
      setAccessStatus("error");
      setAccessMessage(
        `Unable to reach Django API at ${baseUrl}. Ensure the backend development server is running on port 8000.`
      );
    }
  }, [isSignedIn, getToken]);

  // Run access verification when user is signed in
  useEffect(() => {
    if (userLoaded && authLoaded && isSignedIn) {
      checkAdminAccess();
    }
  }, [userLoaded, authLoaded, isSignedIn, checkAdminAccess]);

  const handleCopyUserId = () => {
    if (!user?.id) return;
    navigator.clipboard.writeText(user.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 1. Loading Session State
  if (!userLoaded || !authLoaded) {
    return (
      <div className="smartnav-admin-page smartnav-admin-page--loading">
        <div className="smartnav-admin-loading-box">
          <RefreshCw size={28} className="animate-spin text-teal-600" />
          <p>Initializing Clerk authentication session...</p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated State (Sign In Required)
  if (!isSignedIn) {
    return (
      <div className="smartnav-admin-page">
        <div className="smartnav-admin-container smartnav-admin-container--auth">
          <div className="smartnav-admin-auth-card">
            <div className="smartnav-admin-auth-header">
              <div className="smartnav-admin-shield-icon">
                <Shield size={32} />
              </div>
              <h2>Administrator Portal</h2>
              <p>
                Sign in with your campus administrator credentials to access
                SmartNav event and spatial management controls.
              </p>
            </div>

            <div className="smartnav-clerk-signin-wrapper">
              <SignIn routing="hash" />
            </div>

            <div className="smartnav-admin-notice-box">
              <div className="smartnav-admin-notice-icon">
                <AlertCircle size={18} />
              </div>
              <div className="smartnav-admin-notice-text">
                <strong>Public Campus Navigation:</strong> Students, faculty, and
                guests do not need to sign in. The campus map, turn-by-turn
                guidance, and public events directory are freely accessible.
              </div>
            </div>

            <div className="smartnav-admin-back-link">
              <Link to="/">
                <ArrowLeft size={16} />
                <span>Return to Campus Map</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated State (Admin Landing & Access Verification)
  return (
    <div className="smartnav-admin-page">
      <div className="smartnav-admin-container">
        {/* Top Breadcrumbs & Public Navigation Route Links */}
        <div className="smartnav-admin-topbar">
          <div className="smartnav-admin-breadcrumb">
            <Link to="/" className="hover:underline">
              SmartNav
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Admin Portal</span>
          </div>

          <div className="smartnav-admin-topbar-actions">
            <Link to="/events" className="smartnav-admin-action-link">
              <Calendar size={14} />
              <span>Public Events</span>
            </Link>
            <Link to="/" className="smartnav-admin-action-link">
              <Compass size={14} />
              <span>Campus Map</span>
            </Link>
          </div>
        </div>

        {/* Page Header Banner */}
        <div className="smartnav-admin-header-banner">
          <div>
            <h1 className="smartnav-admin-title">
              <ShieldCheck size={28} className="text-teal-600 inline-block mr-2.5 shrink-0" />
              SmartNav Administrator Portal
            </h1>
            <p className="smartnav-admin-subtitle">
              Campus event administration, spatial navigation links, and server authorization controls.
            </p>
          </div>

          <div className="smartnav-admin-user-profile-widget">
            <UserButton
              afterSignOutUrl="/admin"
              appearance={{
                elements: {
                  avatarBox: "smartnav-circular-avatar",
                  userButtonAvatarBox: "smartnav-circular-avatar",
                  userButtonTrigger: "smartnav-circular-trigger",
                },
              }}
            />
          </div>
        </div>

        {/* ── Section: Administrator Identity & Authorization Status ──── */}
        <div className="smartnav-admin-identity-card">
          <div className="smartnav-admin-identity-main">
            {/* User Avatar & Info */}
            <div className="smartnav-admin-user-summary">
              {user.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={user.fullName || "User Avatar"}
                  className="smartnav-admin-avatar-img"
                />
              ) : (
                <div className="smartnav-admin-avatar-fallback">
                  {user.firstName ? user.firstName[0].toUpperCase() : "A"}
                </div>
              )}
              <div className="smartnav-admin-user-meta">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="smartnav-admin-user-name">
                    {user.fullName || "Campus Administrator"}
                  </h3>
                  <span className="smartnav-admin-chip smartnav-admin-chip--signed-in">
                    Clerk Verified
                  </span>
                </div>
                <p className="smartnav-admin-user-email">
                  {user.primaryEmailAddress?.emailAddress || "Administrator Session"}
                </p>
              </div>
            </div>

            {/* Clerk User ID Copy Control */}
            <div className="smartnav-admin-id-badge">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Clerk User ID:
              </span>
              <div className="smartnav-admin-copyable-id">
                <code>{user.id}</code>
                <button
                  type="button"
                  onClick={handleCopyUserId}
                  className="smartnav-admin-copy-btn"
                  title="Copy Clerk User ID for backend allowlist"
                  aria-label="Copy Clerk User ID"
                >
                  {copied ? (
                    <>
                      <Check size={13} className="text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Real-Time Backend Authorization Status Bar */}
          <div className="smartnav-admin-identity-status">
            {accessStatus === "checking" && (
              <div className="smartnav-admin-status-box smartnav-admin-status-box--checking">
                <RefreshCw size={18} className="animate-spin text-teal-600 shrink-0" />
                <div className="flex-1">
                  <h4>Verifying Administrator Authorization...</h4>
                  <p>{accessMessage}</p>
                </div>
              </div>
            )}

            {accessStatus === "authorized" && (
              <div className="smartnav-admin-status-box smartnav-admin-status-box--authorized">
                <ShieldCheck size={20} className="text-emerald-600 shrink-0" />
                <div className="flex-1">
                  <h4>Server Authorization Verified (HTTP 200)</h4>
                  <p>
                    Your Clerk User ID is present in the server's <code>CLERK_ADMIN_USER_IDS</code> allowlist.
                    You have full administrative privileges to create, edit, and delete campus events.
                  </p>
                  {eventsCount !== null && (
                    <div className="mt-1.5 text-xs font-semibold text-emerald-800">
                      Live Database Status: {eventsCount} campus events currently registered.
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={checkAdminAccess}
                  className="smartnav-admin-refresh-btn"
                  title="Re-verify server authorization"
                >
                  <RefreshCw size={13} />
                  <span>Re-check</span>
                </button>
              </div>
            )}

            {accessStatus === "forbidden" && (
              <div className="smartnav-admin-status-box smartnav-admin-status-box--forbidden">
                <ShieldAlert size={20} className="text-amber-600 shrink-0" />
                <div className="flex-1">
                  <h4>Access Denied — Not on Server Allowlist (HTTP 403)</h4>
                  <p>{accessMessage}</p>
                  <div className="smartnav-admin-resolution-steps">
                    <strong>Granting Administrator Access:</strong>
                    <ol className="list-decimal list-inside mt-1 space-y-1">
                      <li>
                        Copy your Clerk User ID above: <code>{user.id}</code>
                      </li>
                      <li>
                        Open <code>backend/.env</code> on your local server.
                      </li>
                      <li>
                        Add your ID to <code>CLERK_ADMIN_USER_IDS</code> (comma-separated if multiple).
                      </li>
                      <li>Click "Verify Access" below to re-check authorization.</li>
                    </ol>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={checkAdminAccess}
                  className="smartnav-admin-btn-secondary"
                  title="Re-check server authorization"
                >
                  <RefreshCw size={13} />
                  <span>Verify Access</span>
                </button>
              </div>
            )}

            {accessStatus === "unauthorized" && (
              <div className="smartnav-admin-status-box smartnav-admin-status-box--unauthorized">
                <ShieldX size={20} className="text-rose-600 shrink-0" />
                <div className="flex-1">
                  <h4>Authentication Rejected (HTTP 401)</h4>
                  <p>{accessMessage}</p>
                </div>
                <button
                  type="button"
                  onClick={checkAdminAccess}
                  className="smartnav-admin-btn-secondary"
                >
                  <RefreshCw size={13} />
                  <span>Retry</span>
                </button>
              </div>
            )}

            {accessStatus === "error" && (
              <div className="smartnav-admin-status-box smartnav-admin-status-box--error">
                <AlertCircle size={20} className="text-rose-600 shrink-0" />
                <div className="flex-1">
                  <h4>Backend Connection Error</h4>
                  <p>{accessMessage}</p>
                </div>
                <button
                  type="button"
                  onClick={checkAdminAccess}
                  className="smartnav-admin-btn-secondary"
                >
                  <RefreshCw size={13} />
                  <span>Retry Handshake</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Section: Active Management Cards ───────────────────────── */}
        <div className="mt-8">
          <div className="smartnav-admin-section-header">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Management & Campus Systems
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage live campus resources and verify public navigation endpoints.
              </p>
            </div>
          </div>

          <div className="smartnav-admin-cards-grid">
            {/* Card 1: Event Management Dashboard (Core Admin Feature) */}
            <div className="smartnav-admin-mgmt-card smartnav-admin-mgmt-card--primary">
              <div className="smartnav-admin-mgmt-card__header">
                <div className="smartnav-admin-mgmt-card__icon smartnav-admin-mgmt-card__icon--teal">
                  <Calendar size={22} />
                </div>
                <span className="smartnav-admin-mgmt-card__badge smartnav-admin-mgmt-card__badge--teal">
                  Core Management
                </span>
              </div>

              <h3 className="smartnav-admin-mgmt-card__title">
                Campus Event Management
              </h3>
              <p className="smartnav-admin-mgmt-card__desc">
                Create, schedule, edit, and organize campus events. Link events to verified campus buildings and indoor rooms for turn-by-turn navigation.
              </p>

              <div className="smartnav-admin-mgmt-card__meta">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <Sparkles size={14} className="text-teal-600 shrink-0" />
                  <span>
                    {eventsCount !== null
                      ? `${eventsCount} campus events registered`
                      : "Direct DRF MySQL connection"}
                  </span>
                </div>
              </div>

              <div className="smartnav-admin-mgmt-card__actions">
                <Link
                  to="/admin/events"
                  className="smartnav-admin-btn-primary flex-1 justify-center"
                >
                  <Calendar size={15} />
                  <span>Manage Events</span>
                </Link>
                <Link
                  to="/admin/events?action=create"
                  className="smartnav-admin-btn-secondary"
                  title="Create a new event directly"
                >
                  <Plus size={15} />
                  <span>Create</span>
                </Link>
              </div>
            </div>

            {/* Card 2: Interactive Campus Map (Public System) */}
            <div className="smartnav-admin-mgmt-card">
              <div className="smartnav-admin-mgmt-card__header">
                <div className="smartnav-admin-mgmt-card__icon smartnav-admin-mgmt-card__icon--navy">
                  <Compass size={22} />
                </div>
                <span className="smartnav-admin-mgmt-card__badge smartnav-admin-mgmt-card__badge--navy">
                  Public System
                </span>
              </div>

              <h3 className="smartnav-admin-mgmt-card__title">
                Interactive Campus Map
              </h3>
              <p className="smartnav-admin-mgmt-card__desc">
                Explore the live 2D/3D campus map with multi-floor building plans, indoor room directories, and turn-by-turn GPS wayfinding as seen by students and visitors.
              </p>

              <div className="smartnav-admin-mgmt-card__meta">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <MapPin size={14} className="text-teal-600 shrink-0" />
                  <span>Full access without login requirement</span>
                </div>
              </div>

              <div className="smartnav-admin-mgmt-card__actions">
                <Link
                  to="/"
                  className="smartnav-admin-btn-secondary flex-1 justify-center"
                >
                  <Compass size={15} />
                  <span>Open Campus Map</span>
                </Link>
              </div>
            </div>

            {/* Card 3: Public Events Directory (Public View) */}
            <div className="smartnav-admin-mgmt-card">
              <div className="smartnav-admin-mgmt-card__header">
                <div className="smartnav-admin-mgmt-card__icon smartnav-admin-mgmt-card__icon--slate">
                  <ExternalLink size={22} />
                </div>
                <span className="smartnav-admin-mgmt-card__badge smartnav-admin-mgmt-card__badge--slate">
                  Student View
                </span>
              </div>

              <h3 className="smartnav-admin-mgmt-card__title">
                Public Events Directory
              </h3>
              <p className="smartnav-admin-mgmt-card__desc">
                Inspect how published campus events appear to students and visitors, test category filters, and verify saved bookmarks in browser storage.
              </p>

              <div className="smartnav-admin-mgmt-card__meta">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <Calendar size={14} className="text-teal-600 shrink-0" />
                  <span>Real-time sync with database</span>
                </div>
              </div>

              <div className="smartnav-admin-mgmt-card__actions">
                <Link
                  to="/events"
                  className="smartnav-admin-btn-secondary flex-1 justify-center"
                >
                  <ExternalLink size={15} />
                  <span>View Public Calendar</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── Technical Specifications Details ────────────────────────── */}
        <div className="mt-8">
          <div className="smartnav-admin-tech-info">
            <div className="flex items-center justify-between gap-4 mb-3">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                Security & Technical Handshake
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {apiBaseUrl || "http://127.0.0.1:8000"}
              </span>
            </div>
            <div className="smartnav-admin-tech-grid">
              <div>
                <span className="text-slate-500">API Endpoint:</span>
                <span className="font-mono text-slate-700">/api/admin/events/</span>
              </div>
              <div>
                <span className="text-slate-500">Authentication:</span>
                <span className="font-mono text-slate-700">Clerk RS256 Bearer JWT</span>
              </div>
              <div>
                <span className="text-slate-500">Authorization:</span>
                <span className="font-mono text-slate-700">CLERK_ADMIN_USER_IDS Allowlist</span>
              </div>
              <div>
                <span className="text-slate-500">Clock Skew Leeway:</span>
                <span className="font-mono text-slate-700">10 seconds tolerance</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Provides the landing page for campus administration.