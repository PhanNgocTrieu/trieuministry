"use client";

import React from 'react';

interface ArticleContentProps {
    content: string;
    className?: string;
}

/**
 * ArticleContent - Renders rich HTML content with newspaper-style layout
 * Features:
 * - Responsive images with proper scaling
 * - Typography optimized for readability
 * - Blockquote styling
 * - Proper heading hierarchy
 */
export default function ArticleContent({ content, className = "" }: ArticleContentProps) {
    return (
        <article 
            className={`article-content ${className}`}
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
}

// Global styles for article content - applied via globals.css or inline
export const articleStyles = `
/* Article Content - Newspaper Style Layout */
.article-content {
    font-size: 1.125rem;
    line-height: 1.8;
    color: #334155;
    max-width: 100%;
}

.dark .article-content {
    color: #cbd5e1;
}

/* Headings */
.article-content h1 {
    font-size: 2.25rem;
    font-weight: 800;
    margin: 2rem 0 1rem;
    line-height: 1.3;
    color: #0f172a;
}

.dark .article-content h1 {
    color: #f1f5f9;
}

.article-content h2 {
    font-size: 1.75rem;
    font-weight: 700;
    margin: 1.75rem 0 0.875rem;
    line-height: 1.35;
    color: #1e293b;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 0.5rem;
}

.dark .article-content h2 {
    color: #e2e8f0;
    border-bottom-color: #334155;
}

.article-content h3 {
    font-size: 1.375rem;
    font-weight: 600;
    margin: 1.5rem 0 0.75rem;
    color: #334155;
}

.dark .article-content h3 {
    color: #cbd5e1;
}

/* Paragraphs */
.article-content p {
    margin: 1.25rem 0;
    text-align: justify;
    hyphens: auto;
}

.article-content p:first-child {
    margin-top: 0;
}

/* First paragraph - Drop cap style (optional, commented out for simplicity) */
/* .article-content > p:first-of-type::first-letter {
    float: left;
    font-size: 4rem;
    line-height: 1;
    font-weight: 700;
    margin-right: 0.5rem;
    color: #6366f1;
} */

/* Images - Newspaper Style */
.article-content img {
    display: block;
    max-width: 100%;
    height: auto;
    margin: 2rem auto;
    border-radius: 0.75rem;
    box-shadow: 
        0 4px 6px -1px rgba(0, 0, 0, 0.1),
        0 2px 4px -2px rgba(0, 0, 0, 0.1);
}

/* Full-width images */
.article-content img.full-width {
    width: 100%;
    max-width: none;
    margin-left: -1rem;
    margin-right: -1rem;
    width: calc(100% + 2rem);
    border-radius: 0;
}

/* Image with caption wrapper */
.article-content figure {
    margin: 2rem 0;
    text-align: center;
}

.article-content figure img {
    margin: 0 auto 0.75rem;
}

.article-content figcaption {
    font-size: 0.875rem;
    color: #64748b;
    font-style: italic;
    max-width: 80%;
    margin: 0 auto;
}

.dark .article-content figcaption {
    color: #94a3b8;
}

/* Blockquotes */
.article-content blockquote {
    margin: 2rem 0;
    padding: 1.5rem 2rem;
    border-left: 4px solid #6366f1;
    background: linear-gradient(to right, #f8fafc, transparent);
    border-radius: 0 0.5rem 0.5rem 0;
    font-style: italic;
    color: #475569;
}

.dark .article-content blockquote {
    background: linear-gradient(to right, rgba(99, 102, 241, 0.1), transparent);
    color: #94a3b8;
}

.article-content blockquote p {
    margin: 0;
}

/* Lists */
.article-content ul,
.article-content ol {
    margin: 1.5rem 0;
    padding-left: 2rem;
}

.article-content li {
    margin: 0.5rem 0;
}

.article-content ul li::marker {
    color: #6366f1;
}

.article-content ol li::marker {
    color: #6366f1;
    font-weight: 600;
}

/* Links */
.article-content a {
    color: #4f46e5;
    text-decoration: underline;
    text-underline-offset: 2px;
    transition: color 0.2s;
}

.article-content a:hover {
    color: #6366f1;
}

.dark .article-content a {
    color: #818cf8;
}

.dark .article-content a:hover {
    color: #a5b4fc;
}

/* Strong & Emphasis */
.article-content strong {
    font-weight: 700;
    color: #1e293b;
}

.dark .article-content strong {
    color: #f1f5f9;
}

.article-content em {
    font-style: italic;
}

/* Horizontal Rule */
.article-content hr {
    margin: 3rem auto;
    border: none;
    width: 4rem;
    height: 4px;
    background: linear-gradient(to right, #6366f1, #a855f7);
    border-radius: 2px;
}

/* Code (inline) */
.article-content code {
    background: #f1f5f9;
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-size: 0.875em;
    font-family: ui-monospace, SFMono-Regular, monospace;
}

.dark .article-content code {
    background: #1e293b;
}

/* Pre/Code blocks */
.article-content pre {
    background: #1e293b;
    color: #e2e8f0;
    padding: 1.5rem;
    border-radius: 0.75rem;
    overflow-x: auto;
    margin: 1.5rem 0;
}

.article-content pre code {
    background: none;
    padding: 0;
}

/* Tables */
.article-content table {
    width: 100%;
    margin: 2rem 0;
    border-collapse: collapse;
}

.article-content th,
.article-content td {
    padding: 0.75rem 1rem;
    border: 1px solid #e2e8f0;
    text-align: left;
}

.dark .article-content th,
.dark .article-content td {
    border-color: #334155;
}

.article-content th {
    background: #f8fafc;
    font-weight: 600;
}

.dark .article-content th {
    background: #1e293b;
}

/* Responsive adjustments */
@media (max-width: 640px) {
    .article-content {
        font-size: 1rem;
        line-height: 1.75;
    }
    
    .article-content h1 {
        font-size: 1.75rem;
    }
    
    .article-content h2 {
        font-size: 1.5rem;
    }
    
    .article-content h3 {
        font-size: 1.25rem;
    }
    
    .article-content blockquote {
        padding: 1rem 1.25rem;
    }
    
    .article-content img {
        margin: 1.5rem auto;
    }
}
`;
