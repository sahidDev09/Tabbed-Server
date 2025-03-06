export function parseLinks(text: string): React.ReactNode {
  const urlRegex = /(?:https?:\/\/|www\.)[^\s<]+(?:\.[^\s<]+)*(?:\/[^\s<]*)?/gi;

  const parts = text.split(urlRegex);

  const links = Array.from(text.matchAll(urlRegex));

  const elements: React.ReactNode[] = [];
  let index = 0;

  parts.forEach((part, i) => {
    elements.push(part);

    if (i < links.length) {
      const url = links[i][0];
      const href = url.startsWith("http") ? url : `https://${url}`;
      elements.push(
        <a
          key={index++}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          {url}
        </a>
      );
    }
  });

  return elements;
}
