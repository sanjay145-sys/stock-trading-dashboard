'use client';

import { useState } from 'react';
import { Shield, Target, Clock, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import RiskRewardGauge from './RiskRewardGauge';
import type { AiRecommendation, Recommendation } from '@/types';

const REC_STYLES: Record<
  Recommendation,
  { bg: string; border: string; text: string; badge: string; icon: string }
> = {
  INVEST: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300',
    icon: '🟢',
  },
  WATCH: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-300',
    icon: '🟡',
  },
  AVOID: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    badge: 'bg-red-500/20 text-red-300',
    icon: '🔴',
  },
};

interface RecommendationCardProps {
  aiRec: AiRecommendation;
  ticker: string;
}

export default function RecommendationCard({ aiRec, ticker }: RecommendationCardProps) {
  const [showTechnical, setShowTechnical] = useState(false);
  const styles = REC_STYLES[aiRec.recommendation];

  return (
    <div
      className="rounded-xl border border-zinc-800 overflow-hidden"
      style={{ backgroundColor: 'var(--bg-card)' }}
    >
      {/* Header */}
      <div className={`px-4 py-3 border-b ${styles.bg} ${styles.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{styles.icon}</span>
            <div>
              <span className={`text-lg font-black tracking-tight ${styles.text}`}>
                {aiRec.recommendation}
              </span>
              <span className="text-xs text-zinc-500 ml-2">{ticker}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-[10px] text-zinc-500">Price Target</p>
              <p className="text-sm font-bold text-zinc-100">${aiRec.priceTarget.toFixed(2)}</p>
            </div>
            <div className={`px-2 py-1 rounded-lg text-xs font-bold ${styles.badge}`}>
              AI Pick
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Risk / Reward / Confidence gauges */}
        <div className="flex items-center justify-around">
          <RiskRewardGauge value={aiRec.riskScore} label="Risk" variant="risk" />
          <div className="w-px h-12 bg-zinc-800" />
          <RiskRewardGauge value={aiRec.rewardScore} label="Reward" variant="reward" />
          <div className="w-px h-12 bg-zinc-800" />
          <RiskRewardGauge value={aiRec.confidence} label="Confidence" variant="confidence" />
        </div>

        {/* Horizon */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800">
          <Clock className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-xs text-zinc-400">Suggested horizon:</span>
          <span className="text-xs font-semibold text-zinc-100">{aiRec.suggestedHorizon}</span>
        </div>

        {/* Simple explanation */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Target className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-semibold text-zinc-300">AI Analysis</span>
            <span className="text-[10px] text-zinc-600 ml-0.5">· Plain English</span>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">{aiRec.rationaleSimple}</p>
        </div>

        {/* Technical detail toggle */}
        <button
          onClick={() => setShowTechnical(!showTechnical)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-colors"
        >
          <span className="text-xs text-zinc-400">Technical depth</span>
          {showTechnical ? (
            <ChevronUp className="w-3.5 h-3.5 text-zinc-500" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
          )}
        </button>

        {showTechnical && (
          <p className="text-xs text-zinc-500 leading-relaxed px-1">{aiRec.rationaleTechnical}</p>
        )}

        {/* Key risks */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-semibold text-zinc-300">Key Risks</span>
          </div>
          <ul className="space-y-1.5">
            {aiRec.keyRisks.map((risk, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1 w-1 h-1 rounded-full bg-zinc-600 flex-shrink-0" />
                <span className="text-xs text-zinc-500">{risk}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-1.5 pt-1 border-t border-zinc-800">
          <Shield className="w-3 h-3 text-zinc-600" />
          <span className="text-[10px] text-zinc-600">
            AI-generated · Not financial advice · Updated{' '}
            {new Date(aiRec.updatedAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
