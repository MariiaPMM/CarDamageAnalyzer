import { createContext, type PropsWithChildren, useContext, useMemo, useState } from 'react';

import { saveAnalysisHistory } from '@/lib/history';
import { analyzeCarDamagePhotos, type DamageAnalysis } from '@/lib/openai';

export type PickedPhoto = {
  uri: string;
  mimeType: string;
  base64: string;
  fileName?: string | null;
};

export type AnalysisDraft = {
  brand: string;
  model: string;
  year: string;
  photos: PickedPhoto[];
};

type AnalysisFlowContextValue = {
  draft: AnalysisDraft | null;
  result: DamageAnalysis | null;
  error: string;
  isAnalyzing: boolean;
  setDraft: (draft: AnalysisDraft) => void;
  submitDraft: (draft: AnalysisDraft, email?: string | null) => Promise<void>;
  runAnalysis: (email?: string | null) => Promise<void>;
  resetFlow: () => void;
  clearResult: () => void;
};

const AnalysisFlowContext = createContext<AnalysisFlowContextValue | null>(null);

export function AnalysisFlowProvider({ children }: PropsWithChildren) {
  const [draft, setDraftState] = useState<AnalysisDraft | null>(null);
  const [result, setResult] = useState<DamageAnalysis | null>(null);
  const [error, setError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  async function executeAnalysis(targetDraft: AnalysisDraft, email?: string | null) {
    if (!targetDraft.photos.length) {
      setError('Спочатку додай хоча б одне фото авто.');
      return;
    }

    const vehicleContext = [targetDraft.brand.trim(), targetDraft.model.trim(), targetDraft.year.trim()]
      .filter(Boolean)
      .join(' ');

    setIsAnalyzing(true);
    setError('');
    setResult(null);

    try {
      const response = await analyzeCarDamagePhotos({
        photos: targetDraft.photos.map((photo) => ({
          base64Data: photo.base64,
          mimeType: photo.mimeType,
        })),
        vehicleModelInput: vehicleContext,
      });

      setResult(response);

      if (email) {
        await saveAnalysisHistory({
          email,
          analysis: response,
          photos: targetDraft.photos.map((photo) => ({
            uri: photo.uri,
            fileName: photo.fileName,
          })),
        });
      }
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'Не вдалося виконати аналіз.';
      setError(message);
    } finally {
      setIsAnalyzing(false);
    }
  }

  const value = useMemo<AnalysisFlowContextValue>(
    () => ({
      draft,
      result,
      error,
      isAnalyzing,
      setDraft(nextDraft) {
        setDraftState(nextDraft);
        setResult(null);
        setError('');
      },
      async submitDraft(nextDraft, email) {
        setDraftState(nextDraft);
        await executeAnalysis(nextDraft, email);
      },
      async runAnalysis(email) {
        if (!draft) {
          setError('Спочатку додай дані для аналізу.');
          return;
        }

        await executeAnalysis(draft, email);
      },
      resetFlow() {
        setDraftState(null);
        setResult(null);
        setError('');
        setIsAnalyzing(false);
      },
      clearResult() {
        setResult(null);
        setError('');
      },
    }),
    [draft, error, isAnalyzing, result]
  );

  return <AnalysisFlowContext.Provider value={value}>{children}</AnalysisFlowContext.Provider>;
}

export function useAnalysisFlow() {
  const context = useContext(AnalysisFlowContext);
  if (!context) {
    throw new Error('useAnalysisFlow must be used inside AnalysisFlowProvider');
  }

  return context;
}
