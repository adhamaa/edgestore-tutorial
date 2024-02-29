"use client";

import { FileState, MultiFileDropzone } from "@/components/multi-file-dropzone";
import { useEdgeStore } from "@/lib/edgestore";
import Link from "next/link";
import { useState } from "react";

export default function Page() {
  const [files, setFiles] = useState<FileState[]>([]);
  console.log('files:', files)
  const [urls, setUrls] = useState<string[]>([]);
  const { edgestore } = useEdgeStore();

  function updateFileProgress(key: string, progress: FileState["progress"]) {
    setFiles((fileStates) => {
      const newFileStates = structuredClone(fileStates);
      const fileState = newFileStates.find(
        (fileState) => fileState.key === key
      );
      if (fileState) {
        fileState.progress = progress;
      }
      return newFileStates;
    });
  }

  return (
    <div className="flex flex-col items-center m-6 gap-2">
      <MultiFileDropzone
        value={files}
        onChange={setFiles}
        onFilesAdded={async (addedFiles) => {
          setFiles([...files, ...addedFiles]);
        }}
      />

      <button
        className="bg-white text-black rounded px-2 hover:opacity-80"
        onClick={async () => {
          if (files.length > 0) {
            await Promise.all(
              files.map(async (addedFileState) => {
                try {
                  const res = await edgestore.myProtectedFiles.upload({
                    file: addedFileState.file,

                    onProgressChange: async (progress) => {
                      updateFileProgress(addedFileState.key, progress);
                      if (progress === 100) {
                        // wait 1 second to set it to complete
                        // so that the user can see the progress bar at 100%
                        await new Promise((resolve) =>
                          setTimeout(resolve, 1000)
                        );
                        updateFileProgress(addedFileState.key, "COMPLETE");
                      }
                    },
                  });
                  setUrls((prev) => [...prev, res.url]);
                } catch (err) {
                  updateFileProgress(addedFileState.key, "ERROR");
                }
              })
            );

          }
        }}
      >
        Upload
      </button>

      {urls.map((url, index) => (
        <Link key={index} href={url} target="_blank">
          URL{index + 1}
        </Link>
      ))}
    </div>
  );
}
