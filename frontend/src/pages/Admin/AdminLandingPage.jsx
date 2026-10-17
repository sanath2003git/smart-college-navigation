import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  useUser,
  useAuth,
  SignIn,
  SignOutButton,
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
} from "lucide-react";

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
      const token = await getToken();

      if (!token) {
        setAccessStatus("unauthorized");
        setAccessMessage("Unable to retrieve session bearer token from Clerk.");
        return;
      }

      const res = await fetch(`${baseUrl}/api/admin/events/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

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
        setAccessStatus("unauthorized");
        setAccessMessage(
          "Authentication Rejected (HTTP 401): The Django server rejected the session token (signature, issuer, or expiration mismatch)."
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
          {/* Header Card */}
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

            {/* Clerk Sign-In Component */}
            <div className="smartnav-clerk-signin-wrapper">
              <SignIn routing="hash" />
            </div>

            {/* Student & Public Notice */}
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
        {/* Top Breadcrumb & Page Title */}
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
              <Calendar size={15} />
              <span>Public Events</span>
            </Link>
            <Link to="/" className="smartnav-admin-action-link">
              <MapPin size={15} />
              <span>Campus Map</span>
            </Link>
          </div>
        </div>

        <div className="smartnav-admin-header-banner">
          <div>
            <h1 className="smartnav-admin-title">
              <ShieldCheck size={28} className="text-teal-600 inline-block mr-2" />
              SmartNav Admin Landing
            </h1>
            <p className="smartnav-admin-subtitle">
              Verified Clerk Identity & Server Authorization Status
            </p>
          </div>

          <div className="smartnav-admin-user-profile-widget">
            <UserButton afterSignOutUrl="/admin" />
          </div>
        </div>

        {/* Two-Column Grid: User Identity Card & Server Access Status Card */}
        <div className="smartnav-admin-grid">
          {/* Card 1: Signed-in User Information */}
          <div className="smartnav-admin-card">
            <div className="smartnav-admin-card-header">
              <div className="smartnav-admin-card-title">
                <User size={19} className="text-teal-600" />
                <h3>Clerk Account Information</h3>
              </div>
              <span className="smartnav-admin-chip smartnav-admin-chip--signed-in">
                Signed In
              </span>
            </div>

            <div className="smartnav-admin-card-body">
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
                <div>
                  <h4 className="smartnav-admin-user-name">
                    {user.fullName || "Campus Administrator"}
                  </h4>
                  <p className="smartnav-admin-user-email">
                    {user.primaryEmailAddress?.emailAddress || "No email on file"}
                  </p>
                </div>
              </div>

              <div className="smartnav-admin-detail-rows">
                <div className="smartnav-admin-detail-row">
                  <span className="smartnav-admin-detail-label">Clerk User ID</span>
                  <div className="smartnav-admin-copyable-id">
                    <code>{user.id}</code>
                    <button
                      type="button"
                      onClick={handleCopyUserId}
                      className="smartnav-admin-copy-btn"
                      title="Copy Clerk User ID for backend allowlist"
                    >
                      {copied ? (
                        <>
                          <Check size={14} className="text-emerald-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>Copy ID</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="smartnav-admin-detail-row">
                  <span className="smartnav-admin-detail-label">Session ID</span>
                  <code className="text-xs text-slate-500 truncate max-w-xs">
                    {user.lastSignInAt
                      ? new Date(user.lastSignInAt).toLocaleString()
                      : "Active"}
                  </code>
                </div>

                <div className="smartnav-admin-detail-row">
                  <span className="smartnav-admin-detail-label">Account Created</span>
                  <span className="text-xs text-slate-600">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "Verified"}
                  </span>
                </div>
              </div>

              <div className="smartnav-admin-card-footer">
                <SignOutButton>
                  <button type="button" className="smartnav-admin-signout-btn">
                    Sign Out of Clerk
                  </button>
                </SignOutButton>
              </div>
            </div>
          </div>

          {/* Card 2: Server-Side Authorization Status */}
          <div className="smartnav-admin-card">
            <div className="smartnav-admin-card-header">
              <div className="smartnav-admin-card-title">
                <Lock size={19} className="text-teal-600" />
                <h3>Backend Authorization Check</h3>
              </div>
              <button
                type="button"
                onClick={checkAdminAccess}
                disabled={accessStatus === "checking"}
                className="smartnav-admin-refresh-btn"
                title="Re-verify access with Django backend"
              >
                <RefreshCw
                  size={14}
                  className={accessStatus === "checking" ? "animate-spin" : ""}
                />
                <span>Verify Access</span>
              </button>
            </div>

            <div className="smartnav-admin-card-body">
              {/* Status Badge & Alert */}
              {accessStatus === "checking" && (
                <div className="smartnav-admin-status-box smartnav-admin-status-box--checking">
                  <RefreshCw size={20} className="animate-spin text-teal-600" />
                  <div>
                    <h4>Verifying Administrator Status...</h4>
                    <p>{accessMessage}</p>
                  </div>
                </div>
              )}

              {accessStatus === "authorized" && (
                <div className="smartnav-admin-status-box smartnav-admin-status-box--authorized">
                  <ShieldCheck size={22} className="text-emerald-600 flex-shrink-0" />
                  <div>
                    <h4>Authorized Administrator (HTTP 200)</h4>
                    <p>{accessMessage}</p>
                    {eventsCount !== null && (
                      <div className="mt-2 text-xs font-semibold text-emerald-800">
                        Admin API Handshake Verified: {eventsCount} campus events
                        accessible.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {accessStatus === "forbidden" && (
                <div className="smartnav-admin-status-box smartnav-admin-status-box--forbidden">
                  <ShieldAlert size={22} className="text-amber-600 flex-shrink-0" />
                  <div>
                    <h4>Access Denied — Not on Server Allowlist (HTTP 403)</h4>
                    <p>{accessMessage}</p>
                    <div className="smartnav-admin-resolution-steps">
                      <strong>How to grant administrator access:</strong>
                      <ol className="list-decimal list-inside mt-1 space-y-1">
                        <li>
                          Copy your Clerk User ID above: <code>{user.id}</code>
                        </li>
                        <li>
                          Open <code>backend/.env</code> on your server.
                        </li>
                        <li>
                          Add your ID to <code>CLERK_ADMIN_USER_IDS</code> (comma-separated if multiple).
                        </li>
                        <li>Click "Verify Access" above to re-check.</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}

              {accessStatus === "unauthorized" && (
                <div className="smartnav-admin-status-box smartnav-admin-status-box--unauthorized">
                  <ShieldX size={22} className="text-red-600 flex-shrink-0" />
                  <div>
                    <h4>Authentication Rejected (HTTP 401)</h4>
                    <p>{accessMessage}</p>
                  </div>
                </div>
              )}

              {accessStatus === "error" && (
                <div className="smartnav-admin-status-box smartnav-admin-status-box--error">
                  <AlertCircle size={22} className="text-rose-600 flex-shrink-0" />
                  <div>
                    <h4>Backend Connection Error</h4>
                    <p>{accessMessage}</p>
                  </div>
                </div>
              )}

              {/* Technical Inspection Details */}
              <div className="smartnav-admin-tech-info">
                <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">
                  Technical Handshake Details
                </p>
                <div className="smartnav-admin-tech-grid">
                  <div>
                    <span className="text-slate-500">API Endpoint:</span>
                    <span className="font-mono text-slate-700">/api/admin/events/</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Target Host:</span>
                    <span className="font-mono text-slate-700">
                      {apiBaseUrl || "http://127.0.0.1:8000"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Authentication:</span>
                    <span className="font-mono text-slate-700">Clerk RS256 Bearer JWT</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Authorization:</span>
                    <span className="font-mono text-slate-700">CLERK_ADMIN_USER_IDS</span>
                  </div>
                </div>
              </div>

              {/* Roadmap info */}
              <div className="smartnav-admin-roadmap-note">
                <p>
                  <strong>Phase 3A Status:</strong> Admin sign-in, Clerk session
                  token extraction, and backend handshake verification are live.
                  Event creation, venue editing, and full CRUD dashboard will be
                  mounted in Phase 3B.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
