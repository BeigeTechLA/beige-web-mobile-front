"use client";

import React from "react";
import parse, { HTMLReactParserOptions, Element, domToReact, DOMNode } from "html-react-parser";
import { Button } from "../ui/button";

const S3_PREFIX = process.env.NEXT_PUBLIC_S3_PREFIX || "";

interface BlogRendererProps {
  rawContent: string;
}

// Helper to check if a DOM node hierarchy contains ONLY media and no real text
const containsOnlyMedia = (nodes: DOMNode[]): boolean => {
  for (const node of nodes) {
    // If there is actual non-whitespace text content, it's a real paragraph with text
    if (node.type === "text") {
      if (node.data.trim().length > 0) return false;
    }

    if (node instanceof Element) {
      // If it's an image, video, or iframe, continue checking siblings
      if (["img", "iframe", "video", "figure", "svg"].includes(node.name)) {
        continue;
      }
      // If it's a inline wrapper like <a>, <span>, or <div>, recursively check its children
      if (node.children && node.children.length > 0) {
        if (!containsOnlyMedia(node.children as DOMNode[])) {
          return false;
        }
      }
    }
  }
  return true;
};

// Helper to check if a node or container has actual content
const hasContent = (nodes: DOMNode[]): boolean => {
  if (!nodes || nodes.length === 0) return false;

  return nodes.some((node) => {
    // If text node, verify it has non-whitespace characters
    if (node.type === "text") {
      return node.data.trim().length > 0;
    }

    // If Element node, check if it's a media element or has nested content
    if (node instanceof Element) {
      if (["img", "iframe", "video", "svg"].includes(node.name)) {
        return true;
      }
      return hasContent(node.children as DOMNode[]);
    }

    return false;
  });
};

