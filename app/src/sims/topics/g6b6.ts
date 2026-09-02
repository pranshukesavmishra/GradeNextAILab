import { buildSim } from "@engine/archetypeSim";
import type { ArchetypeSpec } from "@engine/archetype";

/**
 * Grade 6 · Unit B · Topic B6 — Sensory systems and information processing.
 *
 * Six simulations, one per subtopic, and six different archetypes. The topic
 * turns on one measurable contrast, so B6.4 is built to carry it: a knee jerk
 * turns around at the spinal cord and is over in about 50 ms, while a chosen
 * response goes up to the brain and back and takes about 250 ms. Both times
 * are computed from the same nerve length and conduction speed, so a student
 * can move one slider and watch the gap open or close for a reason.
 */

/* ---------------------------------------------------------------- *
 * B6.1 — Sensory receptors and stimuli
 * ---------------------------------------------------------------- */

const RECEPTORS: ArchetypeSpec = {
  id: "g6b6-receptors",
  title: "Which Sense Picks This Up?",
  tagline: "Take each thing the world does to you and find the receptor that answers.",
  kind: "sort",
  subject: "biology",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-LS1-8"] },
  learningGoals: [
    "Match a stimulus to the kind of receptor that detects it.",
    "Explain that a receptor turns one kind of change into an electrical signal.",
  ],
  misconceptions: [
    "There are only five senses",
    "The eye sees, rather than the brain making sense of what the eye sends",
  ],
  categories: [
    { id: "light", name: "Light", hint: "eye" },
    { id: "sound", name: "Sound and movement", hint: "ear" },
    { id: "chemical", name: "Chemicals", hint: "nose and tongue" },
    { id: "touch", name: "Touch and heat", hint: "skin" },
  ],
  specimens: [
    {
      id: "torch", name: "A torch beam", category: "light",
      because: "Photoreceptors answer to light: rods in the dark, cones for colour.",
      art: { art: "apparatus", which: "bulb" },
    },
    {
      id: "apple", name: "A red apple", category: "light",
      because: "You see it only because light bounces off it into your eye.",
      art: { art: "sphere", color: "#c0392b", radius: 0.5 },
    },
    {
      id: "string", name: "A plucked string", category: "sound",
      because: "Vibrations in the air bend hair cells in the coiled cochlea.",
      art: { art: "apparatus", which: "spring" },
    },
    {
      id: "spin", name: "Spinning on a chair", category: "sound",
      because: "Hair cells feel fluid moving in the ear's canals. That is balance.",
      art: { art: "apparatus", which: "cart" },
    },
    {
      id: "coffee", name: "The smell of coffee", category: "chemical",
      because: "Drifting molecules land on about 6 million smell receptors.",
      art: { art: "glassware", which: "beaker", level: 0.55, color: "#4a2c17" },
    },
    {
      id: "salt", name: "Salt on your tongue", category: "chemical",
      because: "Taste buds answer only to chemicals already dissolved in saliva.",
      art: { art: "sphere", color: "#cfd6e6", radius: 0.45 },
    },
    {
      id: "mug", name: "A hot mug", category: "touch",
      because: "Warm receptors fire faster as heat rises; past 45 °C, pain joins in.",
      art: { art: "apparatus", which: "burner" },
    },
    {
      id: "cold", name: "A hand in cold water", category: "touch",
      because: "Separate cold receptors sit nearer the surface than the warm ones.",
      art: { art: "glassware", which: "testTube", level: 0.7 },
    },
  ],
};

/* ---------------------------------------------------------------- *
 * B6.2 — The path of a signal to the brain
 * ---------------------------------------------------------------- */

