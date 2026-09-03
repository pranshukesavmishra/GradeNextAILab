# Triage: unresponsive controls

Companion to docs/QUALITY_STATUS.json — one row per dead control from the acceptance sweep, with its root-cause class ((a) never wired, (b) effect unmeasured, (c) intended null result, (d) invisible at defaults), the fix applied, and verification status.

| Sim | Control | Class | Root cause | Fix | Verified |
| --- | --- | --- | --- | --- | --- |
| phys.motion-graphs | drive | d | The dial is only read when mode != "script", and the default mode is "script", so the demanded velocity always came from the script. | The speed dial now takes over from the script whenever it is off zero (and hands back at zero), with the on-stage mode label and help text reflecting the takeover. | yes |
| phys.motion-graphs | observerSpeed | d | Only read when viewFrame = "observer"; at the default "ground" frame nothing consumed it. | Added the honest "Velocity the observer measures" readout (m/s) and vObserved fact, valid in both frames, and the observer is now drawn walking the bench in the ground frame too. | yes |
