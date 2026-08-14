"use client";

import React from "react";
import parse, { HTMLReactParserOptions, Element, Text, domToReact, DOMNode } from "html-react-parser";
import Accordion, { AccordionItemData } from "./Accordion";
import { FAQ, FAQItem } from "./FAQ";
import Cards, { CardItemData } from "./Cards";
import { ImageTextBlock } from "./ImageTextBlock";
import ImageGridBlock from "./ImageGridBlock";
import { TabSwitcher, TabData } from "./TabSwitcher";
import SlideTextCarousel, { CarouselSlideItem } from "./SlideTextCarousel";
import { Testimonials } from "../about/Testimonials";
import { ThreePartAnimate, ThreePartAnimateItem } from "./ThreePartAnimate";
import CardCarousel, {CarouselCardItem} from "./CardCarousel";

interface BlogRendererProps {
  rawContent: string;
}

// Helper to generate a slug ID from heading content if none exists
const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// Extract clean text from element or nested nodes
const extractCleanText = (node: DOMNode | DOMNode[] | React.ReactNode): string => {
  if (!node) return "";
  if (typeof node === "string") return node;

  if (Array.isArray(node)) {
    return node.map(extractCleanText).join("");
  }

  if (node instanceof Element || (typeof node === "object" && "type" in node && node.type === "tag")) {
    const element = node as Element;
    const anchorChild = element.children.find(
      (child) => child instanceof Element && child.name === "a"
    );
    if (anchorChild) {
      return extractCleanText(anchorChild);
    }
    return extractCleanText(element.children as unknown as DOMNode[]);
  }

  if (node instanceof Text || (typeof node === "object" && "type" in node && node.type === "text")) {
    return (node as unknown as { data: string }).data || "";
  }

  return "";
};

// Helpers for normal DOM node evaluation
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
        if (!containsOnlyMedia(node.children as unknown as DOMNode[])) {
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
      return hasContent(node.children as unknown as DOMNode[]);
    }

    return false;
  });
};

/**
 * Replaces <div id="testimonials">...</div> with <Testimonials />
 * 
 * @param {string} htmlContent - Raw HTML string
 * @returns {string} Modified HTML with <Testimonials /> tag inserted
 */
