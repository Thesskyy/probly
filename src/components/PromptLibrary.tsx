import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, X, Save, Trash2 } from 'lucide-react';
import { predefinedPrompts } from '@/constants/prompts';

interface Prompt {
  id: string;
  title: string;
  content: string;
}

interface PromptLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (prompt: string) => void;
}

const PromptLibrary: React.FC<PromptLibraryProps> = ({ isOpen, onClose, onSelectPrompt }) => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newPromptTitle, setNewPromptTitle] = useState('');
  const [newPromptContent, setNewPromptContent] = useState('');
  const [isAddingPrompt, setIsAddingPrompt] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Load prompts from localStorage on mount
  useEffect(() => {
    const savedPrompts = localStorage.getItem('userPrompts');
    if (savedPrompts) {
      try {
        const parsed = JSON.parse(savedPrompts);
        setPrompts([...predefinedPrompts, ...parsed]);
      } catch (error) {
        console.error('Error loading prompts:', error);
        setPrompts([...predefinedPrompts]);
      }
    } else {
      setPrompts([...predefinedPrompts]);
    }
  }, []);

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Filter prompts based on search query
  const filteredPrompts = prompts.filter(
    prompt => 
      prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      prompt.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSavePrompt = () => {
    if (!newPromptTitle.trim() || !newPromptContent.trim()) return;
    
    const newPrompt: Prompt = {
      id: Date.now().toString(),
      title: newPromptTitle.trim(),
      content: newPromptContent.trim()
    };
    
    const updatedPrompts = [...prompts, newPrompt];
    setPrompts(updatedPrompts);
    
    // Save user prompts to localStorage (excluding predefined ones)
    const userPrompts = updatedPrompts.filter(
      prompt => !predefinedPrompts.some(p => p.id === prompt.id)
    );
    localStorage.setItem('userPrompts', JSON.stringify(userPrompts));
    
    // Reset form
    setNewPromptTitle('');
    setNewPromptContent('');
    setIsAddingPrompt(false);
  };

  const handleDeletePrompt = (id: string) => {
    // Check if it's a predefined prompt
    if (predefinedPrompts.some(p => p.id === id)) {
      alert("Cannot delete predefined prompts");
      return;
    }
    
    const updatedPrompts = prompts.filter(prompt => prompt.id !== id);
    setPrompts(updatedPrompts);
    
    // Save updated user prompts to localStorage
    const userPrompts = updatedPrompts.filter(
      prompt => !predefinedPrompts.some(p => p.id === prompt.id)
    );
    localStorage.setItem('userPrompts', JSON.stringify(userPrompts));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Prompt Library</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Search and Add */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search prompts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setIsAddingPrompt(!isAddingPrompt)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              {isAddingPrompt ? <X size={18} /> : <Plus size={18} />}
              {isAddingPrompt ? 'Cancel' : 'Add Prompt'}
            </button>
          </div>
          
          {/* Add Prompt Form */}
          {isAddingPrompt && (
            <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Prompt Title</label>
                <input
                  type="text"
                  value={newPromptTitle}
                  onChange={(e) => setNewPromptTitle(e.target.value)}
                  placeholder="Enter a descriptive title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Prompt Content</label>
                <textarea
                  value={newPromptContent}
                  onChange={(e) => setNewPromptContent(e.target.value)}
                  placeholder="Enter your prompt template..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <button
                onClick={handleSavePrompt}
                disabled={!newPromptTitle.trim() || !newPromptContent.trim()}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Save size={18} />
                Save Prompt
              </button>
            </div>
          )}
        </div>
        
        {/* Prompt List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredPrompts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? 'No prompts match your search' : 'No prompts available'}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredPrompts.map((prompt) => (
                <div 
                  key={prompt.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-800">{prompt.title}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onSelectPrompt(prompt.content)}
                        className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                      >
                        Use
                      </button>
                      {!predefinedPrompts.some(p => p.id === prompt.id) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePrompt(prompt.id);
                          }}
                          className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{prompt.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromptLibrary; 