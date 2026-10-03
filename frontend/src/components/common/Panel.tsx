import { ReactNode } from 'react';

export default function Panel({ children, className = '', title }: { children: ReactNode, className?: string, title?: string }) {
  return (
    <div className={`panel flex flex-col ${className}`}>
      {title && (
        <div className="panel-header">
          <h3 className="text-sm font-semibold text-text-primary tracking-wide">{title}</h3>
        </div>
      )}
      <div className="flex-1 p-4 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
