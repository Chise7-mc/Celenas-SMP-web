# Hero phase animation

The fictional gas giant's textured image remains fixed. The Hero starts at a
waxing crescent (`0.125`) and animates the SVG shadow path and its horizontal
direction through a 120-second cycle. The phase fraction advances with
`requestAnimationFrame`; one path is updated directly and React does not render
on every frame. The fixed 12-degree tilt is applied by a separate outer SVG
group, so the phase morph never rotates the texture or the terminator's tilt.
At 120 seconds the visual returns to the same waxing crescent without a jump.

`prefers-reduced-motion` stops the cycle and shows the same static waxing
crescent used at startup.
The existing `src/lib/lunar-phase.ts` is a standalone UTC approximation for
domain tests; the Hero no longer uses wall-clock lunar data.

Source for the standalone approximation: [NASA GSFC, Phases of the Moon](https://eclipse.gsfc.nasa.gov/phase/phases2001.html).
