'use client';

import { useState, useEffect } from 'react';
import { useLatest } from '@/hooks/use-latest';
import { Sparkles, CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import InputSection from '@/components/InputSection';
import SuggestionsSection from '@/components/SuggestionsSection';
import ArticleHistorySidebar from '@/components/ArticleHistorySidebar';
import { AppState, SuggestionResponse, Article } from '@/types/app';

const initialState: AppState = {
  description: '',
  primaryKeyword: '',
  relevantKeywords: [],
  suggestedHeadlines: [],
  suggestedKeywords: [],
  selectedHeadline: '',
  selectedKeywords: [],
  isLoadingSuggestions: false,
  isGeneratingArticle: false,
  isParsingImage: false,
  showSuggestions: false,
  article: null,
  articleHistory: []
};

export default function Home() {
  const [state, setState] = useState<AppState>(initialState);
  const stateRef = useLatest(state);

  // Reset state for input fields and suggestions
  const resetInputAndSuggestionState = {
    description: '',
    primaryKeyword: '',
    relevantKeywords: [],
    suggestedHeadlines: [],
    suggestedKeywords: [],
    selectedHeadline: '',
    selectedKeywords: [],
    isLoadingSuggestions: false,
    isGeneratingArticle: false,
    isParsingImage: false,
    showSuggestions: false,
    article: null
  };

  const resetAllInputRelatedState = () => {
    updateState(resetInputAndSuggestionState);
    localStorage.removeItem('contentforge-state');
  };

  // Auto-save to localStorage
  useEffect(() => {
    const interval = setInterval(() => {
      localStorage.setItem('contentforge-state', JSON.stringify(stateRef.current));
    }, 5000);

    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('contentforge-state');
    if (saved) {
      try {
        const parsedState = JSON.parse(saved);
        setState(prevState => ({ ...prevState, ...parsedState, isLoadingSuggestions: false, isGeneratingArticle: false }));
      } catch (error) {
        console.error('Failed to load saved state:', error);
      }
    }
  }, []);

  // Listen for reset messages from article page
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data && event.data.type === 'resetInputState') {
        resetAllInputRelatedState();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateState = (updates: Partial<AppState>) => {
    setState(prevState => ({ ...prevState, ...updates }));
  };

  const handleGetSuggestions = async () => {
    updateState({ isLoadingSuggestions: true, showSuggestions: false });

    try {
      const response = await fetch('/api/get-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: state.description,
          primaryKeyword: state.primaryKeyword,
          relevantKeywords: state.relevantKeywords
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get suggestions');
      }

      const data: SuggestionResponse = await response.json();
      
      updateState({
        suggestedHeadlines: data.headlines,
        suggestedKeywords: data.keywords,
        isLoadingSuggestions: false,
        showSuggestions: true
      });
    } catch (error) {
      console.error('Error getting suggestions:', error);
      updateState({ isLoadingSuggestions: false });
    }
  };

  const handleGenerateArticle = async () => {
    updateState({ isGeneratingArticle: true });

    try {
      const response = await fetch('/api/generate-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: state.description,
          primaryKeyword: state.primaryKeyword,
          selectedHeadline: state.selectedHeadline,
          selectedKeywords: state.selectedKeywords
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate article');
      }

      const data = await response.json();
      
      // Create full article object with metadata
      const fullArticle: Article = {
        id: Date.now().toString(),
        ...data.article,
        createdAt: new Date().toISOString(),
        primaryKeyword: state.primaryKeyword,
        selectedKeywords: state.selectedKeywords
      };
      
      // Add to history
      const newHistory = [fullArticle, ...state.articleHistory];
      
      updateState({
        article: fullArticle,
        articleHistory: newHistory,
        isGeneratingArticle: false
      });

      // Open article in new tab
      const newWindow = window.open('/article', '_blank');
      if (newWindow) {
        // Pass article data to new window
        newWindow.addEventListener('load', () => {
          newWindow.postMessage({ article: fullArticle }, '*');
        });
      }
    } catch (error) {
      console.error('Error generating article:', error);
      
      // Show more specific error messages to the user
      let errorMessage = 'Failed to generate article. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('SAFETY')) {
          errorMessage = 'Content was blocked by safety filters. Please try with different keywords or description.';
        } else if (error.message.includes('RECITATION')) {
          errorMessage = 'Content was blocked due to recitation concerns. Please try with more original content.';
        } else if (error.message.includes('API key')) {
          errorMessage = 'API key not configured. Please check your environment variables.';
        } else if (error.message.includes('quota') || error.message.includes('429')) {
          errorMessage = 'API quota exceeded. Please try again later.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        }
      }
      
      // You could add a toast notification system here
      alert(errorMessage);
      
      updateState({ isGeneratingArticle: false });
    }
  };

  const handleImageUpload = async (file: File) => {
    updateState({ isParsingImage: true });

    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
      });

      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

      // Call API to parse image text
      const response = await fetch('/api/parse-image-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Image: base64Data,
          mimeType: file.type
        })
      });

      if (!response.ok) {
        throw new Error('Failed to parse image text');
      }

      const data = await response.json();
      
      // Update description with extracted text
      updateState({
        description: data.extractedText,
        isParsingImage: false
      });
    } catch (error) {
      console.error('Error parsing image:', error);
      updateState({ isParsingImage: false });
      // You might want to show an error message to the user here
    }
  };

  const handleViewHistoryArticle = (article: Article) => {
    // Store the selected article for viewing
    localStorage.setItem('contentforge-current-viewing-article', JSON.stringify(article));
    
    // Open article in new tab
    const newWindow = window.open('/article', '_blank');
    if (newWindow) {
      newWindow.addEventListener('load', () => {
        newWindow.postMessage({ article }, '*');
      });
    }
  };

  const handleDeleteArticle = (articleId: string) => {
    const newHistory = state.articleHistory.filter(article => article.id !== articleId);
    updateState({ articleHistory: newHistory });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="gradient-purple text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Content<span className="text-yellow-300">Forge</span>
            </h1>
            <p className="text-xl opacity-90">
              AI-Powered RSOC Content Page Creator
            </p>
            <p className="text-lg opacity-75 mt-2">
              Create articles fully compliant with Google&apos;s policies in minutes
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 -mt-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-[20px] card-shadow overflow-hidden">
              {/* Input Section */}
              <InputSection
                state={state}
                updateState={updateState}
                onGetSuggestions={handleGetSuggestions}
                onClearInput={resetAllInputRelatedState}
                onImageUpload={handleImageUpload}
              />

              {/* Suggestions Section */}
              {(state.showSuggestions || state.isLoadingSuggestions) && (
                <SuggestionsSection
                  state={state}
                  updateState={updateState}
                  onGenerateArticle={handleGenerateArticle}
                />
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 sticky top-[72px] h-fit">
            <ArticleHistorySidebar
              articles={state.articleHistory}
              onViewArticle={handleViewHistoryArticle}
              onDeleteArticle={handleDeleteArticle}
            />
          </div>
        </div>

        {/* Status Footer */}
        <div className="mt-8 text-center text-gray-600">
          <p className="text-sm">
            ✨ Auto-save enabled • 20 articles per hour • Professional SEO optimization
          </p>
        </div>
      </div>
    </div>
  );
}