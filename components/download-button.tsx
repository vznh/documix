import React from "react";

interface DownloadButtonProps {
  content: Array<{ content: string; url: string; title: string }>;
  filename?: string;
  format: "markdown" | "txt" | "json";
}
const DownloadButton: React.FC<DownloadButtonProps> = ({
  content,
  filename = "scraped-documentation",
  format = "markdown",
}) => {
  const generateContent = () => {
    switch (format) {
      case "markdown":
        return content.reduce((acc, item) => {
          return (
            acc +
            `## ${item.title}\n\nSource: ${item.url}\n\n${item.content}\n\n---\n\n`
          );
        }, `# Scraped Documentation\n\n`);

      case "txt":
        return content.reduce((acc, item) => {
          return (
            acc + `${item.title}\n\n${item.content}\n\n----------------\n\n`
          );
        }, "");

      case "json":
        return JSON.stringify(content, null, 2);

      default:
        return "";
    }
  };

  const handleDownload = () => {
    const contentStr = generateContent();
    const blob = new Blob([contentStr], {
      type: format === "json" ? "application/json" : "text/plain",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.${format === "markdown" ? "md" : format}`;
    document.body.appendChild(a);
    a.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  return (
    <button
      onClick={handleDownload}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
    >
      Download {format.toUpperCase()}
    </button>
  );
};

export default DownloadButton;
