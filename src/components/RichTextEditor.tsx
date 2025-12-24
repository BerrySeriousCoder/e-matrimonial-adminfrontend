'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { useEffect } from 'react';

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    maxLength?: number;
    className?: string;
}

export default function RichTextEditor({
    value,
    onChange,
    placeholder = 'Enter your text here...',
    maxLength,
    className = '',
}: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: false, // Disable headings
                blockquote: false, // Disable blockquotes
                code: false, // Disable code blocks
                codeBlock: false,
            }),
            Underline,
        ],
        content: value,
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            onChange(html);
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm focus:outline-none min-h-[110px] px-3 py-2 text-gray-900',
            },
        },
    });

    // Update editor content when value changes externally
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    // Get character count (visible text only)
    const characterCount = editor?.getText().length || 0;
    const isOverLimit = maxLength ? characterCount > maxLength : false;

    return (
        <div className={`border ${isOverLimit ? 'border-red-300' : 'border-gray-300'} rounded ${className}`}>
            {/* Toolbar */}
            <div className="flex flex-wrap gap-1 p-2 border-b border-gray-300 bg-gray-50">
                <button
                    type="button"
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                    className={`px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 transition-colors text-gray-800 ${editor?.isActive('bold') ? 'bg-indigo-100 border-indigo-400 font-bold' : 'bg-white'
                        }`}
                    title="Bold"
                >
                    <strong>B</strong>
                </button>
                <button
                    type="button"
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                    className={`px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 transition-colors text-gray-800 ${editor?.isActive('italic') ? 'bg-indigo-100 border-indigo-400' : 'bg-white'
                        }`}
                    title="Italic"
                >
                    <em>I</em>
                </button>
                <button
                    type="button"
                    onClick={() => editor?.chain().focus().toggleUnderline().run()}
                    className={`px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 transition-colors text-gray-800 ${editor?.isActive('underline') ? 'bg-indigo-100 border-indigo-400' : 'bg-white'
                        }`}
                    title="Underline"
                >
                    <u>U</u>
                </button>
                <div className="w-px bg-gray-300 mx-1" />
                <button
                    type="button"
                    onClick={() => editor?.chain().focus().toggleBulletList().run()}
                    className={`px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 transition-colors text-gray-800 ${editor?.isActive('bulletList') ? 'bg-indigo-100 border-indigo-400' : 'bg-white'
                        }`}
                    title="Bullet List"
                >
                    • List
                </button>
                <button
                    type="button"
                    onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                    className={`px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 transition-colors text-gray-800 ${editor?.isActive('orderedList') ? 'bg-indigo-100 border-indigo-400' : 'bg-white'
                        }`}
                    title="Numbered List"
                >
                    1. List
                </button>
            </div>

            {/* Editor Content */}
            <div className="bg-white">
                <EditorContent editor={editor} />
            </div>

            {/* Character Counter */}
            {maxLength && (
                <div className={`px-3 py-1 text-xs text-right border-t border-gray-300 ${isOverLimit ? 'text-red-600 bg-red-50' : 'text-gray-600 bg-gray-50'
                    }`}>
                    {characterCount} / {maxLength} characters
                    {isOverLimit && ' (exceeds limit)'}
                </div>
            )}
        </div>
    );
}
