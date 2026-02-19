'use client';

import { useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { Upload, X, FileText } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TextArea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import type { SupportCategory, SupportPriority } from '@/lib/types';

const CATEGORY_LABELS: Record<SupportCategory, string> = {
  bug_report: 'Ошибка',
  feature_request: 'Предложение',
  question: 'Вопрос',
  data_issue: 'Проблема с данными',
  other: 'Другое',
};

const PRIORITY_LABELS: Record<SupportPriority, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
};

const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const PRIORITY_OPTIONS = Object.entries(PRIORITY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const MAX_FILES = 5;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf'];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

interface SupportTicketModalProps {
  open: boolean;
  onClose: () => void;
}

function SupportTicketModal({ open, onClose }: SupportTicketModalProps) {
  const pathname = usePathname();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [category, setCategory] = useState<SupportCategory>('question');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<SupportPriority>('medium');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const validFiles = selected.filter((f) => ACCEPTED_TYPES.includes(f.type));
    const remaining = MAX_FILES - files.length;
    const newFiles = validFiles.slice(0, remaining);

    if (validFiles.length < selected.length) {
      toast.error('Допустимы только изображения и PDF файлы');
    }
    if (selected.length > remaining) {
      toast.error(`Максимум ${MAX_FILES} файлов`);
    }

    setFiles((prev) => [...prev, ...newFiles]);
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    const validFiles = dropped.filter((f) => ACCEPTED_TYPES.includes(f.type));
    const remaining = MAX_FILES - files.length;
    const newFiles = validFiles.slice(0, remaining);
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const resetForm = () => {
    setCategory('question');
    setSubject('');
    setDescription('');
    setPriority('medium');
    setFiles([]);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim()) {
      toast.error('Укажите тему обращения');
      return;
    }
    if (!description.trim()) {
      toast.error('Опишите проблему');
      return;
    }

    setIsSubmitting(true);

    const store = useStore.getState() as any;
    const currentUser = store.currentUser;

    const ticketId = `st-${Date.now()}`;
    const ticketNumber = `SUP-${String(Math.floor(Math.random() * 900) + 100)}`;

    const attachments = files.map((f, idx) => ({
      id: `att-${Date.now()}-${idx}`,
      filename: f.name,
      fileSize: f.size,
      mimeType: f.type,
      url: URL.createObjectURL(f),
    }));

    const ticket = {
      id: ticketId,
      ticketNumber,
      userId: currentUser?.id || '',
      companyId: currentUser?.companyId || null,
      category,
      subject: subject.trim(),
      description: description.trim(),
      priority,
      status: 'open' as const,
      assignedTo: null,
      pageContext: pathname || '',
      browserInfo: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      attachments,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resolvedAt: null,
    };

    store.addSupportTicket?.(ticket);
    toast.success(`Тикет ${ticketNumber} создан`);
    resetForm();
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Обратиться в поддержку" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Category */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Категория
          </label>
          <Select
            options={CATEGORY_OPTIONS}
            value={category}
            onChange={(val) => setCategory(val as SupportCategory)}
            placeholder="Выберите категорию"
          />
        </div>

        {/* Subject */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Тема <span className="text-red-500">*</span>
          </label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value.slice(0, 150))}
            placeholder="Кратко опишите проблему"
            maxLength={150}
            required
          />
          <p className="mt-1 text-xs text-gray-400">{subject.length}/150</p>
        </div>

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Описание <span className="text-red-500">*</span>
          </label>
          <TextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Подробно опишите проблему, шаги для воспроизведения..."
            rows={8}
            required
          />
        </div>

        {/* Priority */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Приоритет
          </label>
          <Select
            options={PRIORITY_OPTIONS}
            value={priority}
            onChange={(val) => setPriority(val as SupportPriority)}
          />
        </div>

        {/* Attachments */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Вложения
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 transition-colors hover:border-blue-400 hover:bg-blue-50/50"
          >
            <Upload className="mb-2 h-8 w-8 text-gray-400" />
            <p className="text-sm text-gray-500">
              Перетащите файлы или нажмите для выбора
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Изображения и PDF, максимум {MAX_FILES} файлов
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Selected files list */}
          {files.length > 0 && (
            <ul className="mt-3 space-y-2">
              {files.map((file, idx) => (
                <li
                  key={`${file.name}-${idx}`}
                  className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 flex-shrink-0 text-gray-400" />
                    <span className="truncate text-sm text-gray-700">{file.name}</span>
                    <span className="flex-shrink-0 text-xs text-gray-400">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(idx);
                    }}
                    className="ml-2 flex-shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Page Context */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Контекст страницы
          </label>
          <Input value={pathname || ''} readOnly disabled className="bg-gray-50" />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Отмена
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : null}
            Отправить
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export { SupportTicketModal };
