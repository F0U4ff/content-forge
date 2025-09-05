'use client';

import { useState, useEffect } from 'react';
import { Sparkles, RotateCcw, Upload, Loader2 } from 'lucide-react';
import { AppState } from '@/types/app';

interface InputSectionProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
  onGetSuggestions: () => void;
  onClearInput: () => void;
  onImageUpload: (file: File) => void;
}

export default function InputSection({ state, updateState, onGetSuggestions, onClearInput, onImageUpload }: InputSectionProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [relevantKeywordsInputString, setRelevantKeywordsInputString] = useState('');

  // Initialize the input string from state on mount or when state changes
  useEffect(() => {
    if (state.relevantKeywords.length > 0) {
      setRelevantKeywordsInputString(state.relevantKeywords.join(', '));
    } else {
      setRelevantKeywordsInputString('');
    }
  }, [state.relevantKeywords]);

  const handleDescriptionChange = (value: string) => {
    updateState({ description: value });
    if (errors.description && value.trim().split(' ').length >= 5) {
      setErrors({ ...errors, description: '' });
    }
  };

  const handlePrimaryKeywordChange = (value: string) => {
    updateState({ primaryKeyword: value });
    if (errors.primaryKeyword && value.trim().split(' ').length >= 2 && value.trim().split(' ').length <= 4) {
      setErrors({ ...errors, primaryKeyword: '' });
    }
  };

  const handleRelevantKeywordsChange = (value: string) => {
    setRelevantKeywordsInputString(value);
    
    // Clear error if we have enough keywords
    const keywords = value.split(',').map(k => k.trim()).filter(k => k.length > 0);
    if (errors.relevantKeywords && keywords.length >= 3) {
      setErrors({ ...errors, relevantKeywords: '' });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate description
    const descriptionWords = state.description.trim().split(' ').filter(w => w.length > 0);
    if (descriptionWords.length < 5) {
      newErrors.description = 'Description must be at least 5 words';
    }

    // Validate primary keyword
    const primaryKeywordWords = state.primaryKeyword.trim().split(' ').filter(w => w.length > 0);
    if (primaryKeywordWords.length < 2 || primaryKeywordWords.length > 4) {
      newErrors.primaryKeyword = 'Primary keyword must be 2-4 words';
    }

    // Validate relevant keywords
    const keywords = relevantKeywordsInputString.split(',').map(k => k.trim()).filter(k => k.length > 0);
    if (keywords.length < 3) {
      newErrors.relevantKeywords = 'Please provide at least 3 relevant keywords';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    // Parse keywords from input string before validation and submission
    const keywords = relevantKeywordsInputString.split(',').map(k => k.trim()).filter(k => k.length > 0);
    updateState({ relevantKeywords: keywords });
    
    if (validateForm()) {
      onGetSuggestions();
    }
  };

  const handleClearAll = () => {
    onClearInput();
    setRelevantKeywordsInputString('');
    setErrors({});
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload(file);
      // Clear the input so the same file can be selected again if needed
      event.target.value = '';
    }
  };

  const triggerFileInput = () => {
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    fileInput?.click();
  };

  const canSubmit = state.description.trim().length > 0 && 
                   state.primaryKeyword.trim().length > 0 && 
                   relevantKeywordsInputString.trim().length > 0 &&
                   !state.isLoadingSuggestions;

  return (
    <div className="bg-[#f8f9fa] p-8">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Tell us about your content idea
          </h2>
        </div>

        {/* Creative Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-3">
            Creative Description
            <span className="text-gray-500 font-normal ml-2">or upload an image to auto-fill</span>
          </label>
          
          {/* Hidden file input */}
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          
          {/* Upload button */}
          <div className="mb-3">
            <button
              type="button"
              onClick={triggerFileInput}
              disabled={state.isParsingImage}
              className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium transition-all duration-200 ${
                state.isParsingImage
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-50 hover:border-indigo-400'
              }`}
            >
              {state.isParsingImage ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Analyzing Image...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Upload Image to Fill Description</span>
                </>
              )}
            </button>
          </div>
          
          <textarea
            id="description"
            value={state.description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="Provide a description of your creative and vertical. (minimum 5 words)"
            className={`w-full px-4 py-3 border rounded-xl resize-none transition-all duration-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
              errors.description ? 'border-red-300' : 'border-gray-300'
            }`}
            style={{ minHeight: '100px' }}
          />
          {errors.description && (
            <p className="mt-2 text-sm text-red-600">{errors.description}</p>
          )}
          <p className="mt-2 text-sm text-gray-500">
            Words: {state.description.trim().split(' ').filter(w => w.length > 0).length}
          </p>
        </div>

        {/* Primary Keyword */}
        <div>
          <label htmlFor="primaryKeyword" className="block text-sm font-semibold text-gray-700 mb-3">
            Primary Keyword
          </label>
          <input
            id="primaryKeyword"
            type="text"
            value={state.primaryKeyword}
            onChange={(e) => handlePrimaryKeywordChange(e.target.value)}
            placeholder="e.g., content marketing strategy"
            className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
              errors.primaryKeyword ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.primaryKeyword && (
            <p className="mt-2 text-sm text-red-600">{errors.primaryKeyword}</p>
          )}
          <p className="mt-2 text-sm text-gray-500">
            2-4 words recommended for best results
          </p>
        </div>

        {/* Relevant Keywords */}
        <div>
          <label htmlFor="relevantKeywords" className="block text-sm font-semibold text-gray-700 mb-3">
            Relevant Keywords
          </label>
          <textarea
            id="relevantKeywords"
            value={relevantKeywordsInputString}
            onChange={(e) => handleRelevantKeywordsChange(e.target.value)}
            placeholder="digital marketing, SEO optimization, social media strategy, content creation, brand awareness"
            className={`w-full px-4 py-3 border rounded-xl resize-none transition-all duration-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
              errors.relevantKeywords ? 'border-red-300' : 'border-gray-300'
            }`}
            style={{ minHeight: '80px' }}
          />
          {errors.relevantKeywords && (
            <p className="mt-2 text-sm text-red-600">{errors.relevantKeywords}</p>
          )}
          <p className="mt-2 text-sm text-gray-500">
            Separate with commas • {relevantKeywordsInputString.split(',').map(k => k.trim()).filter(k => k.length > 0).length} keywords added
          </p>
        </div>

        {/* Submit Button */}
        <div className="pt-4 space-y-3">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`w-full px-8 py-4 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center space-x-2 ${
              canSubmit
                ? 'gradient-purple hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {state.isLoadingSuggestions ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                <span>Generating AI Suggestions...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                <span>✨ Get AI Suggestions</span>
              </>
            )}
          </button>
          
          {/* Clear All Button */}
          <button
            onClick={handleClearAll}
            className="w-full px-8 py-3 rounded-xl font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Clear All Fields</span>
          </button>
        </div>
      </div>
    </div>
  );
}