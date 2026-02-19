"use client";

import React, { useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
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
    Redo
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface PortableTextEditorProps {
    value: any[]; // Portable Text array
    onChangeAction: (value: any[]) => void;
    placeholder?: string;
    language?: string;
    maxLength?: number;
}

/**
 * Convert Tiptap JSON to Sanity Portable Text
 */
function tiptapToPortableText(doc: any): any[] {
    if (!doc || !doc.content) return [];

    const portableText: any[] = [];

    doc.content.forEach((node: any) => {
        if (node.type === 'paragraph') {
            const block: any = {
                _type: 'block',
                _key: uuidv4(),
                style: 'normal',
                children: [],
                markDefs: []
            };

            if (node.content) {
                node.content.forEach((child: any) => {
                    if (child.type === 'text') {
                        const marks: string[] = [];
                        if (child.marks) {
                            child.marks.forEach((mark: any) => {
                                if (mark.type === 'bold') marks.push('strong');
                                if (mark.type === 'italic') marks.push('em');
                                if (mark.type === 'link') {
                                    const markDef = {
                                        _key: uuidv4(),
                                        _type: 'link',
                                        href: mark.attrs.href
                                    };
                                    block.markDefs.push(markDef);
                                    marks.push(markDef._key);
                                }
                            });
                        }

                        block.children.push({
                            _type: 'span',
                            _key: uuidv4(),
                            text: child.text || '',
                            marks
                        });
                    } else if (child.type === 'image') {
                        // Handle inline images
                        portableText.push({
                            _type: 'image',
                            _key: uuidv4(),
                            asset: {
                                _type: 'reference',
                                _ref: child.attrs.src // This will be the temporary URL, needs to be uploaded
                            },
                            alt: child.attrs.alt || ''
                        });
                    }
                });
            }

            if (block.children.length > 0) {
                portableText.push(block);
            }
        } else if (node.type === 'heading') {
            const level = node.attrs.level;
            const style = level === 2 ? 'h2' : level === 3 ? 'h3' : level === 4 ? 'h4' : 'normal';

            const block: any = {
                _type: 'block',
                _key: uuidv4(),
                style,
                children: [],
                markDefs: []
            };

            if (node.content) {
                node.content.forEach((child: any) => {
                    if (child.type === 'text') {
                        const marks: string[] = [];
                        if (child.marks) {
                            child.marks.forEach((mark: any) => {
                                if (mark.type === 'bold') marks.push('strong');
                                if (mark.type === 'italic') marks.push('em');
                            });
                        }

                        block.children.push({
                            _type: 'span',
                            _key: uuidv4(),
                            text: child.text || '',
                            marks
                        });
                    }
                });
            }

            portableText.push(block);
        } else if (node.type === 'bulletList') {
            node.content?.forEach((listItem: any) => {
                const block: any = {
                    _type: 'block',
                    _key: uuidv4(),
                    style: 'normal',
                    listItem: 'bullet',
                    children: [],
                    markDefs: []
                };

                listItem.content?.forEach((para: any) => {
                    para.content?.forEach((child: any) => {
                        if (child.type === 'text') {
                            block.children.push({
                                _type: 'span',
                                _key: uuidv4(),
                                text: child.text || '',
                                marks: []
                            });
                        }
                    });
                });

                portableText.push(block);
            });
        } else if (node.type === 'orderedList') {
            node.content?.forEach((listItem: any) => {
                const block: any = {
                    _type: 'block',
                    _key: uuidv4(),
                    style: 'normal',
                    listItem: 'number',
                    children: [],
                    markDefs: []
                };

                listItem.content?.forEach((para: any) => {
                    para.content?.forEach((child: any) => {
                        if (child.type === 'text') {
                            block.children.push({
                                _type: 'span',
                                _key: uuidv4(),
                                text: child.text || '',
                                marks: []
                            });
                        }
                    });
                });

                portableText.push(block);
            });
        } else if (node.type === 'image') {
            portableText.push({
                _type: 'image',
                _key: uuidv4(),
                asset: {
                    _type: 'reference',
                    _ref: node.attrs.src
                },
                alt: node.attrs.alt || ''
            });
        }
    });

    return portableText;
}

/**
 * Convert Sanity Portable Text to Tiptap JSON
 */
function portableTextToTiptap(portableText: any): any {
    // Defensive check: ensure input is actually an array
    if (!portableText || !Array.isArray(portableText) || portableText.length === 0) {
        return {
            type: 'doc',
            content: []
        };
    }

    const content: any[] = [];

    portableText.forEach((block: any) => {
        if (block._type === 'block') {
            let nodeType = 'paragraph';
            const attrs: any = {};

            if (block.style === 'h2') {
                nodeType = 'heading';
                attrs.level = 2;
            } else if (block.style === 'h3') {
                nodeType = 'heading';
                attrs.level = 3;
            } else if (block.style === 'h4') {
                nodeType = 'heading';
                attrs.level = 4;
            }

            const children: any[] = [];

            block.children?.forEach((child: any) => {
                if (child._type === 'span') {
                    const marks: any[] = [];

                    child.marks?.forEach((mark: string) => {
                        if (mark === 'strong') marks.push({ type: 'bold' });
                        if (mark === 'em') marks.push({ type: 'italic' });
                        // Handle link marks
                        const linkMark = block.markDefs?.find((def: any) => def._key === mark);
                        if (linkMark && linkMark._type === 'link') {
                            marks.push({
                                type: 'link',
                                attrs: { href: linkMark.href }
                            });
                        }
                    });

                    children.push({
                        type: 'text',
                        text: child.text,
                        marks: marks.length > 0 ? marks : undefined
                    });
                }
            });

            content.push({
                type: nodeType,
                attrs,
                content: children.length > 0 ? children : undefined
            });
        } else if (block._type === 'image') {
            content.push({
                type: 'image',
                attrs: {
                    src: block.asset._ref,
                    alt: block.alt || ''
                }
            });
        }
    });

    return {
        type: 'doc',
        content
    };
}

export default function PortableTextEditor({
    value,
    onChangeAction,
    placeholder,
    language = 'en',
    maxLength = 20000
}: PortableTextEditorProps) {
    const isRTL = language === 'ar';

    const editor = useEditor({
        immediatelyRender: false, // Prevents SSR hydration errors in Next.js
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [2, 3, 4]
                }
            }),
            Image.configure({
                inline: true,
                allowBase64: true
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-ccm-water underline'
                }
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
                class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4',
                dir: isRTL ? 'rtl' : 'ltr'
            }
        }
    });

    const addImage = useCallback(() => {
        const url = window.prompt('Enter image URL:');
        if (url && editor) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    }, [editor]);

    const setLink = useCallback(() => {
        const url = window.prompt('Enter URL:');
        if (url && editor) {
            editor.chain().focus().setLink({ href: url }).run();
        }
    }, [editor]);

    if (!editor) {
        return null;
    }

    const charCount = editor.state.doc.textContent.length;

    return (
        <div className="border rounded-lg overflow-hidden">
            {/* Toolbar */}
            <div className="border-b bg-muted/30 p-2 flex flex-wrap gap-1">
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
                    onClick={addImage}
                >
                    <ImageIcon className="w-4 h-4" />
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
            <EditorContent editor={editor} placeholder={placeholder} />

            {/* Footer */}
            <div className="border-t p-2 text-xs text-muted-foreground flex justify-between">
                <span>Use the toolbar to format your content</span>
                <span className={charCount > maxLength ? 'text-destructive' : ''}>
                    {charCount}/{maxLength} characters
                </span>
            </div>
        </div>
    );
}
