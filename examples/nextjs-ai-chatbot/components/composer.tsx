'use client';

import { MODELS } from '@/utils/models';
import {
  ArrowUpIcon,
  ImageIcon,
  MicIcon,
  MicOffIcon,
  Paperclip,
  XIcon,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/contexts/app';
import { useTranscriber } from '@/hooks/usetranscribe';

export default function Composer() {
  const [isActive, setIsActive] = useState(false);
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<File[] | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isListening, transcript, start, stop } = useTranscriber();

  const { id } = useParams();
  const router = useRouter();
  const { chatID } = useApp();

  const { sendMessage, loadChats, defaultModel, setDefaultModel } = useApp();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let text = input;
    if (text?.length === 0) {
      text = ((e.target as HTMLInputElement).value as string)?.trim();
    }
    if (text?.length > 0 || files) {
      if (!id) {
        router.replace(`/${chatID}`);
        setTimeout(() => {
          loadChats();
        }, 1500);
      }
      sendMessage({ text, files });

      setInput('');
      setFiles(undefined);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  useEffect(() => {
    if (transcript) {
      // eslint-disable-next-line
      handleSubmit({
        preventDefault: () => {},
        target: { value: transcript },
      } as unknown as React.FormEvent<Element>);
    }
  }, [transcript]);

  const handleRemoveFile = (index: number) => {
    const newFiles = [...(files || [])];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label
        className={`bg-base-200 p-5 block rounded-xl border-none  transition-all ${
          isActive
            ? 'outline outline-2 outline-offset-2 outline-base-300'
            : 'outline-transparent'
        }`}
      >
        {}
        {[...(files || [])]?.map((file: any, index) => (
          <div key={`attachment-${index}`} className="badge badge-sm mb-2">
            <ImageIcon className="w-3 h-3" />
            <span className="truncate w-20">{file?.name}</span>
            <XIcon
              className="w-3 h-3 cursor-pointer"
              onClick={() => handleRemoveFile(index)}
            />
          </div>
        ))}
        <div>
          <input
            id="input"
            type="text"
            className="w-full h-full outline-none"
            placeholder="Ask anything..."
            onFocus={() => setIsActive(true)}
            onBlur={() => setIsActive(false)}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <div className="flex justify-between items-center mt-5">
          <div className="flex items-center gap-2">
            <button className="btn bg-base-100 hover:bg-base-100/70 border-none btn-circle relative">
              <Paperclip className="w-4 h-4" />
              <input
                type="file"
                multiple
                className="absolute indent-[-99999px] cursor-pointer"
                accept="image/*"
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files) {
                    setFiles([...e.target.files]);
                  }
                }}
              />
            </button>
            <select
              className="select select-neutral bg-base-100 hover:bg-base-100/70 border-none rounded-xl w-auto cursor-pointer"
              aria-placeholder="Select a model"
              value={defaultModel}
              onChange={(e) => setDefaultModel(e.target.value)}
            >
              {MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
          {input.length > 0 ? (
            <button
              type="submit"
              disabled={input.trim().length === 0}
              className="btn btn-circle btn-primary transition-all border-none bg-white text-black hover:bg-white/70"
            >
              <ArrowUpIcon className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (isListening) {
                  stop();
                } else {
                  start();
                }
              }}
              className={`btn btn-circle ${
                isListening
                  ? 'bg-red-500 text-white hover:bg-red-500/70'
                  : 'bg-white text-black hover:bg-white/70'
              } transition-all`}
            >
              {isListening ? (
                <MicOffIcon className="w-5 h-5" />
              ) : (
                <MicIcon className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
      </label>
    </form>
  );
}
