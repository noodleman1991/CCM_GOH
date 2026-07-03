"use client";

import React, { useCallback, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { Placeholder } from '@tiptap/extensions';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Heading2,
    Heading3,
    Heading4,
    LinkIcon,
    ImageIcon,
    Undo,
    Redo,
    Loader2
} from 'lucide-react';
import { tiptapToPortableText, portableTextToTiptap } from '@/components/forms/editor/pt-convert';
import { SlashMenu } from '@/components/forms/editor/slash-menu';
import { DEFAULT_SLASH_MENU_ITEMS, type SlashMenuItemId } from '@/components/forms/editor/slash-menu-list';
import { EditorImage } from '@/components/forms/editor/nodes/image-node';
import { Youtube } from '@/components/forms/editor/nodes/youtube-node';
import { InfoBox } from '@/components/forms/editor/nodes/info-box-node';
import { Break } from '@/components/forms/editor/nodes/break-node';
import { StoryTimeline } from '@/components/forms/editor/nodes/timeline-node';
import { StoryChart } from '@/components/forms/editor/nodes/chart-node';
import { StoryMermaid } from '@/components/forms/editor/nodes/mermaid-node';
import { uploadEditorImage, ImageUploadError } from '@/components/forms/editor/upload';

export { tiptapToPortableText, portableTextToTiptap };

interface PortableTextEditorProps {
    value: any[]; // Portable Text array
    onChangeAction: (value: any[]) => void;
    placeholder?: string;
    language?: string;
    maxLength?: number;
    /** Which slash-menu blocks to offer. Defaults to all five insert-group items (headings/lists count as baseline, not gated). */
    enabledBlocks?: SlashMenuItemId[];
    /** Passed to the upload endpoint so it can authorize against a workspace membership (workspace docs only). */
    collaborationId?: string;
    /**
     * Visual shell. "default" keeps the bordered card look used by workspace
     * docs; "canvas" (Task E3) drops the card chrome for an open editorial
     * canvas — floating pill toolbar, borderless body, quiet footer.
     */
    variant?: 'default' | 'canvas';
}

