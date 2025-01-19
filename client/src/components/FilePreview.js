import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

export default function FilePreview({ namespaceRepo, branch, filePath }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // If file is text or markdown, we store its raw text here:
  const [rawText, setRawText] = useState(null);

  // If file is binary (e.g. image), store an object URL to display:
  const [blobUrl, setBlobUrl] = useState(null);

  // Simple guess from the file extension:
  const extension = filePath.split(".").pop().toLowerCase();
  const isMarkdown = extension === "md";

  useEffect(() => {
    let isMounted = true;

    async function loadFile() {
      setLoading(true);
      setError(null);
      setRawText(null);
      setBlobUrl(null);

      try {
        const resp = await fetch(
            `/api/repos/${namespaceRepo}/preview_file?branch=${branch}&filePath=${encodeURIComponent(filePath)}`
        );
        if (!isMounted) return;

        if (!resp.ok) {
          throw new Error(`Fetch failed with status ${resp.status}`);
        }

        const contentType = resp.headers.get("Content-Type") || "";

        if (contentType.includes("application/json")) {
          // read JSON for rawText
          const data = await resp.json();
          setRawText(data.rawText || "");
        } else {
          // treat as binary
          const blob = await resp.blob();
          const url = URL.createObjectURL(blob);
          setBlobUrl(url);
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadFile();
    return () => {
      isMounted = false;
    };
  }, [namespaceRepo, branch, filePath]);

  if (loading) return <p>Loading preview...</p>;
  if (error) return <p>Error loading file preview: {error}</p>;

  // If we got raw text (.md or .txt):
  if (rawText !== null) {
    if (isMarkdown) {
      return <ReactMarkdown>{rawText}</ReactMarkdown>;
    } else {
      // plain text, e.g. .txt
      return <pre style={{ maxWidth: "600px", whiteSpace: "pre-wrap" }}>{rawText}</pre>;
    }
  }

  // If we got a binary blob (e.g. image, video)
  if (blobUrl) {
    if (["jpg", "jpeg", "png", "gif"].includes(extension)) {
      return <img src={blobUrl} alt={filePath} style={{ maxWidth: "600px" }} />;
    } else if (extension === "mp4") {
      return (
          <video controls width={400}>
            <source src={blobUrl} type="video/mp4" />
            Sorry, your browser does not support MP4.
          </video>
      );
    } else {
      // fallback for other types
      return (
          <div>
            <p>Preview is not supported.</p>
            <a href={blobUrl} download>
              Download file
            </a>
          </div>
      );
    }
  }

  // If neither raw text nor blob, something went wrong
  return <p>No preview available.</p>;
}