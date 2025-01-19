import React, {useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import ReactMarkdown from "react-markdown"; // for rendering
import FilePreview from "../components/FilePreview";

function RepoDetailPage() {
    const {namespace, repo} = useParams();
    const [files, setFiles] = useState([]);
    const [branch, setBranch] = useState("main");
    const [dir, setDir] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);

    // Keep a place to store the actual README text
    const [readmeText, setReadmeText] = useState("");

    // When branch or dir changes, fetch the file listing
    useEffect(() => {
        const fetchFiles = async () => {
            try {
                const resp = await fetch(
                    `/api/repos/${namespace}/${repo}/list?branch=${branch}&dir=${dir}`
                );
                const data = await resp.json();
                if (!resp.ok) throw new Error(data.error || "Failed to list files");
                setFiles(data.entries || []);
            } catch (err) {
                console.error(err);
            }
        };
        fetchFiles();
    }, [namespace, repo, branch, dir]);

    // If we are in the root (dir === ""), look for README.md in the files list
    useEffect(() => {
        if (dir) {
            // not root directory -> no custom readme
            setReadmeText("");
            return;
        }
        // dir is empty => root. Look for "README.md"
        const readmeFile = files.find(
            f => f.filename.toLowerCase() === "readme.md"
        );
        if (readmeFile) {
            fetchReadmeContent(readmeFile.path);
        } else {
            setReadmeText("");
        }
    }, [files, dir]);

    const fetchReadmeContent = async (filePath) => {
        try {
            // Call preview_file directly on your local server
            const resp = await fetch(
                `/api/repos/${namespace}/${repo}/preview_file?branch=${branch}&filePath=${encodeURIComponent(filePath)}`
            );
            if (!resp.ok) {
                throw new Error(`Failed to fetch README: ${resp.status}`);
            }
            // If the server returned JSON, parse it:
            const contentType = resp.headers.get("Content-Type") || "";
            if (contentType.includes("application/json")) {
                const data = await resp.json();
                setReadmeText(data.rawText || ""); // store in local state
            } else {
                // If for some reason it's not text, skip or handle differently
                setReadmeText("");
            }
        } catch (error) {
            console.error("Error fetching README:", error);
            setReadmeText("");
        }
    };

    const handleDownloadFile = async (filePath) => {
        try {
            const response = await fetch(
                `/api/repos/${namespace}/${repo}/download_file?branch=${branch}&filePath=${encodeURIComponent(filePath)}`,
                {method: "GET"}
            );
            if (!response.ok) {
                throw new Error("File download failed");
            }

            // Convert the response to a Blob
            const blob = await response.blob();

            // Derive a file name from the path (the part after the last slash)
            const filename = filePath.split("/").pop() || "download";

            // Create a download URL and click a hidden <a> to download
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Cleanup
            window.URL.revokeObjectURL(downloadUrl);
        } catch (err) {
            console.error("Error downloading file:", err);
            alert("Failed to download: " + err.message);
        }
    };

    const handleDownloadRepo = () => {
        // Download entire repository as zip
        fetch(`/api/repos/${namespace}/${repo}/download_repo?branch=main&shallow=true`,
            {method: "GET", credentials: "include"}
        )
            .then(async (resp) => {
                if (!resp.ok) throw new Error("Download failed");
                const blob = await resp.blob();
                // Create a link to download the blob
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${namespace}_${repo}.zip`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            })
            .catch(err => console.error(err));
    };

    return (
        <div style={{margin: "1rem"}}>
            <h2>
                Repo: {namespace}/{repo} (branch: {branch})
            </h2>
            <div style={{marginBottom: "1rem"}}>
                <label>Branch:</label>
                <input
                    type="text"
                    value={branch}
                    onChange={(e) => {
                        setBranch(e.target.value);
                        setDir("");
                        setSelectedFile(null);
                    }}
                    style={{marginLeft: "0.5rem"}}
                />

                <button
                    style={{marginLeft: "1rem"}}
                    onClick={handleDownloadRepo}
                >
                    Download Entire Repo
                </button>
            </div>

            <table
                style={{
                    borderCollapse: "collapse",
                    width: "100%",
                    marginBottom: "1rem",
                }}
            >
                <thead>
                <tr
                    style={{
                        backgroundColor: "#ddd",
                    }}
                >
                    <th style={{border: "1px solid #ccc", padding: "8px"}}>Name</th>
                    <th style={{border: "1px solid #ccc", padding: "8px"}}>Type</th>
                    <th style={{border: "1px solid #ccc", padding: "8px"}}>Actions</th>
                </tr>
                </thead>
                <tbody>
                {files.map((f, idx) => (
                    <tr key={idx}>
                        <td
                            style={{
                                border: "1px solid #ccc",
                                padding: "8px",
                                cursor: f.type === "dir" ? "pointer" : "auto",
                            }}
                            onClick={() => {
                                if (f.type === "dir") {
                                    setDir(f.path);
                                    setSelectedFile(null);
                                }
                            }}
                        >
                            {f.filename}
                        </td>
                        <td style={{border: "1px solid #ccc", padding: "8px"}}>
                            {f.type}
                        </td>
                        <td style={{border: "1px solid #ccc", padding: "8px"}}>
                            {f.type === "dir"
                                ? (
                                    <span>Double-click to open</span>
                                )
                                : (
                                    <>
                                        <FilePreview namespaceRepo={`${namespace}/${repo}`}
                                                     branch={branch}
                                                     filePath={f.path}/>
                                        <br/>
                                        <button onClick={() => handleDownloadFile(f.path)}>Download</button>
                                    </>
                                )
                            }
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            {/* If we found a README, show it below */}
            {readmeText && (
                <div style={{marginTop: "2rem"}}>
                    <h3>README</h3>
                    <div style={{border: "1px solid #ccc", padding: "1rem"}}>
                        <ReactMarkdown>{readmeText}</ReactMarkdown>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RepoDetailPage;