const SIGNAL_PATH: ArchetypeSpec = {
  id: "g6b6-signal-path",
  title: "From Fingertip to Cortex",
  tagline: "Ride one touch signal up the arm and into the part of the brain that feels it.",
  kind: "trace",
  subject: "biology",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-LS1-8"] },
  learningGoals: [
    "Put receptor, sensory neuron, spinal cord and brain in the order a signal meets them.",
    "Explain that a nerve signal has a speed, and it is far slower than electricity.",
  ],
  misconceptions: [
    "Nerve signals travel at the speed of electricity in a wire",
    "The finger feels the touch, rather than the brain",
  ],
  specimens: [
    { id: "impulse", name: "The impulse itself", art: { art: "sphere", color: "#3f6a9e", radius: 0.4 } },
  ],
  /*
   * A nerve impulse is not a current running down a wire — it is a wave of
   * charge that each patch of membrane has to build again, which is why it
   * manages 50 m/s where electricity manages 200 million. So the impulse runs
   * along the neuron and then stops dead at every synapse, gathering while the
   * handover is made and costing about a millisecond each time. Three relays
   * on this route: into the cord, at the brain stem, and at the thalamus.
   */
  drive: ({ t }) => {
    const p = (t * 0.096) % 1;
    // Synapses sit at the three relays; between them the signal simply runs.
    const atSynapse = (p > 0.36 && p < 0.44) || (p > 0.55 && p < 0.63) || (p > 0.74 && p < 0.82);
    return {
      scale: atSynapse ? 0.6 : 1 + 0.12 * Math.sin(t * 12),
      color: atSynapse ? "#3f6a9e" : "#5fd8ff",
      spin: t * (atSynapse ? 0.2 : 2.4),
      rate: atSynapse ? 0 : 1,
    };
  },
  route: [
    {
      at: [0.09, 0.28], name: "Touch receptor",
      note: "A receptor in the skin turns pressure into an electrical signal.",
    },
    {
      at: [0.25, 0.48], name: "Sensory neuron",
      note: "Up the arm at about 50 m/s: three quarters of a metre in 15 ms.",
    },
    {
      at: [0.43, 0.26], name: "Spinal cord",
      note: "It enters the cord and crosses to the other side of the body.",
    },
    {
      at: [0.59, 0.48], name: "Brain stem",
      note: "A relay hands it upward. Every synapse costs about 1 ms.",
    },
    {
      at: [0.76, 0.26], name: "Thalamus",
      note: "The sorting office: each sense is sent to its own part of the brain.",
    },
    {
      at: [0.92, 0.5], name: "Touch cortex",
      note: "20 to 30 ms after the touch, you know which finger it was.",
    },
  ],
  stages: [
    { name: "Detect", at: 0, caption: "A stimulus is only a stimulus once a receptor has answered to it." },
    { name: "Travel", at: 0.2, caption: "The signal is a wave of charge moving along the neuron, not a current." },
    { name: "Enter", at: 0.4, caption: "All body signals pass through the spinal cord on the way up." },
    { name: "Relay", at: 0.6, caption: "The message is handed on cell to cell, and each handover costs time." },
    { name: "Sort", at: 0.8, caption: "The thalamus routes touch, sight and sound to different destinations." },
    { name: "Feel", at: 1, caption: "Only when the cortex receives it does the touch become a feeling." },
  ],
};

/* ---------------------------------------------------------------- *
 * B6.3 — Processing information in the brain
 * ---------------------------------------------------------------- */

const CHOOSING: ArchetypeSpec = {
  id: "g6b6-cost-of-choosing",
  title: "The Cost of Choosing",
  tagline: "Add buttons to choose between and measure what thinking costs in milliseconds.",
  kind: "investigate",
  subject: "biology",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-LS1-8"] },
  learningGoals: [
    "Explain that the brain takes measurable time to process information.",
    "Describe how reaction time grows as the number of choices grows.",
  ],
  misconceptions: [
    "Thinking takes no time at all",
    "A slow reaction means slow nerves rather than a harder decision",
  ],
  specimens: [
    { id: "brain", name: "Brain at work", art: { art: "sphere", radius: 0.7, glow: 0.45 } },
  ],
  variables: [
    { key: "choices", label: "Buttons to choose between", min: 1, max: 8, step: 1, default: 4 },
  ],
  /*
   * The Hick-Hyman law: reaction time rises with the logarithm of the number
   * of equally likely choices, RT = a + b * log2(N). Here a = 200 ms, which is
   * the fixed cost of sensing and moving with only one button, and b = 150 ms
   * per bit of decision. That gives 200 ms for one choice, 350 ms for two,
   * 500 ms for four and 650 ms for eight, which is what the classic
   * experiments measure.
   */
  measure: (v) => {
    const decisionMs = 150 * Math.log2(v.choices);
    return {
      reactionMs: 200 + decisionMs,
      decisionMs,
      fixedMs: 200,
    };
  },
  plot: {
    x: "choices", y: "reactionMs",
    xLabel: "Number of choices", yLabel: "Reaction time (ms)",
  },
  /*
   * The brain lights and swells with the work it is being given: nothing extra
   * to do with one button, 450 ms of deciding with eight. It also flashes at
   * the rate it can actually answer — one flash per reaction, so five a second
   * at 200 ms and barely one and a half a second at 650. Slow and hot at one
   * end, quick and cool at the other, and the reason is the number of choices
   * rather than the speed of anybody's nerves.
   */
  drive: ({ f, t }) => {
    const load = f.decisionMs / 450;
    const pulse = Math.max(0, Math.sin((t * Math.PI * 1000) / f.reactionMs));
    return {
      color: ["#4a63f0", "#6a6ae0", "#9a63c0", "#c85a86", "#e0724a", "#f0913c"][
        Math.max(0, Math.min(5, Math.round(load * 5)))
      ],
      scale: 1 + load * 0.35 + pulse * pulse * 0.12,
      spin: 0.68 + t * (0.2 + load * 0.9),
    };
  },
};

