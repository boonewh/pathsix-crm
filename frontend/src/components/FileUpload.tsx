// src/components/FileUpload.tsx
import { useRef, useState } from "react";

export default function FileUpload({ onUpload }: { onUpload: (files: File[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function openFilePicker() {
    inputRef.current?.click();
  }

  function handleFilesFromInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length) {
      onUpload(Array.from(e.target.files));
      e.target.value = ""; // reset so selecting same file again still triggers
    }
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) setIsDragging(false);
  }

  async function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const dt = e.dataTransfer;
    if (!dt) return;

    if (dt.items && dt.items.length) {
      const filePromises: Promise<File | null>[] = [];
      for (const item of Array.from(dt.items)) {
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) filePromises.push(Promise.resolve(file));
        }
      }
      const files = (await Promise.all(filePromises)).filter(Boolean) as File[];
      if (files.length) onUpload(files);
      return;
    }

    if (dt.files && dt.files.length) {
      onUpload(Array.from(dt.files));
    }
  }

  return (
    <div
      onClick={openFilePicker}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openFilePicker()}
      className={[
        "border-2 border-dashed rounded-lg p-8 mb-8 flex flex-col items-center justify-center cursor-pointer transition",
        isDragging ? "bg-blue-50 border-blue-400" : "bg-gray-50 hover:bg-gray-100 border-gray-300",
      ].join(" ")}
      aria-label="Upload files"
    >
      <div className="text-gray-700 text-lg">
        {isDragging ? "Drop files to upload" : (
          <>
            Drag & drop files here, or <span className="text-blue-600 underline">browse</span>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFilesFromInput}
      />
    </div>
  );
}
