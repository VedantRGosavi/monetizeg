'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface Repository {
  id: string;
  fullName: string;
  description?: string;
  stars: number;
  language: string;
  isMonetized: boolean;
  adPlacementEnabled: boolean;
}

interface ContentAnalysis {
  technologies: {
    languages: Array<{ name: string; confidence: number }>;
    frameworks: Array<{ name: string; confidence: number }>;
    tools: Array<{ name: string; confidence: number }>;
  };
  topics: Array<{ name: string; confidence: number }>;
  targetAudience: string;
  sentimentScore: number;
  complexityScore: number;
}

interface PlacementResult {
  placementCount: number;
  confidence: number;
  reasoning: string[];
  abTestCreated: boolean;
  abTestId?: string;
  placements: Array<{
    position: number;
    section: string;
    format: string;
    score: number;
    reasoning: string;
  }>;
  contentAnalysis: ContentAnalysis;
}

interface IntelligentAdPlacementProps {
  repository: Repository;
  readmeContent: string;
}

export function IntelligentAdPlacement({ repository, readmeContent }: IntelligentAdPlacementProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysis, setAnalysis] = useState<ContentAnalysis | null>(null);
  const [placementResult, setPlacementResult] = useState<PlacementResult | null>(null);
  const [enableABTesting, setEnableABTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeContent = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/intelligent-ads/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repositoryId: repository.id,
          readmeContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze content');
      }

      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generatePlacements = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const abTestConfig = enableABTesting ? {
        name: `Ad Placement Test - ${repository.fullName}`,
        description: 'Testing optimal ad placement strategies',
        testType: 'placement' as const,
        variants: [
          {
            name: 'Control',
            description: 'Single optimal placement',
            config: {}
          },
          {
            name: 'Multiple',
            description: 'Multiple ad placements',
            config: {}
          }
        ],
        trafficSplit: {
          'variant_1': 50,
          'variant_2': 50
        },
        duration: 14 // 2 weeks
      } : undefined;

      const response = await fetch('/api/intelligent-ads/generate-placements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repositoryId: repository.id,
          enableABTesting,
          abTestConfig,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate placements');
      }

      const data = await response.json();
      setPlacementResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatConfidence = (confidence: number) => {
    return `${(confidence * 100).toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>Intelligent Ad Placement</CardTitle>
          <p className="text-gray-600">
            Use ML-powered content analysis to optimize ad placements for {repository.fullName}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Repository:</span> {repository.fullName}
            </div>
            <div>
              <span className="font-medium">Stars:</span> {repository.stars.toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Language:</span> {repository.language}
            </div>
            <div>
              <span className="font-medium">Status:</span> 
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                repository.isMonetized && repository.adPlacementEnabled 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {repository.isMonetized && repository.adPlacementEnabled ? 'Ready' : 'Setup Required'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-red-800">
              <strong>Error:</strong> {error}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Analysis Section */}
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Content Analysis</CardTitle>
          <p className="text-gray-600">
            Analyze repository content to understand technology stack, topics, and optimal placement positions.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={analyzeContent} 
              disabled={isAnalyzing}
              className="w-full"
            >
              {isAnalyzing ? 'Analyzing Content...' : 'Analyze Repository Content'}
            </Button>

            {analysis && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Technologies */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Detected Technologies</h4>
                    <div className="space-y-1">
                      {analysis.technologies.languages.slice(0, 3).map((tech, index) => (
                        <div key={index} className="text-sm">
                          <span className="font-medium">{tech.name}</span>
                          <span className="text-blue-600 ml-2">
                            {formatConfidence(tech.confidence)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Topics */}
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">Content Topics</h4>
                    <div className="space-y-1">
                      {analysis.topics.map((topic, index) => (
                        <div key={index} className="text-sm">
                          <span className="font-medium">{topic.name.replace('-', ' ')}</span>
                          <span className="text-green-600 ml-2">
                            {formatConfidence(topic.confidence)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Audience & Sentiment */}
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-900 mb-2">Content Profile</h4>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="font-medium">Audience:</span>
                        <span className="ml-2">{analysis.targetAudience.replace('-', ' ')}</span>
                      </div>
                      <div>
                        <span className="font-medium">Sentiment:</span>
                        <span className="ml-2">{formatConfidence(analysis.sentimentScore)}</span>
                      </div>
                      <div>
                        <span className="font-medium">Complexity:</span>
                        <span className="ml-2">{formatConfidence(analysis.complexityScore)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ad Placement Generation */}
      <Card>
        <CardHeader>
          <CardTitle>Step 2: Generate Optimal Placements</CardTitle>
          <p className="text-gray-600">
            Generate contextually relevant ad placements based on content analysis.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* A/B Testing Option */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enable-ab-testing"
                checked={enableABTesting}
                onChange={(e) => setEnableABTesting(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="enable-ab-testing" className="text-sm font-medium">
                Enable A/B Testing (recommended for optimizing performance)
              </label>
            </div>

            <Button 
              onClick={generatePlacements} 
              disabled={isGenerating || !analysis}
              className="w-full"
            >
              {isGenerating ? 'Generating Placements...' : 'Generate Intelligent Placements'}
            </Button>

            {placementResult && (
              <div className="mt-6 space-y-4">
                {/* Results Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Placement Results</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Placements:</span> {placementResult.placementCount}
                    </div>
                    <div>
                      <span className="font-medium">Confidence:</span> {formatConfidence(placementResult.confidence)}
                    </div>
                    <div>
                      <span className="font-medium">A/B Test:</span> {placementResult.abTestCreated ? 'Active' : 'None'}
                    </div>
                    <div>
                      <span className="font-medium">Test ID:</span> {placementResult.abTestId || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Placement Details */}
                <div>
                  <h4 className="font-medium mb-3">Placement Details</h4>
                  <div className="space-y-3">
                    {placementResult.placements.map((placement, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium">Position {placement.position}</h5>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {placement.format}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div><strong>Section:</strong> {placement.section}</div>
                          <div><strong>Score:</strong> {formatConfidence(placement.score)}</div>
                          <div><strong>Reasoning:</strong> {placement.reasoning}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reasoning */}
                <div>
                  <h4 className="font-medium mb-3">AI Reasoning</h4>
                  <ul className="space-y-2 text-sm">
                    {placementResult.reasoning.map((reason, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 