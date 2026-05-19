/**
 * Lazy-loads Vega-Lite charts as the reader scrolls.
 * Each chart container in index.html has:
 *   - class "vega-chart"
 *   - id (e.g. "chart-01")
 *   - data-spec attribute pointing to its JSON spec
 * We use IntersectionObserver to render each chart only once it scrolls
 */

(function () {
  "use strict";
  // Shared vega-embed options
  const EMBED_OPTIONS = {
    actions: { export: true, source: false, editor: true, compiled: false },
    renderer: "svg",
    config: {
      background: "transparent",
      font: "Inter, system-ui, sans-serif",
      title: { fontWeight: 600 },
      view: { stroke: null }
    }
  };
  // Renders a single chart container
  function renderChart(container) {
    const specUrl = container.getAttribute("data-spec");
    if (!specUrl) {
      console.warn("Chart container has no data-spec:", container.id);
      return;
    }

    // Mark as loading so we can style a placeholder
    container.classList.add("is-loading");

    vegaEmbed("#" + container.id, specUrl, EMBED_OPTIONS)
      .then(function () {
        container.classList.remove("is-loading");
        container.classList.add("is-loaded");
      })
      .catch(function (err) {
        container.classList.remove("is-loading");
        container.classList.add("is-error");
        container.innerHTML =
          '<p class="chart-error">Chart failed to load: ' +
          specUrl +
          "</p>";
        console.error("vega-embed error for " + specUrl, err);
      });
  }

  // Set up IntersectionObserver to trigger rendering on near-viewport
  function initLazyCharts() {
    const charts = document.querySelectorAll(".vega-chart");

    // Fallback if IntersectionObserver is unsupported, render everything immediately
    if (!("IntersectionObserver" in window)) {
      charts.forEach(renderChart);
      return;
    }

    const observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            renderChart(entry.target);
            obs.unobserve(entry.target); // render once, then stop watching
          }
        });
      },
      {
        // Start loading 200px before the chart enters the viewport, so it's ready by the time the reader actually sees it.
        rootMargin: "200px 0px",
        threshold: 0.01
      }
    );

    charts.forEach(function (chart) {
      observer.observe(chart);
    });
  }
  // Start running after DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLazyCharts);
  } else {
    initLazyCharts();
  }
})();