export default function PortableTextEditor({
    value,
    onChangeAction,
    placeholder,
    language = 'en',
    maxLength = 20000,
    enabledBlocks = DEFAULT_SLASH_MENU_ITEMS,
    collaborationId,
    variant = 'default'
}: PortableTextEditorProps) {
    const t = useTranslations('editor');
    const isRTL = language === 'ar';
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const editor = useEditor({
        immediatelyRender: false, // Prevents SSR hydration errors in Next.js
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [2, 3, 4]
                }
            }),
            EditorImage.configure({
                inline: false,
                allowBase64: false
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-ccm-water underline'
                }
            }),
            Youtube,
            InfoBox,
            Break,
            // "Data & story" blocks (Task E8). Always registered so existing
            // content renders; whether they're OFFERED is per-surface via
            // `enabledBlocks` (lived experiences exclude them).
            StoryTimeline,
            StoryChart,
            StoryMermaid,
            // Renders the `placeholder` prop as ghost text on the empty editor
            // (the prop was previously passed to EditorContent as a no-op DOM
            // attribute). Styled via `.is-editor-empty` in globals.css.
            Placeholder.configure({
                placeholder: placeholder ?? ''
            }),
            SlashMenu.configure({
                enabledBlocks,
                labels: Object.fromEntries(
                    enabledBlocks.map((id) => [id, t(`slashMenu.items.${id}.label`)])
                ),
                onInsertImage: () => fileInputRef.current?.click()
            })
        ],
        content: portableTextToTiptap(value),
        onUpdate: ({ editor }) => {
            const json = editor.getJSON();
            const portable = tiptapToPortableText(json);
            onChangeAction(portable);
        },
        editorProps: {
            attributes: {
                class: variant === 'canvas'
                    ? 'prose max-w-none focus:outline-none min-h-[420px] py-4'
                    : 'prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4',
                dir: isRTL ? 'rtl' : 'ltr'
            }
        }
    });

    const insertUploadedImage = useCallback(
        async (file: File) => {
            if (!editor) return;
            setUploading(true);
            try {
                const uploaded = await uploadEditorImage(file, collaborationId);
                editor
                    .chain()
                    .focus()
                    .setImage({
                        src: uploaded.url,
                        // @ts-expect-error -- EditorImage's extra attrs aren't in tiptap's base SetImageOptions type
                        assetRef: uploaded.assetRef,
                        width: uploaded.width,
                        height: uploaded.height,
                        lqip: uploaded.lqip
                    })
                    .run();
            } catch (err) {
                const message = err instanceof ImageUploadError ? err.message : t('image.uploadFailed');
                toast.error(message);
            } finally {
                setUploading(false);
            }
        },
        [editor, collaborationId, t]
    );

    const onFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            e.target.value = ''; // allow re-selecting the same file
            if (file) void insertUploadedImage(file);
        },
        [insertUploadedImage]
    );

    const setLink = useCallback(() => {
        const url = window.prompt(t('link.promptUrl'));
        if (url && editor) {
            editor.chain().focus().setLink({ href: url }).run();
        }
    }, [editor, t]);

    if (!editor) {
        return null;
    }

    const charCount = editor.state.doc.textContent.length;

    const isCanvas = variant === 'canvas';

    return (
        <div className={isCanvas ? '' : 'border rounded-lg overflow-hidden'}>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={onFileChange}
                aria-hidden="true"
                tabIndex={-1}
            />
            {/* Toolbar — floating pill in canvas mode, card header otherwise */}
            <div
                className={
                    isCanvas
                        ? 'flex w-fit flex-wrap gap-1 rounded-full border border-border/70 bg-background/95 px-2 py-1 shadow-sm'
                        : 'border-b bg-muted/30 p-2 flex flex-wrap gap-1'
                }
            >
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={editor.isActive('bold') ? 'bg-muted' : ''}
                >
                    <Bold className="w-4 h-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={editor.isActive('italic') ? 'bg-muted' : ''}
                >
                    <Italic className="w-4 h-4" />
                </Button>

                <div className="w-px h-6 bg-border mx-1" />

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={editor.isActive('heading', { level: 2 }) ? 'bg-muted' : ''}
                >
                    <Heading2 className="w-4 h-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={editor.isActive('heading', { level: 3 }) ? 'bg-muted' : ''}
                >
                    <Heading3 className="w-4 h-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
                    className={editor.isActive('heading', { level: 4 }) ? 'bg-muted' : ''}
                >
                    <Heading4 className="w-4 h-4" />
                </Button>

                <div className="w-px h-6 bg-border mx-1" />

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={editor.isActive('bulletList') ? 'bg-muted' : ''}
                >
                    <List className="w-4 h-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={editor.isActive('orderedList') ? 'bg-muted' : ''}
                >
                    <ListOrdered className="w-4 h-4" />
                </Button>

                <div className="w-px h-6 bg-border mx-1" />

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={setLink}
                    className={editor.isActive('link') ? 'bg-muted' : ''}
                >
                    <LinkIcon className="w-4 h-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    aria-label={t('image.insertLabel')}
                >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                </Button>

                <div className="w-px h-6 bg-border mx-1" />

                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                >
                    <Undo className="w-4 h-4" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                >
                    <Redo className="w-4 h-4" />
                </Button>
            </div>

            {/* Editor */}
            <EditorContent editor={editor} />

            {/* Footer */}
            <div
                className={
                    isCanvas
                        ? 'pt-1 text-xs text-muted-foreground flex justify-between'
                        : 'border-t p-2 text-xs text-muted-foreground flex justify-between'
                }
            >
                <span>{t('hint')}</span>
                <span className={charCount > maxLength ? 'text-destructive' : ''}>
                    {charCount}/{maxLength} {t('charCountSuffix')}
                </span>
            </div>
        </div>
    );
}
