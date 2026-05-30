"use client";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, X, FileText } from "lucide-react";

interface Props {
  label: string;
  accept?: Record<string, string[]>;
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
  selectedFiles: File[];
}

export default function DropZone({
  label,
  accept = {
    "application/pdf": [".pdf"],
    "application/msword": [".doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  },
  multiple = true,
  onFilesSelected,
  selectedFiles,
}: Props) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      onFilesSelected(multiple ? [...selectedFiles, ...accepted] : accepted);
    },
    [selectedFiles, multiple, onFilesSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept, multiple });
  const remove = (name: string) => onFilesSelected(selectedFiles.filter((f) => f.name !== name));

  return (
    <div className="space-y-2.5">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-7 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? "border-blue-500 bg-blue-50 scale-[1.01]"
            : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/30"
        }`}
      >
        <input {...getInputProps()} />
        <div className={`w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center transition-colors ${isDragActive ? "bg-blue-100" : "bg-gray-100"}`}>
          <UploadCloud size={20} className={isDragActive ? "text-blue-600" : "text-gray-400"} />
        </div>
        <p className="text-sm font-medium text-gray-600">{isDragActive ? "Drop files here…" : label}</p>
        <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX · Click or drag & drop</p>
      </div>

      {selectedFiles.length > 0 && (
        <ul className="space-y-1.5">
          {selectedFiles.map((f) => (
            <li
              key={f.name}
              className="flex items-center justify-between bg-blue-50/50 border border-blue-100 rounded-xl px-3 py-2 text-sm group"
            >
              <span className="flex items-center gap-2 text-gray-700 truncate">
                <FileText size={13} className="text-blue-500 shrink-0" />
                <span className="truncate text-xs font-medium">{f.name}</span>
              </span>
              <button
                onClick={() => remove(f.name)}
                className="text-gray-300 hover:text-red-500 ml-2 shrink-0 transition-colors"
              >
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
