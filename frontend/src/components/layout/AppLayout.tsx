import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-[#F7F9FC] text-text-primary overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-[#F7F9FC]">
          {children}
        </main>
      </div>
    </div>
  );
}
