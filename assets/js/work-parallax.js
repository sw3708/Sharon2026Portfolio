/* Native scroll animation avoids JavaScript layout reads during scrolling. */
(() => {
  const style = document.createElement('style');
  style.textContent = `
    @supports (animation-timeline: view()) {
      @media (prefers-reduced-motion: no-preference) {
        #work .slide { view-timeline-name: --work-cover; view-timeline-axis: block; }
        #work .slide > .bg {
          inset: -12% 0;
          animation: work-cover-depth linear both;
          animation-timeline: --work-cover;
          animation-range: entry 0% exit 100%;
        }
        @keyframes work-cover-depth {
          from { translate: 0 -8%; }
          to { translate: 0 8%; }
        }
      }
    }
    @media (prefers-reduced-motion: reduce) {
      #work .slide[data-project="somnus"] .bg.has-work-video > img { visibility: visible; }
      #work .slide[data-project="somnus"] .work-cover-video { display: none; }
    }
  `;
  document.head.appendChild(style);
})();
