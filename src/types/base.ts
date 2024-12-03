/**
 * Core type definitions for the Assistant API wrapper.
 * These types are independent of class implementations to avoid circular dependencies.
 */

/**
 * Represents the content of a message in the Assistant API.
 * Messages can be text, images (file or URL), or file attachments.
 */
export interface MessageContent {
  /** The type of content being sent */
  type: 'text' | 'image_file' | 'image_url' | 'file_attachment';
  
  /** Text content, required for type='text' */
  text?: string;
  
  /** File ID from OpenAI, required for type='image_file' or 'file_attachment' */
  file_id?: string;
  
  /** URL for image, required for type='image_url' */
  url?: string;
  
  /** Additional metadata about the message */
  metadata?: {
    /** Whether this message should be hidden from the user */
    hidden?: boolean;
    
    /** Whether this message should be hidden in the UI */
    uiHidden?: boolean;
    
    /** Timestamp of message creation */
    timestamp?: number;
    
    /** File-specific metadata */
    file?: FileAttachment['metadata'];
  };
}

/**
 * Options that can be passed when creating messages
 */
export interface MessageOptions {
  /** 
   * If true, message will be prefixed with hidden instructions.
   * Hidden messages are still sent to the Assistant but may be hidden from the UI.
   */
  hidden?: boolean;
  
  /**
   * Custom prefix for hidden messages. If not provided, DEFAULT_HIDDEN_PREFIX is used.
   * Example: "PROCESS THIS AS INTERNAL DATE INFO: "
   */
  hiddenInstructions?: string;
}

/**
 * Default prefix for hidden messages when no custom instructions are provided
 */
export const DEFAULT_HIDDEN_PREFIX = "THIS IS A HIDDEN SECRET MESSAGE FOR YOU: ";

/**
 * Represents a file attachment in the system
 */
export interface FileAttachment {
  /** Type identifier for file attachments */
  type: 'file_attachment';
  
  /** OpenAI file ID */
  file_id: string;
  
  /** File metadata */
  metadata?: {
    /** Original filename */
    name: string;
    
    /** MIME type */
    type: string;
    
    /** File size in bytes */
    size: number;
    
    /** Whether this file has been vectorized for semantic search */
    vectorized?: boolean;
    
    /** Pinecone namespace where vectors are stored */
    pinecone_namespace?: string;
  };
}

/**
 * Temporary type to avoid circular dependency with AssistantRun
 * This will be replaced with the actual AssistantRun type
 * @internal
 */
export type RunReturn = any;