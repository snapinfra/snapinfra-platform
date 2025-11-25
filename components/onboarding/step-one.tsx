"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { architecturalExamples } from "./utils/step-one-utils"
import {
  GenerationStage,
  FormFields,
  INITIAL_GENERATION_STAGES,
  EXAMPLE_TITLES,
  buildArchitecturalInput,
  generateProjectName,
  validateMinimumFields,
  countCompletedFields,
  calculateProgress,
  formatErrorMessage
} from "./utils/step-one-constants"

interface StepOneProps {
  onComplete: (data: any) => void
}

export function StepOne({ onComplete }: StepOneProps) {
  // Form fields state
  const [formFields, setFormFields] = useState<FormFields>({
    platformType: "",
    businessDomain: "",
    targetMetric: "",
    keyFeatures: "",
    scalingGoal: "",
    compliance: ""
  })

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStages, setGenerationStages] = useState<GenerationStage[]>(INITIAL_GENERATION_STAGES)

  // ============================================
  // HANDLERS
  // ============================================

  const updateField = (field: keyof FormFields, value: string) => {
    setFormFields(prev => ({ ...prev, [field]: value }))
  }

  const updateStageStatus = (stageId: string, status: 'pending' | 'loading' | 'completed') => {
    setGenerationStages(prev => prev.map(stage =>
      stage.id === stageId ? { ...stage, status } : stage
    ))
  }

  const resetAllStages = () => {
    setGenerationStages(prev => prev.map(stage => ({ ...stage, status: 'pending' as const })))
  }

  const loadExample = (index: number) => {
    const example = architecturalExamples[index]
    if (!example) return

    setFormFields({
      platformType: example.platformType,
      businessDomain: example.businessDomain,
      targetMetric: example.targetMetric,
      keyFeatures: example.keyFeatures,
      scalingGoal: example.scalingGoal,
      compliance: example.compliance
    })
  }

  // ============================================
  // MAIN GENERATION LOGIC
  // ============================================

  // Helper function to safely extract diagram data without duplication
  const extractDiagramData = (result: any, fallbackKeys: string[] = ['diagram', 'architecture']) => {
    if (!result?.success) return null;

    // Try to find the first non-null value from the fallback keys
    for (const key of fallbackKeys) {
      if (result[key]) return result[key];
    }

    return null;
  };

  // Helper function to normalize analysis data
  const normalizeAnalysisData = (
    dbRecs: any,
    smartRecs: any,
    optimizations: any,
    security: any,
    scaling: any
  ) => {
    return {
      useCase: dbRecs?.useCase || 'General Purpose',
      databaseRecommendations: dbRecs?.recommendations || [],
      smartRecommendations: smartRecs?.recommendations || [],
      optimizationSuggestions: optimizations?.suggestions || [],
      securityRecommendations: security?.recommendations || [],
      scalingInsights: scaling?.insights || {
        expectedLoad: 'Medium',
        readWriteRatio: '70:30',
        cachingStrategy: 'Application-level',
        indexingPriority: []
      },
      performanceMetrics: scaling?.metrics || []
    };
  };

  const handleGenerate = async () => {
    const architecturalInput = buildArchitecturalInput(formFields);

    if (!validateMinimumFields(formFields)) {
      alert('Please fill in at least the platform type and business domain to continue.');
      return;
    }

    setIsGenerating(true);
    resetAllStages();

    try {
      // ============================================
      // STAGE 1: BACKEND SCHEMA GENERATION
      // ============================================
      updateStageStatus('backend', 'loading');
      updateStageStatus('endpoints', 'loading');

      const backendResponse = await fetch('/api/generate-backend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: architecturalInput,
          options: {
            temperature: 0.7,
            maxTokens: 6000,
          },
        }),
      });

      const backendResult = await backendResponse.json();

      if (!backendResult.success) {
        console.error('Backend generation failed:', backendResult);
        throw new Error(backendResult.error || 'Failed to generate backend');
      }

      console.log('✅ Backend Generation Success');
      updateStageStatus('backend', 'completed');
      updateStageStatus('endpoints', 'completed');

      // ============================================
      // STAGE 2: PARALLEL ANALYSIS GENERATION
      // ============================================
      updateStageStatus('recommendations', 'loading');
      updateStageStatus('smart', 'loading');
      updateStageStatus('performance', 'loading');
      updateStageStatus('security', 'loading');

      const analysisPayload = {
        description: architecturalInput,
        schemas: backendResult.schemas
      };

      // Run all analysis APIs in parallel
      const [dbRecs, smartRecs, optimizations, security, scaling] = await Promise.all([
        fetch('/api/database-recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(analysisPayload)
        }).then(res => res.json()).finally(() => updateStageStatus('recommendations', 'completed')),

        fetch('/api/smart-recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(analysisPayload)
        }).then(res => res.json()).finally(() => updateStageStatus('smart', 'completed')),

        fetch('/api/optimization-suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(analysisPayload)
        }).then(res => res.json()).finally(() => updateStageStatus('performance', 'completed')),

        fetch('/api/security-recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(analysisPayload)
        }).then(res => res.json()).finally(() => updateStageStatus('security', 'completed')),

        fetch('/api/scaling-insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(analysisPayload)
        }).then(res => res.json())
      ]);

      console.log('✅ All Analysis Complete');

      // ============================================
      // STAGE 3: PARALLEL DIAGRAM GENERATION
      // ============================================
      updateStageStatus('hld', 'loading');

      const projectName = generateProjectName(architecturalInput);
      const analysisData = normalizeAnalysisData(dbRecs, smartRecs, optimizations, security, scaling);

      const diagramPayload = {
        schemas: backendResult.schemas,
        endpoints: backendResult.endpoints,
        projectName,
        description: architecturalInput,
        analysis: analysisData
      };

      // Generate all diagrams in parallel
      const [hldResult, lldResult, dataflowResult, erdResult, apiMapResult] = await Promise.all([
        fetch('/api/generate-hld', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(diagramPayload),
        }).then(res => res.json()),

        fetch('/api/generate-lld', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(diagramPayload),
        }).then(res => res.json()),

        fetch('/api/generate-dataflow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(diagramPayload),
        }).then(res => res.json()),

        fetch('/api/generate-erd', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(diagramPayload),
        }).then(res => res.json()),

        fetch('/api/generate-api-map', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(diagramPayload),
        }).then(res => res.json())
      ]);

      // Log results (only once per diagram type)
      if (hldResult.success) {
        console.log('✅ HLD Generation Success');
        updateStageStatus('hld', 'completed');
      } else {
        console.warn('⚠️ HLD generation failed, continuing without HLD');
      }

      if (lldResult.success) {
        console.log('✅ LLD Generation Success');
      } else {
        console.warn('⚠️ LLD generation failed, continuing without LLD');
      }

      if (dataflowResult.success) {
        console.log('✅ Data Flow Generation Success');
      } else {
        console.warn('⚠️ Data Flow generation failed, continuing without Data Flow');
      }

      if (erdResult.success) {
        console.log('✅ ERD Generation Success');
      } else {
        console.warn('⚠️ ERD generation failed, continuing without ERD');
      }

      if (apiMapResult.success) {
        console.log('✅ API Map Generation Success');
      } else {
        console.warn('⚠️ API Map generation failed, continuing without API Map');
      }

      // ============================================
      // STAGE 4: BUILD FINAL RESULT (NO DUPLICATES)
      // ============================================
      const completeResult = {
        // Core backend data
        success: true,
        schemas: backendResult.schemas,
        endpoints: backendResult.endpoints,
        projectName,
        description: architecturalInput,

        // Analysis data (normalized, no duplicates)
        analysis: analysisData,

        // HLD architecture (single source)
        architecture: extractDiagramData(hldResult, ['architecture']),

        // All diagrams in one place (no duplication)
        diagrams: {
          hld: extractDiagramData(hldResult, ['architecture']),
          lld: extractDiagramData(lldResult, ['lld', 'diagram', 'architecture']),
          dataflow: extractDiagramData(dataflowResult, ['dataFlow', 'dataflow', 'diagram', 'architecture']),
          erd: extractDiagramData(erdResult, ['erd', 'diagram', 'architecture']),
          apiMap: extractDiagramData(apiMapResult, ['apiMap', 'diagram', 'architecture'])
        },

        // Metadata (lightweight, no diagram data duplication)
        metadata: {
          hld: hldResult.success ? (hldResult.metadata || null) : null,
          lld: lldResult.success ? (lldResult.metadata || null) : null,
          dataflow: dataflowResult.success ? (dataflowResult.metadata || null) : null,
          erd: erdResult.success ? (erdResult.metadata || null) : null,
          apiMap: apiMapResult.success ? (apiMapResult.metadata || null) : null
        }
      };

      console.log('✅ Complete Result Generated (No Duplicates)');
      console.log('Data size estimate:', JSON.stringify(completeResult).length, 'bytes');

      onComplete(completeResult);

    } catch (error) {
      console.error('❌ Backend generation error:', error);
      resetAllStages();

      const errorMessage = formatErrorMessage(error);

      console.error('Full error details:', {
        error,
        architecturalInput: architecturalInput.substring(0, 200),
        timestamp: new Date().toISOString()
      });

      alert(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const completedFieldsCount = countCompletedFields(formFields)
  const progressPercentage = calculateProgress(generationStages)
  const completedStages = generationStages.filter(stage => stage.status === 'completed').length
  const totalStages = generationStages.length

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-12">
      {/* Step Title */}
      <div className="text-center space-y-3 max-w-[800px]">
        <h1 className="text-[28px] sm:text-[32px] md:text-[36px] font-normal leading-[1.2] text-[#1d1d1f]">
          Describe your platform architecture
        </h1>
        <p className="text-[15px] text-[#86868b] max-w-[700px] mx-auto">
          Provide your vision, objectives, users, features, scaling needs, and compliance requirements
        </p>
      </div>

      {/* Enhanced Dark Input Box with Inline Fill-in-the-Blanks */}
      <div className="w-full max-w-[900px]">
        <div className="relative">
          {/* Solid primary border */}
          <div className="absolute inset-0 rounded-2xl p-[2px] bg-[#005BE3]">
            <div className="w-full h-full rounded-2xl"></div>
          </div>

          {/* Background glow effect */}
          <div className="absolute -inset-2 bg-[#005BE3]/30 rounded-2xl blur-xl opacity-40"></div>

          {/* Main input container */}
          <div className="relative rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden" style={{ margin: '2px' }}>
            {/* Semi-transparent dark background */}
            <div className="absolute inset-0 bg-[#1d1d1f]/90 backdrop-blur-sm z-0"></div>

            {/* Inline Fill-in-the-Blanks Sentence */}
            <div className="p-6 relative z-10">
              <div className="text-white text-[16px] leading-relaxed flex flex-wrap items-center gap-2">
                <span className="text-[rgba(255,255,255,0.7)]">Build a</span>
                <input
                  type="text"
                  value={formFields.platformType}
                  onChange={(e) => updateField('platformType', e.target.value)}
                  placeholder="multi-tenant B2B SaaS"
                  disabled={isGenerating}
                  className="bg-[rgba(0,91,227,0.2)] border-b-2 border-[#005BE3] px-3 py-1 outline-none text-white placeholder-[rgba(255,255,255,0.4)] min-w-[180px] rounded focus:bg-[rgba(0,91,227,0.3)] focus:border-[#0066ff] transition-all"
                />
                <span className="text-[rgba(255,255,255,0.7)]">platform for</span>
                <input
                  type="text"
                  value={formFields.businessDomain}
                  onChange={(e) => updateField('businessDomain', e.target.value)}
                  placeholder="supply chain visibility"
                  disabled={isGenerating}
                  className="bg-[rgba(0,91,227,0.2)] border-b-2 border-[#005BE3] px-3 py-1 outline-none text-white placeholder-[rgba(255,255,255,0.4)] min-w-[180px] rounded focus:bg-[rgba(0,91,227,0.3)] focus:border-[#0066ff] transition-all"
                />
                <span className="text-[rgba(255,255,255,0.7)]">serving</span>
                <input
                  type="text"
                  value={formFields.targetMetric}
                  onChange={(e) => updateField('targetMetric', e.target.value)}
                  placeholder="1M+ daily shipments"
                  disabled={isGenerating}
                  className="bg-[rgba(0,91,227,0.2)] border-b-2 border-[#005BE3] px-3 py-1 outline-none text-white placeholder-[rgba(255,255,255,0.4)] min-w-[160px] rounded focus:bg-[rgba(0,91,227,0.3)] focus:border-[#0066ff] transition-all"
                />
                <span className="text-[rgba(255,255,255,0.7)]" className="w-full"></span>
                <span className="text-[rgba(255,255,255,0.7)]">Key features:</span>
                <input
                  type="text"
                  value={formFields.keyFeatures}
                  onChange={(e) => updateField('keyFeatures', e.target.value)}
                  placeholder="real-time tracking, predictive alerts, API integration"
                  disabled={isGenerating}
                  className="bg-[rgba(0,91,227,0.2)] border-b-2 border-[#005BE3] px-3 py-1 outline-none text-white placeholder-[rgba(255,255,255,0.4)] flex-1 min-w-[300px] rounded focus:bg-[rgba(0,91,227,0.3)] focus:border-[#0066ff] transition-all"
                />
                <span className="text-[rgba(255,255,255,0.7)]" className="w-full mt-2"></span>
                <span className="text-[rgba(255,255,255,0.7)]">Scale to</span>
                <input
                  type="text"
                  value={formFields.scalingGoal}
                  onChange={(e) => updateField('scalingGoal', e.target.value)}
                  placeholder="5K clients across 3 regions"
                  disabled={isGenerating}
                  className="bg-[rgba(0,91,227,0.2)] border-b-2 border-[#005BE3] px-3 py-1 outline-none text-white placeholder-[rgba(255,255,255,0.4)] min-w-[200px] rounded focus:bg-[rgba(0,91,227,0.3)] focus:border-[#0066ff] transition-all"
                />
                <span className="text-[rgba(255,255,255,0.7)]">and ensure</span>
                <input
                  type="text"
                  value={formFields.compliance}
                  onChange={(e) => updateField('compliance', e.target.value)}
                  placeholder="SOC 2, ISO 27001, GDPR"
                  disabled={isGenerating}
                  className="bg-[rgba(0,91,227,0.2)] border-b-2 border-[#005BE3] px-3 py-1 outline-none text-white placeholder-[rgba(255,255,255,0.4)] min-w-[180px] rounded focus:bg-[rgba(0,91,227,0.3)] focus:border-[#0066ff] transition-all"
                />
                <span className="text-[rgba(255,255,255,0.7)]">compliance.</span>
              </div>

              {/* Progress Indicator */}
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {Object.values(formFields).map((field, idx) => (
                      <div
                        key={idx}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${field.trim() ? 'bg-[#005BE3] scale-100' : 'bg-[rgba(255,255,255,0.2)] scale-75'
                          }`}
                      />
                    ))}
                  </div>
                  <span className="text-[13px] text-[rgba(255,255,255,0.5)]">
                    {completedFieldsCount}/6 fields completed
                  </span>
                </div>

                {/* Submit Button */}
                <div>
                  <button
                    onClick={handleGenerate}
                    disabled={!validateMinimumFields(formFields) || isGenerating}
                    className={`px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all duration-200 ${validateMinimumFields(formFields)
                        ? 'bg-[#005BE3] hover:bg-[#004BC9] shadow-[0_2px_8px_rgba(0,91,227,0.4)] cursor-pointer hover:shadow-[0_4px_12px_rgba(0,91,227,0.5)] hover:scale-105'
                        : 'bg-white/10 cursor-not-allowed opacity-50'
                      }`}
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span className="text-white">Generating...</span>
                      </>
                    ) : (
                      <span className="text-white font-medium">Generate Backend Architecture</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Example Buttons */}
      {!isGenerating && (
        <div className="w-full max-w-[900px] mt-6">
          <p className="text-[#605A57] text-sm text-center mb-4">Try an example:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {architecturalExamples.map((example, index) => (
              <button
                key={index}
                onClick={() => loadExample(index)}
                disabled={isGenerating}
                className="p-4 text-center text-sm bg-white hover:bg-[#005BE3]/5 border border-[rgba(55,50,47,0.08)] hover:border-[#005BE3]/20 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-[#37322F] font-medium"
              >
                {EXAMPLE_TITLES[index] || `Example ${index + 1}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {isGenerating && (
        <div className="w-full max-w-[900px] mt-8">
          <div className="bg-white rounded-2xl shadow-lg border border-[rgba(55,50,47,0.08)] p-8">
            <div className="space-y-6">
              {/* Header */}
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-[#005BE3]/20 rounded-full animate-ping"></div>
                    <div className="relative w-2 h-2 bg-[#005BE3] rounded-full"></div>
                  </div>
                  <span className="text-[#1d1d1f] text-base font-medium">Generating your enterprise backend...</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <Progress value={progressPercentage} className="h-2 bg-muted" />
                <p className="text-xs text-[#605A57] text-center">
                  {completedStages} of {totalStages} components completed
                </p>
              </div>

              {/* Status List */}
              <div className="space-y-2">
                {generationStages.map((stage) => {
                  const Icon = stage.icon
                  return (
                    <div
                      key={stage.id}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${stage.status === 'completed'
                          ? 'bg-[#005BE3]/5 text-[#005BE3]'
                          : stage.status === 'loading'
                            ? 'bg-[#005BE3]/10 text-[#005BE3]'
                            : 'bg-transparent text-[#605A57] opacity-40'
                        }`}
                    >
                      <div className="flex-shrink-0">
                        {stage.status === 'completed' ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : stage.status === 'loading' ? (
                          <Icon className="h-5 w-5 animate-pulse" />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                      </div>
                      <span className="text-sm font-medium">{stage.title}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}