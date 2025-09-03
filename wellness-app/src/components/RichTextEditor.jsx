import React, { useState, useRef, useEffect } from 'react';
import CustomModal from './CustomModal';
import LinkInputModal from './LinkInputModal';
import { useCustomModal } from '../hooks/useCustomModal';
import './Styles/RichTextEditor.css';

const RichTextEditor = ({ value, onChange, placeholder = "Write your thoughts...", isDarkMode = false }) => {
  const editorRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [currentFontSize, setCurrentFontSize] = useState('16');
  const [emojiSearch, setEmojiSearch] = useState('');
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    superscript: false,
    subscript: false
  });
  const [currentTextColor, setCurrentTextColor] = useState('#000000');
  const [currentHighlightColor, setCurrentHighlightColor] = useState('transparent');
  const [showLinkModal, setShowLinkModal] = useState(false);
  
  const { modalState, showAlert } = useCustomModal();

  // Emoji categories
  const emojiCategories = {
    'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐'],
    'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
    'Nature': ['🌸', '🌺', '🌻', '🌷', '🌹', '🥀', '🌾', '🌿', '🍀', '🍃', '🌱', '🌲', '🌳', '🌴', '🌵', '🌶️', '🍄', '🌰', '🌼', '🌻'],
    'Food': ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🌭', '🍔', '🍟', '🍕'],
    'Activities': ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️‍♀️', '🏋️‍♂️', '🤸‍♀️', '🤸‍♂️', '⛹️‍♀️', '⛹️‍♂️', '🤺', '🤾‍♀️', '🤾‍♂️', '🏌️‍♀️', '🏌️‍♂️', '🧘‍♀️', '🧘‍♂️', '🏃‍♀️', '🏃‍♂️', '🚶‍♀️', '🚶‍♂️']
  };

  // Color palette
  const colors = [
    '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
    '#FF0000', '#FF6600', '#FFCC00', '#FFFF00', '#CCFF00', '#66FF00',
    '#00FF00', '#00FF66', '#00FFCC', '#00FFFF', '#00CCFF', '#0066FF',
    '#0000FF', '#6600FF', '#CC00FF', '#FF00FF', '#FF00CC', '#FF0066',
    '#8B4513', '#A0522D', '#CD853F', '#DEB887', '#F4A460', '#D2691E'
  ];

  // Font sizes
  const fontSizes = ['12', '14', '16', '18', '20', '24', '28', '32', '36', '48'];

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  // Handle dark mode changes
  useEffect(() => {
    if (editorRef.current && isDarkMode) {
      // Clean up any black text colors when switching to dark mode
      const content = editorRef.current.innerHTML;
      const cleanedContent = content
        .replace(/color:\s*#000000?;?/gi, '')
        .replace(/color:\s*black;?/gi, '')
        .replace(/color:\s*rgb\(0,\s*0,\s*0\);?/gi, '')
        .replace(/background-color:\s*white;?/gi, '')
        .replace(/background-color:\s*#ffffff?;?/gi, '')
        .replace(/background-color:\s*rgb\(255,\s*255,\s*255\);?/gi, '');
      
      if (cleanedContent !== content) {
        editorRef.current.innerHTML = cleanedContent;
        onChange(cleanedContent);
      }
    }
  }, [isDarkMode]);

  // Handle keyboard shortcuts and cursor position changes
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault();
            execCommand('bold');
            break;
          case 'i':
            e.preventDefault();
            execCommand('italic');
            break;
          case 'u':
            e.preventDefault();
            execCommand('underline');
            break;
          case 'k':
            e.preventDefault();
            insertLink();
            break;
          default:
            break;
        }
      }
      
      // Handle Home key to scroll to top
      if (e.key === 'Home' && e.ctrlKey) {
        e.preventDefault();
        if (editorRef.current) {
          editorRef.current.scrollTop = 0;
        }
      }
    };

    const handleSelectionChange = () => {
      updateActiveFormats();
    };

    const handleKeyUp = () => {
      updateActiveFormats();
    };

    const handleMouseUp = () => {
      updateActiveFormats();
    };

    const editor = editorRef.current;
    if (editor) {
      editor.addEventListener('keydown', handleKeyDown);
      editor.addEventListener('keyup', handleKeyUp);
      editor.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('selectionchange', handleSelectionChange);
      
      return () => {
        editor.removeEventListener('keydown', handleKeyDown);
        editor.removeEventListener('keyup', handleKeyUp);
        editor.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('selectionchange', handleSelectionChange);
      };
    }
  }, []);

  const handleInput = () => {
    if (editorRef.current) {
      let content = editorRef.current.innerHTML;
      
      // Fix text color for dark mode
      if (isDarkMode) {
        // Remove problematic inline styles that override dark mode
        content = content
          .replace(/color:\s*#000000?;?/gi, '')
          .replace(/color:\s*black;?/gi, '')
          .replace(/color:\s*rgb\(0,\s*0,\s*0\);?/gi, '')
          .replace(/background-color:\s*white;?/gi, '')
          .replace(/background-color:\s*#ffffff?;?/gi, '')
          .replace(/background-color:\s*rgb\(255,\s*255,\s*255\);?/gi, '');
        
        // Remove empty style attributes
        content = content.replace(/style="\s*"/gi, '');
        
        if (content !== editorRef.current.innerHTML) {
          const selection = window.getSelection();
          const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
          const startOffset = range ? range.startOffset : 0;
          const endOffset = range ? range.endOffset : 0;
          const startContainer = range ? range.startContainer : null;
          
          editorRef.current.innerHTML = content;
          
          // Restore cursor position
          if (range && startContainer) {
            try {
              const newRange = document.createRange();
              newRange.setStart(startContainer, startOffset);
              newRange.setEnd(startContainer, endOffset);
              selection.removeAllRanges();
              selection.addRange(newRange);
            } catch (e) {
              // If cursor restoration fails, just focus the editor
              editorRef.current.focus();
            }
          }
        }
      }
      
      onChange(content);
      updateActiveFormats();
    }
  };

  const updateActiveFormats = () => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;

    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikeThrough: document.queryCommandState('strikeThrough'),
      superscript: document.queryCommandState('superscript'),
      subscript: document.queryCommandState('subscript')
    });

    // Get current text color
    const textColor = document.queryCommandValue('foreColor');
    if (textColor) {
      // Convert RGB to hex if needed
      const rgbMatch = textColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (rgbMatch) {
        const hex = '#' + [rgbMatch[1], rgbMatch[2], rgbMatch[3]]
          .map(x => parseInt(x).toString(16).padStart(2, '0'))
          .join('');
        setCurrentTextColor(hex);
      } else {
        setCurrentTextColor(textColor);
      }
    }

    // Get current font size
    const fontSize = document.queryCommandValue('fontSize');
    if (fontSize) {
      // Convert font size number to px
      const fontSizeMap = { '1': '10', '2': '13', '3': '16', '4': '18', '5': '24', '6': '32', '7': '48' };
      setCurrentFontSize(fontSizeMap[fontSize] || '16');
    }
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
    handleInput();
    updateActiveFormats();
  };

  const insertEmoji = (emoji) => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const emojiNode = document.createTextNode(emoji);
      range.insertNode(emojiNode);
      range.setStartAfter(emojiNode);
      range.setEndAfter(emojiNode);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      editorRef.current.innerHTML += emoji;
    }
    handleInput();
    setShowEmojiPicker(false);
  };

  const changeFontSize = (size) => {
    setCurrentFontSize(size);
    
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && !selection.isCollapsed) {
      // If text is selected, wrap it in a span with the new font size
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.style.fontSize = size + 'px';
      
      try {
        const contents = range.extractContents();
        span.appendChild(contents);
        range.insertNode(span);
        
        // Clear selection and place cursor after the span
        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.setStartAfter(span);
        newRange.collapse(true);
        selection.addRange(newRange);
      } catch (e) {
        console.error('Error applying font size:', e);
      }
    } else {
      // If no selection, set font size for new text
      const span = document.createElement('span');
      span.style.fontSize = size + 'px';
      span.innerHTML = '&nbsp;'; // Add a space to make the span visible
      
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.insertNode(span);
        
        // Place cursor inside the span
        const newRange = document.createRange();
        newRange.setStart(span.firstChild, 1);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    }
    
    handleInput();
    updateActiveFormats();
  };

  const changeTextColor = (color) => {
    setCurrentTextColor(color);
    
    // In dark mode, avoid setting black colors
    if (isDarkMode && (color === '#000000' || color === 'black')) {
      execCommand('foreColor', '#e5e5e5');
    } else {
      execCommand('foreColor', color);
    }
    
    setShowColorPicker(false);
  };

  const changeHighlightColor = (color) => {
    setCurrentHighlightColor(color);
    
    // In dark mode, avoid white highlights
    if (isDarkMode && (color === '#FFFFFF' || color === 'white')) {
      execCommand('hiliteColor', 'transparent');
    } else {
      execCommand('hiliteColor', color);
    }
    
    setShowHighlightPicker(false);
  };

  // Filter emojis based on search
  const getFilteredEmojis = () => {
    if (!emojiSearch) return emojiCategories;
    
    const filtered = {};
    Object.entries(emojiCategories).forEach(([category, emojis]) => {
      const matchingEmojis = emojis.filter(emoji => 
        category.toLowerCase().includes(emojiSearch.toLowerCase())
      );
      if (matchingEmojis.length > 0) {
        filtered[category] = matchingEmojis;
      }
    });
    return filtered;
  };

  const insertLink = () => {
    setShowLinkModal(true);
  };

  const handleLinkInsert = ({ url, text }) => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const link = document.createElement('a');
      link.href = url;
      link.textContent = text;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      if (selection.isCollapsed) {
        // No text selected, insert new link
        range.insertNode(link);
        range.setStartAfter(link);
        range.setEndAfter(link);
      } else {
        // Text selected, wrap it in link
        const selectedText = range.toString();
        link.textContent = text || selectedText;
        range.deleteContents();
        range.insertNode(link);
        range.setStartAfter(link);
        range.setEndAfter(link);
      }
      
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    handleInput();
    setShowLinkModal(false);
  };

  const clearAllFormatting = () => {
    // First use the standard removeFormat command
    execCommand('removeFormat');
    
    // Then handle blockquotes specifically
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      
      // Find any blockquote elements in the selection
      let element = container.nodeType === Node.TEXT_NODE ? container.parentNode : container;
      while (element && element !== editorRef.current) {
        if (element.tagName === 'BLOCKQUOTE') {
          // Replace blockquote with a div or p
          const newElement = document.createElement('p');
          newElement.innerHTML = element.innerHTML;
          element.parentNode.replaceChild(newElement, element);
          break;
        }
        element = element.parentNode;
      }
    }
    
    // Also remove any inline styles
    const selectedText = selection.toString();
    if (selectedText) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.textContent = selectedText;
      range.deleteContents();
      range.insertNode(span);
    }
    
    handleInput();
    updateActiveFormats();
  };



  return (
    <div className={`rich-text-editor ${isDarkMode ? 'dark-mode' : ''}`}>
      {/* Toolbar */}
      <div className="editor-toolbar">
        {/* Text Formatting */}
        <div className="toolbar-group">
          <button
            type="button"
            onClick={() => execCommand('bold')}
            className={`toolbar-btn ${activeFormats.bold ? 'active' : ''}`}
            title="Bold (Ctrl+B)"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            onClick={() => execCommand('italic')}
            className={`toolbar-btn ${activeFormats.italic ? 'active' : ''}`}
            title="Italic (Ctrl+I)"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            onClick={() => execCommand('underline')}
            className={`toolbar-btn ${activeFormats.underline ? 'active' : ''}`}
            title="Underline (Ctrl+U)"
          >
            <u>U</u>
          </button>
          <button
            type="button"
            onClick={() => execCommand('strikeThrough')}
            className={`toolbar-btn ${activeFormats.strikeThrough ? 'active' : ''}`}
            title="Strikethrough"
          >
            <s>S</s>
          </button>
        </div>

        {/* Font Size */}
        <div className="toolbar-group">
          <select
            value={currentFontSize}
            onChange={(e) => changeFontSize(e.target.value)}
            className="font-size-select"
            title="Font Size"
          >
            {fontSizes.map(size => (
              <option key={size} value={size}>{size}px</option>
            ))}
          </select>
        </div>

        {/* Text Color */}
        <div className="toolbar-group">
          <div className="color-picker-container">
            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="toolbar-btn color-btn"
              title="Text Color"
              style={{ borderBottomColor: currentTextColor, borderBottomWidth: '3px', borderBottomStyle: 'solid' }}
            >
              🎨
            </button>
            {showColorPicker && (
              <div className="color-palette">
                {colors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => changeTextColor(color)}
                    className="color-option"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            )}
          </div>
          
          <div className="color-picker-container">
            <button
              type="button"
              onClick={() => setShowHighlightPicker(!showHighlightPicker)}
              className="toolbar-btn highlight-btn"
              title="Highlight Color"
              style={{ 
                backgroundColor: currentHighlightColor !== 'transparent' ? currentHighlightColor : 'transparent',
                borderColor: currentHighlightColor !== 'transparent' ? currentHighlightColor : 'var(--neutral-gray-300, #e5e5e5)'
              }}
            >
              🖍️
            </button>
            {showHighlightPicker && (
              <div className="color-palette">
                {colors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => changeHighlightColor(color)}
                    className="color-option"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Text Alignment */}
        <div className="toolbar-group">
          <button
            type="button"
            onClick={() => execCommand('justifyLeft')}
            className="toolbar-btn"
            title="Align Left"
          >
            ⬅️
          </button>
          <button
            type="button"
            onClick={() => execCommand('justifyCenter')}
            className="toolbar-btn"
            title="Align Center"
          >
            ↔️
          </button>
          <button
            type="button"
            onClick={() => execCommand('justifyRight')}
            className="toolbar-btn"
            title="Align Right"
          >
            ➡️
          </button>
        </div>

        {/* Lists */}
        <div className="toolbar-group">
          <button
            type="button"
            onClick={() => execCommand('insertUnorderedList')}
            className="toolbar-btn"
            title="Bullet List"
          >
            • List
          </button>
          <button
            type="button"
            onClick={() => execCommand('insertOrderedList')}
            className="toolbar-btn"
            title="Numbered List"
          >
            1. List
          </button>
        </div>

        {/* Emoji Picker */}
        <div className="toolbar-group">
          <div className="emoji-picker-container">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="toolbar-btn emoji-btn"
              title="Insert Emoji"
            >
              😊
            </button>
            {showEmojiPicker && (
              <div className="emoji-picker">
                <div className="emoji-search">
                  <input
                    type="text"
                    placeholder="Search emojis..."
                    value={emojiSearch}
                    onChange={(e) => setEmojiSearch(e.target.value)}
                    className="emoji-search-input"
                  />
                </div>
                <div className="emoji-categories">
                  {Object.entries(getFilteredEmojis()).map(([category, emojis]) => (
                    <div key={category} className="emoji-category">
                      <h4>{category}</h4>
                      <div className="emoji-grid">
                        {emojis.map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => insertEmoji(emoji)}
                            className="emoji-option"
                            title={emoji}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional Formatting */}
        <div className="toolbar-group">
          <button
            type="button"
            onClick={() => execCommand('superscript')}
            className={`toolbar-btn ${activeFormats.superscript ? 'active' : ''}`}
            title="Superscript"
          >
            X²
          </button>
          <button
            type="button"
            onClick={() => execCommand('subscript')}
            className={`toolbar-btn ${activeFormats.subscript ? 'active' : ''}`}
            title="Subscript"
          >
            X₂
          </button>
          <button
            type="button"
            onClick={() => execCommand('formatBlock', 'blockquote')}
            className="toolbar-btn"
            title="Quote"
          >
            💬
          </button>
        </div>

        {/* Additional Options */}
        <div className="toolbar-group">
          <button
            type="button"
            onClick={insertLink}
            className="toolbar-btn"
            title="Insert Link (Ctrl+K)"
          >
            🔗
          </button>
          <button
            type="button"
            onClick={clearAllFormatting}
            className="toolbar-btn"
            title="Clear Formatting"
          >
            🧹
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="editor-content"
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />

      {/* Custom Modals */}
      <CustomModal
        isOpen={modalState.isOpen}
        onClose={modalState.onCancel}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        showCancel={modalState.showCancel}
      />

      <LinkInputModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        onConfirm={handleLinkInsert}
      />
    </div>
  );
};

export default RichTextEditor;