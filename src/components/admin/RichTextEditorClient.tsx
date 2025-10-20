'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Link as LinkIcon, 
  Image as ImageIcon,
  Undo,
  Redo
} from 'lucide-react'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  disabled?: boolean
}

export default function RichTextEditorClient({ 
  content, 
  onChange, 
  placeholder = 'Inserisci il testo...',
  disabled = false 
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
    ],
    content,
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none p-3 min-h-[120px] border border-gray-300 rounded-md',
      },
    },
  })

  if (!editor) {
    return (
      <div className="border border-gray-300 rounded-md p-3 min-h-[120px] bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Caricamento editor...</div>
      </div>
    )
  }

  const addLink = () => {
    const url = window.prompt('Inserisci l\'URL:')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    }
  }

  const addImage = () => {
    const url = window.prompt('Inserisci l\'URL dell\'immagine:')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-gray-50 p-2 flex flex-wrap gap-1">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed ${
            editor.isActive('bold') ? 'bg-gray-300' : ''
          }`}
        >
          <Bold className="h-4 w-4" />
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed ${
            editor.isActive('italic') ? 'bg-gray-300' : ''
          }`}
        >
          <Italic className="h-4 w-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={!editor.can().chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed ${
            editor.isActive('bulletList') ? 'bg-gray-300' : ''
          }`}
        >
          <List className="h-4 w-4" />
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={!editor.can().chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed ${
            editor.isActive('orderedList') ? 'bg-gray-300' : ''
          }`}
        >
          <ListOrdered className="h-4 w-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <button
          onClick={addLink}
          className="p-2 rounded hover:bg-gray-200"
        >
          <LinkIcon className="h-4 w-4" />
        </button>
        
        <button
          onClick={addImage}
          className="p-2 rounded hover:bg-gray-200"
        >
          <ImageIcon className="h-4 w-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Undo className="h-4 w-4" />
        </button>
        
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Redo className="h-4 w-4" />
        </button>
      </div>

      {/* Editor */}
      <EditorContent 
        editor={editor} 
        className="min-h-[120px]"
        placeholder={placeholder}
      />
    </div>
  )
}