/* ---------------------------------------------------------------- *
 * B6.4 — Voluntary and reflex responses
 * ---------------------------------------------------------------- */

const REFLEX_VS_VOLUNTARY: ArchetypeSpec = {
  id: "g6b6-reflex-vs-voluntary",
  title: "The Knee Jerk Beats the Brain",
  tagline: "Time the same leg twice: once the cord decides, once you do.",
  kind: "compare",
  subject: "biology",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-LS1-8"] },
  learningGoals: [
    "Describe the reflex arc: receptor, sensory neuron, spinal cord, motor neuron, muscle.",
    "Explain why a reflex is about five times faster than a chosen response.",
  ],
  misconceptions: [
    "Every response is decided by the brain",
    "A reflex is just a very fast decision",
  ],
  specimens: [
    {
      id: "reflex", name: "Reflex: the cord decides",
      because: "One synapse in the spinal cord and the leg kicks. About 50 ms.",
      art: { art: "sphere", radius: 0.42 },
    },
    {
      id: "voluntary", name: "Voluntary: the brain decides",
      because: "Up to the brain, a decision, then back down. About 250 ms.",
      art: { art: "sphere", radius: 0.8, glow: 0.6 },
    },
  ],
  variables: [
    { key: "nerveLength", label: "Knee to spinal cord", unit: "cm", min: 30, max: 100, step: 5, default: 50 },
    { key: "speed", label: "Nerve signal speed", unit: "m/s", min: 10, max: 120, step: 5, default: 50 },
  ],
  /*
   * Both times are built from the same parts, which is what makes the contrast
   * fair. The knee jerk is monosynaptic: the signal runs 50 cm up to the cord
   * and 50 cm back at about 50 m/s (20 ms in total), crosses one synapse and
   * one nerve-muscle junction (about 1 ms each), and then the muscle needs
   * roughly 28 ms to shorten enough to see: 50 ms in all.
   *
   * A voluntary response uses the same route and then adds the trip the reflex
   * skips: 50 cm each way between cord and brain (20 ms more at 50 m/s) plus
   * about 180 ms of deciding. That comes to 250 ms, five times the reflex.
   */
  measure: (v) => {
    const travelMs = ((2 * (v.nerveLength / 100)) / v.speed) * 1000;
    const reflexMs = travelMs + 2 + 28;
    const toBrainMs = ((2 * 0.5) / v.speed) * 1000;
    const voluntaryMs = reflexMs + toBrainMs + 180;
    return {
      reflexMs,
      voluntaryMs,
      savedMs: voluntaryMs - reflexMs,
      timesFaster: voluntaryMs / reflexMs,
      reflexPathCm: 2 * v.nerveLength,
      voluntaryPathCm: 2 * v.nerveLength + 100,
    };
  },
  /*
   * Both legs run at once, at one eighth of real speed, and each one is drawn
   * travelling its own route: 2 x 50 cm for the reflex, and the same again plus
   * the 100 cm up to the brain and back for the chosen response. The signal
   * moves across at the fraction of its own journey the clock has reached, so
   * at any instant you can see the reflex already home while the voluntary
   * response is still on its way, and the moment each arrives it lights up.
   *
   * Both sliders bite. A longer nerve makes both journeys longer, and a slower
   * signal makes both take longer — but only the voluntary side carries the 180
   * ms of deciding, which is why it stays about five times slower whatever you
   * do to the wiring.
   */
  drive: ({ f, t, index }) => {
    const clockMs = ((t / 8) % 0.5) * 1000;
    const took = index === 0 ? f.reflexMs : f.voluntaryMs;
    const path = index === 0 ? f.reflexPathCm : f.voluntaryPathCm;
    const progress = Math.min(1, clockMs / took);
    const arrived = progress >= 1;
    return {
      offset: [-0.6 + progress * (path / 300) * 1.25, 0],
      scale: 0.62 + progress * 0.42,
      color: arrived ? "#f0c93c" : "#5a7ec0",
      spin: 0.68 + t * (arrived ? 0.15 : 2.2),
    };
  },
};

/* ---------------------------------------------------------------- *
 * B6.5 — Memory and stored information
 * ---------------------------------------------------------------- */

