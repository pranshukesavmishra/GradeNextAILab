# Workflow scripts

Multi-agent build scripts for the simulation catalogue, kept in the repo so a
run survives a container restart. Re-invoke one with the Workflow tool:

    Workflow({ scriptPath: ".workflows/build-topic-sims.js", args: [...topics] })

- `build-topic-sims.js` — one agent per curriculum topic, each building 4-5
  dedicated simulations for that topic, followed by an adversarial verifier
  that checks subtopic coverage, distinctness, science and visual quality.
  Topic payloads are generated from `app/src/curriculum/`.
