import type { FormulaGroup } from "./types";

export * from "./types";

/**
 * The Formula Lab — every quantitative relationship a Grade 6-8 student meets
 * on the California Integrated Science curriculum.
 *
 * Three rules were followed throughout, because they are what turns a list of
 * equations into something a student can learn from.
 *
 *   1. The name is the relationship in words. "Speed is the distance covered
 *      in each unit of time" is the idea; "v = d ÷ t" is only its shorthand.
 *      A student who can say the sentence can rebuild the symbols.
 *   2. Multiplication between symbols is always written out with ×. A middle
 *      schooler reads "F = m × a" correctly and reads "F = ma" as a new
 *      variable called "ma".
 *   3. Every entry carries the caution a teacher adds out loud — the classic
 *      misuse, or the boundary where the formula stops being true. That
 *      sentence is usually the difference between a right answer and an
 *      understood one.
 *
 * Topic codes reference the curriculum in src/curriculum: "G8·A2" is Grade 8,
 * Unit A, topic 2. Simulation ids reference src/sims/registry.ts.
 */
export const FORMULA_GROUPS: FormulaGroup[] = [
  /* ================================================================== *
   * Motion
   * ================================================================== */
  {
    id: "motion",
    title: "Motion",
    blurb: "How far, how fast, and how quickly the how-fast is itself changing.",
    subject: "physics",
    formulas: [
      {
        id: "motion.speed",
        name: "Speed is the distance covered in each unit of time",
        expression: "v = d ÷ t",
        rearranged: ["d = v × t", "t = d ÷ v"],
        symbols: [
          { sym: "v", means: "speed", unit: "m/s" },
          { sym: "d", means: "distance travelled along the path", unit: "m" },
          { sym: "t", means: "time taken", unit: "s" },
        ],
        grades: [6, 7, 8],
        topics: ["G8·A1"],
        subject: "physics",
        example: {
          setup: "A cyclist covers 120 m of straight path in 15 s.",
          working: "v = 120 m ÷ 15 s",
          answer: "8 m/s",
        },
        sims: ["phys.motion-graphs", "phys.projectile"],
        note:
          "Unless the speed is steady, this gives the average over the whole interval, " +
          "not the speed at any one instant. The speedometer reading and the journey " +
          "average are different numbers.",
      },
      {
        id: "motion.average-speed",
        name: "Average speed is the whole distance divided by the whole time, however the journey varied",
        expression: "v̄ = total distance ÷ total time",
        rearranged: ["total distance = v̄ × total time"],
        symbols: [
          { sym: "v̄", means: "average speed for the whole journey", unit: "m/s" },
          { sym: "total distance", means: "every metre covered, added up", unit: "m" },
          { sym: "total time", means: "every second from start to finish, stops included", unit: "s" },
        ],
        grades: [6, 7, 8],
        topics: ["G8·A1"],
        subject: "physics",
        example: {
          setup:
            "A bus drives 3 km in 300 s, waits at a stop for 120 s, then drives 2 km more in 180 s.",
          working: "v̄ = (3000 m + 2000 m) ÷ (300 s + 120 s + 180 s)",
          answer: "8.33 m/s",
        },
        sims: ["phys.motion-graphs"],
        note:
          "Average speed is not the average of the speeds. Add the distances, add the " +
          "times — including the time spent stopped — and divide once at the end.",
      },
      {
        id: "motion.velocity",
        name: "Velocity is displacement per unit of time — speed with a direction attached",
        expression: "v = Δs ÷ Δt",
        rearranged: ["Δs = v × Δt"],
        symbols: [
          { sym: "v", means: "velocity, stated with its direction", unit: "m/s" },
          { sym: "Δs", means: "displacement — the straight-line change in position", unit: "m" },
          { sym: "Δt", means: "the time interval", unit: "s" },
        ],
        grades: [8],
        topics: ["G8·A1"],
        subject: "physics",
        example: {
          setup: "A hiker walks 300 m east in 200 s, then turns and walks 100 m back west in 100 s.",
          working: "v = (300 m − 100 m) ÷ (200 s + 100 s)",
          answer: "0.667 m/s east",
        },
        sims: ["phys.motion-graphs"],
        note:
          "Distance and displacement are different quantities. Walk a full lap of the " +
          "track and the distance is 400 m while the displacement — and so the average " +
          "velocity — is zero.",
      },
      {
        id: "motion.relative-speed",
        name: "Relative speed along a line is the difference when two objects move the same way, the sum when they move opposite ways",
        expression: "vᵣₑₗ = v₁ − v₂",
        rearranged: ["vᵣₑₗ = v₁ + v₂ when the two move towards each other"],
        symbols: [
          { sym: "vᵣₑₗ", means: "speed of the first object as seen from the second", unit: "m/s" },
          { sym: "v₁", means: "speed of the first object measured from the ground", unit: "m/s" },
          { sym: "v₂", means: "speed of the second object measured from the ground", unit: "m/s" },
        ],
        grades: [8],
        topics: ["G8·A1"],
        subject: "physics",
        example: {
          setup: "Two trains run the same way on parallel tracks at 30 m/s and 22 m/s.",
          working: "vᵣₑₗ = 30 m/s − 22 m/s",
          answer: "8 m/s",
        },
        sims: ["phys.motion-graphs"],
        note:
          "Every speed is measured against some reference frame. A passenger walking " +
          "down the aisle is doing 1 m/s to the train and 31 m/s to the platform, and " +
          "neither number is wrong.",
      },
      {
        id: "motion.acceleration",
        name: "Acceleration is how much the velocity changes in each second",
        expression: "a = (v − u) ÷ t",
        rearranged: ["v = u + a × t", "t = (v − u) ÷ a"],
        symbols: [
          { sym: "a", means: "acceleration", unit: "m/s²" },
          { sym: "v", means: "final velocity", unit: "m/s" },
          { sym: "u", means: "starting velocity", unit: "m/s" },
          { sym: "t", means: "time over which the velocity changed", unit: "s" },
        ],
        grades: [8],
        topics: ["G8·A2"],
        subject: "physics",
        example: {
          setup: "A car pulls away from rest and reaches 24 m/s in 6 s.",
          working: "a = (24 m/s − 0 m/s) ÷ 6 s",
          answer: "4 m/s²",
        },
        sims: ["phys.motion-graphs", "phys.forces"],
        note:
          "A negative acceleration does not always mean slowing down — it means the " +
          "acceleration points backwards along the chosen positive direction. An object " +
          "reversing and speeding up has a negative acceleration too.",
      },
      {
        id: "motion.final-velocity",
        name: "Starting velocity plus the velocity gained gives the final velocity",
        expression: "v = u + a × t",
        rearranged: ["u = v − a × t", "a = (v − u) ÷ t"],
        symbols: [
          { sym: "v", means: "velocity at the end of the interval", unit: "m/s" },
          { sym: "u", means: "velocity at the start of the interval", unit: "m/s" },
          { sym: "a", means: "acceleration, taken as steady", unit: "m/s²" },
          { sym: "t", means: "how long the acceleration lasted", unit: "s" },
        ],
        grades: [8],
        topics: ["G8·A2"],
        subject: "physics",
        example: {
          setup: "A skateboarder rolling at 5 m/s accelerates down a slope at 2 m/s² for 4 s.",
          working: "v = 5 m/s + 2 m/s² × 4 s",
          answer: "13 m/s",
        },
        sims: ["phys.motion-graphs"],
        note:
          "This form only holds while the acceleration stays constant. On a velocity-time " +
          "graph that is a straight line; the moment the line bends, this equation no " +
          "longer applies to the whole interval.",
      },
      {
        id: "motion.distance-time-gradient",
        name: "The gradient of a distance-time graph is the speed",
        expression: "v = Δd ÷ Δt",
        rearranged: ["Δd = v × Δt"],
        symbols: [
          { sym: "v", means: "speed read off the graph as a gradient", unit: "m/s" },
          { sym: "Δd", means: "rise — the distance the line climbs between two points", unit: "m" },
          { sym: "Δt", means: "run — the time between those same two points", unit: "s" },
        ],
        grades: [8],
        topics: ["G8·A1", "G8·A2"],
        subject: "physics",
        example: {
          setup: "A straight line on a distance-time graph passes through (5 s, 15 m) and (20 s, 60 m).",
          working: "v = (60 m − 15 m) ÷ (20 s − 5 s)",
          answer: "3 m/s",
        },
        sims: ["phys.motion-graphs", "math.derivatives"],
        note:
          "A flat line means stopped, not missing data. A curved line means the speed is " +
          "changing, so a single gradient describes only the tangent at one instant.",
      },
      {
        id: "motion.velocity-time-gradient",
        name: "The gradient of a velocity-time graph is the acceleration",
        expression: "a = Δv ÷ Δt",
        rearranged: ["Δv = a × Δt"],
        symbols: [
          { sym: "a", means: "acceleration read off the graph as a gradient", unit: "m/s²" },
          { sym: "Δv", means: "rise — the velocity gained between two points", unit: "m/s" },
          { sym: "Δt", means: "run — the time between those same two points", unit: "s" },
        ],
        grades: [8],
        topics: ["G8·A2"],
        subject: "physics",
        example: {
          setup: "A velocity-time graph rises steadily from 4 m/s at 2 s to 16 m/s at 8 s.",
          working: "a = (16 m/s − 4 m/s) ÷ (8 s − 2 s)",
          answer: "2 m/s²",
        },
        sims: ["phys.motion-graphs", "math.derivatives"],
        note:
          "The two graph types look alike and mean opposite things. A horizontal line on " +
          "a distance-time graph is an object at rest; a horizontal line on a " +
          "velocity-time graph is an object cruising at steady speed.",
      },
      {
        id: "motion.area-under-velocity-time",
        name: "The area under a velocity-time graph is the distance travelled",
        expression: "d = ½ × (u + v) × t",
        rearranged: ["d = v × t when the velocity is steady"],
        symbols: [
          { sym: "d", means: "distance travelled — the area under the line", unit: "m" },
          { sym: "u", means: "velocity at the start of the interval", unit: "m/s" },
          { sym: "v", means: "velocity at the end of the interval", unit: "m/s" },
          { sym: "t", means: "width of the interval along the time axis", unit: "s" },
        ],
        grades: [8],
        topics: ["G8·A2"],
        subject: "physics",
        example: {
          setup: "A skater speeds up steadily from 2 m/s to 10 m/s over 8 s.",
          working: "d = ½ × (2 m/s + 10 m/s) × 8 s",
          answer: "48 m",
        },
        sims: ["phys.motion-graphs"],
        note:
          "This trapezium shortcut assumes the line is straight, so the acceleration is " +
          "constant. For a curved graph the area still gives the distance, but it has to " +
          "be counted square by square.",
      },
    ],
  },

  /* ================================================================== *
   * Forces and fields
   * ================================================================== */
  {
    id: "forces",
    title: "Forces and Fields",
    blurb: "What changes an object's motion, and how a force reaches across empty space to do it.",
    subject: "physics",
    formulas: [
      {
        id: "forces.resultant",
        name: "The resultant force is what is left after opposing forces cancel out",
        expression: "Fₙₑₜ = F₁ − F₂",
        rearranged: ["Fₙₑₜ = 0 when the forces are balanced"],
        symbols: [
          { sym: "Fₙₑₜ", means: "resultant (net) force on the object", unit: "N" },
          { sym: "F₁", means: "force acting one way", unit: "N" },
          { sym: "F₂", means: "force acting the opposite way", unit: "N" },
        ],
        grades: [8],
        topics: ["G8·A3", "G8·A4"],
        subject: "physics",
        example: {
          setup: "A train engine pulls forwards with 250 N while friction and drag pull back with 90 N.",
          working: "Fₙₑₜ = 250 N − 90 N",
          answer: "160 N forwards",
        },
        sims: ["phys.forces"],
        note:
          "Balanced forces do not mean stopped — they mean no change in motion. A car at " +
          "a steady 30 m/s on a level road has a resultant force of zero.",
      },
      {
        id: "forces.newton-second",
        name: "A resultant force accelerates a mass — force equals mass times acceleration",
        expression: "F = m × a",
        rearranged: ["a = F ÷ m", "m = F ÷ a"],
        symbols: [
          { sym: "F", means: "resultant force on the object", unit: "N" },
          { sym: "m", means: "mass of the object", unit: "kg" },
          { sym: "a", means: "acceleration produced", unit: "m/s²" },
        ],
        grades: [8],
        topics: ["G8·A4", "G8·A3"],
        subject: "physics",
        example: {
          setup: "A 2 kg cart is pulled along a bench by a resultant force of 6 N.",
          working: "a = 6 N ÷ 2 kg",
          answer: "3 m/s²",
        },
        sims: ["phys.forces", "phys.collisions"],
        note:
          "F is the resultant force, never just the force you happen to be pushing with. " +
          "If you push a box with 20 N and friction holds it back with 20 N, F is zero " +
          "and the box does not accelerate no matter how hard the push looks.",
      },
      {
        id: "forces.weight",
        name: "Weight is the pull of gravity on a mass",
        expression: "W = m × g",
        rearranged: ["m = W ÷ g", "g = W ÷ m"],
        symbols: [
          { sym: "W", means: "weight — the gravitational force on the object", unit: "N" },
          { sym: "m", means: "mass of the object", unit: "kg" },
          { sym: "g", means: "gravitational field strength (9.8 N/kg on Earth)", unit: "N/kg" },
        ],
        grades: [8],
        topics: ["G8·C4", "G8·C5"],
        subject: "physics",
        example: {
          setup: "A 6 kg bag of rice sits on Earth's surface, where g is 9.8 N/kg.",
          working: "W = 6 kg × 9.8 N/kg",
          answer: "58.8 N",
        },
        sims: ["phys.gravity", "phys.fields"],
        note:
          "Mass is not weight. A 6 kg bag is still 6 kg on the Moon, but with g of about " +
          "1.6 N/kg it weighs roughly 10 N there instead of 59 N — about a sixth as much. " +
          "Mass is in kilograms, weight is a force in newtons.",
      },
      {
        id: "forces.third-law",
        name: "Forces come in pairs: whatever A pushes on B, B pushes back on A just as hard the other way",
        expression: "F₁ = −F₂",
        symbols: [
          { sym: "F₁", means: "force object A exerts on object B", unit: "N" },
          { sym: "F₂", means: "force object B exerts back on object A", unit: "N" },
        ],
        grades: [8],
        topics: ["G8·A5"],
        subject: "physics",
        example: {
          setup: "A swimmer pushes 150 N backwards against the water.",
          working: "F₁ = 150 N backwards on the water, so F₂ = 150 N forwards on the swimmer",
          answer: "150 N forwards on the swimmer",
        },
        sims: ["phys.collisions", "phys.forces"],
        note:
          "The two forces in the pair act on different objects, which is why they never " +
          "cancel each other. In a truck-and-car collision both feel the same size of " +
          "force; the car is damaged more because the same force acts on far less mass.",
      },
      {
        id: "forces.momentum",
        name: "Momentum is how much mass is moving, and how fast",
        expression: "p = m × v",
        rearranged: ["v = p ÷ m", "m = p ÷ v"],
        symbols: [
          { sym: "p", means: "momentum, in the direction of travel", unit: "kg·m/s" },
          { sym: "m", means: "mass of the object", unit: "kg" },
          { sym: "v", means: "velocity of the object", unit: "m/s" },
        ],
        grades: [8],
        topics: ["G8·A5", "G8·A6"],
        subject: "physics",
        example: {
          setup: "A 60 kg skater glides across the ice at 4 m/s.",
          working: "p = 60 kg × 4 m/s",
          answer: "240 kg·m/s",
        },
        sims: ["phys.collisions"],
        note:
          "Momentum is not energy. Two objects can carry equal momentum and very " +
          "different kinetic energies, because momentum uses v once and kinetic energy " +
          "uses it twice.",
      },
      {
        id: "forces.momentum-conservation",
        name: "In a collision the total momentum before equals the total momentum after",
        expression: "m₁ × u₁ + m₂ × u₂ = m₁ × v₁ + m₂ × v₂",
        rearranged: ["m₁ × u₁ + m₂ × u₂ = (m₁ + m₂) × v when the two stick together"],
        symbols: [
          { sym: "m₁", means: "mass of the first object", unit: "kg" },
          { sym: "m₂", means: "mass of the second object", unit: "kg" },
          { sym: "u₁", means: "velocity of the first object before the collision", unit: "m/s" },
          { sym: "u₂", means: "velocity of the second object before the collision", unit: "m/s" },
          { sym: "v₁", means: "velocity of the first object after the collision", unit: "m/s" },
          { sym: "v₂", means: "velocity of the second object after the collision", unit: "m/s" },
        ],
        grades: [8],
        topics: ["G8·A5", "G8·A6"],
        subject: "physics",
        example: {
          setup: "A 2 kg trolley moving at 3 m/s runs into a stationary 1 kg trolley and they lock together.",
          working: "(2 kg × 3 m/s) + (1 kg × 0 m/s) = 3 kg × v",
          answer: "2 m/s",
        },
        sims: ["phys.collisions"],
        note:
          "Momentum is conserved only when no outside force acts on the pair. Friction, a " +
          "wall, or the ground counts as an outside force — which is why a ball bouncing " +
          "off the Earth seems to break the rule until you remember the Earth is in the " +
          "system too.",
      },
      {
        id: "forces.pressure",
        name: "Pressure is the force pressed onto each unit of area",
        expression: "P = F ÷ A",
        rearranged: ["F = P × A", "A = F ÷ P"],
        symbols: [
          { sym: "P", means: "pressure", unit: "Pa" },
          { sym: "F", means: "force pressing at right angles to the surface", unit: "N" },
          { sym: "A", means: "area the force is spread over", unit: "m²" },
        ],
        grades: [6, 7, 8],
        topics: ["G6·D2", "G6·D3"],
        subject: "physics",
        example: {
          setup: "A hiker weighing 600 N stands on snowshoes that spread the load over 0.03 m².",
          working: "P = 600 N ÷ 0.03 m²",
          answer: "20000 Pa",
        },
        sims: ["earth.atmosphere", "chem.gas-laws"],
        note:
          "The same force gives a different pressure on a different area — that is the " +
          "whole point of snowshoes, drawing pins and knife blades. One pascal is one " +
          "newton per square metre, which is a very small pressure; sea-level air " +
          "pressure is about 101000 Pa.",
      },
      {
        id: "forces.field-strength",
        name: "A gravitational field's strength is the force it exerts on each kilogram",
        expression: "g = W ÷ m",
        rearranged: ["W = m × g"],
        symbols: [
          { sym: "g", means: "gravitational field strength at that place", unit: "N/kg" },
          { sym: "W", means: "weight measured there", unit: "N" },
          { sym: "m", means: "mass being weighed", unit: "kg" },
        ],
        grades: [8],
        topics: ["G8·C4", "G8·C5"],
        subject: "physics",
        example: {
          setup: "A 5 kg rock brought to Mars is measured to weigh 18.5 N.",
          working: "g = 18.5 N ÷ 5 kg",
          answer: "3.7 N/kg",
        },
        sims: ["phys.gravity", "phys.fields"],
        note:
          "A field is a property of the space, not of the object you put in it. The value " +
          "of g at a place is the same whether you hang 1 kg or 100 kg there.",
      },
      {
        id: "forces.gravitation",
        name: "Every mass attracts every other mass: more mass means more pull, more distance means much less",
        expression: "F = G × (m₁ × m₂) ÷ d²",
        rearranged: ["double either mass → double the force", "double the distance → a quarter of the force"],
        symbols: [
          { sym: "F", means: "gravitational force pulling the two together", unit: "N" },
          { sym: "G", means: "the gravitational constant, 6.67 × 10⁻¹¹", unit: "N·m²/kg²" },
          { sym: "m₁", means: "mass of the first object", unit: "kg" },
          { sym: "m₂", means: "mass of the second object", unit: "kg" },
          { sym: "d", means: "distance between the two centres", unit: "m" },
        ],
        grades: [8],
        topics: ["G8·C4", "G8·E3"],
        subject: "physics",
        example: {
          setup: "Two objects attract each other with 40 N. They are then moved twice as far apart.",
          working: "F = 40 N ÷ 2² = 40 N ÷ 4",
          answer: "10 N",
        },
        sims: ["phys.gravity", "phys.fields"],
        note:
          "At this level you are expected to use the pattern, not the constant. Gravity " +
          "is always attractive and never switches off — the force between two students " +
          "in a classroom is real, just far too small to notice next to Earth's pull.",
      },
      {
        id: "forces.electric",
        name: "Two charges push or pull along the line joining them — like repels like, opposites attract",
        expression: "F = k × (q₁ × q₂) ÷ d²",
        rearranged: ["halve the distance → four times the force", "double either charge → double the force"],
        symbols: [
          { sym: "F", means: "electric force between the charges", unit: "N" },
          { sym: "k", means: "the electrostatic constant, 8.99 × 10⁹", unit: "N·m²/C²" },
          { sym: "q₁", means: "size of the first charge", unit: "C" },
          { sym: "q₂", means: "size of the second charge", unit: "C" },
          { sym: "d", means: "distance between the charges", unit: "m" },
        ],
        grades: [8],
        topics: ["G8·C2", "G8·C1"],
        subject: "physics",
        example: {
          setup: "Two charged spheres repel with 0.60 N. They are moved to half their original separation.",
          working: "F = 0.60 N × 2² = 0.60 N × 4",
          answer: "2.4 N",
        },
        sims: ["phys.electric-force", "phys.fields"],
        note:
          "This has the same inverse-square shape as gravity, with one crucial " +
          "difference: charge comes in two kinds, so this force can repel as well as " +
          "attract, while gravity only ever pulls.",
      },
      {
        id: "forces.electromagnet",
        name: "An electromagnet gets stronger with more current and more turns of wire",
        expression: "B ∝ N × I",
        symbols: [
          { sym: "B", means: "strength of the magnetic field produced", unit: "T" },
          { sym: "N", means: "number of turns in the coil" },
          { sym: "I", means: "current in the coil", unit: "A" },
        ],
        grades: [8],
        topics: ["G8·C3"],
        subject: "physics",
        example: {
          setup: "A coil of 50 turns is rewound with 100 turns and run at the same current.",
          working: "B ∝ 100 turns ÷ 50 turns",
          answer: "2 times the field strength",
        },
        sims: ["phys.magnetism", "phys.fields"],
        note:
          "The sign here is ∝ (proportional to), not =. The iron core matters more than " +
          "either factor and is not in this relationship at all, so use it to compare " +
          "one coil with itself, not one coil with another.",
      },
    ],
  },

  /* ================================================================== *
   * Energy, work and power
   * ================================================================== */
  {
    id: "energy",
    title: "Energy, Work and Power",
    blurb: "Energy is never made or destroyed — it is stored, moved, converted, and spread out.",
    subject: "physics",
    formulas: [
      {
        id: "energy.kinetic",
        name: "Kinetic energy is the energy of movement, and it grows with the square of the speed",
        expression: "KE = ½ × m × v²",
        rearranged: ["m = (2 × KE) ÷ v²", "v = √((2 × KE) ÷ m)"],
        symbols: [
          { sym: "KE", means: "kinetic energy stored in the motion", unit: "J" },
          { sym: "m", means: "mass of the moving object", unit: "kg" },
          { sym: "v", means: "speed of the object", unit: "m/s" },
        ],
        grades: [6, 7, 8],
        topics: ["G8·B1", "G6·C1"],
        subject: "physics",
        example: {
          setup: "A 1200 kg car travels at 20 m/s.",
          working: "KE = ½ × 1200 kg × (20 m/s)²",
          answer: "240000 J",
        },
        sims: ["phys.kinetic-energy", "phys.collisions", "phys.energy-skate"],
        note:
          "Double the mass and the kinetic energy doubles; double the speed and it " +
          "quadruples. That asymmetry is the physics behind speed limits — a crash at " +
          "40 m/s carries four times the energy of the same car at 20 m/s, not twice.",
      },
      {
        id: "energy.gravitational-potential",
        name: "Gravitational potential energy is the energy stored by lifting a mass against gravity",
        expression: "PE = m × g × h",
        rearranged: ["h = PE ÷ (m × g)", "m = PE ÷ (g × h)"],
        symbols: [
          { sym: "PE", means: "gravitational potential energy stored", unit: "J" },
          { sym: "m", means: "mass that was lifted", unit: "kg" },
          { sym: "g", means: "gravitational field strength (9.8 N/kg on Earth)", unit: "N/kg" },
          { sym: "h", means: "height gained above the chosen zero level", unit: "m" },
        ],
        grades: [6, 7, 8],
        topics: ["G8·B2", "G6·C1"],
        subject: "physics",
        example: {
          setup: "A 2 kg book is lifted from the floor onto a shelf 1.5 m up.",
          working: "PE = 2 kg × 9.8 N/kg × 1.5 m",
          answer: "29.4 J",
        },
        sims: ["phys.energy-skate", "phys.pendulum"],
        note:
          "Height is measured from whatever level you decide to call zero, so the value " +
          "of PE depends on that choice. Only the change in PE has physical meaning, and " +
          "the potential energy belongs to the object-and-Earth system, not to the object " +
          "alone.",
      },
      {
        id: "energy.elastic-potential",
        name: "A stretched or squashed spring stores energy that grows with the square of the stretch",
        expression: "Eₑ = ½ × k × x²",
        symbols: [
          { sym: "Eₑ", means: "elastic potential energy stored in the spring", unit: "J" },
          { sym: "k", means: "spring constant — how stiff the spring is", unit: "N/m" },
          { sym: "x", means: "how far the spring is stretched or squashed from its natural length", unit: "m" },
        ],
        grades: [8],
        topics: ["G8·B2"],
        subject: "physics",
        example: {
          setup: "A spring of stiffness 200 N/m is pulled 0.10 m past its natural length.",
          working: "Eₑ = ½ × 200 N/m × (0.10 m)²",
          answer: "1.0 J",
        },
        sims: ["phys.energy-skate"],
        note:
          "Grade 8 usually meets this as a pattern rather than a calculation: stretch it " +
          "twice as far and it stores four times the energy. It stops being true once the " +
          "spring is pulled so far it no longer springs back.",
      },
      {
        id: "energy.conservation",
        name: "Energy is never created or destroyed, so the potential energy lost equals the kinetic energy gained",
        expression: "PE lost = KE gained",
        rearranged: ["½ × m × v² = m × g × h", "energy in = useful energy out + energy dissipated"],
        symbols: [
          { sym: "PE lost", means: "potential energy the system gave up as it fell or ran down", unit: "J" },
          { sym: "KE gained", means: "kinetic energy the system picked up", unit: "J" },
        ],
        grades: [6, 7, 8],
        topics: ["G8·B4", "G6·C1"],
        subject: "physics",
        example: {
          setup: "A 50 kg skateboarder drops 4 m down a smooth ramp.",
          working: "KE gained = 50 kg × 9.8 N/kg × 4 m",
          answer: "1960 J",
        },
        sims: ["phys.energy-skate", "phys.pendulum", "phys.collisions"],
        note:
          "This clean swap only holds when friction and air resistance are negligible. " +
          "In the real world some energy always ends up as thermal energy in the ramp, " +
          "the wheels and the air — dissipated, spread out and hard to use again, but " +
          "never destroyed.",
      },
      {
        id: "energy.speed-from-drop",
        name: "Falling turns height into speed, and the mass cancels out",
        expression: "v = √(2 × g × h)",
        rearranged: ["h = v² ÷ (2 × g)"],
        symbols: [
          { sym: "v", means: "speed at the bottom of the drop", unit: "m/s" },
          { sym: "g", means: "gravitational field strength (9.8 N/kg on Earth)", unit: "N/kg" },
          { sym: "h", means: "vertical height dropped", unit: "m" },
        ],
        grades: [8],
        topics: ["G8·B4", "G8·B2"],
        subject: "physics",
        example: {
          setup: "A ball rolls from rest down a smooth track that drops 5 m.",
          working: "v = √(2 × 9.8 N/kg × 5 m)",
          answer: "9.9 m/s",
        },
        sims: ["phys.energy-skate", "phys.pendulum"],
        note:
          "Mass has vanished from the formula, so a heavy and a light ball reach the same " +
          "speed from the same height. Only the vertical drop counts — the shape of the " +
          "ramp between top and bottom does not.",
      },
      {
        id: "energy.work",
        name: "Work done is the force multiplied by the distance moved in the direction of that force",
        expression: "W = F × d",
        rearranged: ["F = W ÷ d", "d = W ÷ F"],
        symbols: [
          { sym: "W", means: "work done, which equals the energy transferred", unit: "J" },
          { sym: "F", means: "force applied", unit: "N" },
          { sym: "d", means: "distance moved along the line of the force", unit: "m" },
        ],
        grades: [8],
        topics: ["G8·B4", "G8·B3"],
        subject: "physics",
        example: {
          setup: "A crate is dragged 3 m along the floor against a steady 25 N of friction.",
          working: "W = 25 N × 3 m",
          answer: "75 J",
        },
        sims: ["phys.forces", "phys.energy-skate"],
        note:
          "No movement means no work, however tiring it feels — holding a heavy bag still " +
          "does zero joules of work in physics. The distance must also be along the force: " +
          "carrying that bag horizontally does no work against gravity.",
      },
      {
        id: "energy.power",
        name: "Power is how much energy is transferred each second",
        expression: "P = W ÷ t",
        rearranged: ["W = P × t", "t = W ÷ P"],
        symbols: [
          { sym: "P", means: "power", unit: "W" },
          { sym: "W", means: "work done, or energy transferred", unit: "J" },
          { sym: "t", means: "time taken", unit: "s" },
        ],
        grades: [6, 7, 8],
        topics: ["G6·C1", "G8·B4"],
        subject: "physics",
        example: {
          setup: "A motor transfers 3000 J of energy in 20 s.",
          working: "P = 3000 J ÷ 20 s",
          answer: "150 W",
        },
        sims: ["phys.circuits", "phys.energy-skate"],
        note:
          "Power is a rate, not an amount. Two lifts that raise the same load to the same " +
          "floor do identical work; the faster one is simply more powerful. One watt is " +
          "one joule per second.",
      },
      {
        id: "energy.efficiency",
        name: "Efficiency is the share of the energy going in that comes out as the energy you wanted",
        expression: "efficiency = useful energy out ÷ total energy in × 100",
        rearranged: ["useful energy out = efficiency ÷ 100 × total energy in"],
        symbols: [
          { sym: "efficiency", means: "percentage of the input energy that does the intended job", unit: "%" },
          { sym: "useful energy out", means: "energy delivered in the form you wanted", unit: "J" },
          { sym: "total energy in", means: "all the energy supplied", unit: "J" },
        ],
        grades: [6, 7, 8],
        topics: ["G8·B4", "G6·C5"],
        subject: "physics",
        example: {
          setup: "An electric motor is supplied with 500 J and delivers 350 J as movement.",
          working: "efficiency = 350 J ÷ 500 J × 100",
          answer: "70%",
        },
        sims: ["phys.energy-skate", "phys.heat-transfer"],
        note:
          "Efficiency can never exceed 100%. The missing 30% has not been destroyed — it " +
          "has been dissipated as thermal energy and sound, which is why the motor gets " +
          "warm.",
      },
      {
        id: "energy.pendulum-period",
        name: "A pendulum's swing time depends on its length, not on the mass hanging from it",
        expression: "T = 2 × π × √(L ÷ g)",
        rearranged: ["L = g × (T ÷ (2 × π))²"],
        symbols: [
          { sym: "T", means: "period — the time for one complete swing there and back", unit: "s" },
          { sym: "π", means: "pi, about 3.1416" },
          { sym: "L", means: "length from the pivot to the centre of the bob", unit: "m" },
          { sym: "g", means: "gravitational field strength (9.8 N/kg on Earth)", unit: "N/kg" },
        ],
        grades: [8],
        topics: ["G8·B2"],
        subject: "physics",
        example: {
          setup: "A pendulum hangs 1.0 m from its pivot.",
          working: "T = 2 × 3.1416 × √(1.0 m ÷ 9.8 N/kg)",
          answer: "2.0 s",
        },
        sims: ["phys.pendulum"],
        note:
          "The mass of the bob is absent from the formula, and so is the size of a small " +
          "swing — a result that surprises almost every class. It stops being accurate " +
          "for large swings, beyond roughly 15° from vertical.",
      },
    ],
  },

  /* ================================================================== *
   * Waves, sound and light
   * ================================================================== */
  {
    id: "waves",
    title: "Waves, Sound and Light",
    blurb: "Waves move energy and information from place to place without carrying the matter along.",
    subject: "physics",
    formulas: [
      {
        id: "waves.wave-speed",
        name: "A wave's speed is its frequency multiplied by its wavelength",
        expression: "v = f × λ",
        rearranged: ["f = v ÷ λ", "λ = v ÷ f"],
        symbols: [
          { sym: "v", means: "speed of the wave through its medium", unit: "m/s" },
          { sym: "f", means: "frequency — waves passing a point each second", unit: "Hz" },
          { sym: "λ", means: "wavelength — the length of one whole wave", unit: "m" },
        ],
        grades: [8],
        topics: ["G8·D1", "G8·D3", "G8·D4"],
        subject: "physics",
        example: {
          setup: "A note of frequency 170 Hz travels through air with a wavelength of 2.0 m.",
          working: "v = 170 Hz × 2.0 m",
          answer: "340 m/s",
        },
        sims: ["phys.waves", "phys.sound", "phys.em-spectrum"],
        note:
          "In a given medium the speed is fixed by the medium, not by the source. Raising " +
          "the frequency shortens the wavelength to match — it does not make the wave " +
          "travel faster.",
      },
      {
        id: "waves.frequency-period",
        name: "Frequency and period are opposites: one is waves per second, the other seconds per wave",
        expression: "f = 1 ÷ T",
        rearranged: ["T = 1 ÷ f"],
        symbols: [
          { sym: "f", means: "frequency", unit: "Hz" },
          { sym: "T", means: "period — the time for one complete wave", unit: "s" },
        ],
        grades: [8],
        topics: ["G8·D1"],
        subject: "physics",
        example: {
          setup: "One complete vibration of a guitar string takes 0.004 s.",
          working: "f = 1 ÷ 0.004 s",
          answer: "250 Hz",
        },
        sims: ["phys.waves", "phys.sound", "phys.pendulum"],
        note:
          "A hertz simply means 'per second'. A high frequency goes with a short period, " +
          "so the two numbers always move in opposite directions.",
      },
      {
        id: "waves.frequency-count",
        name: "Frequency is the number of complete waves passing a point each second",
        expression: "f = n ÷ t",
        rearranged: ["n = f × t"],
        symbols: [
          { sym: "f", means: "frequency", unit: "Hz" },
          { sym: "n", means: "number of complete waves counted" },
          { sym: "t", means: "time spent counting", unit: "s" },
        ],
        grades: [8],
        topics: ["G8·D1"],
        subject: "physics",
        example: {
          setup: "A student counts 60 crests passing a post in 12 s.",
          working: "f = 60 ÷ 12 s",
          answer: "5 Hz",
        },
        sims: ["phys.waves"],
        note:
          "Count complete waves, not crests plus troughs. Counting for longer and " +
          "dividing gives a better value than timing a single wave.",
      },
      {
        id: "waves.light-speed",
        name: "Every electromagnetic wave travels at the same speed through a vacuum",
        expression: "c = f × λ",
        rearranged: ["λ = c ÷ f", "f = c ÷ λ"],
        symbols: [
          { sym: "c", means: "speed of light in a vacuum, 3.00 × 10⁸", unit: "m/s" },
          { sym: "f", means: "frequency of the electromagnetic wave", unit: "Hz" },
          { sym: "λ", means: "wavelength of the electromagnetic wave", unit: "m" },
        ],
        grades: [8],
        topics: ["G8·D3"],
        subject: "physics",
        example: {
          setup: "A radio station broadcasts at 1.50 × 10⁸ Hz.",
          working: "λ = (3.00 × 10⁸ m/s) ÷ (1.50 × 10⁸ Hz)",
          answer: "2.00 m",
        },
        sims: ["phys.em-spectrum", "phys.optics"],
        note:
          "Radio waves, visible light and gamma rays all travel at c in a vacuum — they " +
          "differ in wavelength and frequency, not in speed. Light does slow down in " +
          "glass or water, which is what bends it when it refracts.",
      },
      {
        id: "waves.echo-distance",
        name: "In echo sounding the distance is half the round trip, because the sound goes there and back",
        expression: "d = (v × t) ÷ 2",
        rearranged: ["t = (2 × d) ÷ v"],
        symbols: [
          { sym: "d", means: "distance to the reflecting surface", unit: "m" },
          { sym: "v", means: "speed of sound in that medium", unit: "m/s" },
          { sym: "t", means: "time for the echo to return", unit: "s" },
        ],
        grades: [8],
        topics: ["G8·D4"],
        subject: "physics",
        example: {
          setup: "A ship's sonar pings the seabed and hears the echo 0.8 s later; sound travels at 1500 m/s in seawater.",
          working: "d = (1500 m/s × 0.8 s) ÷ 2",
          answer: "600 m",
        },
        sims: ["phys.sound"],
        note:
          "Forgetting to halve is the classic error — the sound covers the distance twice. " +
          "Use the speed of sound in the right medium: about 340 m/s in air but roughly " +
          "1500 m/s in water and faster still in steel.",
      },
      {
        id: "waves.amplitude-energy",
        name: "A wave's energy grows with the square of its amplitude",
        expression: "E ∝ A²",
        symbols: [
          { sym: "E", means: "energy the wave carries", unit: "J" },
          { sym: "A", means: "amplitude — the maximum displacement from rest", unit: "m" },
        ],
        grades: [8],
        topics: ["G8·D1"],
        subject: "physics",
        example: {
          setup: "The amplitude of a water wave is tripled while its frequency is left alone.",
          working: "E ∝ 3² = 9",
          answer: "9 times the energy",
        },
        sims: ["phys.waves", "phys.sound"],
        note:
          "Amplitude, not frequency, sets how much energy a wave delivers — louder sound " +
          "and brighter light mean bigger amplitude. Raising the pitch of a note does not " +
          "by itself make it louder.",
      },
      {
        id: "waves.digital-codes",
        name: "Each extra bit doubles the number of different values a digital signal can carry",
        expression: "number of codes = 2ⁿ",
        symbols: [
          { sym: "number of codes", means: "how many distinct values can be represented" },
          { sym: "ⁿ", means: "n, the number of bits used" },
        ],
        grades: [8],
        topics: ["G8·D5"],
        subject: "physics",
        example: {
          setup: "A sensor sends its reading as an 8-bit binary number.",
          working: "number of codes = 2ⁿ with n = 8",
          answer: "256 different readings",
        },
        note:
          "More bits means finer steps, not a perfect signal — a digital reading is always " +
          "rounded to the nearest available code. Digital survives noise better than " +
          "analogue because a slightly distorted 1 is still clearly a 1.",
      },
    ],
  },

  /* ================================================================== *
   * Electricity and circuits
   * ================================================================== */
  {
    id: "electricity",
    title: "Electricity and Circuits",
    blurb: "Charge driven round a loop: what pushes it, what holds it back, and what it delivers.",
    subject: "physics",
    formulas: [
      {
        id: "elec.ohm",
        name: "Current is set by the voltage pushing and the resistance holding back",
        expression: "V = I × R",
        rearranged: ["I = V ÷ R", "R = V ÷ I"],
        symbols: [
          { sym: "V", means: "potential difference (voltage) across the component", unit: "V" },
          { sym: "I", means: "current through the component", unit: "A" },
          { sym: "R", means: "resistance of the component", unit: "Ω" },
        ],
        grades: [8],
        topics: ["G8·C3", "G8·C2"],
        subject: "physics",
        example: {
          setup: "A 6 V battery is connected across a 3 Ω resistor.",
          working: "I = 6 V ÷ 3 Ω",
          answer: "2 A",
        },
        sims: ["phys.circuits"],
        note:
          "A battery supplies a fixed voltage, not a fixed current — the circuit decides " +
          "the current. Resistance is not 'used up' either: the same current flows into " +
          "and out of a bulb, and what the bulb takes is energy, not charge.",
      },
      {
        id: "elec.charge",
        name: "Charge delivered is the current multiplied by how long it flows",
        expression: "Q = I × t",
        rearranged: ["I = Q ÷ t", "t = Q ÷ I"],
        symbols: [
          { sym: "Q", means: "charge that passed", unit: "C" },
          { sym: "I", means: "current", unit: "A" },
          { sym: "t", means: "time the current flowed", unit: "s" },
        ],
        grades: [8],
        topics: ["G8·C2"],
        subject: "physics",
        example: {
          setup: "A current of 0.5 A flows through a lamp for 60 s.",
          working: "Q = 0.5 A × 60 s",
          answer: "30 C",
        },
        sims: ["phys.circuits", "phys.electric-force"],
        note:
          "One ampere is one coulomb of charge passing each second, so current is a rate " +
          "and charge is an amount. The charge is not consumed on its way round — it " +
          "returns to the battery.",
      },
      {
        id: "elec.power",
        name: "Electrical power is the voltage multiplied by the current",
        expression: "P = V × I",
        rearranged: ["I = P ÷ V", "V = P ÷ I"],
        symbols: [
          { sym: "P", means: "power transferred by the component", unit: "W" },
          { sym: "V", means: "potential difference across it", unit: "V" },
          { sym: "I", means: "current through it", unit: "A" },
        ],
        grades: [8],
        topics: ["G8·C3"],
        subject: "physics",
        example: {
          setup: "A motor runs at 12 V drawing 2 A.",
          working: "P = 12 V × 2 A",
          answer: "24 W",
        },
        sims: ["phys.circuits"],
        note:
          "Power is the rate of energy transfer, so a 24 W motor uses 24 J every second. " +
          "Multiply by the running time in seconds to get the energy in joules.",
      },
      {
        id: "elec.series-resistance",
        name: "Resistances in series simply add up",
        expression: "R = R₁ + R₂ + R₃",
        symbols: [
          { sym: "R", means: "total resistance of the series chain", unit: "Ω" },
          { sym: "R₁", means: "resistance of the first component", unit: "Ω" },
          { sym: "R₂", means: "resistance of the second component", unit: "Ω" },
          { sym: "R₃", means: "resistance of any further component", unit: "Ω" },
        ],
        grades: [8],
        topics: ["G8·C3"],
        subject: "physics",
        example: {
          setup: "A 4 Ω lamp and a 6 Ω resistor are wired one after the other in a single loop.",
          working: "R = 4 Ω + 6 Ω",
          answer: "10 Ω",
        },
        sims: ["phys.circuits"],
        note:
          "Adding a bulb in series raises the total resistance, so every bulb in the loop " +
          "dims. In parallel the opposite happens — each new branch gives the current " +
          "another route, so the total resistance falls.",
      },
      {
        id: "elec.parallel-current",
        name: "In a parallel circuit the branch currents add up to the current leaving the battery",
        expression: "I = I₁ + I₂",
        rearranged: ["I₂ = I − I₁"],
        symbols: [
          { sym: "I", means: "total current supplied by the battery", unit: "A" },
          { sym: "I₁", means: "current in the first branch", unit: "A" },
          { sym: "I₂", means: "current in the second branch", unit: "A" },
        ],
        grades: [8],
        topics: ["G8·C3"],
        subject: "physics",
        example: {
          setup: "Two parallel branches carry 0.3 A and 0.5 A.",
          working: "I = 0.3 A + 0.5 A",
          answer: "0.8 A from the battery",
        },
        sims: ["phys.circuits"],
        note:
          "Charge is conserved at every junction: whatever flows in must flow out. This " +
          "is why the current thins out where the circuit splits and recombines where the " +
          "branches meet.",
      },
    ],
  },

  /* ================================================================== *
   * Matter, atoms and density
   * ================================================================== */
  {
    id: "matter",
    title: "Matter, Atoms and Density",
    blurb: "What a substance is made of, how tightly it is packed, and how a gas responds to squeezing and heating.",
    subject: "chemistry",
    formulas: [
      {
        id: "matter.density",
        name: "Density is how much mass is packed into each unit of volume",
        expression: "ρ = m ÷ V",
        rearranged: ["m = ρ × V", "V = m ÷ ρ"],
        symbols: [
          { sym: "ρ", means: "density of the material", unit: "kg/m³ (often g/cm³ in the lab)" },
          { sym: "m", means: "mass of the sample", unit: "kg" },
          { sym: "V", means: "volume of the sample", unit: "m³" },
        ],
        grades: [6, 7, 8],
        topics: ["G6·C2", "G7·A1", "G6·D2"],
        subject: "chemistry",
        example: {
          setup: "A block of metal has a mass of 54 g and a volume of 20 cm³.",
          working: "ρ = 54 g ÷ 20 cm³",
          answer: "2.7 g/cm³, which identifies it as aluminium",
        },
        sims: ["chem.states", "chem.gas-laws"],
        note:
          "Density is a property of the material, not of the lump. Saw an aluminium bar " +
          "in half and each half has half the mass, half the volume and exactly the same " +
          "density — which is why density identifies a substance and mass cannot.",
      },
      {
        id: "matter.floating",
        name: "An object floats when it is less dense than the fluid around it",
        expression: "ρ object < ρ fluid",
        symbols: [
          { sym: "ρ object", means: "average density of the whole object, air spaces included", unit: "g/cm³" },
          { sym: "ρ fluid", means: "density of the liquid or gas it sits in", unit: "g/cm³" },
        ],
        grades: [6, 7],
        topics: ["G6·C2", "G7·A1"],
        subject: "chemistry",
        example: {
          setup: "Cooking oil of density 0.92 g/cm³ is poured into water of density 1.00 g/cm³.",
          working: "0.92 g/cm³ < 1.00 g/cm³",
          answer: "the oil floats and forms a layer on top",
        },
        sims: ["chem.states"],
        note:
          "It is the average density that matters, which is how a steel ship floats: the " +
          "hull encloses a great deal of air, so the ship as a whole is less dense than " +
          "water even though steel is not.",
      },
      {
        id: "matter.boyle",
        name: "Squeeze a gas into half the space at the same temperature and its pressure doubles",
        expression: "P₁ × V₁ = P₂ × V₂",
        rearranged: ["P₂ = (P₁ × V₁) ÷ V₂", "V₂ = (P₁ × V₁) ÷ P₂"],
        symbols: [
          { sym: "P₁", means: "pressure before", unit: "kPa" },
          { sym: "V₁", means: "volume before", unit: "L" },
          { sym: "P₂", means: "pressure after", unit: "kPa" },
          { sym: "V₂", means: "volume after", unit: "L" },
        ],
        grades: [6, 7],
        topics: ["G6·D2", "G7·B4"],
        subject: "chemistry",
        example: {
          setup: "2.0 L of air at 100 kPa is pushed down to 0.50 L at the same temperature.",
          working: "P₂ = (100 kPa × 2.0 L) ÷ 0.50 L",
          answer: "400 kPa",
        },
        sims: ["chem.gas-laws"],
        note:
          "The temperature must stay constant, and the gas must not leak. The particles " +
          "themselves are not squashed — they simply hit the walls more often because " +
          "there is less room between collisions.",
      },
      {
        id: "matter.charles",
        name: "Heat a gas that is free to expand and its volume grows in step with its kelvin temperature",
        expression: "V₁ ÷ T₁ = V₂ ÷ T₂",
        rearranged: ["V₂ = V₁ × (T₂ ÷ T₁)", "T₂ = T₁ × (V₂ ÷ V₁)"],
        symbols: [
          { sym: "V₁", means: "volume before", unit: "L" },
          { sym: "T₁", means: "temperature before, in kelvin", unit: "K" },
          { sym: "V₂", means: "volume after", unit: "L" },
          { sym: "T₂", means: "temperature after, in kelvin", unit: "K" },
        ],
        grades: [6, 7],
        topics: ["G6·D2", "G7·B4"],
        subject: "chemistry",
        example: {
          setup: "2.0 L of gas at 300 K is heated to 600 K at constant pressure.",
          working: "V₂ = 2.0 L × (600 K ÷ 300 K)",
          answer: "4.0 L",
        },
        sims: ["chem.gas-laws", "earth.atmosphere"],
        note:
          "Temperatures must be in kelvin. Doubling from 20 °C to 40 °C is nothing like " +
          "doubling the temperature — in kelvin it is 293 K to 313 K, a rise of under 7%, " +
          "and using the Celsius numbers gives a badly wrong answer.",
      },
      {
        id: "matter.mass-number",
        name: "The mass number counts the protons and neutrons together in the nucleus",
        expression: "A = Z + N",
        rearranged: ["N = A − Z", "Z = A − N"],
        symbols: [
          { sym: "A", means: "mass number — the total of protons and neutrons" },
          { sym: "Z", means: "atomic number — the number of protons, which names the element" },
          { sym: "N", means: "number of neutrons in that nucleus" },
        ],
        grades: [7],
        topics: ["G7·A2", "G7·A3"],
        subject: "chemistry",
        example: {
          setup: "A carbon atom has 6 protons and 8 neutrons.",
          working: "A = 6 + 8",
          answer: "14, so this is carbon-14",
        },
        sims: ["chem.build-atom", "chem.periodic-table"],
        note:
          "Change Z and you have a different element; change only N and you have an " +
          "isotope of the same element. In a neutral atom the number of electrons equals " +
          "Z, but electrons are far too light to appear in the mass number.",
      },
      {
        id: "matter.percent-composition",
        name: "Percent composition is the share of a compound's mass contributed by one element",
        expression: "% element = (mass of element ÷ mass of compound) × 100",
        rearranged: ["mass of element = % element ÷ 100 × mass of compound"],
        symbols: [
          { sym: "% element", means: "percentage of the total mass made up by that element", unit: "%" },
          { sym: "mass of element", means: "mass of that one element in the sample", unit: "g" },
          { sym: "mass of compound", means: "mass of the whole sample", unit: "g" },
        ],
        grades: [7],
        topics: ["G7·A4"],
        subject: "chemistry",
        example: {
          setup: "18.0 g of water contains 16.0 g of oxygen.",
          working: "% element = (16 g ÷ 18 g) × 100",
          answer: "88.9% oxygen by mass",
        },
        sims: ["chem.molecules", "chem.periodic-table"],
        note:
          "Percent by mass is not percent by atom count. Water is 88.9% oxygen by mass " +
          "but two of its three atoms are hydrogen — hydrogen atoms are simply very light.",
      },
      {
        id: "matter.formula-mass",
        name: "A compound's formula mass is the masses of all its atoms added together",
        expression: "M = (n₁ × A₁) + (n₂ × A₂) + …",
        symbols: [
          { sym: "M", means: "formula mass of the compound", unit: "atomic mass units" },
          { sym: "n₁", means: "how many atoms of the first element the formula shows" },
          { sym: "A₁", means: "relative atomic mass of the first element, read off the periodic table" },
          { sym: "n₂", means: "how many atoms of the second element" },
          { sym: "A₂", means: "relative atomic mass of the second element" },
        ],
        grades: [7],
        topics: ["G7·A4", "G7·A3"],
        subject: "chemistry",
        example: {
          setup: "Water is H₂O; hydrogen has a relative atomic mass of 1.0 and oxygen 16.0.",
          working: "M = (2 × 1.0) + (1 × 16.0)",
          answer: "18.0",
        },
        sims: ["chem.molecules", "chem.periodic-table"],
        note:
          "Read the subscripts carefully — the 2 in H₂O applies only to the hydrogen. " +
          "Formula mass has no unit at this level; it is a comparison against a standard " +
          "atom, not a mass in grams.",
      },
      {
        id: "matter.atom-count",
        name: "The atoms in a written formula are the coefficient multiplied by the subscript",
        expression: "atoms = coefficient × subscript",
        symbols: [
          { sym: "atoms", means: "how many atoms of that element are present" },
          { sym: "coefficient", means: "the big number in front, which multiplies the whole formula" },
          { sym: "subscript", means: "the small number after a symbol, counting atoms inside one unit" },
        ],
        grades: [7],
        topics: ["G7·A4", "G7·B3"],
        subject: "chemistry",
        example: {
          setup: "How many hydrogen atoms are in 3H₂O?",
          working: "atoms = 3 × 2",
          answer: "6 hydrogen atoms",
        },
        sims: ["chem.molecules", "chem.conservation"],
        note:
          "A coefficient may be changed to balance an equation; a subscript never may. " +
          "Turning H₂O into H₂O₂ to make the oxygens balance changes water into hydrogen " +
          "peroxide — a different substance entirely.",
      },
    ],
  },

  /* ================================================================== *
   * Heat and temperature
   * ================================================================== */
  {
    id: "heat",
    title: "Heat and Temperature",
    blurb: "Thermal energy always flows from hot to cold — how much moves, and what it does when it arrives.",
    subject: "physics",
    formulas: [
      {
        id: "heat.temperature-change",
        name: "A temperature change is the final temperature minus the starting one",
        expression: "ΔT = T₂ − T₁",
        rearranged: ["T₂ = T₁ + ΔT"],
        symbols: [
          { sym: "ΔT", means: "change in temperature — negative if it cooled", unit: "°C" },
          { sym: "T₂", means: "temperature at the end", unit: "°C" },
          { sym: "T₁", means: "temperature at the start", unit: "°C" },
        ],
        grades: [6, 7],
        topics: ["G6·C2", "G6·C4"],
        subject: "physics",
        example: {
          setup: "Water in a beaker starts at 22 °C and finishes at 65 °C.",
          working: "ΔT = 65 − 22",
          answer: "43 °C",
        },
        sims: ["phys.heat-transfer", "chem.heating-curve"],
        note:
          "ΔT is a difference, not a temperature — a rise of 43 °C is the same size as a " +
          "rise of 43 K. Always subtract in the order final minus initial so cooling comes " +
          "out negative.",
      },
      {
        id: "heat.specific-heat",
        name: "The energy needed to warm something depends on its mass, its material and how far you warm it",
        expression: "q = m × c × ΔT",
        rearranged: ["ΔT = q ÷ (m × c)", "c = q ÷ (m × ΔT)", "m = q ÷ (c × ΔT)"],
        symbols: [
          { sym: "q", means: "thermal energy transferred", unit: "J" },
          { sym: "m", means: "mass being heated", unit: "kg" },
          { sym: "c", means: "specific heat capacity of the material (4200 for water)", unit: "J/(kg·°C)" },
          { sym: "ΔT", means: "temperature change produced", unit: "°C" },
        ],
        grades: [6, 7],
        topics: ["G6·C4", "G6·C2"],
        subject: "chemistry",
        example: {
          setup: "0.5 kg of water is heated from 20 °C to 40 °C.",
          working: "q = 0.5 kg × 4200 J/(kg·°C) × 20 °C",
          answer: "42000 J",
        },
        sims: ["chem.heating-curve", "phys.heat-transfer"],
        note:
          "Water's specific heat capacity is unusually large, which is why a coastal city " +
          "stays milder than an inland one and why sand at the beach burns your feet while " +
          "the sea is still cold. Doubling the mass doubles the energy needed for the same " +
          "rise.",
      },
      {
        id: "heat.latent",
        name: "Melting or boiling takes energy without changing the temperature at all",
        expression: "Q = m × L",
        rearranged: ["L = Q ÷ m", "m = Q ÷ L"],
        symbols: [
          { sym: "Q", means: "energy absorbed during the state change", unit: "J" },
          { sym: "m", means: "mass changing state", unit: "kg" },
          { sym: "L", means: "latent heat — energy per kilogram for that change (334000 to melt ice)", unit: "J/kg" },
        ],
        grades: [7],
        topics: ["G7·B4"],
        subject: "chemistry",
        example: {
          setup: "0.20 kg of ice at 0 °C is melted into water at 0 °C.",
          working: "Q = 0.20 kg × 334000 J/kg",
          answer: "66800 J",
        },
        sims: ["chem.heating-curve", "chem.states"],
        note:
          "This is why a heating curve has flat sections. The energy is going into pulling " +
          "the particles apart from one another, not into speeding them up, so the " +
          "thermometer sits still while energy keeps pouring in.",
      },
      {
        id: "heat.equilibrium",
        name: "When two things touch, the energy one loses is the energy the other gains, until both reach the same temperature",
        expression: "q lost = q gained",
        symbols: [
          { sym: "q lost", means: "thermal energy given up by the hotter object", unit: "J" },
          { sym: "q gained", means: "thermal energy taken in by the cooler object", unit: "J" },
        ],
        grades: [6, 7],
        topics: ["G6·C3", "G6·C4"],
        subject: "physics",
        example: {
          setup: "A hot metal block gives up 4200 J to 0.10 kg of water in an insulated cup.",
          working: "ΔT = 4200 J ÷ (0.10 kg × 4200 J/(kg·°C))",
          answer: "10 °C rise in the water",
        },
        sims: ["phys.heat-transfer"],
        note:
          "Thermal equilibrium means equal temperatures, not equal energy — the water " +
          "still holds far more thermal energy than the small block. Nothing flows from " +
          "cold to hot on its own.",
      },
      {
        id: "heat.celsius-kelvin",
        name: "The kelvin scale is the Celsius scale shifted so that zero means no particle motion at all",
        expression: "T = θ + 273",
        rearranged: ["θ = T − 273"],
        symbols: [
          { sym: "T", means: "absolute temperature", unit: "K" },
          { sym: "θ", means: "the same temperature in Celsius", unit: "°C" },
        ],
        grades: [6, 7],
        topics: ["G6·C2", "G7·B4"],
        subject: "physics",
        example: {
          setup: "A room is at 25 °C.",
          working: "T = 25 + 273",
          answer: "298 K",
        },
        sims: ["chem.states", "chem.gas-laws"],
        note:
          "Kelvin takes no degree sign — write 298 K, not 298 °K. A change of one kelvin " +
          "is the same size as a change of one degree Celsius, so only convert absolute " +
          "temperatures, never temperature differences.",
      },
      {
        id: "heat.celsius-fahrenheit",
        name: "Fahrenheit degrees are smaller than Celsius degrees and start from a different zero",
        expression: "F = θ × 9 ÷ 5 + 32",
        rearranged: ["θ = (F − 32) × 5 ÷ 9"],
        symbols: [
          { sym: "F", means: "temperature on the Fahrenheit scale", unit: "°F" },
          { sym: "θ", means: "the same temperature in Celsius", unit: "°C" },
        ],
        grades: [6],
        topics: ["G6·C2", "G6·D3"],
        subject: "physics",
        example: {
          setup: "A pleasant Sacramento morning reads 20 °C.",
          working: "F = 20 × 9 ÷ 5 + 32",
          answer: "68 °F",
        },
        sims: ["earth.weather"],
        note:
          "Do the multiplication before the addition, or 20 °C comes out as a nonsense " +
          "94 °F. A useful check: −40 is the one temperature where both scales agree.",
      },
    ],
  },

  /* ================================================================== *
   * Chemical change
   * ================================================================== */
  {
    id: "chemical-change",
    title: "Chemical Change",
    blurb: "Atoms are rearranged in a reaction, never created or destroyed — every calculation here follows from that.",
    subject: "chemistry",
    formulas: [
      {
        id: "chem.conservation-mass",
        name: "The total mass of the products equals the total mass of the reactants",
        expression: "total mass of reactants = total mass of products",
        symbols: [
          { sym: "total mass of reactants", means: "mass of everything that went into the reaction", unit: "g" },
          { sym: "total mass of products", means: "mass of everything that came out, gases included", unit: "g" },
        ],
        grades: [7],
        topics: ["G7·B3"],
        subject: "chemistry",
        example: {
          setup: "8.0 g of methane burns completely in 32.0 g of oxygen inside a sealed vessel.",
          working: "mass of products = 8.0 g + 32.0 g",
          answer: "40.0 g of carbon dioxide and water together",
        },
        sims: ["chem.conservation", "chem.reactions"],
        note:
          "This follows from atom conservation: the same atoms come out that went in, " +
          "only bonded differently. Mass is conserved in every reaction — a burning log " +
          "seems to lose mass only because the carbon dioxide and water vapour leave.",
      },
      {
        id: "chem.open-container",
        name: "Mass appears to fall in an open container only because a gas has escaped",
        expression: "mass measured after = mass before − mass of gas released",
        rearranged: ["mass of gas released = mass before − mass measured after"],
        symbols: [
          { sym: "mass measured after", means: "what the balance reads once the reaction finishes", unit: "g" },
          { sym: "mass before", means: "mass of the reactants and the container at the start", unit: "g" },
          { sym: "mass of gas released", means: "mass of gas that left the open container", unit: "g" },
        ],
        grades: [7],
        topics: ["G7·B3"],
        subject: "chemistry",
        example: {
          setup: "12.0 g of marble chips and acid react in an open flask, releasing 2.2 g of carbon dioxide.",
          working: "mass measured after = 12.0 g − 2.2 g",
          answer: "9.8 g on the balance",
        },
        sims: ["chem.conservation", "chem.reactions"],
        note:
          "Nothing has been destroyed — seal the same reaction in a closed flask and the " +
          "balance reading never changes. The reverse case catches students out too: " +
          "steel wool gains mass when it burns, because oxygen from the air joins it.",
      },
      {
        id: "chem.balanced-equation",
        name: "A balanced equation shows the same number of every kind of atom on both sides",
        expression: "CH₄ + 2O₂ → CO₂ + 2H₂O",
        symbols: [
          { sym: "CH₄", means: "methane, the fuel being burned" },
          { sym: "O₂", means: "oxygen from the air" },
          { sym: "CO₂", means: "carbon dioxide produced" },
          { sym: "H₂O", means: "water produced" },
        ],
        grades: [7],
        topics: ["G7·B3", "G7·A4"],
        subject: "chemistry",
        example: {
          setup: "Count each element on both sides of the burning-methane equation.",
          working: "left: 1 C, 4 H, 4 O — right: 1 C, 4 H, 4 O",
          answer: "balanced, because every atom is accounted for",
        },
        sims: ["chem.conservation", "chem.reactions", "chem.molecules"],
        note:
          "Balance by changing the numbers in front, never the small numbers inside a " +
          "formula. The arrow means 'becomes', not 'equals' — it points from reactants to " +
          "products.",
      },
      {
        id: "chem.energy-released",
        name: "A reaction that warms its surroundings has released energy; one that cools them has absorbed it",
        expression: "q released = m × c × ΔT",
        symbols: [
          { sym: "q released", means: "energy given out by the reaction into the water or surroundings", unit: "J" },
          { sym: "m", means: "mass of the surroundings being warmed, usually water", unit: "kg" },
          { sym: "c", means: "specific heat capacity of those surroundings (4200 for water)", unit: "J/(kg·°C)" },
          { sym: "ΔT", means: "temperature change measured in the surroundings", unit: "°C" },
        ],
        grades: [7],
        topics: ["G7·B6", "G7·B2"],
        subject: "chemistry",
        example: {
          setup: "A hand-warmer reaction raises 0.10 kg of water by 25 °C.",
          working: "q released = 0.10 kg × 4200 J/(kg·°C) × 25 °C",
          answer: "10500 J released",
        },
        sims: ["chem.reactions"],
        note:
          "The energy is not created by the reaction — it was already stored in the bonds " +
          "of the reactants. A temperature drop is just as much a sign of a reaction as a " +
          "rise; an instant cold pack absorbs energy from your hand.",
      },
    ],
  },

  /* ================================================================== *
   * Earth and space
   * ================================================================== */
  {
    id: "earth-space",
    title: "Earth and Space",
    blurb: "Distances too large and times too long to picture, made manageable by a handful of ratios.",
    subject: "earth",
    formulas: [
      {
        id: "earth.astronomical-unit",
        name: "The astronomical unit measures solar-system distances in Earth-orbits instead of kilometres",
        expression: "d(AU) = d(km) ÷ 149600000",
        rearranged: ["d(km) = d(AU) × 149600000"],
        symbols: [
          { sym: "d(AU)", means: "the distance expressed in astronomical units", unit: "AU" },
          { sym: "d(km)", means: "the same distance in kilometres", unit: "km" },
        ],
        grades: [8],
        topics: ["G8·E4"],
        subject: "earth",
        example: {
          setup: "Jupiter orbits about 778000000 km from the Sun.",
          working: "d(AU) = 778000000 km ÷ 149600000 km",
          answer: "5.2 AU",
        },
        note:
          "One AU is the average Earth-Sun distance, so Earth's orbit is 1 AU by " +
          "definition. It is useful inside the solar system and hopeless beyond it — the " +
          "nearest star is over 270000 AU away, which is why light years take over.",
      },
      {
        id: "earth.light-travel-time",
        name: "Light takes real time to cross space, so distance divided by the speed of light gives the delay",
        expression: "t = d ÷ c",
        rearranged: ["d = c × t"],
        symbols: [
          { sym: "t", means: "time the light takes to arrive", unit: "s" },
          { sym: "d", means: "distance the light travels", unit: "km" },
          { sym: "c", means: "speed of light, 300000 km/s in a vacuum", unit: "km/s" },
        ],
        grades: [8],
        topics: ["G8·E4", "G8·D3"],
        subject: "earth",
        example: {
          setup: "The Sun is about 150000000 km from Earth.",
          working: "t = 150000000 km ÷ 300000 km/s",
          answer: "500 s, which is about 8.3 minutes",
        },
        sims: ["phys.em-spectrum"],
        note:
          "Looking out into space is looking back in time. Sunlight left the Sun eight " +
          "minutes ago, and the light from a distant galaxy left before there were people " +
          "to see it.",
      },
      {
        id: "earth.orbital-period",
        name: "The further a planet orbits from the Sun, the longer its year",
        expression: "T² = a³",
        rearranged: ["T = √(a × a × a) with T in years and a in AU"],
        symbols: [
          { sym: "T", means: "orbital period — the length of that planet's year", unit: "years" },
          { sym: "a", means: "average distance from the Sun", unit: "AU" },
        ],
        grades: [8],
        topics: ["G8·E3", "G8·E4"],
        subject: "earth",
        example: {
          setup: "Mars orbits at an average distance of 1.52 AU.",
          working: "T = √(1.52 × 1.52 × 1.52)",
          answer: "1.88 years",
        },
        note:
          "This tidy form works only in these units — years and AU — and it is Earth's " +
          "own orbit that makes the numbers come out so neatly. Grade 8 needs the pattern " +
          "rather than the algebra: further out means both a longer path and a slower " +
          "orbital speed.",
      },
      {
        id: "earth.synodic-month",
        name: "The Moon's phase cycle takes longer than its orbit, because Earth moves round the Sun meanwhile",
        expression: "1 ÷ S = 1 ÷ P − 1 ÷ E",
        symbols: [
          { sym: "S", means: "synodic month — new Moon to new Moon", unit: "days" },
          { sym: "P", means: "the Moon's orbital period against the stars, 27.3", unit: "days" },
          { sym: "E", means: "Earth's orbital period, 365.25", unit: "days" },
        ],
        grades: [8],
        topics: ["G8·E1"],
        subject: "earth",
        example: {
          setup: "Work out how often the Moon returns to the same phase.",
          working: "1 ÷ S = 1 ÷ 27.3 days − 1 ÷ 365.25 days",
          answer: "29.5 days",
        },
        sims: ["earth.moon-phases"],
        note:
          "The two-day gap between the 27.3-day orbit and the 29.5-day phase cycle is the " +
          "whole idea: by the time the Moon has gone round once, Earth has moved along its " +
          "own orbit and the Moon must swing a little further to line up with the Sun " +
          "again.",
      },
      {
        id: "earth.half-life",
        name: "Every half-life leaves half of the radioactive parent atoms that were there before",
        expression: "N = N₀ ÷ 2ⁿ",
        rearranged: ["n = t ÷ T½", "N ÷ N₀ = 1 ÷ 2ⁿ"],
        symbols: [
          { sym: "N", means: "parent atoms (or mass) still left", unit: "g" },
          { sym: "N₀", means: "parent atoms (or mass) at the start", unit: "g" },
          { sym: "ⁿ", means: "n, the number of half-lives that have passed" },
        ],
        grades: [8],
        topics: ["G8·E6"],
        subject: "earth",
        example: {
          setup: "80 g of an isotope with a 5730-year half-life is left for 17190 years.",
          working: "N = 80 g ÷ 2³, since 17190 years ÷ 5730 years is 3 half-lives",
          answer: "10 g of parent isotope left",
        },
        sims: ["earth.radiometric"],
        note:
          "Halving never reaches zero — after ten half-lives about a thousandth is still " +
          "there. Decay is also unaffected by heating, crushing or dissolving the sample, " +
          "which is what makes it such a reliable clock.",
      },
      {
        id: "earth.fraction-remaining",
        name: "The fraction of parent atoms left tells you how many half-lives have gone by",
        expression: "fraction left = 1 ÷ 2ⁿ",
        symbols: [
          { sym: "fraction left", means: "share of the original parent atoms still undecayed" },
          { sym: "ⁿ", means: "n, the number of half-lives elapsed" },
        ],
        grades: [8],
        topics: ["G8·E6"],
        subject: "earth",
        example: {
          setup: "A mineral is found to hold one quarter of its original parent isotope.",
          working: "fraction left = 1 ÷ 2ⁿ with n = 2",
          answer: "0.25, so two half-lives have passed",
        },
        sims: ["earth.radiometric"],
        note:
          "Parent and daughter always add to the whole, so a quarter parent means three " +
          "quarters daughter. A half-and-half ratio is exactly one half-life, not two.",
      },
      {
        id: "earth.radiometric-age",
        name: "A rock's radiometric age is the number of half-lives multiplied by the length of one",
        expression: "age = n × T½",
        rearranged: ["n = age ÷ T½"],
        symbols: [
          { sym: "age", means: "time since the mineral crystallised", unit: "years" },
          { sym: "n", means: "number of half-lives worked out from the parent-daughter ratio" },
          { sym: "T½", means: "half-life of the isotope used", unit: "years" },
        ],
        grades: [8],
        topics: ["G8·E6", "G8·E5"],
        subject: "earth",
        example: {
          setup: "A granite holds one eighth of its original potassium-40, whose half-life is 1.3 billion years.",
          working: "age = 3 × 1.3 billion years",
          answer: "3.9 billion years",
        },
        sims: ["earth.radiometric", "earth.strata"],
        note:
          "Radiometric dating gives the age of the mineral's crystallisation, not of the " +
          "fossil lying beside it. Sedimentary rock is dated indirectly, by dating igneous " +
          "layers above and below and bracketing the fossil between them.",
      },
      {
        id: "earth.spreading-rate",
        name: "A seafloor spreading rate is the distance from the ridge divided by the age of that seafloor",
        expression: "rate = d ÷ t",
        rearranged: ["d = rate × t", "t = d ÷ rate"],
        symbols: [
          { sym: "rate", means: "rate at which new seafloor moves away from the ridge", unit: "cm/year" },
          { sym: "d", means: "distance from the ridge crest to the sample", unit: "km" },
          { sym: "t", means: "radiometric age of the seafloor there", unit: "years" },
        ],
        grades: [7],
        topics: ["G7·E4", "G7·E3"],
        subject: "earth",
        example: {
          setup: "Basalt 60 km from a ridge crest is dated at 3 million years old.",
          working: "rate = 60 km ÷ 3 million years",
          answer: "20 km per million years, which is 2 cm each year",
        },
        sims: ["earth.plate-tectonics"],
        note:
          "This is a half-rate — new crust forms on both sides of the ridge, so the two " +
          "plates separate at twice this figure. Matching magnetic stripes on either side " +
          "of the ridge is the evidence that the seafloor really is spreading.",
      },
      {
        id: "earth.plate-motion",
        name: "A plate's speed is how far a marker has moved divided by how long it took",
        expression: "v = d ÷ t",
        rearranged: ["d = v × t", "t = d ÷ v"],
        symbols: [
          { sym: "v", means: "speed of the plate", unit: "m/year" },
          { sym: "d", means: "distance a feature has been offset or displaced", unit: "m" },
          { sym: "t", means: "time over which it moved", unit: "years" },
        ],
        grades: [7],
        topics: ["G7·E3", "G7·E5"],
        subject: "earth",
        example: {
          setup: "A stream channel crossing the San Andreas fault is offset by 128 m of movement built up over 3200 years.",
          working: "v = 128 m ÷ 3200 years",
          answer: "0.04 m per year, about 4 cm each year",
        },
        sims: ["earth.plate-tectonics", "earth.erosion"],
        note:
          "Plates move about as fast as fingernails grow — slow, but over millions of " +
          "years it moves continents. The motion is not smooth: the fault sticks for " +
          "decades and then slips metres in seconds, which is the earthquake.",
      },
      {
        id: "earth.albedo",
        name: "Albedo is the fraction of the sunlight hitting a surface that is reflected straight back",
        expression: "albedo = reflected energy ÷ incoming energy",
        rearranged: ["reflected energy = albedo × incoming energy"],
        symbols: [
          { sym: "albedo", means: "reflected share, from 0 for perfectly black to 1 for a perfect mirror" },
          { sym: "reflected energy", means: "sunlight bounced back off the surface", unit: "W/m²" },
          { sym: "incoming energy", means: "sunlight arriving at the surface", unit: "W/m²" },
        ],
        grades: [6],
        topics: ["G6·D5", "G6·F1"],
        subject: "earth",
        example: {
          setup: "Fresh snow receives 400 W/m² of sunlight and reflects 340 W/m² of it.",
          working: "albedo = 340 W/m² ÷ 400 W/m²",
          answer: "0.85, or 85% reflected",
        },
        sims: ["earth.unequal-heating"],
        note:
          "Albedo is a ratio, so it has no unit and can never exceed 1. What is reflected " +
          "is not absorbed, which is why dark ocean warms far faster than bright ice — and " +
          "why melting ice speeds up the warming that melted it.",
      },
      {
        id: "earth.energy-balance",
        name: "Earth's temperature holds steady only while the energy arriving equals the energy leaving",
        expression: "Eᵢₙ = Eₒᵤₜ",
        rearranged: ["imbalance = Eᵢₙ − Eₒᵤₜ"],
        symbols: [
          { sym: "Eᵢₙ", means: "solar energy absorbed by Earth each second per square metre", unit: "W/m²" },
          { sym: "Eₒᵤₜ", means: "energy radiated back to space over the same area", unit: "W/m²" },
        ],
        grades: [6],
        topics: ["G6·F1", "G6·F3"],
        subject: "earth",
        example: {
          setup: "Earth absorbs about 340 W/m² of sunlight while radiating about 339 W/m² back to space.",
          working: "imbalance = 340 W/m² − 339 W/m²",
          answer: "1 W/m² retained, so the system warms",
        },
        note:
          "The planet does not warm because it gets more sunlight; it warms because it " +
          "loses less. Greenhouse gases change the outgoing side of this balance, and the " +
          "warming continues until the two sides are equal again at a higher temperature.",
      },
      {
        id: "earth.lapse-rate",
        name: "Air cools by roughly six and a half degrees for every kilometre you climb",
        expression: "ΔT = lapse rate × Δh",
        rearranged: ["Δh = ΔT ÷ lapse rate"],
        symbols: [
          { sym: "ΔT", means: "temperature change with height", unit: "°C" },
          { sym: "lapse rate", means: "how fast the air cools with altitude, about −6.5", unit: "°C/km" },
          { sym: "Δh", means: "height climbed", unit: "km" },
        ],
        grades: [6],
        topics: ["G6·D5", "G6·D2"],
        subject: "earth",
        example: {
          setup: "A hiker climbs 3 km from a Central Valley trailhead into the Sierra Nevada.",
          working: "ΔT = −6.5 °C/km × 3 km",
          answer: "−19.5 °C, so the summit is about 20 degrees colder",
        },
        sims: ["earth.atmosphere", "earth.unequal-heating"],
        note:
          "Higher does not mean closer to the Sun in any way that matters — air thins with " +
          "altitude, so it holds less energy and radiates it away faster. The figure is an " +
          "average; the real rate depends on how moist the air is.",
      },
      {
        id: "earth.relative-humidity",
        name: "Relative humidity compares the water vapour in the air with the most that air could hold",
        expression: "RH = actual vapour ÷ maximum vapour × 100",
        rearranged: ["actual vapour = RH ÷ 100 × maximum vapour"],
        symbols: [
          { sym: "RH", means: "relative humidity", unit: "%" },
          { sym: "actual vapour", means: "water vapour actually present in a cubic metre of air", unit: "g/m³" },
          { sym: "maximum vapour", means: "most that air could hold at its current temperature", unit: "g/m³" },
        ],
        grades: [6],
        topics: ["G6·D3", "G6·D1"],
        subject: "earth",
        example: {
          setup: "Air holding 12 g/m³ of vapour could hold 24 g/m³ at its current temperature.",
          working: "RH = 12 g/m³ ÷ 24 g/m³ × 100",
          answer: "50%",
        },
        sims: ["earth.weather", "earth.water-cycle"],
        note:
          "Warm air can hold far more vapour, so the same water gives a lower relative " +
          "humidity on a warm afternoon than at dawn. Cool the air until RH reaches 100% " +
          "and you have found the dew point — which is when fog, dew or cloud forms.",
      },
      {
        id: "earth.residence-time",
        name: "Residence time is how long a typical molecule stays in a reservoir before moving on",
        expression: "residence time = amount stored ÷ rate in or out",
        rearranged: ["amount stored = residence time × rate in or out"],
        symbols: [
          { sym: "residence time", means: "average time a molecule spends in that store", unit: "years" },
          { sym: "amount stored", means: "how much the reservoir holds", unit: "km³" },
          { sym: "rate in or out", means: "how much enters (and leaves) each year at steady state", unit: "km³/year" },
        ],
        grades: [6],
        topics: ["G6·D1", "G6·A2"],
        subject: "earth",
        example: {
          setup: "The atmosphere holds about 12900 km³ of water, and about 505000 km³ falls as precipitation each year.",
          working: "residence time = 12900 km³ ÷ 505000 km³ per year",
          answer: "0.0255 years, roughly 9 days",
        },
        sims: ["earth.water-cycle", "earth.spheres"],
        note:
          "This only makes sense for a reservoir in balance, with as much entering as " +
          "leaving. The contrast is the lesson: water spends about nine days in the air " +
          "and thousands of years in the deep ocean or an ice sheet.",
      },
      {
        id: "earth.magnitude-scale",
        name: "Each step up the earthquake magnitude scale multiplies the ground shaking about tenfold",
        expression: "shaking ratio = 10ⁿ",
        symbols: [
          { sym: "shaking ratio", means: "how many times larger the ground movement is" },
          { sym: "ⁿ", means: "n, the difference between the two magnitudes" },
        ],
        grades: [7],
        topics: ["G7·F1", "G7·F2"],
        subject: "earth",
        example: {
          setup: "Compare a magnitude 6.0 earthquake with a magnitude 4.0 one.",
          working: "shaking ratio = 10ⁿ with n = 6.0 − 4.0 = 2.0",
          answer: "100 times the ground movement",
        },
        note:
          "The scale is logarithmic, so a magnitude 6 is not 50% worse than a magnitude 4 " +
          "— it shakes the ground 100 times as far and releases roughly 1000 times the " +
          "energy. Damage also depends on depth, distance and the ground beneath the " +
          "buildings.",
      },
    ],
  },

  /* ================================================================== *
   * Life systems
   * ================================================================== */
  {
    id: "life",
    title: "Life Systems",
    blurb: "Cells, bodies and ecosystems all run on the same accounting: matter cycles, energy flows one way and thins out.",
    subject: "biology",
    formulas: [
      {
        id: "life.photosynthesis",
        name: "Photosynthesis builds sugar from carbon dioxide and water, using light energy",
        expression: "6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂",
        rearranged: ["carbon dioxide + water + light → glucose + oxygen"],
        symbols: [
          { sym: "CO₂", means: "carbon dioxide taken in from the air" },
          { sym: "H₂O", means: "water drawn up from the roots" },
          { sym: "light energy", means: "sunlight captured by chlorophyll in the chloroplasts" },
          { sym: "C₆H₁₂O₆", means: "glucose, the sugar the plant builds and stores" },
          { sym: "O₂", means: "oxygen released as a by-product" },
        ],
        grades: [6, 7],
        topics: ["G7·C1", "G7·C2", "G7·C5"],
        subject: "biology",
        example: {
          setup: "Count the atoms on each side to check that nothing is created or destroyed.",
          working: "left: 6 C, 12 H, 18 O — right: 6 C, 12 H, 18 O",
          answer: "balanced — the plant rearranges atoms, it does not make them",
        },
        sims: ["bio.photosynthesis", "bio.carbon-cycle", "bio.cell"],
        note:
          "Almost all of a tree's dry mass came out of the air, not the soil — the carbon " +
          "in every C₆H₁₂O₆ arrived as CO₂. Light is an energy input, not a reactant, " +
          "which is why it sits above the arrow in most textbooks.",
      },
      {
        id: "life.respiration",
        name: "Cellular respiration releases the energy stored in sugar, running photosynthesis backwards",
        expression: "C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + energy released",
        rearranged: ["glucose + oxygen → carbon dioxide + water + energy"],
        symbols: [
          { sym: "C₆H₁₂O₆", means: "glucose broken down for its stored energy" },
          { sym: "O₂", means: "oxygen taken in from air or water" },
          { sym: "CO₂", means: "carbon dioxide breathed out" },
          { sym: "H₂O", means: "water produced as a product" },
          { sym: "energy released", means: "energy made available to the cell for movement, growth and warmth" },
        ],
        grades: [6, 7],
        topics: ["G7·C3", "G7·C4", "G7·C5"],
        subject: "biology",
        example: {
          setup: "Compare this equation with photosynthesis.",
          working: "the products of one are the reactants of the other, atom for atom",
          answer: "the two processes are chemical opposites linked in a cycle",
        },
        sims: ["bio.photosynthesis", "bio.carbon-cycle", "bio.cell"],
        note:
          "Respiration is not breathing. It happens inside cells, in every living thing, " +
          "day and night — plants respire too, which is why a sealed plant in the dark " +
          "runs out of oxygen. Energy is released from the sugar, never created.",
      },
      {
        id: "life.trophic-transfer",
        name: "Only about a tenth of the energy at one feeding level reaches the next",
        expression: "energy passed on = energy available × 0.10",
        rearranged: ["energy n levels up = starting energy × 0.10ⁿ"],
        symbols: [
          { sym: "energy passed on", means: "energy that becomes biomass in the level above", unit: "kJ" },
          { sym: "energy available", means: "energy stored in the level below", unit: "kJ" },
        ],
        grades: [7],
        topics: ["G7·D2", "G7·D3"],
        subject: "biology",
        example: {
          setup: "Producers in a meadow store 10000 kJ of energy.",
          working: "energy passed on = 10000 kJ × 0.10",
          answer: "1000 kJ reaching the herbivores",
        },
        sims: ["bio.food-web", "bio.ecosystem"],
        note:
          "The other 90% is not destroyed. Most is released as heat during respiration, " +
          "and the rest leaves in waste or in parts nobody eats. This is why food chains " +
          "rarely run past four or five levels, and why top predators are always rare.",
      },
      {
        id: "life.population-growth",
        name: "A population grows by births and arrivals and shrinks by deaths and departures",
        expression: "growth rate = (births + immigration) − (deaths + emigration)",
        symbols: [
          { sym: "growth rate", means: "change in the number of individuals per year", unit: "individuals/year" },
          { sym: "births", means: "individuals born in the year" },
          { sym: "immigration", means: "individuals that moved in" },
          { sym: "deaths", means: "individuals that died" },
          { sym: "emigration", means: "individuals that moved out" },
        ],
        grades: [7, 8],
        topics: ["G7·D1", "G8·F6"],
        subject: "biology",
        example: {
          setup: "In one year a deer herd records 120 births, 45 deaths, 10 arrivals and 25 departures.",
          working: "growth rate = (120 + 10) − (45 + 25)",
          answer: "60 more deer per year",
        },
        sims: ["bio.ecosystem", "bio.human-impact"],
        note:
          "A positive growth rate cannot continue indefinitely. Once a limiting resource " +
          "runs short the population levels off near the carrying capacity, and a " +
          "population may fall while births still outnumber deaths if enough individuals " +
          "leave.",
      },
      {
        id: "life.percent-growth",
        name: "A percentage growth rate compares the change with the population it came from",
        expression: "r = ΔN ÷ N × 100",
        rearranged: ["ΔN = r ÷ 100 × N"],
        symbols: [
          { sym: "r", means: "growth rate as a percentage per year", unit: "%/year" },
          { sym: "ΔN", means: "change in the number of individuals over the year" },
          { sym: "N", means: "population size at the start of the year" },
        ],
        grades: [7, 8],
        topics: ["G7·D1", "G8·F6"],
        subject: "biology",
        example: {
          setup: "A herd of 1500 deer grows by 60 animals in a year.",
          working: "r = 60 ÷ 1500 × 100",
          answer: "4% per year",
        },
        sims: ["bio.ecosystem", "bio.human-impact"],
        note:
          "A steady percentage means the numbers added grow every year, because the " +
          "population it is a percentage of is growing too. That is what makes a graph of " +
          "unchecked growth curve upwards rather than climb in a straight line.",
      },
      {
        id: "life.human-impact",
        name: "Total human impact is the number of people multiplied by what each person uses",
        expression: "impact = population × consumption per person",
        rearranged: ["consumption per person = impact ÷ population"],
        symbols: [
          { sym: "impact", means: "total resource used, or waste produced", unit: "L/day" },
          { sym: "population", means: "number of people" },
          { sym: "consumption per person", means: "average amount each person uses", unit: "L/day per person" },
        ],
        grades: [8],
        topics: ["G8·F6"],
        subject: "biology",
        example: {
          setup: "A city of 500000 people uses an average of 350 L of water per person each day.",
          working: "impact = 500000 people × 350 L per day",
          answer: "175000000 L per day",
        },
        sims: ["bio.human-impact", "bio.ecosystem"],
        note:
          "Both factors matter, which is why arguments that blame only population or only " +
          "lifestyle are incomplete. Halving per-person use offsets a doubling of the " +
          "population — and one high-consumption person can outweigh many low-consumption " +
          "ones.",
      },
      {
        id: "life.magnification",
        name: "A microscope's total magnification is the eyepiece multiplied by the objective lens",
        expression: "M = Mₑ × Mₒ",
        rearranged: ["Mₒ = M ÷ Mₑ"],
        symbols: [
          { sym: "M", means: "total magnification of the image" },
          { sym: "Mₑ", means: "magnification of the eyepiece, usually 10" },
          { sym: "Mₒ", means: "magnification of the objective lens in use" },
        ],
        grades: [6],
        topics: ["G6·B1", "G6·B2"],
        subject: "biology",
        example: {
          setup: "A student views a slide through a 10× eyepiece and a 40× objective.",
          working: "M = 10 × 40",
          answer: "400 times life size",
        },
        sims: ["bio.cell"],
        note:
          "Magnification is not resolution. Blowing a blurred image up further only makes " +
          "a bigger blur, which is the limit that pushed biologists from light microscopes " +
          "to electron microscopes.",
      },
      {
        id: "life.actual-size",
        name: "The real size of a specimen is its size in the image divided by the magnification",
        expression: "actual size = image size ÷ M",
        rearranged: ["image size = actual size × M", "M = image size ÷ actual size"],
        symbols: [
          { sym: "actual size", means: "true size of the specimen", unit: "mm" },
          { sym: "image size", means: "size measured on the image or drawing", unit: "mm" },
          { sym: "M", means: "magnification used" },
        ],
        grades: [6],
        topics: ["G6·B1"],
        subject: "biology",
        example: {
          setup: "A cell measures 40 mm across in a drawing made at 400× magnification.",
          working: "actual size = 40 mm ÷ 400",
          answer: "0.1 mm, which is 100 micrometres",
        },
        sims: ["bio.cell"],
        note:
          "Measure and calculate in the same unit, then convert at the end. Cells are " +
          "usually quoted in micrometres: 1 mm is 1000 µm.",
      },
      {
        id: "life.surface-area-volume",
        name: "The surface-area-to-volume ratio falls as something grows, which is why cells stay small",
        expression: "SA ÷ V = (6 × s²) ÷ s³ = 6 ÷ s",
        symbols: [
          { sym: "SA", means: "total surface area of a cube-shaped model cell", unit: "mm²" },
          { sym: "V", means: "volume of that model cell", unit: "mm³" },
          { sym: "s", means: "length of one side", unit: "mm" },
        ],
        grades: [6],
        topics: ["G6·B1", "G6·B2"],
        subject: "biology",
        example: {
          setup: "Compare a model cell 1 mm on a side with one 2 mm on a side.",
          working: "SA ÷ V = 6 ÷ 2 mm",
          answer: "3 per mm, half the ratio of the smaller cube",
        },
        sims: ["bio.cell"],
        note:
          "Double the side and the volume grows eight times while the surface grows only " +
          "four — the hungry inside outgrows the membrane that has to feed it. The same " +
          "geometry explains why large organisms need lungs, gills and blood vessels " +
          "instead of simply absorbing what they need through their skin.",
      },
      {
        id: "life.cardiac-output",
        name: "The blood pumped each minute is the heart rate multiplied by the volume pushed out per beat",
        expression: "cardiac output = heart rate × stroke volume",
        rearranged: ["stroke volume = cardiac output ÷ heart rate"],
        symbols: [
          { sym: "cardiac output", means: "volume of blood the heart pumps each minute", unit: "mL/min" },
          { sym: "heart rate", means: "beats per minute", unit: "beats/min" },
          { sym: "stroke volume", means: "blood pushed out by one beat", unit: "mL" },
        ],
        grades: [6],
        topics: ["G6·B4", "G6·B5"],
        subject: "biology",
        example: {
          setup: "A student at rest has a heart rate of 70 beats per minute and a stroke volume of 70 mL.",
          working: "cardiac output = 70 beats/min × 70 mL",
          answer: "4900 mL per minute, about 4.9 litres",
        },
        sims: ["bio.body-systems"],
        note:
          "During exercise both factors rise, which is how the circulatory system delivers " +
          "the extra oxygen the muscles are respiring with. It is a clear case of body " +
          "systems working together rather than separately.",
      },
      {
        id: "life.punnett-probability",
        name: "A Punnett square gives the probability of each offspring type, not a promise about any one offspring",
        expression: "probability = matching boxes ÷ total boxes",
        symbols: [
          { sym: "probability", means: "chance that one offspring shows the trait" },
          { sym: "matching boxes", means: "squares in the grid showing that combination" },
          { sym: "total boxes", means: "squares in the whole grid, normally 4" },
        ],
        grades: [6],
        topics: ["G6·E6", "G6·E5"],
        subject: "biology",
        example: {
          setup: "Two Aa parents are crossed; three of the four squares contain at least one A.",
          working: "probability = 3 ÷ 4",
          answer: "0.75, a 75% chance of the dominant trait",
        },
        sims: ["bio.heredity", "math.probability"],
        note:
          "A 3:1 ratio is a probability, not a guarantee. Four offspring can easily come " +
          "out 4:0 — in the same way four coin tosses need not give two heads. Large " +
          "numbers of offspring are what bring the real ratio close to the prediction.",
      },
    ],
  },

  /* ================================================================== *
   * Maths toolkit
   * ================================================================== */
  {
    id: "math",
    title: "Maths Toolkit",
    blurb: "The handful of mathematical moves that every science topic borrows.",
    subject: "math",
    formulas: [
      {
        id: "math.mean",
        name: "The mean shares the total equally between the measurements",
        expression: "mean = sum of values ÷ number of values",
        rearranged: ["sum of values = mean × number of values"],
        symbols: [
          { sym: "mean", means: "the average value" },
          { sym: "sum of values", means: "every reading added together" },
          { sym: "number of values", means: "how many readings were taken" },
        ],
        grades: [6, 7, 8],
        topics: ["G6·A5", "G6·C4"],
        subject: "math",
        example: {
          setup: "Four repeats of a timing experiment give 12.1, 11.8, 12.4 and 12.1 seconds.",
          working: "mean = (12.1 + 11.8 + 12.4 + 12.1) ÷ 4",
          answer: "12.1 s",
        },
        sims: ["math.probability"],
        note:
          "Repeating and averaging reduces random error but does nothing about a " +
          "systematic one — a stopwatch started late every time gives a precise wrong " +
          "answer. Investigate an obvious outlier rather than quietly averaging it in.",
      },
      {
        id: "math.percent-of",
        name: "A percentage is a number of hundredths of the whole",
        expression: "part = percent ÷ 100 × whole",
        rearranged: ["percent = part ÷ whole × 100", "whole = part ÷ percent × 100"],
        symbols: [
          { sym: "part", means: "the amount the percentage refers to" },
          { sym: "percent", means: "the percentage figure", unit: "%" },
          { sym: "whole", means: "the total the percentage is taken from" },
        ],
        grades: [6, 7, 8],
        topics: ["G6·A5"],
        subject: "math",
        example: {
          setup: "Find 15% of a 60 g sample.",
          working: "part = 15 ÷ 100 × 60",
          answer: "9 g",
        },
        sims: ["math.fractions"],
        note:
          "Always ask 'percentage of what?'. 15% of the sample and 15% of the container " +
          "are different amounts, and percentages of different wholes must never be added " +
          "together.",
      },
      {
        id: "math.percent-change",
        name: "Percent change measures the change against the value it started from",
        expression: "% change = (V₂ − V₁) ÷ V₁ × 100",
        rearranged: ["V₂ = V₁ × (1 + % change ÷ 100)"],
        symbols: [
          { sym: "% change", means: "increase (positive) or decrease (negative)", unit: "%" },
          { sym: "V₁", means: "the original value", unit: "any" },
          { sym: "V₂", means: "the new value, in the same unit", unit: "any" },
        ],
        grades: [6, 7, 8],
        topics: ["G6·A5", "G8·F6"],
        subject: "math",
        example: {
          setup: "A population rises from 250 to 300.",
          working: "% change = (300 − 250) ÷ 250 × 100",
          answer: "20% increase",
        },
        sims: ["bio.ecosystem"],
        note:
          "Divide by the original value, never the new one. Rises and falls are not " +
          "symmetric: 2 to 4 is a 100% increase, but 4 back to 2 is only a 50% decrease.",
      },
      {
        id: "math.percent-error",
        name: "Percent error compares how far a measurement missed by with the value it should have been",
        expression: "percent error = (measured value − accepted value) ÷ accepted value × 100",
        symbols: [
          { sym: "percent error", means: "size of the error as a percentage", unit: "%" },
          { sym: "measured value", means: "what the experiment gave" },
          { sym: "accepted value", means: "the established value being compared against" },
        ],
        grades: [6, 7, 8],
        topics: ["G6·A5"],
        subject: "math",
        example: {
          setup: "A balance reads 490 g for a mass known to be 500 g.",
          working: "percent error = (490 − 500) ÷ 500 × 100",
          answer: "2.0% error",
        },
        note:
          "Report the size of the error and ignore the sign unless the direction matters. " +
          "A small percent error says the result is accurate, not that the experiment was " +
          "well designed.",
      },
      {
        id: "math.ratio-proportion",
        name: "Two ratios in proportion scale up and down together",
        expression: "a ÷ b = c ÷ d",
        rearranged: ["c = (a × d) ÷ b", "a × d = b × c"],
        symbols: [
          { sym: "a", means: "first quantity of the known pair" },
          { sym: "b", means: "second quantity of the known pair" },
          { sym: "c", means: "the matching unknown quantity" },
          { sym: "d", means: "the quantity it must match" },
        ],
        grades: [6, 7, 8],
        topics: ["G6·A5", "G7·A4"],
        subject: "math",
        example: {
          setup: "A recipe uses 3 spoons of salt per 250 mL of water. How much for 400 mL?",
          working: "c = 3 × 400 ÷ 250",
          answer: "4.8 spoons",
        },
        sims: ["math.fractions"],
        note:
          "Keep matching quantities in matching positions — mixing up which number belongs " +
          "on top is the usual mistake. Check the answer for sense: more water must need " +
          "more salt, not less.",
      },
      {
        id: "math.slope",
        name: "The gradient of a straight line is the rise divided by the run",
        expression: "m = rise ÷ run = (y₂ − y₁) ÷ (x₂ − x₁)",
        symbols: [
          { sym: "m", means: "gradient (slope) of the line" },
          { sym: "rise", means: "change along the vertical axis" },
          { sym: "run", means: "change along the horizontal axis" },
          { sym: "y₁", means: "vertical coordinate of the first point" },
          { sym: "y₂", means: "vertical coordinate of the second point" },
          { sym: "x₁", means: "horizontal coordinate of the first point" },
          { sym: "x₂", means: "horizontal coordinate of the second point" },
        ],
        grades: [6, 7, 8],
        topics: ["G6·A5", "G8·A1", "G8·A2"],
        subject: "math",
        example: {
          setup: "A line on a graph passes through (2, 10) and (6, 30).",
          working: "m = (30 − 10) ÷ (6 − 2)",
          answer: "5 units up for every 1 across",
        },
        sims: ["math.functions", "math.derivatives", "phys.motion-graphs"],
        note:
          "In science a gradient always carries units taken from the axes — metres per " +
          "second on a distance-time graph, degrees per minute on a heating curve. Use two " +
          "widely separated points on the line, not two raw data points that happen to sit " +
          "near it.",
      },
      {
        id: "math.rate",
        name: "A rate is how much something changes in each unit of time",
        expression: "rate = change in quantity ÷ time taken",
        rearranged: ["change in quantity = rate × time taken"],
        symbols: [
          { sym: "rate", means: "how fast the quantity changes", unit: "units per second" },
          { sym: "change in quantity", means: "how much it changed" },
          { sym: "time taken", means: "how long the change took", unit: "s" },
        ],
        grades: [6, 7, 8],
        topics: ["G6·A5", "G7·C1"],
        subject: "math",
        example: {
          setup: "A pondweed shoot releases 45 oxygen bubbles in 300 s.",
          working: "rate = 45 bubbles ÷ 300 s",
          answer: "0.15 bubbles per second",
        },
        sims: ["bio.photosynthesis", "math.derivatives"],
        note:
          "Every rate needs its time unit stated — per second, per year, per million years " +
          "— or the number means nothing. Comparing rates fairly means measuring over the " +
          "same length of time.",
      },
      {
        id: "math.unit-conversion",
        name: "Convert units by multiplying by a factor written so the unwanted unit cancels",
        expression: "value in new unit = value in old unit × conversion factor",
        symbols: [
          { sym: "value in new unit", means: "the converted number" },
          { sym: "value in old unit", means: "the number you started with" },
          { sym: "conversion factor", means: "a fraction equal to 1, such as 1000 m ÷ 1 km" },
        ],
        grades: [6, 7, 8],
        topics: ["G6·A5"],
        subject: "math",
        example: {
          setup: "Convert 5.4 km/h into metres per second.",
          working: "value in new unit = 5.4 × 1000 ÷ 3600",
          answer: "1.5 m/s",
        },
        note:
          "Write the factor as a fraction and cancel the units on the page — that is what " +
          "tells you whether to multiply or divide. Sanity-check the result: metres per " +
          "second should be a smaller number than kilometres per hour.",
      },
      {
        id: "math.scientific-notation",
        name: "Scientific notation writes any number as a single digit, a decimal part, and a power of ten",
        expression: "N = a × 10ⁿ",
        symbols: [
          { sym: "N", means: "the number being written" },
          { sym: "a", means: "the coefficient, at least 1 and less than 10" },
          { sym: "ⁿ", means: "n, the power of ten — negative for numbers below 1" },
        ],
        grades: [7, 8],
        topics: ["G7·A1", "G8·E4"],
        subject: "math",
        example: {
          setup: "The Moon is about 384400000 m from Earth.",
          working: "move the point 8 places left: 384400000 becomes 3.844 × 10⁸",
          answer: "3.844 × 10⁸ m",
        },
        note:
          "The power counts how far the decimal point moved, so a negative power means a " +
          "small number: 10⁻³ is one thousandth. Keeping the coefficient between 1 and 10 " +
          "is what makes two such numbers easy to compare at a glance.",
      },
      {
        id: "math.probability",
        name: "Probability is the count of favourable outcomes over the count of possible outcomes",
        expression: "P = favourable outcomes ÷ possible outcomes",
        symbols: [
          { sym: "P", means: "probability, between 0 and 1" },
          { sym: "favourable outcomes", means: "outcomes that count as a success" },
          { sym: "possible outcomes", means: "all equally likely outcomes" },
        ],
        grades: [6, 7, 8],
        topics: ["G6·E6", "G7·F2"],
        subject: "math",
        example: {
          setup: "One square of a four-square Punnett grid shows the recessive combination.",
          working: "P = 1 ÷ 4",
          answer: "0.25, a 25% chance",
        },
        sims: ["math.probability", "bio.heredity"],
        note:
          "A probability of 0.25 says nothing about what the next single event will do. " +
          "It also assumes the outcomes really are equally likely — the reason a hazard " +
          "forecast is a probability and never a promise.",
      },
      {
        id: "math.area-rectangle",
        name: "The area of a rectangle is its length times its width",
        expression: "A = l × w",
        rearranged: ["l = A ÷ w", "w = A ÷ l"],
        symbols: [
          { sym: "A", means: "area of the rectangle", unit: "m²" },
          { sym: "l", means: "length", unit: "m" },
          { sym: "w", means: "width", unit: "m" },
        ],
        grades: [6, 7, 8],
        topics: ["G6·A5", "G6·D2"],
        subject: "math",
        example: {
          setup: "A solar panel measures 2.5 m by 1.2 m.",
          working: "A = 2.5 m × 1.2 m",
          answer: "3.0 m²",
        },
        note:
          "Both measurements must be in the same unit before multiplying, and the answer " +
          "carries a squared unit. This area is what turns a force into a pressure and a " +
          "power into a power per square metre.",
      },
      {
        id: "math.volume-box",
        name: "The volume of a rectangular solid is length times width times height",
        expression: "V = l × w × h",
        rearranged: ["h = V ÷ (l × w)"],
        symbols: [
          { sym: "V", means: "volume of the solid", unit: "cm³" },
          { sym: "l", means: "length", unit: "cm" },
          { sym: "w", means: "width", unit: "cm" },
          { sym: "h", means: "height", unit: "cm" },
        ],
        grades: [6, 7, 8],
        topics: ["G6·A5", "G6·C2"],
        subject: "math",
        example: {
          setup: "A block measures 4 cm by 3 cm by 2 cm.",
          working: "V = 4 cm × 3 cm × 2 cm",
          answer: "24 cm³",
        },
        sims: ["chem.states"],
        note:
          "One cubic centimetre holds exactly one millilitre, which is how a measuring " +
          "cylinder gives volume for a density calculation. An irregular object needs the " +
          "displacement method instead — this formula only fits a box.",
      },
      {
        id: "math.circle-circumference",
        name: "The circumference of a circle is pi times its diameter",
        expression: "C = 2 × π × r",
        rearranged: ["C = π × d", "r = C ÷ (2 × π)"],
        symbols: [
          { sym: "C", means: "distance all the way round the circle", unit: "cm" },
          { sym: "π", means: "pi, about 3.1416" },
          { sym: "r", means: "radius, from centre to edge", unit: "cm" },
          { sym: "d", means: "diameter, twice the radius", unit: "cm" },
        ],
        grades: [6, 7, 8],
        topics: ["G6·A5", "G8·E4"],
        subject: "math",
        example: {
          setup: "A model planet is drawn with a radius of 5 cm.",
          working: "C = 2 × 3.1416 × 5 cm",
          answer: "31.4 cm",
        },
        sims: ["math.unit-circle"],
        note:
          "Watch which one you have been given — using the diameter where the formula " +
          "wants the radius doubles the answer. Pi has no unit, so the circumference " +
          "carries the same unit as the radius.",
      },
      {
        id: "math.circle-area",
        name: "The area of a circle is pi times the radius squared",
        expression: "A = π × r²",
        rearranged: ["r = √(A ÷ π)"],
        symbols: [
          { sym: "A", means: "area enclosed by the circle", unit: "cm²" },
          { sym: "π", means: "pi, about 3.1416" },
          { sym: "r", means: "radius of the circle", unit: "cm" },
        ],
        grades: [6, 7, 8],
        topics: ["G6·A5", "G6·D5"],
        subject: "math",
        example: {
          setup: "A circular petri dish has a radius of 5 cm.",
          working: "A = 3.1416 × (5 cm)²",
          answer: "78.5 cm²",
        },
        sims: ["math.unit-circle"],
        note:
          "Square the radius first, then multiply by pi — squaring the whole product gives " +
          "a wildly wrong answer. Doubling the radius quadruples the area, which is why a " +
          "wider dish or a wider lens gathers so much more.",
      },
      {
        id: "math.cylinder-volume",
        name: "The volume of a cylinder is its circular area times its height",
        expression: "V = π × r² × h",
        rearranged: ["h = V ÷ (π × r²)"],
        symbols: [
          { sym: "V", means: "volume of the cylinder", unit: "cm³" },
          { sym: "π", means: "pi, about 3.1416" },
          { sym: "r", means: "radius of the circular end", unit: "cm" },
          { sym: "h", means: "height of the cylinder", unit: "cm" },
        ],
        grades: [6, 7, 8],
        topics: ["G6·A5", "G6·C2"],
        subject: "math",
        example: {
          setup: "A measuring cylinder has a radius of 3 cm and holds liquid to a height of 10 cm.",
          working: "V = 3.1416 × (3 cm)² × 10 cm",
          answer: "283 cm³",
        },
        note:
          "The rule behind it is general: the volume of any prism is the area of its " +
          "cross-section times its length. Keep the radius and height in the same unit " +
          "before multiplying.",
      },
      {
        id: "math.sphere-volume",
        name: "The volume of a sphere is four thirds of pi times the cube of its radius",
        expression: "V = (4 ÷ 3) × π × r³",
        symbols: [
          { sym: "V", means: "volume of the sphere", unit: "cm³" },
          { sym: "π", means: "pi, about 3.1416" },
          { sym: "r", means: "radius of the sphere", unit: "cm" },
        ],
        grades: [8],
        topics: ["G8·E4"],
        subject: "math",
        example: {
          setup: "A model planet has a radius of 6 cm.",
          working: "V = (4 ÷ 3) × 3.1416 × (6 cm)³",
          answer: "905 cm³",
        },
        note:
          "Volume grows with the cube of the radius, so a planet twice the radius has " +
          "eight times the volume. That is exactly why a to-scale model of the solar " +
          "system will not fit in a classroom.",
      },
      {
        id: "math.scale-factor",
        name: "A scale factor says how many real units each unit of the model stands for",
        expression: "model size = real size ÷ scale factor",
        rearranged: ["real size = model size × scale factor"],
        symbols: [
          { sym: "model size", means: "size to draw or build", unit: "cm" },
          { sym: "real size", means: "true size of the object", unit: "km" },
          { sym: "scale factor", means: "real units represented by one model unit", unit: "km per cm" },
        ],
        grades: [6, 8],
        topics: ["G8·E4", "G6·A3"],
        subject: "math",
        example: {
          setup: "The Sun is 1392000 km across; a model uses 1 cm for every 100000 km.",
          working: "model size = 1392000 km ÷ 100000 km per cm",
          answer: "13.9 cm",
        },
        note:
          "One model can rarely scale both sizes and distances at once. At this scale the " +
          "Sun is a beach ball but Earth is under a millimetre and sits 15 m away, which " +
          "is the point the scale exercise is meant to make.",
      },
    ],
  },
];

/** Every formula in the lab, flattened, in teaching order. */
export const ALL_FORMULAS = FORMULA_GROUPS.flatMap((g) => g.formulas);

/** Formulas a given grade meets. */
export function formulasForGrade(grade: number) {
  return ALL_FORMULAS.filter((f) => f.grades.includes(grade));
}

/** Formulas attached to a curriculum topic code, e.g. "G8·A2". */
export function formulasForTopic(code: string) {
  return ALL_FORMULAS.filter((f) => f.topics.includes(code));
}

/** Formulas that can be watched working in a given simulation. */
export function formulasForSim(simId: string) {
  return ALL_FORMULAS.filter((f) => f.sims?.includes(simId));
}
