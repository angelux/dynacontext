function a(e) {
  return {
    phase: "INIT",
    config: e,
    intake: {
      messages: [],
      summary: "",
      taskType: "",
      references: [],
      assessment: "",
      searchPatterns: [],
      biasing: ""
    },
    retrieval: {
      steps: ["", "", "", ""],
      patterns: "",
      expandedSteps: [],
      failedStep: null
    },
    assembly: {
      content: "",
      revisionHistory: [],
      revisionFeedback: "",
      retrievalRequested: !1,
      saveCount: 0
    },
    stats: {
      intake: [],
      retrieval: [],
      assembly: []
    }
  };
}
function n(e) {
  import("fs").then((t) => {
    e.retrieval.patterns = t.existsSync("retrieval-patterns.md") ? t.readFileSync("retrieval-patterns.md", "utf8") : "";
    for (let s = 1; s <= 4; s++) {
      const r = `retrieval-step${s}.md`;
      e.retrieval.steps[s - 1] = t.existsSync(r) ? t.readFileSync(r, "utf8") : "";
    }
  });
}
export {
  a as createSession,
  n as handleStepFileReload
};
