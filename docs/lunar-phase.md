# Hero phase animation

The fictional gas giant's textured image remains fixed. The Hero animates only
the SVG shadow path and its horizontal direction, deriving the geometry from a
phase fraction that advances with `requestAnimationFrame`. One path is updated
directly; React does not render on every frame. The 300-second cycle passes
through new, quarter, full, waning quarter and returns to its starting geometry.
The near-cycle boundary snaps within one frame to the same new-moon shape so the
loop remains visually continuous.

`prefers-reduced-motion` stops the cycle and shows a static first-quarter shape.
The existing `src/lib/lunar-phase.ts` is a standalone UTC approximation for
domain tests; the Hero no longer uses wall-clock lunar data.

Source for the standalone approximation: [NASA GSFC, Phases of the Moon](https://eclipse.gsfc.nasa.gov/phase/phases2001.html).
