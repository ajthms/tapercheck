const speeds = [25, 30, 35, 40, 45, 50, 55];

const state = {
  speed: 35,
};

const speedOptions = document.querySelector("#speed-options");
const resultLabel = document.querySelector("#result-label");
const resultPanel = document.querySelector(".result-panel");
const primaryLength = document.querySelector("#primary-length");
const rangeLength = document.querySelector("#range-length");
const cycleCount = document.querySelector("#cycle-count");
const redFlag = document.querySelector("#red-flag");
const reportText = document.querySelector("#report-text");
const metroEmailButton = document.querySelector("#email-metro");
const kytcEmailButton = document.querySelector("#email-kytc");
const copyButton = document.querySelector("#copy-report");
const copyStatus = document.querySelector("#copy-status");
const siteHeader = document.querySelector(".site-header");

function updateHeaderOffset() {
  const offset = siteHeader.offsetHeight + 12;
  document.documentElement.style.setProperty("--header-offset", `${offset}px`);
}

function taperLength(speed, laneWidth) {
  if (speed <= 40) {
    return Math.round((laneWidth * speed * speed) / 60);
  }

  return Math.round(laneWidth * speed);
}

function cycleRange(minLength, maxLength) {
  const low = Math.max(1, Math.round(minLength / 40));
  const high = Math.max(low, Math.round(maxLength / 40));
  return { low, high };
}

function formatCycleRange(cycles) {
  if (cycles.low === cycles.high) {
    return `${cycles.low} cycles`;
  }

  return `${cycles.low} to ${cycles.high} cycles`;
}

function formatCycleNumberRange(cycles) {
  if (cycles.low === cycles.high) {
    return String(cycles.low);
  }

  return `${cycles.low} to ${cycles.high}`;
}

function buildReportText(speed, maxLength, cycles) {
  const cycleLabel = cycles.high === 1 ? "cycle" : "cycles";

  return `Temporary Traffic Control Safety Concern

Location:
Direction of travel:
Date/time observed:
Posted speed limit: ${speed} mph
Road type if known: local street / state route / unknown
Photos or dashcam video available: yes/no
Company logo visible, if obvious:

I observed a temporary traffic control setup that appears unsafe and may need inspection.

A merge taper at this speed should be about ${maxLength} ft, or roughly ${formatCycleNumberRange(
    cycles,
  )} lane-line ${cycleLabel}. The taper appeared dramatically shorter than that benchmark.

Please have the appropriate inspector, permit authority, or responsible agency review the temporary traffic control setup for safety.`;
}

function createButton(label, isActive, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `option-button${isActive ? " is-active" : ""}`;
  button.textContent = label;
  button.setAttribute("aria-pressed", String(isActive));
  button.addEventListener("click", onClick);
  return button;
}

function scrollToResult() {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  resultPanel.scrollIntoView({
    block: "start",
    behavior: prefersReducedMotion ? "auto" : "smooth",
  });
}

function renderOptions() {
  speedOptions.replaceChildren(
    ...speeds.map((speed) =>
      createButton(`${speed} mph`, speed === state.speed, () => {
        state.speed = speed;
        render();
        requestAnimationFrame(scrollToResult);
      }),
    ),
  );
}

function renderResult() {
  const minLength = taperLength(state.speed, 10);
  const maxLength = taperLength(state.speed, 12);
  const cycles = cycleRange(minLength, maxLength);
  const quickFlag = Math.max(1, Math.round(cycles.high / 2));

  resultLabel.textContent = `${state.speed} mph merge taper`;
  primaryLength.textContent = `About ${maxLength} ft`;
  rangeLength.textContent = `${minLength} to ${maxLength} ft`;
  cycleCount.textContent = formatCycleRange(cycles);
  redFlag.textContent = `If it looks closer to only ${quickFlag} lane-line ${
    quickFlag === 1 ? "cycle" : "cycles"
  }, it may be worth reporting.`;

  reportText.value = buildReportText(state.speed, maxLength, cycles);
  metroEmailButton.href =
    `mailto:metro.311@louisvilleky.gov?subject=${encodeURIComponent(
      "Temporary Traffic Control Safety Concern",
    )}&body=${encodeURIComponent(reportText.value)}`;
  kytcEmailButton.href =
    `mailto:KYTCDistrict5Permits@ky.gov?subject=${encodeURIComponent(
      "Temporary Traffic Control Safety Concern at [location]",
    )}&body=${encodeURIComponent(reportText.value)}`;
}

function render() {
  renderOptions();
  renderResult();
  copyStatus.textContent = "";
}

async function copyReportText() {
  const text = reportText.value.trim();
  let copied = false;

  function copyWithSelection() {
    reportText.focus();
    reportText.select();
    const success = document.execCommand("copy");
    return success;
  }

  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch (error) {
      copied = false;
    }
  }

  if (!copied) {
    copied = copyWithSelection();
  }

  if (copied) {
    copyStatus.textContent = "Report text copied.";
  } else {
    reportText.focus();
    reportText.select();
    copyStatus.textContent = "Report text selected. Use your browser copy command.";
  }
}

copyButton.addEventListener("click", copyReportText);
window.addEventListener("resize", updateHeaderOffset);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch(() => {});
  });
}

updateHeaderOffset();
render();
