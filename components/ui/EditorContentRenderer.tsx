// components/ui/EditorContentRenderer.tsx
import React from 'react';

interface EditorBlock {
  type: string;
  data: any;
}

interface EditorContentRendererProps {
  content: { blocks: EditorBlock[] };
}

const EditorContentRenderer: React.FC<EditorContentRendererProps> = ({
  content
}) => {
  if (!content || !content.blocks) {
    return <p>No content available.</p>;
  }

  return (
    <div>
      {content.blocks.map((block, index) => {
        switch (block.type) {
          case 'paragraph':
            return (
              <p key={index} className="mb-4 text-gray-800">
                {block.data.text}
              </p>
            );
          case 'header':
            return (
              <h2 key={index} className="text-2xl font-bold mb-4">
                {block.data.text}
              </h2>
            );
          case 'list':
            if (block.data.style === 'ordered') {
              return (
                <ol key={index} className="list-decimal ml-6 mb-4">
                  {block.data.items.map((item: string, idx: number) => (
                    <li key={idx} className="mb-2">
                      {item}
                    </li>
                  ))}
                </ol>
              );
            } else {
              return (
                <ul key={index} className="list-disc ml-6 mb-4">
                  {block.data.items.map((item: string, idx: number) => (
                    <li key={idx} className="mb-2">
                      {item}
                    </li>
                  ))}
                </ul>
              );
            }
          case 'image':
            return (
              <div key={index} className="mb-4">
                <img
                  src={block.data.file.url}
                  alt={block.data.caption || 'Image'}
                  className="w-full h-auto rounded"
                />
                {block.data.caption && (
                  <p className="text-sm text-gray-600 mt-2">
                    {block.data.caption}
                  </p>
                )}
              </div>
            );
          case 'quote':
            return (
              <blockquote
                key={index}
                className="border-l-4 border-gray-400 pl-4 italic text-gray-700 mb-4"
              >
                {block.data.text}
                {block.data.caption && (
                  <cite className="block text-right mt-2">
                    - {block.data.caption}
                  </cite>
                )}
              </blockquote>
            );
          default:
            return (
              <p key={index} className="text-red-500 mb-4">
                Unsupported block type: {block.type}
              </p>
            );
        }
      })}
    </div>
  );
};

export default EditorContentRenderer;
