import { promises as fs } from 'fs';
import path from 'path';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { LockIcon } from 'lucide-react';
import Header from '@/components/Header';
import MarkdownViewer from '@/components/MarkdownViewer';
import WebTerminal from '@/components/WebTerminal';
import { db } from '@/lib/db';
import ResizableSplit from '@/components/ResizableSplit';

export default async function LabPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: labId } = await params;

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('user_session');
  let username = '';
  
  if (sessionCookie) {
    try {
      const session = JSON.parse(sessionCookie.value);
      username = session.username;

      const accessResult = await db.query(
        'SELECT has_access FROM lab_access WHERE username = $1 AND lab_id = $2',
        [username, labId]
      );
      const accessRow = accessResult.rows[0];

      if (!accessRow || accessRow.has_access === false) {
        return (
          <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 text-white">
            <div className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900/90 p-8 shadow-2xl text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 border border-red-500/30">
                <LockIcon className="h-7 w-7 text-red-500" />
              </div>
              <h1 className="text-3xl font-bold text-red-500">Access Restricted</h1>
              <p className="mt-3 text-zinc-400">
                You do not have permission to access this lab. Please contact your instructor.
              </p>
              <Link
                href="/"
                className="mt-7 inline-flex items-center rounded-lg bg-zinc-800 px-5 py-2.5 font-medium text-zinc-100 hover:bg-zinc-700 transition-colors"
              >
                ← Back to Portal
              </Link>
            </div>
          </div>
        );
      }
    } catch (e) {
      console.error('Failed to parse session cookie or check DB');
    }
  }

  let markdownContent = '';
  let labTitle = `Lab ${labId.replace('-', '.')}`;

  try {
    const dbResult = await db.query(
      'SELECT title, content FROM labs WHERE lab_key = $1 LIMIT 1',
      [labId]
    );

    const dbLab = dbResult.rows[0];
    if (dbLab?.title) {
      labTitle = dbLab.title;
    }

    if (dbLab?.content) {
      markdownContent = dbLab.content;
    } else {
      const filePath = path.join(process.cwd(), 'page', `lab${labId}.md`);
      markdownContent = await fs.readFile(filePath, 'utf8');
    }
  } catch (error) {
    try {
      const filePath = path.join(process.cwd(), 'page', `lab${labId}.md`);
      markdownContent = await fs.readFile(filePath, 'utf8');
    } catch {
      markdownContent = '# Lab Not Found\nThe requested lab document could not be loaded.';
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-white">
      <Header title={`Lab ${labId.replace('-', '.')}`} />
      <div className="w-full bg-white py-2 px-6 text-xs text-[#4F4F4F] border-b border-[#E0E6ED]">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-[#828282] hover:text-[#333] transition-colors">
            ← Back to Portal
          </Link>
          <span className="text-[#BDBDBD]">|</span>
          <span>Lab: {labTitle}</span>
        </div>
      </div>
      
      <ResizableSplit
        leftPanel={
          <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
            <MarkdownViewer content={markdownContent} />
          </div>
        }
        rightPanel={
          <div className="flex-1 p-8 flex flex-col bg-zinc-950">
            <div className="flex-1 min-h-0 relative">
              <WebTerminal labId={labId} username={username} />
            </div>
          </div>
        }
      />
    </div>
  );
}
