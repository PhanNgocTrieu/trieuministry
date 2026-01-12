declare module 'react-quill-new' {
    import * as React from 'react';

    export interface ReactQuillProps {
        theme?: string;
        modules?: any;
        formats?: string[];
        value?: string;
        defaultValue?: string;
        placeholder?: string;
        readOnly?: boolean;
        onChange?: (content: string, delta: any, source: string, editor: any) => void;
        className?: string;
        style?: React.CSSProperties;
        ref?: any;
        children?: React.ReactNode; 
    }

    const ReactQuill: React.ComponentType<ReactQuillProps>;
    export default ReactQuill;
}
