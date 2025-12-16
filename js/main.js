(() => {
  const nav = document.getElementById("site-nav");
  const toggle = document.querySelector(".nav-toggle");
  const year = document.getElementById("year");

  // Footer year
  if (year) year.textContent = String(new Date().getFullYear());

  // Mobile nav
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    // Close menu on link click (mobile)
    nav.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });

    // Close menu on outside click
    document.addEventListener("click", (e) => {
      const target = e.target;
      const clickedInside = nav.contains(target) || toggle.contains(target);
      if (!clickedInside) {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // =======================================================
  // Report form (report.html)
  // - If /api/report exists, we POST JSON for automatic sending.
  // - If not, we fall back to a mailto: link (opens user's email app).
  // =======================================================
  const reportForm = document.getElementById("report-form");
  const reportStatus = document.getElementById("report-status");
  const reportSubmit = document.getElementById("report-submit");
  const reportCopy = document.getElementById("report-copy");

  const REPORT_TO = "peelapp09@gmail.com";
  const DEFAULT_API_URL = "/api/report";

  const setStatus = (type, message) => {
    if (!reportStatus) return;
    reportStatus.hidden = false;
    reportStatus.classList.remove("success", "error");
    reportStatus.classList.add(type);
    reportStatus.textContent = message;
  };

  const buildReportText = (data) => {
    const lines = [
      "PEEL Report",
      "----------",
      `Reporter email: ${data.reporterEmail || ""}`,
      `Type: ${data.issueType || ""}`,
      `Subject: ${data.subject || ""}`,
      `Reported user: ${data.reportedUser || ""}`,
      `Match/Chat ID: ${data.contextId || ""}`,
      "",
      "Details:",
      data.message || "",
      "",
      `Submitted at: ${new Date().toISOString()}`
    ];
    return lines.join("
");
  };

  const openMailtoFallback = (data) => {
    const subject = `PEEL Report — ${data.subject || data.issueType || "New report"}`;
    const body = buildReportText(data);

    const mailto = `mailto:${encodeURIComponent(REPORT_TO)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  };

  if (reportCopy) {
    reportCopy.addEventListener("click", async () => {
      if (!reportForm) return;
      const data = Object.fromEntries(new FormData(reportForm).entries());
      const text = buildReportText(data);

      try {
        await navigator.clipboard.writeText(text);
        setStatus("success", "Copied. You can paste it into an email or message.");
      } catch {
        setStatus("error", "Could not copy automatically. Select the text and copy manually.");
      }
    });
  }

  if (reportForm) {
    reportForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const data = Object.fromEntries(new FormData(reportForm).entries());

      // Basic required checks (native required + a quick extra check for checkbox)
      if (!data.reporterEmail || !data.issueType || !data.subject || !data.message || !reportForm.querySelector("#consent")?.checked) {
        setStatus("error", "Please fill the required fields and check the consent box.");
        return;
      }

      // Try API first (if your backend supports it)
      const apiUrl = window.REPORT_API_URL || DEFAULT_API_URL;

      if (reportSubmit) reportSubmit.setAttribute("aria-busy", "true");
      setStatus("success", "Sending…");

      try {
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            page: window.location.href,
            userAgent: navigator.userAgent
          })
        });

        if (res.ok) {
          setStatus("success", "Report sent. Thank you.");
          reportForm.reset();
        } else {
          // No API? fall back to mailto
          setStatus("error", "Automatic send isn’t available on this site. Opening your email app instead…");
          openMailtoFallback(data);
        }
      } catch {
        setStatus("error", "Could not reach the server. Opening your email app instead…");
        openMailtoFallback(data);
      } finally {
        if (reportSubmit) reportSubmit.setAttribute("aria-busy", "false");
      }
    });
  }

})();
