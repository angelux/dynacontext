import { useState, useRef, useEffect } from 'react';
import { useApp, Text, Box, Static } from 'ink';
import { createSession } from '../pipeline.js';
import { listSessions, loadSession, saveSession } from '../services/session.js';
import { loadConfig } from '../services/config.js';
import { notify } from '../services/notify.js';
import BootSequence from './components/BootSequence.jsx';
import SessionMenu from './components/SessionMenu.jsx';
import IntakeView from './components/IntakeView.jsx';
import RetrievalView from './components/RetrievalView.jsx';
import AssemblyView from './components/AssemblyView.jsx';
import ReviewView from './components/ReviewView.jsx';
import StepFileReviewView from './components/StepFileReviewView.jsx';
import IntakeSummary from './components/shared/IntakeSummary.jsx';
import RetrievalSummary from './components/shared/RetrievalSummary.jsx';
import AssemblySummary from './components/shared/AssemblySummary.jsx';
import ResumeSummary from './components/shared/ResumeSummary.jsx';
import RetrievalStepItem from './components/shared/RetrievalStepItem.jsx';
import WizardView from './components/WizardView.jsx';
import SettingsView from './components/SettingsView.jsx';

export default function App({ initialConfig, needsWizard, onValidateConfig }) {
  const { exit } = useApp();
  const sessionRef = useRef(null);
  const [config, setConfig] = useState(initialConfig);
  const [phase, setPhase] = useState(needsWizard ? 'WIZARD' : 'INIT');
  const [returnPhase, setReturnPhase] = useState(null);
  const [staticItems, setStaticItems] = useState([]);
  const [historyKey, setHistoryKey] = useState(0);

  const refreshScrollback = () => {
    process.stdout.write('\x1b[2J\x1b[3J\x1b[H');
    setHistoryKey(k => k + 1);
  };

  // Initialization effect (only runs when NOT in wizard mode)
  useEffect(() => {
    if (needsWizard) return;

    const sessions = listSessions();
    if (sessions.length > 0) {
      sessionRef.current = { _pendingSessions: sessions };
      setPhase('SESSION_MENU');
    } else {
      sessionRef.current = createSession(config);
      setPhase('BOOT');
    }
  }, [config, needsWizard]);

  // Debounced resize: clear terminal and remount Static on terminal width change
  useEffect(() => {
    let timer;
    const handleResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        refreshScrollback();
      }, 300);
    };
    process.stdout.on('resize', handleResize);
    return () => {
      process.stdout.off('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  // Wizard completion handler
  const handleWizardComplete = (newConfig) => {
    setConfig(newConfig);
    sessionRef.current = createSession(newConfig);
    setPhase('BOOT');
  };

  // Settings navigation handlers
  const handleSettingsRequested = (fromPhase) => {
    setReturnPhase(fromPhase || phase);
    setPhase('SETTINGS');
  };

  const handleSettingsComplete = (updatedConfig) => {
    if (updatedConfig) {
      setConfig(updatedConfig);
    }
    setPhase(returnPhase || 'INIT');
    setReturnPhase(null);
  };

  // Phase transition handler
  const handlePhaseComplete = (nextPhase) => {
    if (phase === 'BOOT') {
      setStaticItems(prev => {
        if (prev.some(item => item.type === 'BOOT')) return prev;
        return [...prev, { type: 'BOOT' }];
      });
    }

    if (phase === 'INTAKE') {
      setStaticItems(prev => {
        if (prev.some(item => item.type === 'INTAKE')) return prev;
        return [...prev, {
          type: 'INTAKE',
          data: {
            summary: sessionRef.current.intake.summary,
            assessment: sessionRef.current.intake.assessment,
            taskType: sessionRef.current.intake.taskType,
            biasing: sessionRef.current.intake.biasing,
          }
        }];
      });
    }

    if (phase === 'RETRIEVAL') {
      setStaticItems(prev => {
        if (prev.some(item => item.type === 'RETRIEVAL')) return prev;
        return [...prev, {
          type: 'RETRIEVAL',
          data: {}
        }];
      });
    }

    if (phase === 'ASSEMBLY') {
      setStaticItems(prev => {
        if (prev.some(item => item.type === 'ASSEMBLY')) return prev;
        return [...prev, {
          type: 'ASSEMBLY',
          data: {
            retrievalRequested: sessionRef.current.assembly.retrievalRequested,
          }
        }];
      });
    }

    if (nextPhase === 'DONE') {
      exit();
      return;
    }

    if (nextPhase === 'ASSEMBLY' && phase === 'RETRIEVAL'
        && config.stepFiles?.reviewBeforeAssembly === true) {
      sessionRef.current.phase = 'STEP_FILE_REVIEW';
      setPhase('STEP_FILE_REVIEW');
      notify('DynaContext', 'Retrieval complete — step files ready for review.');
      return;
    }

    // Always update the phase on the session object *before* checking/saving
    sessionRef.current.phase = nextPhase;

    if (['ASSEMBLY', 'REVIEW'].includes(nextPhase)) {
      saveSession(sessionRef.current);
    }

    if (nextPhase === 'REVIEW' && phase === 'ASSEMBLY') {
      notify('DynaContext', 'Context package assembled — ready for review.');
    }

    setPhase(nextPhase);
  };

  const handleSessionSelect = (choice) => {
    if (choice.action === 'resume') {
      sessionRef.current = loadSession(choice.id, config);
      setStaticItems(prev => [...prev, {
        type: 'RESUME',
        data: {
          summary: sessionRef.current.intake.summary,
          assessment: sessionRef.current.intake.assessment,
          taskType: sessionRef.current.intake.taskType,
          biasing: sessionRef.current.intake.biasing,
          phase: sessionRef.current.phase,
          sessionId: sessionRef.current._sessionId,
        }
      }]);
      setPhase(sessionRef.current.phase || 'INTAKE');
    } else if (choice.action === 'settings') {
      handleSettingsRequested('SESSION_MENU');
    } else {
      sessionRef.current = createSession(config);
      setPhase('BOOT');
    }
  };

  let activeView = null;
  switch (phase) {
    case 'INIT':
      break;
    case 'WIZARD':
      activeView = (
        <WizardView
          onComplete={handleWizardComplete}
          onValidateConfig={onValidateConfig}
        />
      );
      break;
    case 'SETTINGS':
      activeView = (
        <SettingsView
          config={config}
          onComplete={handleSettingsComplete}
          onValidateConfig={onValidateConfig}
        />
      );
      break;
    case 'SESSION_MENU':
      activeView = (
        <SessionMenu
          sessions={sessionRef.current._pendingSessions}
          onSelect={handleSessionSelect}
        />
      );
      break;
    case 'BOOT':
      activeView = (
        <BootSequence
          config={config}
          onComplete={() => handlePhaseComplete('INTAKE')}
        />
      );
      break;
    case 'INTAKE':
      activeView = (
        <IntakeView
          session={sessionRef.current}
          config={config}
          onPhaseComplete={handlePhaseComplete}
          onSettingsRequested={() => handleSettingsRequested('INTAKE')}
        />
      );
      break;
    case 'RETRIEVAL':
      activeView = (
        <RetrievalView
          session={sessionRef.current}
          config={config}
          onPhaseComplete={handlePhaseComplete}
          onStaticAdd={(item) => setStaticItems(prev => [...prev, item])}
        />
      );
      break;
    case 'STEP_FILE_REVIEW':
      activeView = (
        <StepFileReviewView
          session={sessionRef.current}
          config={config}
          onPhaseComplete={handlePhaseComplete}
        />
      );
      break;
    case 'ASSEMBLY':
      activeView = (
        <AssemblyView
          session={sessionRef.current}
          config={config}
          onPhaseComplete={handlePhaseComplete}
        />
      );
      break;
    case 'REVIEW':
      activeView = (
        <ReviewView
          session={sessionRef.current}
          config={config}
          onPhaseComplete={handlePhaseComplete}
        />
      );
      break;
  }

  return (
    <Box flexDirection="column">
      <Static key={`history-${historyKey}`} items={staticItems}>
        {(item, index) => {
          if (item.type === 'RESUME') {
            return <ResumeSummary key={`static-resume-${index}`} data={item.data} />;
          }
          if (item.type === 'BOOT') {
            return <BootSequence key={`static-boot-${index}`} config={config} isStatic />;
          }
          if (item.type === 'INTAKE') {
            return <IntakeSummary key={`static-intake-${index}`} data={item.data} />;
          }
          if (item.type === 'RETRIEVAL_STEP') {
            return <RetrievalStepItem key={`static-retrieval-step-${index}`} data={item.data} />;
          }
          if (item.type === 'RETRIEVAL') {
            return <RetrievalSummary key={`static-retrieval-${index}`} data={item.data} />;
          }
          if (item.type === 'ASSEMBLY') {
            return <AssemblySummary key={`static-assembly-${index}`} data={item.data} />;
          }
          return null;
        }}
      </Static>
      {activeView}
    </Box>
  );
}
