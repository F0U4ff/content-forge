'use client';

import { useState, useEffect } from 'react';
import { Copy, ArrowLeft, Edit3, Send, Loader2 } from 'lucide-react';
import type { Article } from '@/types/app';

export default function ArticlePage() {
  const [article, setArticle] = useState<Article | null>(null);
  const [copied, setCopied] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [showRefinementPanel, setShowRefinementPanel] = useState(false);
  const [refinementInstructions, setRefinementInstructions] = useState('');
  const [refinementHistory, setRefinementHistory] = useState<Array<{
    instructions: string;
    timestamp: string;
    previousContent: string;
  }>>([]);

  useEffect(() => {
    // First, check if we're viewing a specific historical article
    const currentViewingArticle = localStorage.getItem('contentforge-current-viewing-article');
    if (currentViewingArticle) {
      try {
        const article = JSON.parse(currentViewingArticle);
        setArticle(article);
        // Clear the viewing article from localStorage after loading
        localStorage.removeItem('contentforge-current-viewing-article');
        return;
      } catch (error) {
        console.error('Failed to load current viewing article:', error);
      }
    }

    // Listen for article data from parent window
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data && event.data.article) {
        setArticle(event.data.article);
      }
    };

    window.addEventListener('message', handleMessage);

    // Check localStorage as fallback for the most recent article
    const savedState = localStorage.getItem('contentforge-state');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        if (state.article) {
          setArticle(state.article);
        }
      } catch (error) {
        console.error('Failed to load article from storage:', error);
      }
    }

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleCopy = async () => {
    if (article) {
      try {
        await navigator.clipboard.writeText(article.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy article:', error);
      }
    }
  };

  const handleRefineArticle = async () => {
    if (!article || !refinementInstructions.trim()) return;

    setIsRefining(true);

    try {
      const response = await fetch('/api/refine-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentContent: article.content,
          title: article.title,
          instructions: refinementInstructions.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to refine article');
      }

      const data = await response.json();
      
      // Save current state to history before updating
      const historyEntry = {
        instructions: refinementInstructions,
        timestamp: new Date().toISOString(),
        previousContent: article.content
      };
      
      setRefinementHistory(prev => [historyEntry, ...prev]);
      
      // Update article with refined content
      setArticle(prev => prev ? { ...prev, content: data.refinedContent } : null);
      
      // Clear instructions and close panel
      setRefinementInstructions('');
      setShowRefinementPanel(false);
      
    } catch (error) {
      console.error('Error refining article:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsRefining(false);
    }
  };

  const handleUndoRefinement = (historyIndex: number) => {
    if (!article || historyIndex >= refinementHistory.length) return;
    
    const historyEntry = refinementHistory[historyIndex];
    setArticle(prev => prev ? { ...prev, content: historyEntry.previousContent } : null);
    
    // Remove this and all subsequent history entries
    setRefinementHistory(prev => prev.slice(historyIndex + 1));
  };

  const handleNewArticle = () => {
    // Send reset message to parent window if it exists
    if (window.opener) {
      window.opener.postMessage({ type: 'resetInputState' }, window.location.origin);
    }
    window.close();
  };

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your article...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Floating Action Bar */}
      <div className="fixed top-6 right-6 z-50 bg-white rounded-full shadow-lg p-2">
        <button
          onClick={() => setShowRefinementPanel(!showRefinementPanel)}
          className={`p-3 rounded-full transition-colors duration-200 mr-2 ${
            showRefinementPanel ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 text-gray-600'
          }`}
          title="Refine article"
        >
          <Edit3 className="h-5 w-5" />
        </button>
        <button
          onClick={handleCopy}
          className={`p-3 rounded-full transition-colors duration-200 ${
            copied ? 'bg-green-100 text-green-600' : 'hover:bg-gray-100 text-gray-600'
          }`}
          title="Copy to clipboard"
        >
          <Copy className="h-5 w-5" />
        </button>
      </div>

      {/* Refinement Panel */}
      {showRefinementPanel && (
        <div className="fixed top-20 right-6 z-40 w-96 bg-white rounded-xl shadow-xl border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Refine Article</h3>
              <button
                onClick={() => setShowRefinementPanel(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Refinement Instructions
                </label>
                <textarea
                  value={refinementInstructions}
                  onChange={(e) => setRefinementInstructions(e.target.value)}
                  placeholder="e.g., Make it more conversational, add more statistics, focus on benefits rather than features..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  rows={4}
                />
              </div>
              
              <button
                onClick={handleRefineArticle}
                disabled={!refinementInstructions.trim() || isRefining}
                className={`w-full px-4 py-2 rounded-lg font-medium text-white transition-all duration-200 flex items-center justify-center space-x-2 ${
                  refinementInstructions.trim() && !isRefining
                    ? 'bg-indigo-600 hover:bg-indigo-700'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                {isRefining ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Refining...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Refine Article</span>
                  </>
                )}
              </button>
            </div>
            
            {/* Refinement History */}
            {refinementHistory.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Changes</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {refinementHistory.slice(0, 3).map((entry, index) => (
                    <div key={index} className="text-xs bg-gray-50 rounded-lg p-2">
                      <div className="flex items-start justify-between">
                        <p className="text-gray-600 flex-1 mr-2">
                          {entry.instructions.length > 50 
                            ? entry.instructions.substring(0, 50) + '...' 
                            : entry.instructions}
                        </p>
                        <button
                          onClick={() => handleUndoRefinement(index)}
                          className="text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          Undo
                        </button>
                      </div>
                      <p className="text-gray-400 mt-1">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-[20px] card-shadow p-8 md:p-12">
            {/* Header */}
            <div className="mb-8">
              <button
                onClick={handleNewArticle}
                className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 transition-colors duration-200 mb-6"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Create New Article</span>
              </button>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                {article.title}
              </h1>
            </div>

            {/* Article Content */}
            <div className="prose prose-lg max-w-none">
              {article.content.split('\n').map((line, index) => {
                const trimmed = line.trim();
                
                if (trimmed.startsWith('## ')) {
                  return (
                    <h2 key={index} className="text-2xl font-semibold text-gray-800 mt-6 mb-3">
                      {trimmed.substring(3)}
                    </h2>
                  );
                }
                
                if (trimmed.startsWith('### ')) {
                  return (
                    <h3 key={index} className="text-xl font-medium text-gray-800 mt-4 mb-2">
                      {trimmed.substring(4)}
                    </h3>
                  );
                }
                
                if (trimmed === '') {
                  return <div key={index} className="h-4"></div>;
                }
                
                // Process bold text
                const processedLine = trimmed.split(/(\*\*[^*]+\*\*)/).map((part, partIndex) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return (
                      <strong key={partIndex} className="font-semibold text-gray-900">
                        {part.slice(2, -2)}
                      </strong>
                    );
                  }
                  return part;
                });
                
                return (
                  <p key={index} className="text-gray-700 leading-relaxed mb-4">
                    {processedLine}
                  </p>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {copied && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-full">
          Article copied to clipboard!
        </div>
      )}
      
      {/* Success message for refinement */}
      {refinementHistory.length > 0 && !isRefining && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white px-4 py-2 rounded-full opacity-0 animate-pulse">
          Article refined successfully!
        </div>
      )}
    </div>
  );
}