
// app/page.tsx
'use client';

import React, { useState } from 'react';
import { Loader2, Wand2, Download, Image as ImageIcon } from 'lucide-react';

export default function DiagramGenerator() {
  const [prompt, setPrompt] = useState<string>('');
  const [diagram, setDiagram] = useState<string>('');
  const [diagramImage, setDiagramImage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const generateDiagram = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError('');
    setDiagram('');
    setDiagramImage('');

    try {
      const response = await fetch('/api/generate-mingram-diagram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate diagram');
      }

      if (data.code) {
        setDiagram(data.code);
      }
      
      if (data.image) {
        setDiagramImage(data.image);
      }
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadCode = () => {
    const blob = new Blob([diagram], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagram.py';
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadImage = () => {
    const a = document.createElement('a');
    a.href = diagramImage;
    a.download = 'diagram.png';
    a.click();
  };

  const examples = [
    'A web application with load balancer, multiple web servers, cache layer, and database',
    'Microservices architecture with API gateway, authentication service, and multiple backend services',
    'Data pipeline with S3 storage, Lambda processing, and RDS database',
    'CI/CD pipeline with GitHub, Jenkins, Docker, and Kubernetes'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            AI Diagram Generator
          </h1>
          <p className="text-gray-600">
            Generate and visualize Mingrammer diagrams from natural language
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Describe Your Architecture
            </h2>
            
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the system architecture you want to diagram..."
              className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />

            <button
              onClick={generateDiagram}
              disabled={loading}
              className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  Generate Diagram
                </>
              )}
            </button>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Example Prompts:
              </h3>
              <div className="space-y-2">
                {examples.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(ex)}
                    className="w-full text-left text-xs p-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Diagram Preview Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Diagram Preview
              </h2>
              {diagramImage && (
                <button
                  onClick={downloadImage}
                  className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download PNG
                </button>
              )}
            </div>

            {diagramImage ? (
              <div className="relative">
                <div className="border-2 border-gray-200 rounded-lg p-4 bg-white overflow-auto max-h-[600px]">
                  <img 
                    src={diagramImage} 
                    alt="Generated Diagram" 
                    className="w-full h-auto"
                  />
                </div>
              </div>
            ) : (
              <div className="h-96 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded-lg">
                {loading ? (
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    <p className="text-sm">Generating diagram...</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Your diagram will appear here</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Code Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Python Code
              </h2>
              {diagram && (
                <button
                  onClick={downloadCode}
                  className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              )}
            </div>

            {diagram ? (
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs max-h-[600px]">
                  <code>{diagram}</code>
                </pre>
              </div>
            ) : (
              <div className="h-96 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded-lg">
                {loading ? (
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    <p className="text-sm">Generating code...</p>
                  </div>
                ) : (
                  <p className="text-sm">Generated code will appear here</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            About This Tool
          </h3>
          <p className="text-gray-600 mb-4">
            This tool uses AI to generate Mingrammer (diagrams library) Python code and renders the diagram 
            in real-time. The backend uses Python to execute the code and generate the PNG image.
          </p>
          <div className="flex gap-4 text-sm">
            <a
              href="https://diagrams.mingrammer.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Documentation →
            </a>
            <a
              href="https://github.com/mingrammer/diagrams"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              GitHub →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}