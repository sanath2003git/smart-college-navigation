import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useUser, useAuth, SignIn } from "@clerk/react";
import {
  Shield,
  ShieldAlert,
  Calendar,
  Clock,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  FlaskConical,
  Compass,
} from "lucide-react";

import {
  fetchAdminEvents,
  createAdminEvent,
  updateAdminEvent,
  deleteAdminEvent,
  fetchPublicVenues,
  formatDatetimeLocal,
  getValidAdminToken,
} from "../../services/eventService.js";
import { getStatus, formatEventDateTime } from "../../utils/eventTime.js";

const CATEGORIES = [
  "Tech",
  "Cultural",
  "Sports",
  "Workshop",
  "Seminar",
  "Other",
];

const CATEGORY_COLORS = {
  Tech: { bg: "#e0f2fe", text: "#0369a1", border: "#bae6fd" },
  Cultural: { bg: "#fce7f3", text: "#be185d", border: "#fbcfe8" },
  Sports: { bg: "#ffedd5", text: "#c2410c", border: "#fed7aa" },
  Workshop: { bg: "#fef3c7", text: "#b45309", border: "#fde68a" },
  Seminar: { bg: "#ede9fe", text: "#6d28d9", border: "#ddd6fe" },
  Other: { bg: "#f1f5f9", text: "#475569", border: "#e2e8f0" },
};