export const CustomBlogRenderer: React.FC<BlogRendererProps> = ({ rawContent }) => {
  const options: HTMLReactParserOptions = {
    replace: (domNode) => {
      if (!(domNode instanceof Element)) return;

      // 1. Paragraph handling (handles deeply nested <img> inside <p>)
      if (domNode.name === "p") {
        const isMediaOnlyParagraph = containsOnlyMedia(domNode.children as DOMNode[]);

        // If paragraph contains only media, unwrap <p> tag completely
        if (isMediaOnlyParagraph) {
          return <>{domToReact(domNode.children as Element[], options)}</>;
        }

        return (
          <p className="font-['Yrsa'] text-white/80 my-4 text-sm lg:text-2xl">
            {domToReact(domNode.children as Element[], options)}
          </p>
        );
      }

      // 2. Top-level or inline Images
      if (domNode.name === "img") {
        const { src, srcset, sizes, alt, width, height } = domNode.attribs;

        const imgWidth = width ? parseInt(width, 10) : undefined;
        const imgHeight = height ? parseInt(height, 10) : undefined;

        // Calculate inline aspect ratio to maintain intrinsic proportions if both are present
        const aspectRatioStyle =
          imgWidth && imgHeight ? { aspectRatio: `${imgWidth} / ${imgHeight}` } : undefined;

        return (
          <div className="my-6 overflow-hidden rounded-2xl max-w-full">
            <img
              src={`${S3_PREFIX}${src}`}
              srcSet={srcset}
              sizes={sizes}
              alt={alt || ""}
              width={imgWidth}
              height={imgHeight}
              style={aspectRatioStyle}
              className="w-full h-auto object-cover rounded-2xl"
              loading="lazy"
            />
          </div>
        );
      }

      // 2. Figure elements (often wraps images with captions in Webflow/WordPress)
      if (domNode.name === "figure") {
        const isFigureNotEmpty = hasContent(domNode.children as DOMNode[]);

        // Only render figure if it contains valid content (e.g. <img>, caption, text)
        if (!isFigureNotEmpty) {
          return null;
        }

        return (
          <figure className="my-8 rounded-2xl overflow-hidden p-2 bg-white/5">
            {domToReact(domNode.children as Element[], options)}
          </figure>
        );
      }

      // 3. Embedded YouTube / Videos
      if (domNode.name === "iframe" || domNode.name === "video") {
        const { src, title } = domNode.attribs;
        return (
          <div className="relative aspect-video w-full my-8 rounded-2xl overflow-hidden">
            <iframe
              src={src}
              title={title || "Embedded Video"}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );
      }

      // 4. Article Wrapper
      if (domNode.name === "article") {
        return (
          <article className="article-wrapper space-y-6 text-white/90 font-['Yrsa'] text-sm lg:text-2xl">
            {domToReact(domNode.children as Element[], options)}
          </article>
        );
      }

      // 5. Headings (h1, h2, h3)
      if (domNode.name === "h1") {
        return (
          <h1 id={domNode.attribs.id} className="text-2xl lg:text-[51px] font-bold text-[#E8D1AB] font-['Instrument_Sans'] mt-10 mb-6 tracking-tight scroll-mt-28">
            {domToReact(domNode.children as Element[], options)}
          </h1>
        );
      }

      if (domNode.name === "h2") {
        return (
          <h2 id={domNode.attribs.id} className="text-xl lg:text-4xl font-semibold text-white font-['Instrument_Sans'] mt-8 mb-4 scroll-mt-28">
            {domToReact(domNode.children as Element[], options)}
          </h2>
        );
      }

      if (domNode.name === "h3") {
        return (
          <h3 id={domNode.attribs.id} className="text-lg lg:text-3xl text-white/90 font-medium font-['Instrument_Sans'] mt-6 mb-3 scroll-mt-28">
            {domToReact(domNode.children as Element[], options)}
          </h3>
        );
      }

      // 6. Quotes / Blockquotes
      if (domNode.name === "blockquote") {
        return (
          <blockquote className="p-6 my-6 bg-[#E8D1AB]/10 border-l-4 border-[#E8D1AB] rounded-r-2xl italic text-white/90">
            {domToReact(domNode.children as Element[], options)}
          </blockquote>
        );
      }

      // 7. Ordered / Unordered Lists
      if (domNode.name === "ul" || domNode.name === "ol") {
        const isOrdered = domNode.name === "ol";
        return (
          <div className="my-6">
            {React.createElement(
              domNode.name,
              {
                className: `${isOrdered ? "list-decimal" : "list-disc"
                  } list-inside space-y-2 text-white/80`,
              },
              domToReact(domNode.children as Element[], options)
            )}
          </div>
        );
      }

      if (domNode.name === "li") {
        return (
          <li className="marker:text-[#E8D1AB] font-['Yrsa'] text-sm lg:text-2xl">
            {domToReact(domNode.children as Element[], options)}
          </li>
        );
      }

      // 9. Tables and Table Components
      if (domNode.name === "table") {
        return (
          <div className="my-8 w-full overflow-x-auto rounded-xl border border-white/10 bg-white/5 p-2">
            <table className="w-full min-w-full text-left border-collapse text-white/90">
              {domToReact(domNode.children as Element[], options)}
            </table>
          </div>
        );
      }

      if (domNode.name === "thead") {
        return (
          <thead className="bg-[#E8D1AB]/20 border-b border-white/20 text-[#E8D1AB]">
            {domToReact(domNode.children as Element[], options)}
          </thead>
        );
      }

      if (domNode.name === "tbody") {
        return (
          <tbody className="divide-y divide-white/10">
            {domToReact(domNode.children as Element[], options)}
          </tbody>
        );
      }

      if (domNode.name === "tr") {
        return (
          <tr className="hover:bg-white/5 transition-colors">
            {domToReact(domNode.children as Element[], options)}
          </tr>
        );
      }

      if (domNode.name === "th") {
        return (
          <th className="px-4 py-3 font-semibold text-xs lg:text-xl border-b border-white/20">
            {domToReact(domNode.children as Element[], options)}
          </th>
        );
      }

      if (domNode.name === "td") {
        return (
          <td className="px-4 py-3 font-['Yrsa'] text-xs lg:text-xl text-white/80 align-top">
            {domToReact(domNode.children as Element[], options)}
          </td>
        );
      }

      // 10. SVG Handling
      if (domNode.name === "svg") {
        // Apply max dimensions via Tailwind classes
        domNode.attribs.class = `${domNode.attribs.class || ""} max-w-[20px] max-h-[20px]`.trim();

        // Cap explicit attributes if they exceed 20
        if (domNode.attribs.width && parseInt(domNode.attribs.width, 10) > 20) {
          domNode.attribs.width = "20";
        }
        if (domNode.attribs.height && parseInt(domNode.attribs.height, 10) > 20) {
          domNode.attribs.height = "20";
        }

        // Return undefined to let html-react-parser natively handle the modified node.
        return;
      }

      if (domNode.name === "a") {
        const href = domNode.attribs.href || "#";
        const isExternal = href.startsWith("http://") || href.startsWith("https://");

        return (
          <a
            href={href}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            // className="inline-flex items-center justify-center h-7 rounded-lg font-medium bg-[#E8D1AB] px-5 text-sm text-black hover:bg-[#dcb98a] lg:h-15 lg:px-8 lg:text-xl transition-colors my-4 font-['Instrument_Sans']"
            className="inline-flex items-center justify-center font-medium text-[#E8D1AB] hover:text-[#dcb98a] transition-colors px-1"
          >
            {domToReact(domNode.children as Element[], options)}
          </a>
        );
      }
    },
  };

  return (
    <div className="w-full mx-auto space-y-4 lg:space-y-10 font-['Yrsa'] text-sm lg:text-2xl">
      {parse(rawContent, options)}
    </div>
  );
};