const MEMORY: ArchetypeSpec = {
  id: "g6b6-memory",
  title: "How a Moment Becomes a Memory",
  tagline: "Walk one sight from a quarter-second flash to something you keep for years.",
  kind: "process",
  subject: "biology",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-LS1-8"] },
  learningGoals: [
    "Order sensory memory, working memory and long-term memory by how long each lasts.",
    "Explain that a memory is stored as connections between neurons, not as a recording.",
  ],
  misconceptions: [
    "Memory works like a video recording that can be played back",
    "Everything you see is stored somewhere in the brain",
  ],
  specimens: [
    { id: "brain", name: "Brain", art: { art: "sphere", radius: 0.75, glow: 0.4 } },
  ],
  stages: [
    {
      name: "Sensory", at: 0,
      caption: "Everything the eyes send is held for about a quarter of a second, then gone.",
    },
    {
      name: "Attention", at: 0.25,
      caption: "Only what you attend to gets any further. The rest is never stored at all.",
    },
    {
      name: "Working", at: 0.5,
      caption: "Working memory holds five to nine items for 15 to 30 seconds without rehearsal.",
    },
    {
      name: "Consolidation", at: 0.75,
      caption: "Repeating it, and sleeping on it, strengthens the connections that hold it.",
    },
    {
      name: "Long-term", at: 1,
      caption: "Stored as a pattern of strengthened synapses. Recalling it rebuilds it, and can change it.",
    },
  ],
  /*
   * What the run shows is how much survives each step, so the brain dims at
   * every one. Everything the eyes send arrives at once and blazes for about a
   * quarter of a second; attention throws nearly all of it away; working memory
   * keeps five to nine items for half a minute; and what is left after
   * consolidation is a small, steady, permanent thing. It only stops flickering
   * at the end: a long-term memory is a pattern that holds still.
   */
  drive: ({ t }) => {
    const p = (t * 0.096) % 1;
    const stage = Math.min(4, Math.floor(p * 5));
    const flicker = stage < 4 ? 1 + 0.1 * Math.sin(t * (9 - stage * 2)) : 1;
    return {
      scale: [1.55, 1.05, 0.82, 0.66, 0.6][stage] * flicker,
      color: ["#ffe98a", "#f0c93c", "#d8913c", "#a86ec0", "#7a5ad8"][stage],
      spin: 0.68 + t * (stage < 4 ? 0.9 : 0.12),
    };
  },
};

/* ---------------------------------------------------------------- *
 * B6.6 — Stimulus to response to memory, together
 * ---------------------------------------------------------------- */

const CLOSE_THE_LOOP: ArchetypeSpec = {
  id: "g6b6-close-the-loop",
  title: "Close the Loop",
  tagline: "Build the whole path, from the thing that happens to the lesson you keep.",
  kind: "assemble",
  subject: "biology",
  bands: ["3-5", "6-8"],
  grades: [5, 6, 7],
  standards: { ngss: ["MS-LS1-8"] },
  learningGoals: [
    "Assemble the full path from stimulus to response and on to stored memory.",
    "Explain how a stored memory changes the next response to the same stimulus.",
  ],
  misconceptions: [
    "A response ends the story",
    "Memory is separate from the way the body reacts",
  ],
  specimens: [
    {
      id: "loop", name: "One event, start to finish",
      art: { art: "sphere", radius: 0.85, glow: 0.35 },
      parts: [
        {
          id: "stimulus", name: "Stimulus and receptor", at: [-0.45, -0.25],
          note: "A receptor turns a change in the world into a signal.",
        },
        {
          id: "sensory", name: "Sensory neuron", at: [-0.2, -0.42],
          note: "Carries the signal inward, at up to 120 metres a second.",
        },
        {
          id: "brain", name: "Brain and spinal cord", at: [0, 0],
          note: "Sorts it, compares it with memory, and decides what to do.",
        },
        {
          id: "motor", name: "Motor neuron", at: [0.3, -0.35],
          note: "Carries the order out to the muscle that will act.",
        },
        {
          id: "response", name: "Response", at: [0.44, 0.15],
          note: "The muscle contracts. This is the only part anyone can see.",
        },
        {
          id: "memory", name: "Memory stored", at: [-0.3, 0.36],
          note: "What happened is kept, so next time the answer comes faster.",
        },
        {
          id: "feedback", name: "Feedback", at: [0.18, 0.42],
          note: "The senses check the result, and the whole loop runs again.",
        },
      ],
    },
  ],
};

export const g6b6Receptors = buildSim(RECEPTORS);
export const g6b6SignalPath = buildSim(SIGNAL_PATH);
export const g6b6CostOfChoosing = buildSim(CHOOSING);
export const g6b6ReflexVsVoluntary = buildSim(REFLEX_VS_VOLUNTARY);
export const g6b6Memory = buildSim(MEMORY);
export const g6b6CloseTheLoop = buildSim(CLOSE_THE_LOOP);
