# Browser validation

## Native scrolling, November 7, 2026

Follow-up input diagnosis found a responsiveness issue that frame-rate averages cannot identify. A replay of the actual vendored interpolation class, using the production `lerp: .085` configuration and a 60 Hz schedule, took 600 ms to reach 95% of an isolated scroll step. This is the interpolator response, not a measured hardware input-latency value. The repro asserted a 150 ms maximum extra catch-up window and failed.

Wheel and touch now stay browser-owned. Removed the Lenis runtime/styles from every rendered page and retained a small adapter for native smooth section navigation, reduced motion and modal scroll locking. No JavaScript wheel/touch cancellation or perpetual scroll animation loop remains. Original ASCII and reveal effects remain. This targets input lag; it does not promise zero dropped frames under every power/device setting.

Native desktop Chrome and Safari previews were loaded and page movement/reveals inspected. Chrome was restored from the expired temporary QA port to the real localhost preview. Safari case gallery loaded and its revealed cards rendered, but native AX link clicks only scrolled into view rather than reliably activating the dialog, so manual dialog interaction is not claimed as verified. The modal integration test and adapter lock/restoration tests pass. Physical-phone behavior is unverified. No new browser FPS claim is made for this change.

The new scroll regression covers no extra wheel engine, no scroll RAF loop, native section targets, reduced-motion navigation, idempotent modal locking, original-style restoration and removing legacy engine loads from all ten pages. Earlier frame-timing notes below describe prior revisions.

## Follow-up, November 7, 2026

The previous display-frame averages missed a real defect: the hero and service character still redrew only every 30–33 ms. The original repro failed with `ascii updates in only 50% of display frames`; the production-code cadence tests also failed with 29 hero and 30 service updates per 60 display frames. Both now update every display frame. The tests exercise 60 Hz and 120 Hz schedules and confirm the hero reuses its glyph cache.

All three ASCII renderers cache glyph pixels at resize, preserving the fonts, palettes, density and character design. Their animation paths copy glyphs instead of repeatedly shaping text, and scan cells/points once instead of once per colour. In native Safari desktop profiling, hero redraw time fell from 8 ms to 3 ms at p95 and its measured update rate rose from 29.5 to 59.7/s. The service character fell from 8 ms to 3 ms at p95, rising from 29.7 to 58.4 updates/s during a scroll run. Display p95 remained 17 ms. These local samples still contain isolated long frames; they do not establish perfect scrolling on all devices.

An A/B check without the scroll controller recorded the same Safari display p95 (17 ms) and four frames over 50 ms as the after-fix controller run. The runs had different durations (17.6 versus 37.9 seconds) and wheel sequences, so they do not prove equivalence, but they provide no basis for replacing the controller. Scroll easing and reveal effects remain intact.

The initial Chrome capture ran near 30 display frames/s while its Energy Saver popup explicitly warned that smooth scrolling may be limited. No browser power setting was changed by the agent. The final Chrome capture could not be saved because its native window closed before the stop action (`cgWindowNotFound`). Chrome verification after the fix is therefore incomplete; no new 60 fps Chrome claim is made.

The temporary profiler lives outside the repository and is not published. Regression, portfolio, SEO, scroll, modal and carousel checks pass.

## Previous validation

## November 6, 2026

Live checks used native Safari and Google Chrome on the local Mac. Browser access recovered after the earlier bridge failure. The preview at `http://localhost:8765/` remains running.

### Robot handoff diagnosis and fix

The relay was throttled to approximately 30 updates per second even when Safari painted at 60 Hz. Changing a project card also immediately read all card heights, forcing layout after text mutation. The relay now updates once per display animation frame and caches card dimensions through ResizeObserver. The service character keeps its lower raster cadence to limit unnecessary work. Both ASCII scenes and the hero stop scheduling frames when off-screen, paused or hidden. Reduced motion renders a static scene.

A temporary server outside the project injected a small frame recorder. It recorded requestAnimationFrame intervals; native computer-use input supplied wheel events. These are local frame-timing samples, not a Lighthouse score, an input-latency test or field Core Web Vitals.

| Run | Viewport | Duration | Frames | p95 interval | Frames over 50 ms | Input |
| --- | --- | --- | --- | --- | --- | --- |
| Safari relay before | 1470 × 871, DPR 2 | 96.1 s | 5,704 | 17.0 ms | 1 | Stationary robot scene |
| Safari relay after | 1470 × 871, DPR 2 | 76.9 s | 4,547 | 17.0 ms | 1 | Stationary robot scene |
| Chrome after | 1470 × 835, DPR 2 | 29.4 s | 1,699 | 17.6 ms | 0 | 376 wheel events, scroll positions 682.5–4,904 px |

The similar Safari display intervals do not by themselves prove a faster animation. A regression test separately confirms the relay draws at least 55 times during 60 simulated display frames; the old 30 Hz cap failed that check. The after sample retained stable display timing while doubling relay update cadence. Safari still recorded one isolated 129 ms interval in the after sample, so the evidence does not support claiming every frame is perfect.

### Visual and navigation checks

- Safari desktop: titanium hero and miniature header wordmark render correctly. The header link returns to `index.html#top`.
- Safari Responsive Design Mode: 390 × 844 and 320 × 844 layouts. The wordmark, navigation and case gallery fit without overlap; the mobile robot cards remain readable. A wordmark click from Case studies returned home.
- Chrome device toolbar: 412 × 748 article layout, author attribution and terminal contact anchor checked. All contact fields exist together. A wordmark click from the article returned home.
- Chrome desktop: restored the full-width local home preview after device checks. Its developer console showed no errors during the article check.

Responsive desktop previews do not reproduce physical iPhone/Android hardware, touch inertia or mobile browser chrome. A physical-device pass remains a release check. No benchmark controls or recorder script are included in `dist/`.

### Automated checks

- `python3 scripts/check_case_studies.py`: all local assets/links, unique IDs, one complete terminal per page, project fees and author metadata.
- `python3 scripts/check_seo.py`: ten canonicals, readable headings, descriptions, social cards, structured data, crawl files, internal fragments and all header home links.
- `node scripts/check-case-modal.cjs`: overlays suspend background scroll and restore focus on close.
- `node scripts/check-case-ring.cjs`: controls, automatic motion, off-screen stopping, reduced motion and safe camera distance.
- `node scripts/check-scroll-performance.cjs`: cached scroll geometry and no card-height reads after a handoff text change.
- `node scripts/check-smooth-scroll.cjs`: wheel controller, native touch, section offsets, reduced motion, paused/hidden loops and page restoration.
- `node scripts/check-animation-lifecycle.cjs`: idle scene loops, visibility/pause lifecycle and relay display cadence.

The contact form currently copies the project brief. No receiving business email is configured; no delivery claim is made.

## Sigaram case-study update, 11 November 2026

Reviewed the expanded direct story in the in-app browser at desktop size and 390 × 844. The mobile document measured 390 px wide with no horizontal overflow. The Tamil homepage screenshot remains contained and readable without cropping. The gallery's Sigaram card opens the updated story in its existing dialog, with the original ₹2,500 website-build label and close control visible. This content/layout pass does not establish physical-device Safari or Chrome performance.

Case-study source checks, SEO checks, the generated page inventory, modal checks, ring checks and `git diff --check` passed. No animation or scroll-controller behavior changed in this update.
