import React, { useState, useEffect } from 'react';
import {
  Artwork,
  ArtworkCategory,
  CritiqueData,
  CriticStage,
  ExhibitionRecord as IExhibitionRecord,
  ConversationExchange,
  BrutalTruthData,
  ArchiveRecord
} from './types';
import { STAGE_CONFIG } from './services/criticPersonality';
import { generateInitialCritique, generateBrutalTruth } from './services/criticEngine';
import { isSoundEnabled, setSoundEnabled, playStamp, playBounce, playDramatic } from './utils/soundEffects';

import { IntroSequence } from './components/IntroSequence';
import { HeaderBar } from './components/HeaderBar';
import { CharacterExpression } from './components/CriticPet';
import { WelcomeStep } from './components/steps/WelcomeStep';
import { UploadStep } from './components/steps/UploadStep';
import { InvestigatingStep } from './components/steps/InvestigatingStep';
import { VerdictStep } from './components/steps/VerdictStep';
import { InteractionStep } from './components/steps/InteractionStep';
import { RedesignStep } from './components/steps/RedesignStep';
import { FullCritiqueModal } from './components/FullCritiqueModal';
import { ArchivePage } from './components/ArchivePage';
import { SettingsModal } from './components/SettingsModal';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { MobileBottomNav } from './components/MobileBottomNav';

const SESSION_STORAGE_KEY = 'UNRELIABLE_ART_CRITIC_SESSION';
const THEME_STORAGE_KEY = 'CRITIC_THEME';

export type AppStep =
  | 'INTRO'
  | 'WELCOME'
  | 'UPLOAD'
  | 'INVESTIGATING'
  | 'VERDICT'
  | 'INTERACTION'
  | 'REDESIGN';

export type InteractionMode = 'DEFEND' | 'CHALLENGE' | 'BRUTAL_TRUTH';

