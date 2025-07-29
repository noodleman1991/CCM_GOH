/// <reference types="react" />

import {DocumentActionComponent} from 'sanity'
import type {FieldDefinition} from 'sanity'
import {JSX as JSX_2} from 'react'
import type {KeyedObject} from 'sanity'
import type {ObjectSchemaType} from 'sanity'
import {Plugin as Plugin_2} from 'sanity'
import type {Reference} from 'sanity'
import type {SanityClient} from 'sanity'
import type {SanityDocument} from 'sanity'
import type {SanityDocumentLike} from 'sanity'

export declare const DeleteTranslationAction: DocumentActionComponent

export declare const documentInternationalization: Plugin_2<PluginConfig>

export declare function DocumentInternationalizationMenu(
  props: DocumentInternationalizationMenuProps
): JSX_2.Element | null

export declare type DocumentInternationalizationMenuProps = {
  schemaType: ObjectSchemaType
  documentId: string
}

export declare interface DocumentInternationalizationSchemaOpts {
  documentInternationalization?: {
    /** Set to true to disable duplication of this field or type */
    exclude?: boolean
  }
}

export declare const DuplicateWithTranslationsAction: DocumentActionComponent

export declare type Language = {
  id: Intl.UnicodeBCP47LocaleIdentifier
  title: string
}

export declare type Metadata = {
  _id: string
  _createdAt: string
  translations: TranslationReference[]
}

export declare type MetadataDocument = SanityDocumentLike & {
  schemaTypes: string[]
  translations: TranslationReference[]
}

export declare type PluginCallbackArgs = {
  sourceDocument: SanityDocument
  newDocument: SanityDocument
  sourceLanguageId: string
  destinationLanguageId: string
  metaDocumentId: string
  client: SanityClient
}

export declare type PluginConfig = {
  supportedLanguages: SupportedLanguages
  schemaTypes: string[]
  languageField?: string
  weakReferences?: boolean
  bulkPublish?: boolean
  metadataFields?: FieldDefinition[]
  apiVersion?: string
  allowCreateMetaDoc?: boolean
  callback?: ((args: PluginCallbackArgs) => Promise<void>) | null
}

export declare type PluginConfigContext = Required<PluginConfig> & {
  supportedLanguages: Language[]
}

export declare type SupportedLanguages =
  | Language[]
  | ((client: SanityClient) => Promise<Language[]>)

export declare type TranslationReference = KeyedObject & {
  _type: 'internationalizedArrayReferenceValue'
  value: Reference
}

export declare function useDocumentInternationalizationContext(): PluginConfigContext

export {}

declare module 'sanity' {
  interface ArrayOptions extends DocumentInternationalizationSchemaOpts {}
  interface BlockOptions extends DocumentInternationalizationSchemaOpts {}
  interface BooleanOptions extends DocumentInternationalizationSchemaOpts {}
  interface CrossDatasetReferenceOptions
    extends DocumentInternationalizationSchemaOpts {}
  interface DateOptions extends DocumentInternationalizationSchemaOpts {}
  interface DatetimeOptions extends DocumentInternationalizationSchemaOpts {}
  interface FileOptions extends DocumentInternationalizationSchemaOpts {}
  interface GeopointOptions extends DocumentInternationalizationSchemaOpts {}
  interface ImageOptions extends DocumentInternationalizationSchemaOpts {}
  interface NumberOptions extends DocumentInternationalizationSchemaOpts {}
  interface ObjectOptions extends DocumentInternationalizationSchemaOpts {}
  interface ReferenceBaseOptions
    extends DocumentInternationalizationSchemaOpts {}
  interface SlugOptions extends DocumentInternationalizationSchemaOpts {}
  interface StringOptions extends DocumentInternationalizationSchemaOpts {}
  interface TextOptions extends DocumentInternationalizationSchemaOpts {}
  interface UrlOptions extends DocumentInternationalizationSchemaOpts {}
  interface EmailOptions extends DocumentInternationalizationSchemaOpts {}
}
