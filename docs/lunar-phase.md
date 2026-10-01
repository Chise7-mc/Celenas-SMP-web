# Lunar phase visual

`src/lib/lunar-phase.ts` maps a UTC timestamp to a phase fraction, continuous
illumination and one of eight phase names. It uses NASA GSFC's January 24, 2001
new moon at 13:07 UT as a reference and the mean synodic month of 29.530588
days. Actual lunations vary (NASA reports approximately 29.26–29.80 days), so
this is a deterministic visual approximation, not an ephemeris.

The Server Component supplies the initial phase to the isolated
`LunarPhaseScene` client boundary. After hydration it recalculates against the
visitor's clock, then refreshes every six hours. No network request,
geolocation, or astronomy dependency is used. SVG terminator geometry shows
waxing illumination on the right and waning illumination on the left as a
brand convention, not a location-specific orientation. Moon glow, atmospheric
light and star visibility vary subtly with illumination; reduced motion keeps
the current phase visible while stopping animation.

Source: [NASA GSFC, Phases of the Moon](https://eclipse.gsfc.nasa.gov/phase/phases2001.html).
