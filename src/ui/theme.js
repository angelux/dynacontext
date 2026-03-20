// src/ui/theme.js

const theme = {
  // Status indicators (used by StatusMessage and inline status displays)
  status: {
    success: 'green',     // checkmarks, completion, READY assessment
    warning: 'yellow',    // warnings, threshold alerts, NEEDS_INFO assessment
    error: 'red',         // errors, failure indicators, delete confirmations
    info: 'cyan',         // SYS labels, system information
  },

  // Interactive elements
  ui: {
    accent: 'cyan',       // selected items, active indicators, running commands, section headers with color
    muted: 'gray',        // disabled options, default/unknown phase state
    active: 'white',      // enabled but non-accent interactive elements
  },

  // Phase status colors (used by SessionMenu's getPhaseColor)
  phase: {
    DONE: 'green',
    REVIEW: 'cyan',
    ASSEMBLY: 'yellow',
    default: 'gray',
  },
};

export default theme;
