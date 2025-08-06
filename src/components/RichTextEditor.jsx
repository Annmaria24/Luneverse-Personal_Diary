import React, { useState, useRef, useEffect } from 'react';
import './Styles/RichTextEditor.css';

const RichTextEditor = ({ value, onChange, placeholder = "Write your thoughts..." }) => {
  const editorRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentFontSize, setCurrentFontSize] = useState('16');

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

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
    handleInput();
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
    execCommand('fontSize', '7'); // Use size 7 as base, then override with CSS
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.style.fontSize = size + 'px';
      try {
        range.surroundContents(span);
      } catch (e) {
        // If can't surround, just set the font size for new text
        editorRef.current.style.fontSize = size + 'px';
      }
    }
    handleInput();
  };

  const changeTextColor = (color) => {
    execCommand('foreColor', color);
    setShowColorPicker(false);
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  return (
    <div className="rich-text-editor">
      {/* Toolbar */}
      <div className="editor-toolbar">
        {/* Text Formatting */}
        <div className="toolbar-group">
          <button
            type="button"
            onClick={() => execCommand('bold')}
            className="toolbar-btn"
            title="Bold (Ctrl+B)"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            onClick={() => execCommand('italic')}
            className="toolbar-btn"
            title="Italic (Ctrl+I)"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            onClick={() => execCommand('underline')}
            className="toolbar-btn"
            title="Underline (Ctrl+U)"
          >
            <u>U</u>
          </button>
          <button
            type="button"
            onClick={() => execCommand('strikeThrough')}
            className="toolbar-btn"
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
                <div className="emoji-categories">
                  {Object.entries(emojiCategories).map(([category, emojis]) => (
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

        {/* Additional Options */}
        <div className="toolbar-group">
          <button
            type="button"
            onClick={insertLink}
            className="toolbar-btn"
            title="Insert Link"
          >
            🔗
          </button>
          <button
            type="button"
            onClick={() => execCommand('removeFormat')}
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
    </div>
  );
};

export default RichTextEditor;