import json, sys
def apply(grade, D, path="docs/structure/SUBTOPIC_STRUCTURE.json"):
    d = json.load(open(path)); n = 0; miss = []
    g = d["grades"].get(str(grade))
    if g is None: raise SystemExit(f"no grade {grade}")
    seen = set()
    for u in g.values():
        for t in u["topics"].values():
            for st in t["subtopics"]:
                seen.add(st["code"])
                if st["code"] in D:
                    st["idea"], st["design"] = D[st["code"]]
                    if st["status"] == "design pending": st["status"] = "designed"
                    n += 1
    miss = [c for c in D if c not in seen]
    json.dump(d, open(path, "w"), indent=1)
    return n, miss