export default function AdminEventsDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isLoaded: userLoaded, isSignedIn, user } = useUser();
  const { isLoaded: authLoaded, getToken } = useAuth();

  // ── Data State ─────────────────────────────────────────────────────
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 50;

  // ── Filters & Search ───────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [demoFilter, setDemoFilter] = useState("all"); // "all" | "real" | "demo"

  // ── Notification Toast ─────────────────────────────────────────────
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: string }
  const showToast = useCallback((type, message) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  }, []);

  // ── Form Modal State (Create / Edit) ───────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" | "edit"
  const [editingEventId, setEditingEventId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const defaultFormData = {
    title: "",
    category: "Tech",
    venue: "",
    start_time: "",
    end_time: "",
    organizer: "",
    description: "",
    is_demo: false,
  };
  const [formData, setFormData] = useState(defaultFormData);

  // ── Delete Confirmation Modal State ────────────────────────────────
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Clock tick for live status badges ──────────────────────────────
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  // ── Fetch Venues for Form Dropdown ─────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    fetchPublicVenues({ all: true })
      .then((data) => {
        if (isMounted) setVenues(data);
      })
      .catch((err) => {
        console.warn("[AdminEventsDashboard] Failed to fetch venues:", err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // ── Fetch Events from Admin API ────────────────────────────────────
  const loadEvents = useCallback(
    async (pageToLoad = 1) => {
      if (!isSignedIn) return;

      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchAdminEvents({
          getToken,
          page: pageToLoad,
          pageSize,
        });

        setEvents(data.results);
        setTotalCount(data.count);
        setTotalPages(data.totalPages);
        setCurrentPage(data.currentPage);
      } catch (err) {
        console.error("[AdminEventsDashboard] Load error:", err);
        setError({
          status: err.status || 500,
          message:
            err.message ||
            "Unable to load events from the server. Please check your connection.",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [isSignedIn, getToken, pageSize]
  );

  // Initial load when auth is ready
  useEffect(() => {
    if (userLoaded && authLoaded && isSignedIn) {
      loadEvents(1);
    }
  }, [userLoaded, authLoaded, isSignedIn, loadEvents]);

  // Support ?action=create query param from Landing Page
  useEffect(() => {
    if (searchParams.get("action") === "create" && !isModalOpen) {
      handleOpenCreateModal();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, isModalOpen]);

  // ── Filtered & Searched Events ─────────────────────────────────────
  const displayedEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return events.filter((evt) => {
      // Demo Filter
      if (demoFilter === "real" && evt.isDemo) return false;
      if (demoFilter === "demo" && !evt.isDemo) return false;

      // Category filter
      if (selectedCategory !== "All" && evt.category !== selectedCategory) {
        return false;
      }

      // Search query
      if (q) {
        const titleMatch = evt.title?.toLowerCase().includes(q);
        const organizerMatch = evt.organizer?.toLowerCase().includes(q);
        const descMatch = evt.description?.toLowerCase().includes(q);
        const venueNameMatch = evt.venue?.name?.toLowerCase().includes(q);
        const venueIdMatch = evt.venueId?.toLowerCase().includes(q);

        if (
          !titleMatch &&
          !organizerMatch &&
          !descMatch &&
          !venueNameMatch &&
          !venueIdMatch
        ) {
          return false;
        }
      }

      return true;
    });
  }, [events, searchQuery, selectedCategory, demoFilter]);

  // ── Modal Actions ──────────────────────────────────────────────────
  function handleOpenCreateModal() {
    setModalMode("create");
    setEditingEventId(null);
    setFormData(defaultFormData);
    setFormErrors({});
    setIsModalOpen(true);
  }

  const handleOpenEditModal = (evt) => {
    setModalMode("edit");
    setEditingEventId(evt.id);
    setFormErrors({});
    setFormData({
      title: evt.title || "",
      category: evt.category || "Tech",
      venue: evt.venueId || evt.venue?.id || "",
      start_time: formatDatetimeLocal(evt.start),
      end_time: formatDatetimeLocal(evt.end),
      organizer: evt.organizer || "",
      description: evt.description || "",
      is_demo: Boolean(evt.isDemo),
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (!isSubmitting) {
      setIsModalOpen(false);
      setFormErrors({});
    }
  };

  // ── Form Validation & Submission ───────────────────────────────────
  const validateForm = () => {
    const errors = {};

    if (!formData.title?.trim()) {
      errors.title = "Event title is required.";
    } else if (formData.title.trim().length > 200) {
      errors.title = "Event title cannot exceed 200 characters.";
    }

    if (!formData.category) {
      errors.category = "Category is required.";
    }

    if (!formData.venue) {
      errors.venue = "Please select a campus venue.";
    }

    if (!formData.start_time) {
      errors.start_time = "Start date and time is required.";
    }

    if (!formData.end_time) {
      errors.end_time = "End date and time is required.";
    }

    if (formData.start_time && formData.end_time) {
      const startMs = new Date(formData.start_time).getTime();
      const endMs = new Date(formData.end_time).getTime();

      if (isNaN(startMs)) {
        errors.start_time = "Invalid start datetime format.";
      }
      if (isNaN(endMs)) {
        errors.end_time = "Invalid end datetime format.";
      }
      if (!isNaN(startMs) && !isNaN(endMs) && startMs >= endMs) {
        errors.end_time = "Event end time must be after start time.";
      }
    }

    if (!formData.organizer?.trim()) {
      errors.organizer = "Organizer name or department is required.";
    } else if (formData.organizer.trim().length > 150) {
      errors.organizer = "Organizer cannot exceed 150 characters.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});

    try {
      if (modalMode === "create") {
        await createAdminEvent({ getToken, eventData: formData });
        showToast("success", `Event "${formData.title}" created successfully.`);
      } else {
        await updateAdminEvent({
          getToken,
          id: editingEventId,
          eventData: formData,
        });
        showToast("success", `Event "${formData.title}" updated successfully.`);
      }

      setIsModalOpen(false);
      await loadEvents(currentPage);
    } catch (err) {
      console.error("[AdminEventsDashboard] Save error:", err);
      if (err.fieldErrors) {
        setFormErrors(err.fieldErrors);
      }
      showToast("error", err.message || "Failed to save event.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Delete Confirmation Actions ────────────────────────────────────
  const handleOpenDeleteModal = (evt) => {
    setEventToDelete(evt);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    if (!isDeleting) {
      setIsDeleteModalOpen(false);
      setEventToDelete(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;

    setIsDeleting(true);

    try {
      await deleteAdminEvent({ getToken, id: eventToDelete.id });
      showToast(
        "success",
        `Event "${eventToDelete.title}" has been deleted.`
      );
      setIsDeleteModalOpen(false);
      setEventToDelete(null);
      await loadEvents(currentPage);
    } catch (err) {
      console.error("[AdminEventsDashboard] Delete error:", err);
      showToast("error", err.message || "Failed to delete event.");
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Unauthenticated / Loading Guards ───────────────────────────────
  if (!userLoaded || !authLoaded) {
    return (
      <div className="smartnav-admin-page smartnav-admin-page--loading">
        <div className="smartnav-admin-loading-box">
          <RefreshCw size={28} className="animate-spin text-teal-600" />
          <p>Initializing Clerk session...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="smartnav-admin-page">
        <div className="smartnav-admin-container smartnav-admin-container--auth">
          <div className="smartnav-admin-auth-card">
            <div className="smartnav-admin-auth-header">
              <div className="smartnav-admin-shield-icon">
                <Shield size={32} />
              </div>
              <h2>Administrator Sign In Required</h2>
              <p>
                Sign in with your verified campus administrator account to
                access the SmartNav Event Management Dashboard.
              </p>
            </div>
            <div className="smartnav-clerk-signin-wrapper">
              <SignIn routing="hash" />
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

  // ── Main Dashboard Layout ──────────────────────────────────────────
  return (
    <div className="smartnav-admin-page">
      <div className="smartnav-admin-container">
        {/* Floating Toast Notification */}
        {toast && (
          <div
            className={`smartnav-admin-toast smartnav-admin-toast--${toast.type}`}
            role="status"
          >
            {toast.type === "success" ? (
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={18} className="text-rose-600 shrink-0" />
            )}
            <span className="flex-1">{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="smartnav-admin-toast-close"
              aria-label="Dismiss toast"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Top Breadcrumbs & Quick Links */}
        <div className="smartnav-admin-topbar">
          <div className="smartnav-admin-breadcrumb">
            <Link to="/" className="hover:underline">
              SmartNav
            </Link>
            <span>/</span>
            <Link to="/admin" className="hover:underline">
              Admin Portal
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold">
              Event Management
            </span>
          </div>

          <div className="smartnav-admin-topbar-actions">
            <Link to="/admin" className="smartnav-admin-action-link">
              <Shield size={14} />
              <span>Admin Portal</span>
            </Link>
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

        {/* Header Banner */}
        <div className="smartnav-admin-header-banner">
          <div>
            <h1 className="smartnav-admin-title">
              <Calendar size={26} className="text-teal-600 inline-block mr-2 shrink-0" />
              Event Management Dashboard
            </h1>
            <p className="smartnav-admin-subtitle">
              Create, update, and manage campus events with real-time venue wayfinding.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => loadEvents(currentPage)}
              disabled={isLoading}
              className="smartnav-admin-btn-secondary"
              title="Refresh events list from database"
            >
              <RefreshCw
                size={14}
                className={isLoading ? "animate-spin text-teal-600" : ""}
              />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="smartnav-admin-btn-primary"
            >
              <Plus size={16} />
              <span>Create Event</span>
            </button>
          </div>
        </div>

        {/* Authorization Error Notice (HTTP 403) */}
        {error && error.status === 403 && (
          <div className="smartnav-admin-status-box smartnav-admin-status-box--forbidden mb-6">
            <ShieldAlert size={24} className="text-amber-600 shrink-0" />
            <div className="flex-1">
              <h4>Access Denied — Not on Server Allowlist (HTTP 403)</h4>
              <p>{error.message}</p>
              <div className="smartnav-admin-resolution-steps">
                <strong>How to grant administrator access:</strong>
                <ol className="list-decimal list-inside mt-1 space-y-1">
                  <li>
                    Your Clerk User ID: <code>{user.id}</code>
                  </li>
                  <li>
                    Add your ID to <code>CLERK_ADMIN_USER_IDS</code> in <code>backend/.env</code>.
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => loadEvents(1)}
                      className="text-teal-700 font-semibold underline ml-1 cursor-pointer"
                    >
                      Click here to retry
                    </button>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Generic Server Error Notice */}
        {error && error.status !== 403 && (
          <div className="smartnav-admin-status-box smartnav-admin-status-box--error mb-6">
            <AlertCircle size={22} className="text-rose-600 shrink-0" />
            <div className="flex-1">
              <h4>Failed to Connect to Admin Events API</h4>
              <p>{error.message}</p>
              <button
                type="button"
                onClick={() => loadEvents(currentPage)}
                className="mt-2 text-xs font-semibold text-rose-800 underline inline-flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw size={12} />
                <span>Retry Request</span>
              </button>
            </div>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="smartnav-admin-filter-bar">
          {/* Search Box */}
          <div className="smartnav-admin-search-wrapper">
            <Search size={15} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search events by title, organizer, or venue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="smartnav-admin-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="smartnav-admin-filter-group">
            <Filter size={14} className="text-slate-400 shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="smartnav-admin-select"
              aria-label="Filter events by category"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Event Type / Demo Filter */}
          <div className="smartnav-admin-filter-group">
            <FlaskConical size={14} className="text-slate-400 shrink-0" />
            <select
              value={demoFilter}
              onChange={(e) => setDemoFilter(e.target.value)}
              className="smartnav-admin-select"
              aria-label="Filter events by demo status"
            >
              <option value="all">All Events</option>
              <option value="real">Real Events Only</option>
              <option value="demo">Demo / Seed Only</option>
            </select>
          </div>

          <div className="smartnav-admin-count-pill">
            <span>
              Showing {displayedEvents.length} of {totalCount} events
            </span>
            {(searchQuery || selectedCategory !== "All" || demoFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                  setDemoFilter("all");
                }}
                className="ml-2 text-xs text-teal-700 hover:underline cursor-pointer font-semibold"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Events Table / Card Container */}
        <div className="smartnav-admin-table-card">
          {isLoading ? (
            <div className="smartnav-admin-table-loading">
              <RefreshCw size={26} className="animate-spin text-teal-600" />
              <p>Loading campus events from server...</p>
            </div>
          ) : displayedEvents.length === 0 ? (
            <div className="smartnav-admin-empty-state">
              <Calendar size={48} className="text-slate-300 mb-3" />
              <h3>No Events Found</h3>
              <p className="text-slate-500 text-sm max-w-sm mb-4">
                {searchQuery || selectedCategory !== "All" || demoFilter !== "all"
                  ? "No campus events matched your current search and filter criteria."
                  : "No events are currently scheduled in the campus database. Create your first event to get started."}
              </p>
              {searchQuery || selectedCategory !== "All" || demoFilter !== "all" ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All");
                    setDemoFilter("all");
                  }}
                  className="smartnav-admin-btn-secondary"
                >
                  Clear Filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="smartnav-admin-btn-primary"
                >
                  <Plus size={15} />
                  <span>Create First Event</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Data Table */}
              <div className="smartnav-admin-table-wrapper">
                <table className="smartnav-admin-table">
                  <thead>
                    <tr>
                      <th>Event Details</th>
                      <th>Category</th>
                      <th>Campus Venue</th>
                      <th>Date & Time</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedEvents.map((evt) => {
                      const status = getStatus(evt, now);
                      const timeStr = formatEventDateTime(
                        evt.start,
                        evt.end,
                        now
                      );
                      const catStyle =
                        CATEGORY_COLORS[evt.category] || CATEGORY_COLORS.Other;
                      const venueName =
                        evt.venue?.name || evt.venueId || "Unassigned Venue";
                      const buildingText = evt.venue?.building
                        ? `${evt.venue.building}${
                            evt.venue.roomNo ? ` (${evt.venue.roomNo})` : ""
                          }`
                        : null;

                      return (
                        <tr key={evt.id}>
                          {/* Title & Organizer */}
                          <td>
                            <div className="smartnav-admin-cell-title">
                              <span className="font-semibold text-slate-900">
                                {evt.title}
                              </span>
                              {evt.isDemo && (
                                <span
                                  className="smartnav-admin-demo-badge"
                                  title="Test demonstration event"
                                >
                                  Demo
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              By {evt.organizer}
                            </div>
                          </td>

                          {/* Category */}
                          <td>
                            <span
                              className="smartnav-admin-cat-pill"
                              style={{
                                backgroundColor: catStyle.bg,
                                color: catStyle.text,
                                borderColor: catStyle.border,
                              }}
                            >
                              {evt.category}
                            </span>
                          </td>

                          {/* Venue */}
                          <td>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-800">
                              <MapPin size={13} className="text-teal-600 shrink-0" />
                              <span className="truncate max-w-xs">{venueName}</span>
                            </div>
                            {buildingText && (
                              <div className="text-xs text-slate-500 pl-4.5">
                                {buildingText}
                              </div>
                            )}
                          </td>

                          {/* Date & Time */}
                          <td>
                            <div className="flex items-center gap-1.5 text-xs text-slate-700">
                              <Clock size={13} className="text-slate-400 shrink-0" />
                              <span>{timeStr}</span>
                            </div>
                          </td>

                          {/* Dynamic Status */}
                          <td>
                            <div
                              className={`smartnav-event-status-pill smartnav-event-status-pill--${status}`}
                            >
                              {status === "live" && (
                                <span
                                  className="smartnav-event-status-dot"
                                  aria-hidden="true"
                                />
                              )}
                              <span>
                                {status === "live"
                                  ? "Live Now"
                                  : status === "today"
                                  ? "Today"
                                  : status === "upcoming"
                                  ? "Upcoming"
                                  : "Ended"}
                              </span>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="text-right">
                            <div className="smartnav-admin-actions-cell">
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(evt)}
                                className="smartnav-admin-edit-btn"
                                title="Edit event"
                                aria-label={`Edit ${evt.title}`}
                              >
                                <Pencil size={13} />
                                <span>Edit</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenDeleteModal(evt)}
                                className="smartnav-admin-delete-btn"
                                title="Delete event"
                                aria-label={`Delete ${evt.title}`}
                              >
                                <Trash2 size={13} />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View (renders on screens < 768px) */}
              <div className="smartnav-admin-mobile-cards">
                {displayedEvents.map((evt) => {
                  const status = getStatus(evt, now);
                  const timeStr = formatEventDateTime(evt.start, evt.end, now);
                  const catStyle =
                    CATEGORY_COLORS[evt.category] || CATEGORY_COLORS.Other;
                  const venueName =
                    evt.venue?.name || evt.venueId || "Unassigned Venue";

                  return (
                    <div key={evt.id} className="smartnav-admin-mobile-card">
                      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="smartnav-admin-cat-pill text-xs"
                            style={{
                              backgroundColor: catStyle.bg,
                              color: catStyle.text,
                              borderColor: catStyle.border,
                            }}
                          >
                            {evt.category}
                          </span>
                          {evt.isDemo && (
                            <span className="smartnav-admin-demo-badge text-xs">
                              Demo
                            </span>
                          )}
                        </div>

                        <div
                          className={`smartnav-event-status-pill smartnav-event-status-pill--${status}`}
                        >
                          {status === "live" && (
                            <span
                              className="smartnav-event-status-dot"
                              aria-hidden="true"
                            />
                          )}
                          <span>
                            {status === "live"
                              ? "Live Now"
                              : status === "today"
                              ? "Today"
                              : status === "upcoming"
                              ? "Upcoming"
                              : "Ended"}
                          </span>
                        </div>
                      </div>

                      <h4 className="font-semibold text-slate-900 text-sm mb-1">
                        {evt.title}
                      </h4>
                      <p className="text-xs text-slate-500 mb-3">
                        By {evt.organizer}
                      </p>

                      <div className="space-y-1.5 text-xs text-slate-700 mb-3.5">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={13} className="text-teal-600 shrink-0" />
                          <span className="truncate">{venueName}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} className="text-slate-400 shrink-0" />
                          <span>{timeStr}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(evt)}
                          className="smartnav-admin-edit-btn flex-1 justify-center py-2"
                        >
                          <Pencil size={13} />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDeleteModal(evt)}
                          className="smartnav-admin-delete-btn flex-1 justify-center py-2"
                        >
                          <Trash2 size={13} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="smartnav-admin-pagination">
                  <button
                    type="button"
                    onClick={() => loadEvents(currentPage - 1)}
                    disabled={currentPage <= 1 || isLoading}
                    className="smartnav-admin-page-btn"
                  >
                    <ChevronLeft size={16} />
                    <span>Previous</span>
                  </button>

                  <span className="text-xs text-slate-600">
                    Page <strong>{currentPage}</strong> of{" "}
                    <strong>{totalPages}</strong>
                  </span>

                  <button
                    type="button"
                    onClick={() => loadEvents(currentPage + 1)}
                    disabled={currentPage >= totalPages || isLoading}
                    className="smartnav-admin-page-btn"
                  >
                    <span>Next</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── CREATE / EDIT EVENT MODAL ─────────────────────────────────── */}
      {isModalOpen && (
        <div
          className="smartnav-admin-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="smartnav-admin-modal-card">
            {/* Modal Header */}
            <div className="smartnav-admin-modal-header">
              <div className="flex items-center gap-2.5">
                <div className="smartnav-admin-modal-icon">
                  {modalMode === "create" ? (
                    <Plus size={20} className="text-teal-600" />
                  ) : (
                    <Pencil size={18} className="text-teal-600" />
                  )}
                </div>
                <div>
                  <h3 id="modal-title" className="text-base font-bold text-slate-900">
                    {modalMode === "create" ? "Create New Campus Event" : "Edit Campus Event"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {modalMode === "create"
                      ? "Publish a new event to the campus schedule with venue navigation."
                      : `Update details for event: ${formData.title}`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="smartnav-admin-modal-close"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form with anchored footer */}
            <form onSubmit={handleSubmitForm} className="smartnav-admin-modal-form">
              <div className="smartnav-admin-modal-body">
                {/* Event Title */}
                <div className="smartnav-admin-field">
                  <label htmlFor="evt-title">
                    Event Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="evt-title"
                    type="text"
                    required
                    maxLength={200}
                    placeholder="e.g. Annual Tech Symposium & Hackathon"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className={`smartnav-admin-input ${
                      formErrors.title ? "smartnav-admin-input--error" : ""
                    }`}
                  />
                  {formErrors.title && (
                    <p className="smartnav-admin-field-error">
                      {Array.isArray(formErrors.title)
                        ? formErrors.title[0]
                        : formErrors.title}
                    </p>
                  )}
                </div>

                {/* Category & Venue Two-Column */}
                <div className="smartnav-admin-grid-2">
                  {/* Category */}
                  <div className="smartnav-admin-field">
                    <label htmlFor="evt-category">
                      Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="evt-category"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="smartnav-admin-input"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Venue Dropdown */}
                  <div className="smartnav-admin-field">
                    <label htmlFor="evt-venue">
                      Campus Venue <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="evt-venue"
                      required
                      value={formData.venue}
                      onChange={(e) =>
                        setFormData({ ...formData, venue: e.target.value })
                      }
                      className={`smartnav-admin-input ${
                        formErrors.venue ? "smartnav-admin-input--error" : ""
                      }`}
                    >
                      <option value="" disabled>
                        Select campus venue...
                      </option>
                      {venues.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} {v.building ? `(${v.building})` : ""}
                        </option>
                      ))}
                    </select>
                    {formErrors.venue && (
                      <p className="smartnav-admin-field-error">
                        {Array.isArray(formErrors.venue)
                          ? formErrors.venue[0]
                          : formErrors.venue}
                      </p>
                    )}
                  </div>
                </div>

                {/* Start & End Datetimes */}
                <div className="smartnav-admin-grid-2">
                  {/* Start Time */}
                  <div className="smartnav-admin-field">
                    <label htmlFor="evt-start">
                      Start Date & Time <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="evt-start"
                      type="datetime-local"
                      required
                      value={formData.start_time}
                      onChange={(e) =>
                        setFormData({ ...formData, start_time: e.target.value })
                      }
                      className={`smartnav-admin-input ${
                        formErrors.start_time ? "smartnav-admin-input--error" : ""
                      }`}
                    />
                    {formErrors.start_time && (
                      <p className="smartnav-admin-field-error">
                        {Array.isArray(formErrors.start_time)
                          ? formErrors.start_time[0]
                          : formErrors.start_time}
                      </p>
                    )}
                  </div>

                  {/* End Time */}
                  <div className="smartnav-admin-field">
                    <label htmlFor="evt-end">
                      End Date & Time <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="evt-end"
                      type="datetime-local"
                      required
                      value={formData.end_time}
                      onChange={(e) =>
                        setFormData({ ...formData, end_time: e.target.value })
                      }
                      className={`smartnav-admin-input ${
                        formErrors.end_time ? "smartnav-admin-input--error" : ""
                      }`}
                    />
                    {formErrors.end_time && (
                      <p className="smartnav-admin-field-error">
                        {Array.isArray(formErrors.end_time)
                          ? formErrors.end_time[0]
                          : formErrors.end_time}
                      </p>
                    )}
                  </div>
                </div>

                {/* Organizer */}
                <div className="smartnav-admin-field">
                  <label htmlFor="evt-organizer">
                    Organizer / Host <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="evt-organizer"
                    type="text"
                    required
                    maxLength={150}
                    placeholder="e.g. IEEE Student Branch or Dept of Mechanical Engineering"
                    value={formData.organizer}
                    onChange={(e) =>
                      setFormData({ ...formData, organizer: e.target.value })
                    }
                    className={`smartnav-admin-input ${
                      formErrors.organizer ? "smartnav-admin-input--error" : ""
                    }`}
                  />
                  {formErrors.organizer && (
                    <p className="smartnav-admin-field-error">
                      {Array.isArray(formErrors.organizer)
                        ? formErrors.organizer[0]
                        : formErrors.organizer}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="smartnav-admin-field">
                  <label htmlFor="evt-desc">
                    Event Description{" "}
                    <span className="text-xs text-slate-400 font-normal">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    id="evt-desc"
                    rows={3}
                    placeholder="Provide instructions, registration requirements, or agenda..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="smartnav-admin-textarea"
                  />
                </div>

                {/* Is Demo Event Checkbox */}
                <div className="smartnav-admin-checkbox-row">
                  <input
                    id="evt-is-demo"
                    type="checkbox"
                    checked={formData.is_demo}
                    onChange={(e) =>
                      setFormData({ ...formData, is_demo: e.target.checked })
                    }
                    className="smartnav-admin-checkbox"
                  />
                  <label htmlFor="evt-is-demo" className="text-xs text-slate-700 cursor-pointer">
                    <strong>Tag as Demonstration Event:</strong> Marks this event with a visible Demo badge to distinguish test data from real campus events.
                  </label>
                </div>
              </div>

              {/* Anchored Modal Footer Actions */}
              <div className="smartnav-admin-modal-footer">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="smartnav-admin-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="smartnav-admin-btn-primary"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : modalMode === "create" ? (
                    <>
                      <Plus size={15} />
                      <span>Create Event</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION DIALOG ────────────────────────────────── */}
      {isDeleteModalOpen && eventToDelete && (
        <div
          className="smartnav-admin-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseDeleteModal();
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div className="smartnav-admin-modal-card smartnav-admin-modal-card--sm">
            <div className="smartnav-admin-modal-header border-b-0 pb-0">
              <div className="smartnav-admin-delete-warning-icon">
                <Trash2 size={24} className="text-rose-600" />
              </div>
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                disabled={isDeleting}
                className="smartnav-admin-modal-close"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 pt-2 text-center">
              <h3
                id="delete-dialog-title"
                className="text-base font-bold text-slate-900 mb-2"
              >
                Delete Campus Event?
              </h3>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Are you sure you want to delete{" "}
                <strong className="text-slate-900">"{eventToDelete.title}"</strong>?
                This action will remove the event from campus navigation and the
                public schedule. This action cannot be undone.
              </p>

              <div className="smartnav-admin-delete-meta-box">
                <div>
                  <span className="text-slate-500">Venue:</span>{" "}
                  <strong>{eventToDelete.venue?.name || eventToDelete.venueId}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Date:</span>{" "}
                  <span>
                    {formatEventDateTime(eventToDelete.start, eventToDelete.end, now)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Organizer:</span>{" "}
                  <span>{eventToDelete.organizer}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleCloseDeleteModal}
                  disabled={isDeleting}
                  className="smartnav-admin-btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="smartnav-admin-btn-danger flex-1"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      <span>Confirm Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// Small review-only change: keep this component within the approved campus project work.
