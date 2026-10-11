// =========================================================
// SmartNav Voice Guidance Service
// Browser SpeechSynthesis wrapper with mute, repeat, and state management
// =========================================================

let isMutedState = false;
let lastSpokenText = "";

try {
  isMutedState = localStorage.getItem("smartnav_voice_muted") === "true";
} catch {
  isMutedState = false;
}

/**
 * Checks whether voice navigation is currently muted.
 */
export function isVoiceMuted() {
  return isMutedState;
}

/**
 * Sets the voice navigation mute state and persists it to localStorage.
 */
export function setVoiceMuted(muted) {
  isMutedState = Boolean(muted);
  try {
    localStorage.setItem("smartnav_voice_muted", String(isMutedState));
  } catch {
    // Ignore storage errors in private browsing modes
  }

  if (isMutedState) {
    cancelSpeech({ force: true });
  }
}

let isMilestoneActive = false;
let currentUtterance = null;
let speechQueue = [];

function processQueue() {
  if (speechQueue.length > 0) {
    const next = speechQueue.shift();
    if (next && next.text) {
      speak(next.text, next.options);
    }
  }
}

/**
 * Cancels any active speech synthesis output.
 * If a milestone announcement is active and force is false, cancellation is ignored to prevent clipping.
 */
export function cancelSpeech({ force = false } = {}) {
  if (isMilestoneActive && !force) {
    return;
  }
  isMilestoneActive = false;
  currentUtterance = null;
  speechQueue = [];
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Returns the most recently spoken navigation instruction text.
 */
export function getLastSpokenText() {
  return lastSpokenText;
}

/**
 * Repeats the most recent voice instruction.
 */
export function repeatLastInstruction() {
  if (!lastSpokenText) return false;
  // Repeat forces speech even if currently quieted or muted, as a priority announcement
  return speak(lastSpokenText, { force: true, milestone: true });
}

/**
 * Resets voice guidance state and clears the previous instruction cache.
 */
export function resetVoiceGuidance() {
  cancelSpeech({ force: true });
  lastSpokenText = "";
}

/**
 * Speaks the provided text via browser SpeechSynthesis.
 * Automatically halts prior utterances to avoid overlap and respects mute state.
 * Supports priority lifecycle milestones and speech queuing to avoid clipped audio.
 */
export function speak(
  text,
  { force = false, milestone = false, queue = false, rate = 1, pitch = 1 } = {}
) {
  if (!text || typeof text !== "string") return false;
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;

  // Check mute status unless forced by explicit user action
  if (isMutedState && !force) {
    return false;
  }

  const trimmed = text.trim();
  if (!trimmed) return false;

  // If a milestone is currently playing and a non-milestone instruction arrives:
  // Queue the instruction so it plays cleanly after the milestone finishes.
  if (isMilestoneActive && !milestone) {
    speechQueue = [{ text: trimmed, options: { force, rate, pitch } }];
    return true;
  }

  // Prevent speech engine stall
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }

  // If this is a milestone announcement, clear any pending turn queue and interrupt lower-priority audio
  if (milestone) {
    speechQueue = [];
    isMilestoneActive = true;
  }

  // Stop previous non-milestone instruction cleanly
  window.speechSynthesis.cancel();

  lastSpokenText = trimmed;

  const utterance = new SpeechSynthesisUtterance(trimmed);
  utterance.lang = "en-US";
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.volume = 1;

  currentUtterance = utterance;

  const handleEnd = () => {
    currentUtterance = null;
    if (milestone) {
      isMilestoneActive = false;
    }
    processQueue();
  };

  utterance.onend = handleEnd;

  // Defensive error handling for speech synthesis
  utterance.onerror = (e) => {
    currentUtterance = null;
    if (milestone) {
      isMilestoneActive = false;
    }
    if (e.error !== "interrupted" && e.error !== "canceled") {
      console.warn("SpeechSynthesis error:", e.error);
    }
    processQueue();
  };

  try {
    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.error("SpeechSynthesis execution failed:", err);
    currentUtterance = null;
    if (milestone) {
      isMilestoneActive = false;
    }
    return false;
  }
}