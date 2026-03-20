export function createSession(config) {
  return {
    phase: 'INIT',
    config,
    intake: {
      messages: [],
      summary: '',
      taskType: '',
      references: [],
      assessment: '',
      searchPatterns: [],
      biasing: '',
    },
    retrieval: {
      steps: ['', '', '', ''],
      patterns: '',
      expandedSteps: [],
      failedStep: null,
    },
    assembly: {
      content: '',
      revisionHistory: [],
      revisionFeedback: '',
      retrievalRequested: false,
      saveCount: 0,
    },
    stats: {
      intake: [],
      retrieval: [],
      assembly: []
    }
  };
}

export function handleStepFileReload(session) {
  import('fs').then(fs => {
    session.retrieval.patterns = fs.existsSync('retrieval-patterns.md')
      ? fs.readFileSync('retrieval-patterns.md', 'utf8')
      : '';
      
    for (let i = 1; i <= 4; i++) {
      const stepFile = `retrieval-step${i}.md`;
      session.retrieval.steps[i - 1] = fs.existsSync(stepFile)
        ? fs.readFileSync(stepFile, 'utf8')
        : '';
    }
  });
}
