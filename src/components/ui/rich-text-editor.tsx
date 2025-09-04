import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { TextAlign } from '@tiptap/extension-text-align';
import { Underline } from '@tiptap/extension-underline';
import { BulletList } from '@tiptap/extension-bullet-list';
import { OrderedList } from '@tiptap/extension-ordered-list';
import { ListItem } from '@tiptap/extension-list-item';
import { Button } from './button';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List, 
  ListOrdered, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Palette,
  Type
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  compact?: boolean;
}

export function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = "Start typing...",
  className,
  minHeight = "200px",
  compact = false
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      BulletList,
      OrderedList,
      ListItem,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'text-sm max-w-none focus:outline-none p-3 [&_p]:mb-4 [&_ul]:mb-4 [&_ol]:mb-4 [&_h1]:mb-4 [&_h2]:mb-4 [&_h3]:mb-4 [&_li]:mb-2 [&_div]:mb-4 [&_br]:block [&_br]:h-4 [&_*]:!mb-4 [&_li]:!mb-2 [&_strong]:font-bold [&_em]:italic',
        style: `min-height: ${minHeight}; line-height: 1.6`,
      },
    },
  });

  if (!editor) {
    return null;
  }

  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    children, 
    title 
  }: { 
    onClick: () => void; 
    isActive?: boolean; 
    children: React.ReactNode; 
    title: string;
  }) => (
    <Button
      type="button"
      variant={isActive ? "default" : "ghost"}
      size="sm"
      onClick={onClick}
      title={title}
      className={compact ? "h-6 w-6 p-0" : "h-8 w-8 p-0"}
    >
      {children}
    </Button>
  );

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      {/* Toolbar */}
      <div className={cn(
        "border-b bg-muted/50 flex gap-1",
        compact ? "p-1" : "p-2 flex-wrap"
      )}>
        {compact ? (
          /* Compact toolbar - only essential tools */
          <>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive('bold')}
              title="Bold"
            >
              <Bold className="h-3 w-3" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive('italic')}
              title="Italic"
            >
              <Italic className="h-3 w-3" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive('underline')}
              title="Underline"
            >
              <UnderlineIcon className="h-3 w-3" />
            </ToolbarButton>
          </>
        ) : (
          /* Full toolbar */
          <>
            {/* Text Formatting */}
            <div className="flex gap-1 border-r pr-2 mr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title="Underline"
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Headings */}
        <div className="flex gap-1 border-r pr-2 mr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().setParagraph().run()}
            isActive={editor.isActive('paragraph')}
            title="Normal Text"
          >
            <Type className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            H1
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            H2
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            H3
          </ToolbarButton>
        </div>

        {/* Lists */}
        <div className="flex gap-1 border-r pr-2 mr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Alignment */}
        <div className="flex gap-1 border-r pr-2 mr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Colors */}
        <div className="flex gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().setColor('#000000').run()}
            isActive={editor.isActive('textStyle', { color: '#000000' })}
            title="Black"
          >
            <div className="w-4 h-4 rounded border border-gray-300 bg-black" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setColor('#ef4444').run()}
            isActive={editor.isActive('textStyle', { color: '#ef4444' })}
            title="Red"
          >
            <div className="w-4 h-4 rounded border border-gray-300 bg-red-500" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setColor('#3b82f6').run()}
            isActive={editor.isActive('textStyle', { color: '#3b82f6' })}
            title="Blue"
          >
            <div className="w-4 h-4 rounded border border-gray-300 bg-blue-500" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setColor('#10b981').run()}
            isActive={editor.isActive('textStyle', { color: '#10b981' })}
            title="Green"
          >
            <div className="w-4 h-4 rounded border border-gray-300 bg-green-500" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setColor('#f59e0b').run()}
            isActive={editor.isActive('textStyle', { color: '#f59e0b' })}
            title="Orange"
          >
            <div className="w-4 h-4 rounded border border-gray-300 bg-orange-500" />
          </ToolbarButton>
        </div>
          </>
        )}
      </div>

      {/* Editor Content */}
      <div className="bg-background">
        <EditorContent 
          editor={editor} 
          className="focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
        />
        {editor.isEmpty && (
          <div className="absolute top-3 left-3 text-muted-foreground pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  );
}