export const App: React.FC = () => {
  // Lightweight router state: '/' (critic) vs '/archive'
  const [route, setRoute] = useState<'critic' | 'archive'>(() => {
    try {
      if (typeof window !== 'undefined') {
        const p = window.location.pathname;
        const h = window.location.hash;
        if (p.includes('/archive') || h.includes('archive')) return 'archive';
      }
    } catch {}
    return 'critic';
  });

  const navigateTo = (newRoute: 'critic' | 'archive') => {
    setRoute(newRoute);
    try {
      if (typeof window !== 'undefined') {
        const targetPath = newRoute === 'archive' ? '/archive' : '/';
        if (window.location.pathname !== targetPath) {
          window.history.pushState({ route: newRoute }, '', targetPath);
        }
      }
    } catch {}
  };

  // Listen to browser forward/back buttons
  useEffect(() => {
    const handlePopState = () => {
      try {
        const p = window.location.pathname;
        const h = window.location.hash;
        if (p.includes('/archive') || h.includes('archive')) {
          setRoute('archive');
        } else {
          setRoute('critic');
        }
      } catch {}
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Theme State: Day / Night
  const [theme, setTheme] = useState<'day' | 'night'>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'day' || saved === 'night') return saved;
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'night';
      }
    } catch {}
    return 'day';
  });

  // Finite State Machine: Step-Based Experience
  // Introduction plays automatically on EVERY fresh page load & refresh
  const [currentStep, setCurrentStep] = useState<AppStep>(() => {
    try {
      if (typeof window !== 'undefined') {
        const p = window.location.pathname;
        if (p.includes('/archive')) return 'WELCOME';
      }
    } catch {}
    return 'INTRO';
  });
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('DEFEND');

  // Sound state
  const [soundOn, setSoundOn] = useState<boolean>(() => isSoundEnabled());

  // Session & Critic State
  const [currentArtwork, setCurrentArtwork] = useState<Artwork | null>(null);
  const [currentCritique, setCurrentCritique] = useState<CritiqueData | null>(null);
  const [currentStage, setCurrentStage] = useState<CriticStage>(1);
  const [exchanges, setExchanges] = useState<ConversationExchange[]>([]);
  const [stageLogs, setStageLogs] = useState<
    { stage: CriticStage; label: string; reason: string; timestamp: string }[]
  >([]);
  const [isLoadingCritique, setIsLoadingCritique] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Brutal truth dedicated state & error handling
  const [isBrutalTruthLoading, setIsBrutalTruthLoading] = useState<boolean>(false);
  const [brutalTruthData, setBrutalTruthData] = useState<BrutalTruthData | null>(null);
  const [brutalTruthError, setBrutalTruthError] = useState<string | null>(null);

  // Character reaction states (14 expressions + speech)
  const [forcedExpression, setForcedExpression] = useState<CharacterExpression | null>(null);
  const [speechText, setSpeechText] = useState<string>('');

  // Modals state
  const [isDossierOpen, setIsDossierOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);

  // Apply data-theme attribute on document root and update mobile status bar color
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const metaTheme = document.getElementById('meta-theme-color');
    if (metaTheme) {
      metaTheme.setAttribute('content', theme === 'night' ? '#111111' : '#F7F6F2');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {}
  }, [theme]);

  // Restore session from localStorage on mount (preserves data without skipping intro)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.artwork && parsed.initialCritique) {
          setCurrentArtwork(parsed.artwork);
          setCurrentCritique(parsed.initialCritique);
          setCurrentStage(parsed.currentStage || 1);
          setExchanges(parsed.exchanges || []);
          setStageLogs(parsed.stageLogs || []);
        }
      }
    } catch (err) {
      console.warn('Failed to restore session from storage', err);
    }
  }, []);

  // Save session to localStorage
  useEffect(() => {
    if (currentArtwork && currentCritique) {
      try {
        const sessionRecord: IExhibitionRecord = {
          artwork: currentArtwork,
          initialCritique: currentCritique,
          currentStage,
          exchanges,
          stageLogs
        };
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionRecord));
      } catch (err) {
        console.warn('Failed to save session to storage', err);
      }
    }
  }, [currentArtwork, currentCritique, currentStage, exchanges, stageLogs]);

  // Handle Day / Night Theme Toggle with Character Reaction
  const handleToggleTheme = () => {
    const nextTheme = theme === 'day' ? 'night' : 'day';
    setTheme(nextTheme);

    if (nextTheme === 'night') {
      setForcedExpression('SLEEPY');
      setSpeechText("Ah. My natural habitat.");
      setTimeout(() => setForcedExpression(null), 2500);
    } else {
      setForcedExpression('HAPPY');
      setSpeechText("Good morning. I have opinions.");
      setTimeout(() => setForcedExpression(null), 2500);
    }
  };

  // Handle Sound Toggle
  const handleToggleSound = () => {
    const nextState = !soundOn;
    setSoundOn(nextState);
    setSoundEnabled(nextState);
  };

  // Handle Replay Intro (allows user to re-trigger manually)
  const handleReplayIntro = () => {
    setCurrentStep('INTRO');
  };

  // Intro completed -> Transition smoothly to WELCOME
  const handleIntroComplete = () => {
    setCurrentStep('WELCOME');
  };

  // Step 2 -> Step 3: From Welcome to Upload
  const handleWelcomeProceed = () => {
    setForcedExpression('CURIOUS');
    setSpeechText("Show me what you've made.");
    setCurrentStep('UPLOAD');
    setTimeout(() => setForcedExpression(null), 2500);
  };

  // Step 3 -> Step 4: Artwork submitted -> Investigating
  const handleArtworkSubmitted = async (artwork: Artwork) => {
    setCurrentArtwork(artwork);
    setAnalysisError(null);
    setCurrentStep('INVESTIGATING');
    setIsLoadingCritique(true);
    setForcedExpression('CONFUSED');
    setSpeechText("Hmm. Interesting.");

    try {
      const initialStage: CriticStage = 1;
      const critique = await generateInitialCritique(artwork, initialStage);

      setCurrentCritique(critique);
      setCurrentStage(initialStage);
      setExchanges([]);
      setStageLogs([
        {
          stage: 1,
          label: STAGE_CONFIG[1].name,
          reason: 'Initial submission admitted to the gallery stage.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      playStamp();

      // Reaction based on critique score
      if (critique.verdict.overallScore >= 8) {
        setForcedExpression('IMPRESSED');
        setSpeechText("Unfortunately, I respect this.");
      } else {
        setForcedExpression('SUSPICIOUS');
        setSpeechText("We need to discuss your margins.");
      }
      setTimeout(() => setForcedExpression(null), 3000);

      // Transition smoothly into Step 5: VERDICT
      setCurrentStep('VERDICT');
    } catch (err: any) {
      console.error(err);
      setForcedExpression('SHOCKED');
      setSpeechText("Curatorial panic! The canvas analysis encountered an irregularity.");
      setAnalysisError(err?.message || "Failed to complete AI critique. Please check API key or retry.");
    } finally {
      setIsLoadingCritique(false);
    }
  };

  // Retry analysis if failed
  const handleRetryAnalysis = () => {
    if (currentArtwork) {
      handleArtworkSubmitted(currentArtwork);
    } else {
      setCurrentStep('UPLOAD');
    }
  };

  // Step 5 Actions -> Step 6 (Interaction) or Step 7 (Redesign)
  const handleSelectVerdictAction = async (action: 'DEFEND' | 'CHALLENGE' | 'BRUTAL_TRUTH' | 'REDESIGN') => {
    if (action === 'REDESIGN') {
      setCurrentStep('REDESIGN');
      setForcedExpression('CONFUSED');
      setSpeechText("Three formal trajectories.");
      setTimeout(() => setForcedExpression(null), 2500);
    } else if (action === 'BRUTAL_TRUTH') {
      if (brutalTruthData) {
        setInteractionMode('BRUTAL_TRUTH');
        setCurrentStep('INTERACTION');
        setForcedExpression('PROUD');
        setSpeechText(brutalTruthData.hardTruth || "Unvarnished reality.");
        return;
      }
      if (!currentArtwork || isBrutalTruthLoading) return;
      try {
        setIsBrutalTruthLoading(true);
        setBrutalTruthError(null);
        setForcedExpression('PROUD');
        setSpeechText("Analyzing unvarnished design truth...");
        const truth = await generateBrutalTruth(currentArtwork);
        setBrutalTruthData(truth);
        setInteractionMode('BRUTAL_TRUTH');
        setCurrentStep('INTERACTION');
        setSpeechText(truth.hardTruth || "Unvarnished reality.");
      } catch (err: any) {
        console.error('Failed to generate Brutal Truth:', err);
        setBrutalTruthError("Failed to extract brutal truth. Please retry.");
        setSpeechText("Curatorial analysis encountered an issue.");
      } finally {
        setIsBrutalTruthLoading(false);
      }
    } else {
      setInteractionMode(action);
      setCurrentStep('INTERACTION');
      if (action === 'DEFEND') {
        setForcedExpression('CURIOUS');
        setSpeechText("Explain your rationale.");
      } else if (action === 'CHALLENGE') {
        setForcedExpression('SUSPICIOUS');
        setSpeechText("Questioning my qualifications?");
      }
      setTimeout(() => setForcedExpression(null), 2500);
    }
  };

  // Handle new conversation interaction
  const handleNewExchange = (
    exchange: ConversationExchange,
    stageShift?: { nextStage: CriticStage; reason: string }
  ) => {
    setExchanges((prev) => [exchange, ...prev]);

    if (stageShift && stageShift.nextStage !== currentStage) {
      const newStage = stageShift.nextStage;
      setCurrentStage(newStage);
      setStageLogs((prev) => [
        ...prev,
        {
          stage: newStage,
          label: STAGE_CONFIG[newStage].name,
          reason: stageShift.reason,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      if (newStage >= 4) {
        playDramatic();
        setForcedExpression('UNHINGED');
      } else {
        playBounce();
      }
    }
  };

  // Handle score update upon successful defense
  const handleUpdateVerdictScore = (newScore: number) => {
    if (currentCritique) {
      setCurrentCritique({
        ...currentCritique,
        verdict: {
          ...currentCritique.verdict,
          overallScore: newScore
        }
      });
    }
  };

  // Start fresh with a new artwork
  const handleNewArtwork = () => {
    setCurrentArtwork(null);
    setCurrentCritique(null);
    setBrutalTruthData(null);
    setBrutalTruthError(null);
    setCurrentStep('UPLOAD');
    setSpeechText("Show me what you've made.");
    setForcedExpression('CURIOUS');
    setTimeout(() => setForcedExpression(null), 2500);
  };

  // Purge session
  const handleResetSession = () => {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {}
    setCurrentArtwork(null);
    setCurrentCritique(null);
    setBrutalTruthData(null);
    setBrutalTruthError(null);
    setCurrentStage(1);
    setExchanges([]);
    setStageLogs([]);
    setSpeechText("Session memory purged! Composure fully restored.");
    setForcedExpression('IDLE');
    setCurrentStep('WELCOME');
  };

  // Open an archived record: restores original critique & brutal truth without regenerating
  const handleOpenArchivedRecord = (record: ArchiveRecord) => {
    const restoredArtwork: Artwork = {
      id: record.id,
      fileName: record.fileName,
      dataUrl: record.dataUrl,
      fileSizeFormatted: `${Math.round((record.dataUrl.length * 0.75) / 1024)} KB`,
      category: (record.category as ArtworkCategory) || 'Other',
      statement: record.firstImpression || '',
      submittedAt: record.createdAt,
      analysis: {
        width: 800,
        height: 800,
        aspectRatio: '1:1',
        isPortrait: false,
        isLandscape: false,
        isSquare: true,
        dominantColors: ['#171717', '#D71920'],
        brightnessLevel: 'balanced',
        contrastLevel: 'moderate',
        estimatedComplexity: 'balanced',
        hasHighSaturation: false,
        horizontalBalance: 'centered',
        verticalBalance: 'centered',
        edgeDensity: 'balanced-margins'
      }
    };

    setCurrentArtwork(restoredArtwork);
    setCurrentCritique(record.critique);
    setBrutalTruthData(record.brutalTruth || null);
    setCurrentStep('VERDICT');
    setForcedExpression('PROUD');
    setSpeechText(`Archived work restored.`);
    navigateTo('critic');
  };

  return (
    <div
      className="min-h-[100dvh] w-full flex flex-col font-sans select-none overflow-x-hidden"
      style={{
        backgroundColor: 'var(--bg)',
        color: 'var(--text)'
      }}
    >
      {/* 1. INTRO ANIMATION: Plays automatically on every fresh load & refresh of main critic */}
      {route === 'critic' && currentStep === 'INTRO' && (
        <IntroSequence
          onStartReveal={() => {}}
          onComplete={handleIntroComplete}
        />
      )}

      {/* 2. MINIMAL HEADER BAR WITH COMPACT CONTROLS */}
      <HeaderBar
        theme={theme}
        onToggleTheme={handleToggleTheme}
        soundEnabled={soundOn}
        onToggleSound={handleToggleSound}
        onReplayIntro={handleReplayIntro}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onReset={() => setIsResetConfirmOpen(true)}
        onNavigateArchive={() => navigateTo(route === 'archive' ? 'critic' : 'archive')}
        isArchiveView={route === 'archive'}
        hasArtwork={Boolean(currentArtwork && currentCritique)}
        currentStep={route === 'archive' ? 'ARCHIVE' : currentStep}
      />

      {/* 3. CENTRAL VIEW: ARCHIVE PAGE OR STEP-BASED STAGE */}
      {route === 'archive' ? (
        <div className="flex-1 w-full">
          <ArchivePage
            onReturnToCritic={() => navigateTo('critic')}
            onOpenRecord={handleOpenArchivedRecord}
            theme={theme}
          />
        </div>
      ) : (
        <main className="flex-1 w-full max-w-[1200px] mx-auto p-2 sm:p-4 pb-20 sm:pb-4 flex flex-col items-center">
          {/* STEP 2: WELCOME */}
          {currentStep === 'WELCOME' && (
            <WelcomeStep
              currentStage={currentStage}
              speechText={speechText}
              forcedExpression={forcedExpression}
              onExpressionChange={setForcedExpression}
              onSpeechChange={setSpeechText}
              onProceed={handleWelcomeProceed}
              theme={theme}
            />
          )}

          {/* STEP 3: UPLOAD */}
          {currentStep === 'UPLOAD' && (
            <UploadStep
              currentStage={currentStage}
              onArtworkSubmitted={handleArtworkSubmitted}
              speechText={speechText}
              forcedExpression={forcedExpression}
              onExpressionChange={setForcedExpression}
              onSpeechChange={setSpeechText}
              theme={theme}
            />
          )}

          {/* STEP 4: INVESTIGATING */}
          {currentStep === 'INVESTIGATING' && currentArtwork && (
            <InvestigatingStep
              artwork={currentArtwork}
              currentStage={currentStage}
              errorMessage={analysisError}
              onRetry={handleRetryAnalysis}
              onBackToUpload={() => setCurrentStep('UPLOAD')}
              theme={theme}
            />
          )}

          {/* STEP 5: VERDICT */}
          {currentStep === 'VERDICT' && currentArtwork && currentCritique && (
            <VerdictStep
              artwork={currentArtwork}
              critique={currentCritique}
              currentStage={currentStage}
              speechText={speechText}
              forcedExpression={forcedExpression}
              onExpressionChange={setForcedExpression}
              onSpeechChange={setSpeechText}
              onOpenDossier={() => setIsDossierOpen(true)}
              onSelectAction={handleSelectVerdictAction}
              onNewArtwork={handleNewArtwork}
              isBrutalTruthLoading={isBrutalTruthLoading}
              brutalTruthError={brutalTruthError}
              onRetryBrutalTruth={() => handleSelectVerdictAction('BRUTAL_TRUTH')}
              theme={theme}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          )}

          {/* STEP 6: INTERACTION (DEFEND / CHALLENGE / BRUTAL TRUTH) */}
          {currentStep === 'INTERACTION' && currentArtwork && currentCritique && (
            <InteractionStep
              mode={interactionMode}
              artwork={currentArtwork}
              currentCritique={currentCritique}
              currentStage={currentStage}
              onUpdateVerdictScore={handleUpdateVerdictScore}
              onNewExchange={handleNewExchange}
              onReturnToVerdict={() => setCurrentStep('VERDICT')}
              speechText={speechText}
              forcedExpression={forcedExpression}
              onExpressionChange={setForcedExpression}
              onSpeechChange={setSpeechText}
              initialBrutalTruth={brutalTruthData}
              theme={theme}
            />
          )}

          {/* STEP 7: REDESIGN */}
          {currentStep === 'REDESIGN' && currentArtwork && (
            <RedesignStep
              artwork={currentArtwork}
              currentStage={currentStage}
              onReturnToVerdict={() => setCurrentStep('VERDICT')}
              speechText={speechText}
              forcedExpression={forcedExpression}
              onExpressionChange={setForcedExpression}
              onSpeechChange={setSpeechText}
              theme={theme}
            />
          )}
        </main>
      )}

      {/* 4. MODALS & OVERLAYS */}
      {/* Full Critique Overlay */}
      {currentArtwork && currentCritique && (
        <FullCritiqueModal
          isOpen={isDossierOpen}
          onClose={() => setIsDossierOpen(false)}
          artwork={currentArtwork}
          critique={currentCritique}
          brutalTruth={brutalTruthData}
          theme={theme}
        />
      )}

      {/* Settings Modal (AI Engine & Critic Memory) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onApiKeyUpdated={() => {}}
      />

      {/* Reset Confirmation Modal */}
      <ResetConfirmModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetSession}
      />

      {/* 5. MOBILE APP BOTTOM NAVIGATION BAR */}
      <MobileBottomNav
        currentRoute={route}
        onNavigate={navigateTo}
        hasArtwork={Boolean(currentArtwork && currentCritique)}
        onOpenDossier={() => setIsDossierOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onReplayIntro={handleReplayIntro}
        onReset={() => setIsResetConfirmOpen(true)}
        theme={theme}
      />
    </div>
  );
};

export default App;