export function replaceTestimonialsSection(htmlContent: string) {
  // Regex matches <div id="testimonials"> up to its matching/closing context
  const testimonialsRegex = /<div\s+id=["']testimonials["'][\s\S]*?<\/div>/gi;

  return htmlContent.replace(testimonialsRegex, '<Testimonials />');
}

export const CustomBlogRenderer: React.FC<BlogRendererProps> = ({ rawContent }) => {
  const options: HTMLReactParserOptions = {
    replace: (domNode) => {
      if (!(domNode instanceof Element)) return;

      // -------------------------------------------------------------
      // 1. CARDS HANDLER (id="cards")
      // -------------------------------------------------------------
      const isCardContainer =
        domNode.attribs?.id === "cards" ||
        domNode.attribs?.class?.includes("cards");

      if (domNode.name === "div" && isCardContainer) {
        const cardItems: CardItemData[] = [];
        const rawChildren = (domNode.children as unknown as DOMNode[]) || [];

        // Check if container holds explicit sub-div cards (<div class="card-item">)
        const childDivs = rawChildren.filter(
          (child) => child instanceof Element && child.name === "div"
        ) as Element[];

        if (childDivs.length > 0) {
          // Branch A: Nested structure (<div id="cards"> <div>...</div> <div>...</div> </div>)
          childDivs.forEach((cardDiv) => {
            const innerChildren = (cardDiv.children as unknown as DOMNode[]) || [];
            const titleNode = innerChildren.find(
              (child) => child instanceof Element && ["h2", "h3", "h4", "h5"].includes(child.name)
            ) as Element;

            const descriptionNodes = innerChildren.filter(
              (child) => child !== titleNode
            );

            if (titleNode) {
              cardItems.push({
                title: domToReact(titleNode.children as unknown as DOMNode[], options),
                description:
                  descriptionNodes.length > 0
                    ? domToReact(descriptionNodes as unknown as DOMNode[], options)
                    : null,
              });
            }
          });
        } else {
          // Branch B: Flat structure with sequential Headings (e.g. <h4> -> <ul> / <p>)
          for (let i = 0; i < rawChildren.length; i++) {
            const current = rawChildren[i];

            if (current instanceof Element && ["h2", "h3", "h4", "h5"].includes(current.name)) {
              const title = domToReact(current.children as unknown as DOMNode[], options);
              const descriptionNodes: DOMNode[] = [];

              // Scan forward until we hit the next heading tag or end of container
              let nextIndex = i + 1;
              while (nextIndex < rawChildren.length) {
                const nextNode = rawChildren[nextIndex];

                // Stop if another heading tag is encountered
                if (nextNode instanceof Element && ["h2", "h3", "h4", "h5"].includes(nextNode.name)) {
                  break;
                }

                // Collect non-empty nodes (lists <ul>/<ol>, paragraphs <p>, raw text nodes, etc.)
                if (nextNode instanceof Element) {
                  descriptionNodes.push(nextNode);
                } else if (nextNode.type === "text" || "data" in nextNode) {
                  const textContent = (nextNode as unknown as { data: string }).data?.trim();
                  if (textContent) {
                    descriptionNodes.push(nextNode);
                  }
                }

                nextIndex++;
              }

              // Advance loop pointer past processed content block
              i = nextIndex - 1;

              if (title) {
                cardItems.push({
                  title,
                  description:
                    descriptionNodes.length > 0
                      ? domToReact(descriptionNodes as unknown as DOMNode[], options)
                      : null,
                });
              }
            }
          }
        }

        return <Cards items={cardItems} />;
      }

      // -------------------------------------------------------------
      // FAQ CONTAINER HANDLER (id="faq")
      // -------------------------------------------------------------
      const isFaqContainer =
        domNode.attribs?.id === "faq" ||
        domNode.attribs?.class?.includes("faq");

      if (domNode.name === "div" && isFaqContainer) {
        const faqItems: FAQItem[] = [];
        const rawChildren = (domNode.children as unknown as DOMNode[]) || [];

        // Helper function to identify if a node is a question
        const isQuestionNode = (node: DOMNode): boolean => {
          // 1. Unwrapped text node ending with "?" or looking like a question title
          if (node.type === "text" || "data" in node) {
            const text = (node as unknown as { data: string }).data?.trim() || "";
            return text.length > 0 && text.endsWith("?");
          }

          if (node instanceof Element) {
            // Ignore main container heading
            if (node.name === "h2") return false;

            // 2. Standard Question Tags
            if (
              ["h3", "h4", "h5", "strong"].includes(node.name) ||
              node.attribs?.class?.includes("faq-question") ||
              node.attribs?.class?.includes("elementor-tab-title")
            ) {
              return true;
            }

            // 3. Paragraphs or Divs ending with "?"
            if (node.name === "p" || node.name === "div") {
              const text = extractCleanText(node).trim();
              return text.endsWith("?");
            }
          }

          return false;
        };

        for (let i = 0; i < rawChildren.length; i++) {
          const current = rawChildren[i];

          // Skip main FAQ heading (e.g. <h2>Frequently Asked Questions</h2>)
          if (current instanceof Element && current.name === "h2") {
            continue;
          }

          if (isQuestionNode(current)) {
            // Extract the question string
            let questionText = "";
            if (current instanceof Element) {
              questionText = extractCleanText(current).trim();
            } else if (current.type === "text" || "data" in current) {
              questionText = ((current as unknown as { data: string }).data || "").trim();
            }

            const answerNodes: React.ReactNode[] = [];
            let nextIndex = i + 1;

            // Collect all following answer nodes until the next question or section end
            while (nextIndex < rawChildren.length) {
              const nextNode = rawChildren[nextIndex];

              // Stop scanning if we hit the next question or an h2
              if (
                isQuestionNode(nextNode) ||
                (nextNode instanceof Element && nextNode.name === "h2")
              ) {
                break;
              }

              // Collect HTML Elements (<p>, <div>, <ul>, etc.)
              if (nextNode instanceof Element) {
                answerNodes.push(
                  <React.Fragment key={`faq-ans-elem-${nextIndex}`}>
                    {domToReact([nextNode] as unknown as DOMNode[], options)}
                  </React.Fragment>
                );
              }
              // Collect Bare Text Nodes
              else if (nextNode.type === "text" || "data" in nextNode) {
                const textContent = ((nextNode as unknown as { data: string }).data || "").trim();
                if (textContent) {
                  answerNodes.push(
                    <p key={`faq-ans-text-${nextIndex}`} className="my-2">
                      {textContent}
                    </p>
                  );
                }
              }

              nextIndex++;
            }

            // Sync the main loop index past all consumed answer nodes
            i = nextIndex - 1;

            if (questionText) {
              faqItems.push({
                question: questionText,
                answer: answerNodes.length > 0 ? answerNodes : null,
              });
            }
          }
          // Structural wrapper support (e.g. <div class="faq-item">)
          else if (
            current instanceof Element &&
            current.name === "div" &&
            (current.attribs?.class?.includes("faq-item") ||
              current.attribs?.id?.includes("faq"))
          ) {
            const titleNode = current.children.find(
              (child) =>
                child instanceof Element &&
                (["h3", "h4", "h5", "strong"].includes(child.name) ||
                  child.attribs?.class?.includes("question") ||
                  child.attribs?.class?.includes("elementor-tab-title"))
            ) as Element;

            if (titleNode) {
              const bodyChildren = current.children.filter((child) => child !== titleNode);
              faqItems.push({
                question: extractCleanText(titleNode).trim(),
                answer: domToReact(bodyChildren as unknown as DOMNode[], options),
              });
            }
          }
        }

        return <FAQ items={faqItems} />;
      }

      // -------------------------------------------------------------
      // 3. ACCORDION HANDLER
      // -------------------------------------------------------------
      const isAccordionContainer =
        domNode.attribs.id === "accordion" ||
        domNode.attribs.class?.includes("accordion");

      if (domNode.name === "div" && isAccordionContainer) {
        const accordionItems: AccordionItemData[] = [];
        const rawChildren = (domNode.children as unknown as DOMNode[]) || [];

        for (let i = 0; i < rawChildren.length; i++) {
          const current = rawChildren[i];

          // Detect Accordion Title (h3, h4, h5, or elementor-tab-title class)
          if (
            current instanceof Element &&
            (["h3", "h4", "h5"].includes(current.name) ||
              current.attribs.class?.includes("accordion-title") ||
              current.attribs.class?.includes("elementor-tab-title"))
          ) {
            const titleText = extractCleanText(current).trim();
            const contentNodes: React.ReactNode[] = [];

            let nextIndex = i + 1;
            while (nextIndex < rawChildren.length) {
              const nextNode = rawChildren[nextIndex];

              // Stop scanning if we hit the next heading/accordion title
              if (
                nextNode instanceof Element &&
                (["h3", "h4", "h5"].includes(nextNode.name) ||
                  nextNode.attribs.class?.includes("accordion-title") ||
                  nextNode.attribs.class?.includes("elementor-tab-title"))
              ) {
                break;
              }

              // Collect standard HTML elements (<b>, <ul>, <p>, <div>, <span>, etc.)
              if (nextNode instanceof Element) {
                contentNodes.push(
                  <React.Fragment key={`acc-content-${nextIndex}`}>
                    {domToReact([nextNode] as unknown as DOMNode[], options)}
                  </React.Fragment>
                );
              }
              // Collect raw text nodes
              else if (nextNode.type === "text" || "data" in nextNode) {
                const textContent = (nextNode as unknown as { data: string }).data?.trim();
                if (textContent) {
                  contentNodes.push(textContent);
                }
              }

              nextIndex++;
            }

            // Sync the loop index past all consumed content nodes
            i = nextIndex - 1;

            if (titleText) {
              accordionItems.push({
                id: current.attribs.id || `acc-item-${accordionItems.length}`,
                title: titleText,
                content:
                  contentNodes.length > 0 ? (
                    <div className="space-y-2">{contentNodes}</div>
                  ) : null,
              });
            }
          }
          // Fallback: Handle explicit wrapper items (<div class="accordion-item">...</div>)
          else if (
            current instanceof Element &&
            current.name === "div" &&
            (current.attribs.class?.includes("accordion-item") ||
              current.attribs.id?.includes("item"))
          ) {
            // Strategy: Nested Wrapper Elements (e.g., <div class="accordion-item"> ... </div>)
            const titleNode = current.children.find(
              (child) =>
                child instanceof Element &&
                (["h3", "h4", "h5"].includes(child.name) ||
                  child.attribs.class?.includes("title") ||
                  child.attribs.class?.includes("elementor-tab-title"))
            ) as Element;

            const titleText = titleNode ? extractCleanText(titleNode).trim() : "";

            if (titleText) {
              const bodyChildren = current.children.filter((child) => child !== titleNode);
              accordionItems.push({
                id: current.attribs.id || `acc-item-${accordionItems.length}`,
                title: titleText,
                content: domToReact(bodyChildren as unknown as DOMNode[], options),
              });
            }
          }
        }

        return <Accordion items={accordionItems} allowMultiple={false} />;
      }

      // -------------------------------------------------------------
      // 4. IMAGE TEXT BLOCK HANDLER (id="img-text-block")
      // -------------------------------------------------------------
      const isImgTextBlock =
        domNode.attribs?.id === "img-text-block" ||
        domNode.attribs?.class?.includes("img-text-block");

      if (domNode.name === "div" && isImgTextBlock) {
        const rawChildren = (domNode.children as unknown as DOMNode[]) || [];

        interface StepItem {
          titleNode: Element | null;
          descriptionParts: React.ReactNode[];
        }

        interface BlockData {
          items: StepItem[];
          imageSrc: string;
          imageAlt: string;
          caption: React.ReactNode;
          imageFirst: boolean;
        }

        const blocks: BlockData[] = [];
        let currentBlock: BlockData = {
          items: [],
          imageSrc: "",
          imageAlt: "",
          caption: null,
          imageFirst: false,
        };

        let currentItem: StepItem = {
          titleNode: null,
          descriptionParts: [],
        };

        const extractImgDetails = (imgElement: Element, targetBlock: BlockData) => {
          if (!targetBlock.imageSrc) {
            const srcAttr = imgElement.attribs?.src || "";
            targetBlock.imageSrc =
              srcAttr.startsWith("http") || srcAttr.startsWith("/")
                ? srcAttr
                : `${srcAttr}`;
            targetBlock.imageAlt = imgElement.attribs?.alt || "";
          }
        };

        const pushCurrentItem = () => {
          if (currentItem.titleNode || currentItem.descriptionParts.length > 0) {
            currentBlock.items.push(currentItem);
            currentItem = { titleNode: null, descriptionParts: [] };
          }
        };

        const processNode = (node: DOMNode) => {
          if (node instanceof Element) {
            // 1. Headings (h1 - h5)
            if (["h1", "h2", "h3", "h4", "h5"].includes(node.name)) {
              pushCurrentItem();
              currentItem.titleNode = node;
            }
            // 2. Bold / Strong Tags used as Section Titles
            else if (
              (node.name === "b" || node.name === "strong") &&
              !currentItem.titleNode &&
              currentItem.descriptionParts.length === 0
            ) {
              const textContent = extractCleanText(node).trim();
              if (textContent) {
                pushCurrentItem();
                currentItem.titleNode = node;
              }
            }
            // 3. Direct Images
            else if (node.name === "img") {
              if (
                currentBlock.items.length === 0 &&
                !currentItem.titleNode &&
                currentItem.descriptionParts.length === 0
              ) {
                currentBlock.imageFirst = true;
              }
              extractImgDetails(node, currentBlock);
            }
            // 4. Paragraphs
            else if (node.name === "p") {
              const innerImg = node.children.find(
                (child) => child instanceof Element && child.name === "img"
              ) as Element | undefined;

              if (innerImg) {
                if (
                  currentBlock.items.length === 0 &&
                  !currentItem.titleNode &&
                  currentItem.descriptionParts.length === 0
                ) {
                  currentBlock.imageFirst = true;
                }
                extractImgDetails(innerImg, currentBlock);
              } else {
                currentItem.descriptionParts.push(
                  <React.Fragment key={`img-text-desc-${currentItem.descriptionParts.length}`}>
                    {domToReact([node] as unknown as DOMNode[], options)}
                  </React.Fragment>
                );
              }
            }
            // 5. Lists & Structural Text Elements (<ul>, <ol>, <a>, etc.)
            else if (["ul", "ol", "a", "blockquote", "span", "b", "strong"].includes(node.name)) {
              currentItem.descriptionParts.push(
                <React.Fragment key={`img-text-elem-${currentItem.descriptionParts.length}`}>
                  {domToReact([node] as unknown as DOMNode[], options)}
                </React.Fragment>
              );
            }
            // 6. Divs & Custom ID Blocks (Accordion, Tab, FAQ, Carousel, etc.)
            else if (node.name === "div") {
              const nodeAttributes = node.attribs || {};
              const id = nodeAttributes.id || "";
              const className = nodeAttributes.class || "";

              // Check if the div matches any special component ID
              const isSpecialComponent =
                id === "accordion" ||
                className.includes("accordion") ||
                id === "tab-container" ||
                className.includes("tab-container") ||
                id === "faq" ||
                className.includes("faq") ||
                id === "slide-text-carousel" ||
                className.includes("slide-text-carousel");

              if (isSpecialComponent) {
                // Delegate to domToReact so html-react-parser triggers the specific component handler
                currentItem.descriptionParts.push(
                  <React.Fragment key={`img-text-nested-${currentItem.descriptionParts.length}`}>
                    {domToReact([node] as unknown as DOMNode[], options)}
                  </React.Fragment>
                );
              } else {
                // Regular wrapper div -> recursively process children
                const nestedChildren = (node.children as unknown as DOMNode[]) || [];
                nestedChildren.forEach((child) => processNode(child));
              }
            }
          }
          // 7. Bare Text Nodes
          else if (node.type === "text" || "data" in node) {
            const textContent = ((node as unknown as { data: string }).data || "").trim();
            if (textContent) {
              currentItem.descriptionParts.push(
                <React.Fragment key={`img-text-raw-${currentItem.descriptionParts.length}`}>
                  {textContent}
                </React.Fragment>
              );
            }
          }
        };

        rawChildren.forEach((child) => processNode(child));
        pushCurrentItem();

        if (currentBlock.items.length > 0 || currentBlock.imageSrc) {
          blocks.push(currentBlock);
        }

        return (
          <div className="space-y-12 my-8">
            {blocks.map((b, idx) => {
              const combinedTextContent = (
                <div className="space-y-8">
                  {b.items.map((item, itemIdx) => {
                    let parsedTitle: React.ReactNode = null;
                    if (item.titleNode) {
                      const headingText = extractCleanText(item.titleNode);
                      const headingId = item.titleNode.attribs?.id || slugify(headingText);

                      const isStandardHeader = ["h1", "h2", "h3", "h4", "h5"].includes(
                        item.titleNode.name
                      );
                      const Tag = isStandardHeader
                        ? (item.titleNode.name as React.ElementType)
                        : "h3";

                      parsedTitle = (
                        <Tag
                          id={headingId}
                          className="text-2xl lg:text-3xl font-bold text-white font-['Instrument_Sans'] tracking-tight leading-snug scroll-mt-28"
                        >
                          {domToReact(item.titleNode.children as Element[], options)}
                        </Tag>
                      );
                    }

                    return (
                      <div key={`block-item-${itemIdx}`} className="space-y-3">
                        {parsedTitle}
                        {item.descriptionParts.length > 0 && (
                          <div className="font-['Yrsa'] text-white text-sm lg:text-2xl space-y-3">
                            {item.descriptionParts}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );

              return (
                <ImageTextBlock
                  key={`img-text-block-${idx}`}
                  title={null}
                  description={combinedTextContent}
                  imageSrc={b.imageSrc}
                  imageAlt={b.imageAlt}
                  caption={b.caption}
                  imageFirst={b.imageFirst}
                />
              );
            })}
          </div>
        );
      }

      // -------------------------------------------------------------
      // 5. DYNAMIC IMAGE GRID HANDLER (id="grid")
      // -------------------------------------------------------------
      const isGridBlock =
        domNode.attribs?.id === "grid" ||
        domNode.attribs?.class?.includes("grid");

      if (domNode.name === "div" && isGridBlock) {
        const rawChildren = (domNode.children as unknown as DOMNode[]) || [];
        const validChildren = rawChildren.filter((child) => child instanceof Element) as Element[];

        const gridItems = validChildren.map((child, index) => {
          if (child.name === "a") {
            const href = child.attribs?.href || "";
            const hasImgChild = (child.children as unknown as DOMNode[])?.some(
              (c) => c instanceof Element && c.name === "img"
            );

            if (!hasImgChild && href) {
              return (
                <div
                  key={`grid-img-${index}`}
                  className="block w-full h-full aspect-[4/3] overflow-hidden"
                >
                  <img
                    src={href}
                    alt={`Grid image ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
              );
            }
          }

          return (
            <React.Fragment key={`grid-child-${index}`}>
              {domToReact([child] as unknown as DOMNode[], options)}
            </React.Fragment>
          );
        });

        return <ImageGridBlock>{gridItems}</ImageGridBlock>;
      }

      // -------------------------------------------------------------
      // SLIDE TEXT CAROUSEL HANDLER (id="slide-text-carousel")
      // -------------------------------------------------------------
      const isCarouselContainer =
        domNode.attribs?.id === "slide-text-carousel" ||
        domNode.attribs?.class?.includes("slide-text-carousel");

      if (domNode.name === "div" && isCarouselContainer) {
        const rawChildren = (domNode.children as unknown as DOMNode[]) || [];
        const slides: CarouselSlideItem[] = [];

        let currentBgImage = "";
        let currentThumbImage = "";
        let currentTitle = "";
        let currentActionUrl = "";
        let currentActionText = "";
        let descNodes: DOMNode[] = [];

        const pushCurrentSlide = () => {
          const bgImg = currentBgImage.trim();
          const thumbImg = currentThumbImage.trim() || bgImg;

          // Only push if we have valid content or an image
          if (bgImg || currentTitle || descNodes.length > 0) {
            slides.push({
              id: `slide-${slides.length + 1}`,
              bgImage: bgImg,
              thumbnailImage: thumbImg,
              title: currentTitle,
              description:
                descNodes.length > 0
                  ? domToReact(descNodes as unknown as DOMNode[], options)
                  : null,
              actionUrl: currentActionUrl,
              actionText: currentActionText,
            });
          }

          // Reset slide accumulator state
          currentBgImage = "";
          currentThumbImage = "";
          currentTitle = "";
          currentActionUrl = "";
          currentActionText = "";
          descNodes = [];
        };

        for (let i = 0; i < rawChildren.length; i++) {
          const child = rawChildren[i];

          if (child instanceof Element) {
            // 1. Detect Image Nodes
            if (child.name === "img") {
              const src = child.attribs?.src?.trim() || "";

              // If we already have a full slide populated (title/desc) and hit new images, flush previous slide
              if ((currentTitle || descNodes.length > 0) && currentBgImage) {
                pushCurrentSlide();
              }

              if (!currentBgImage) {
                currentBgImage = src;
              } else if (!currentThumbImage) {
                // Second consecutive image acts as thumbnail/duplicate fallback
                currentThumbImage = src;
              }
              continue;
            }

            // 2. Detect Header Nodes
            if (["h3", "h4", "h5", "h6"].includes(child.name)) {
              // If we encounter a header and already have a title or description, flush current slide
              if (currentTitle) {
                pushCurrentSlide();
              }
              currentTitle = extractCleanText(child).trim();
              continue;
            }

            // 3. Detect Action Links (e.g. <a href="...">Hire Professional Photographer</a>)
            if (child.name === "a") {
              currentActionUrl = child.attribs?.href || "";
              currentActionText = extractCleanText(child).trim();
              continue;
            }

            // 4. Collect regular content (Paragraphs, formatted text tags)
            descNodes.push(child);
          } else if (child.type === "text" || "data" in child) {
            const text = ((child as unknown as { data: string }).data || "").trim();
            if (text) {
              descNodes.push(child);
            }
          }
        }

        // Flush the final slide item from buffer
        pushCurrentSlide();

        return <SlideTextCarousel slides={slides} />;
      }

      // -------------------------------------------------------------
      // TAB CONTAINER HANDLER (id="tab-container")
      // -------------------------------------------------------------
      const isTabContainer =
        domNode.attribs?.id === "tab-container" ||
        domNode.attribs?.class?.includes("tab-container");

      if (domNode.name === "div" && isTabContainer) {
        const rawChildren = (domNode.children as unknown as DOMNode[]) || [];

        interface RawTab {
          index: string;
          title: string;
          nodes: DOMNode[];
        }

        const tabsMap: Record<string, RawTab> = {};
        const tabOrder: string[] = [];

        // 1. First pass: Collect all buttons
        rawChildren.forEach((child) => {
          if (child instanceof Element && child.name === "button") {
            const tabIdx = child.attribs?.["data-tab-index"] || `${tabOrder.length + 1}`;
            const tabTitle = extractCleanText(child).trim();

            if (!tabsMap[tabIdx]) {
              tabsMap[tabIdx] = {
                index: tabIdx,
                title: tabTitle,
                nodes: [],
              };
              tabOrder.push(tabIdx);
            }
          }
        });

        // 2. Second pass: Collect content nodes (divs, accordions, etc.)
        const contentNodes: DOMNode[] = rawChildren.filter((child) => {
          if (!(child instanceof Element)) return false;
          // Filter out buttons & pure whitespace text nodes
          return child.name !== "button";
        });

        // 3. Positional Mapping: Assign the N-th content block to the N-th Tab
        contentNodes.forEach((contentNode, index) => {
          let targetIdx = tabOrder[index];

          // Fallback: If node explicitly defines data-content-index, prioritize it
          if (contentNode instanceof Element && contentNode.attribs?.["data-content-index"]) {
            targetIdx = contentNode.attribs["data-content-index"];
          }

          if (targetIdx && tabsMap[targetIdx]) {
            tabsMap[targetIdx].nodes.push(contentNode);
          }
        });

        // 4. Transform accumulated nodes into React structures
        const formattedTabs: TabData[] = tabOrder.map((idx) => {
          const tab = tabsMap[idx];

          // Check for inner ImageTextBlock criteria
          const hasImage = tab.nodes.some((n) => {
            if (!(n instanceof Element)) return false;
            return (
              n.name === "img" ||
              n.children?.some((c) => c instanceof Element && c.name === "img")
            );
          });

          let renderedContent: React.ReactNode = null;

          if (hasImage) {
            let imgElement: Element | null = null;
            const textNodes: DOMNode[] = [];

            tab.nodes.forEach((n) => {
              if (!(n instanceof Element)) {
                textNodes.push(n);
                return;
              }

              if (n.name === "img") {
                imgElement = n;
              } else {
                const innerImg = n.children?.find(
                  (c) => c instanceof Element && c.name === "img"
                ) as Element | undefined;

                if (innerImg) {
                  imgElement = innerImg;
                  const cloned = { ...n, children: n.children.filter((c) => c !== innerImg) };
                  if (cloned.children.length > 0) textNodes.push(cloned);
                } else {
                  textNodes.push(n);
                }
              }
            });

            renderedContent = (
              <ImageTextBlock
                title={null}
                description={domToReact(textNodes as unknown as DOMNode[], options)}
                imageSrc={imgElement?.attribs?.src || ""}
                imageAlt={imgElement?.attribs?.alt || ""}
                imageFirst={false}
              />
            );
          } else {
            // General case: Let html-react-parser automatically handle child elements
            // (like <div id="accordion">, <h5>, <p>, etc.)
            renderedContent = domToReact(tab.nodes as unknown as DOMNode[], options);
          }

          return {
            index: tab.index,
            title: tab.title,
            content: renderedContent,
          };
        });

        return <TabSwitcher tabs={formattedTabs} />;
      }

      // -------------------------------------------------------------
      // CARD CAROUSEL HANDLER (id="card-carousel")
      // -------------------------------------------------------------
      const isCardCarousel =
        domNode.attribs?.id === "card-carousel" ||
        domNode.attribs?.class?.includes("card-carousel");

      if (domNode.name === "div" && isCardCarousel) {
        const carouselItems: CarouselCardItem[] = [];

        const rawChildren = (domNode.children as unknown as DOMNode[]) || [];
        const innerCardsDiv = rawChildren.find(
          (c) => c instanceof Element && (c.attribs?.id === "cards" || c.name === "div")
        ) as Element | undefined;

        const contentNodes = (
          innerCardsDiv
            ? (innerCardsDiv.children as unknown as DOMNode[])
            : rawChildren
        ) || [];

        const seenTitles = new Set<string>();

        // Helper to recursively extract image src/alt from figure or img
        const findImg = (node: DOMNode): Element | null => {
          if (!(node instanceof Element)) return null;
          if (node.name === "img") return node;
          if (node.children) {
            for (const child of node.children as DOMNode[]) {
              const res = findImg(child);
              if (res) return res;
            }
          }
          return null;
        };

        for (let i = 0; i < contentNodes.length; i++) {
          const current = contentNodes[i];

          if (current instanceof Element && ["h2", "h3", "h4"].includes(current.name)) {
            const rawTextTitle = extractCleanText(current).trim();

            if (!seenTitles.has(rawTextTitle) && rawTextTitle.length > 0) {
              seenTitles.add(rawTextTitle);

              const titleReact = domToReact(current.children as unknown as DOMNode[], options);

              let imageSrc: string | undefined;
              let imageAlt: string | undefined;
              let subtitleReact: React.ReactNode = null;
              let descriptionReact: React.ReactNode = null;
              let linkHref: string | undefined;

              // 1. Scan BACKWARDS from <h3> to collect Image (<figure>/<img>) and Subtitle (between img and h3)
              let backIdx = i - 1;
              let subtitleNodes: DOMNode[] = [];

              while (backIdx >= 0) {
                const prevNode = contentNodes[backIdx];

                // If we hit a previous heading or anchor tag, stop looking back
                if (
                  prevNode instanceof Element &&
                  (["h2", "h3", "h4", "a"].includes(prevNode.name) ||
                    prevNode.attribs?.id === "cards")
                ) {
                  break;
                }

                const imgNode = findImg(prevNode);
                if (imgNode) {
                  imageSrc = imgNode.attribs?.src;
                  imageAlt = imgNode.attribs?.alt;
                  break; // Stop after finding the card's primary image
                } else {
                  // Collect intermediate nodes (like subtitle text or <p> tags prior to the heading)
                  if (prevNode instanceof Element) {
                    subtitleNodes.unshift(prevNode);
                  } else if (prevNode.type === "text" || "data" in prevNode) {
                    const textContent = (prevNode as unknown as { data: string }).data?.trim();
                    if (textContent) subtitleNodes.unshift(prevNode);
                  }
                }
                backIdx--;
              }

              if (subtitleNodes.length > 0) {
                subtitleReact = domToReact(subtitleNodes as unknown as DOMNode[], options);
              }

              // 2. Scan FORWARD from <h3> to collect Description (<p>) and CTA Link (<a>)
              let nextIdx = i + 1;
              while (nextIdx < contentNodes.length) {
                const nextNode = contentNodes[nextIdx];

                if (nextNode instanceof Element) {
                  // Stop scanning forward if another card block starts
                  if (["h2", "h3", "h4", "figure"].includes(nextNode.name)) break;

                  if (nextNode.name === "p" && !descriptionReact) {
                    descriptionReact = domToReact(
                      nextNode.children as unknown as DOMNode[],
                      options
                    );
                    i = nextIdx;
                  } else if (nextNode.name === "a") {
                    linkHref = nextNode.attribs?.href;
                    i = nextIdx;
                  }
                }
                nextIdx++;
              }

              carouselItems.push({
                title: titleReact,
                subtitle: subtitleReact,
                description: descriptionReact,
                imageSrc,
                imageAlt,
                linkHref,
              });
            }
          }
        }

        return <CardCarousel items={carouselItems} />;
      }

      // Intercept <div id="testimonials"> and swap it out
      if (
        domNode instanceof Element &&
        domNode.name === 'div' &&
        domNode.attribs?.id === 'testimonials'
      ) {
        return <div className="w-full"><Testimonials showHeaders={false} /></div>;
      }

      if (
        domNode instanceof Element &&
        domNode.name === "div" &&
        domNode.attribs?.id === "three-part-animate"
      ) {
        const items: ThreePartAnimateItem[] = [];

        // 2. Traversal & Data Extraction
        domNode.children.forEach((child) => {
          if (child instanceof Element && child.name === "label") {
            const styleAttr = child.attribs?.style || "";
            let bgImage = "";

            // Extract background URL from style attribute string
            const urlMatch = styleAttr.match(/url\(['"]?(.*?)['"]?\)/i);
            if (urlMatch && urlMatch[1]) {
              bgImage = urlMatch[1];
            }

            let link = "";
            let titleText = "";

            // Parse direct children inside <label>
            child.children.forEach((labelChild) => {
              if (
                labelChild instanceof Element &&
                labelChild.name === "a"
              ) {
                link = labelChild.attribs?.href || "";
              } else if (labelChild.type === "text") {
                const textVal = labelChild.data?.trim();
                if (textVal) {
                  titleText += textVal + " ";
                }
              }
            });

            if (bgImage) {
              items.push({
                title: titleText.trim(),
                link: link,
                bgImage: bgImage,
              });
            }
          }
        });

        // 3. Return the dynamic component with parsed props
        return <ThreePartAnimate items={items} />;
      }

      // Paragraph handling
      if (domNode.name === "p") {
        const isMediaOnlyParagraph = containsOnlyMedia(domNode.children as DOMNode[]);

        // If paragraph contains only media, unwrap <p> tag completely
        if (isMediaOnlyParagraph) {
          return <>{domToReact(domNode.children as Element[], options)}</>;
        }

        return (
          <p className="font-['Yrsa'] text-white my-4 text-sm lg:text-2xl">
            {domToReact(domNode.children as Element[], options)}
          </p>
        );
      }

      // Top-level or inline Images
      if (domNode.name === "img") {
        const { src, srcset, sizes, alt, width, height } = domNode.attribs;

        const imgWidth = width ? parseInt(width, 10) : undefined;
        const imgHeight = height ? parseInt(height, 10) : undefined;

        // Calculate inline aspect ratio to maintain intrinsic proportions if both are present
        const aspectRatioStyle =
          imgWidth && imgHeight ? { aspectRatio: `${imgWidth} / ${imgHeight}` } : undefined;

        return (
          <div className="overflow-hidden rounded-2xl max-w-full">
            <img
              src={`${src}`}
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

      // Figure elements
      if (domNode.name === "figure") {
        const isFigureNotEmpty = hasContent(domNode.children as DOMNode[]);

        // Only render figure if it contains valid content (e.g. <img>, caption, text)
        if (!isFigureNotEmpty) {
          return null;
        }

        return (
          <figure className="my-8 rounded-2xl overflow-hidden">
            {domToReact(domNode.children as Element[], options)}
          </figure>
        );
      }

      // Embedded YouTube / Videos
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

      // Article Wrapper
      if (domNode.name === "article") {
        return (
          <article className="article-wrapper space-y-6 text-white font-['Yrsa'] text-sm lg:text-2xl">
            {domToReact(domNode.children as Element[], options)}
          </article>
        );
      }

      // -------------------------------------------------------------
      // Headings (h1, h2, h3)
      // -------------------------------------------------------------
      if (domNode.name === "h1") {
        const headingText = extractCleanText(domNode);
        const headingId = domNode.attribs.id || slugify(headingText);
        return (
          <h1 id={headingId} className="text-2xl lg:text-[51px] font-bold text-[#E8D1AB] font-['Instrument_Sans'] mt-10 mb-6 tracking-tight scroll-mt-28">
            {domToReact(domNode.children as Element[], options)}
          </h1>
        );
      }

      if (domNode.name === "h2") {
        const headingText = extractCleanText(domNode);
        const headingId = domNode.attribs.id || slugify(headingText);
        return (
          <h2 id={headingId} className="text-xl lg:text-4xl font-semibold text-white font-['Instrument_Sans'] mt-8 mb-4 scroll-mt-28">
            {domToReact(domNode.children as Element[], options)}
          </h2>
        );
      }

      if (domNode.name === "h3") {
        const headingText = extractCleanText(domNode);
        const headingId = domNode.attribs.id || slugify(headingText);
        return (
          <h3 id={headingId} className="text-lg lg:text-3xl text-white font-medium font-['Instrument_Sans'] mt-6 mb-3 scroll-mt-28">
            {domToReact(domNode.children as Element[], options)}
          </h3>
        );
      }

      // Quotes / Blockquotes
      if (domNode.name === "blockquote") {
        return (
          <blockquote className="p-6 my-6 bg-[#E8D1AB]/10 border-l-4 border-[#E8D1AB] rounded-r-2xl italic text-white">
            {domToReact(domNode.children as Element[], options)}
          </blockquote>
        );
      }

      // Ordered / Unordered Lists
      if (domNode.name === "ul" || domNode.name === "ol") {
        const isOrdered = domNode.name === "ol";
        return (
          <div className="my-6">
            {React.createElement(
              domNode.name,
              {
                className: `${isOrdered ? "list-decimal" : "list-disc"} list-inside space-y-2 text-white`,
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

      // Tables and Table Components
      if (domNode.name === "table") {
        return (
          <div className="my-8 w-full overflow-x-auto rounded-xl border border-white/10 bg-white/5 p-2">
            <table className="w-full min-w-full text-left border-collapse text-white">
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

      // SVG Handling
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

      // Links
      if (domNode.name === "a") {
        console.log(domNode.attribs.id)
        const href = domNode.attribs.href || "#";
        const isExternal = href.startsWith("http://") || href.startsWith("https://");

        if (domNode.attribs.id === "link-button") {
          return (
            <a
              href={href}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noopener noreferrer" : undefined}
              className="inline-flex items-center justify-center h-7 rounded-lg font-semibold bg-[#E8D1AB] px-5 text-sm text-black hover:bg-[#dcb98a] lg:h-15 lg:px-8 lg:text-xl transition-colors my-4 font-['Instrument_Sans']"
            >
              {domToReact(domNode.children as Element[], options)}
            </a>
          );
        }

        return (
          <a
            href={href}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            className="items-center justify-center font-medium text-[#E8D1AB] hover:text-[#dcb98a] transition-colors px-1"
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
