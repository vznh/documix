import { NextRequest } from "next/server";
import * as cheerio from "cheerio";
import { URL } from "url";
import { limiter, redis } from "./rate-limiter";
import { Redis } from "@upstash/redis";
import robotsParser from "robots-parser";
import { ContentItem } from "@/lib/types";

const USER_AGENT = "DocumixScraper/1.0 (ryannguyenc@gmail.com)";

class DocumentationScraper {
  visitedUrls: Set<string> = new Set();
  textContent: ContentItem[] = [];
  baseUrl: string = "";
  maxDepth: number = 5;
  cache: Redis = redis;

  async canScrape(url: string): Promise<boolean> {
    const parsedUrl = new URL(url);
    const robotsUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}/robots.txt`;
    try {
      const response = await fetch(robotsUrl);
      if (!response.ok) return true;
      const robotsTxt = await response.text();
      const robots = robotsParser(robotsUrl, robotsTxt);
      return robots.isAllowed(url, USER_AGENT) || false;
    } catch (error: any) {
      return false;
    }
  }

  cleanText(text: string): string {
    // Remove extra whitespace and empty lines
    const lines = text.split("\n").map((line) => line.trim());
    const chunks = lines.flatMap((line) =>
      line.split(/\s{2,}/).map((phrase) => phrase.trim()),
    );
    let cleaned = chunks.filter((chunk) => chunk).join(" ");

    // Remove duplicate spaces
    cleaned = cleaned.replace(/\s+/g, " ");

    return cleaned.trim();
  }

  async extractText($: cheerio.CheerioAPI, url: string): Promise<void> {
    // Remove unnecessary elements
    $("script, style, nav, footer, header").remove();

    const cachedContent = await this.cache.get(`scrape:${url}`);
    if (cachedContent) {
      if (typeof cachedContent === "string") {
        const parsedContent = JSON.parse(cachedContent) as ContentItem;
        this.textContent.push(parsedContent);
      } else {
        this.textContent.push(cachedContent as ContentItem);
      }
      return;
    }

    // Extract main content
    const mainContent = $("main").length
      ? $("main")
      : $("article").length
        ? $("article")
        : $(".content").length
          ? $(".content")
          : $("body");

    let text = mainContent.text();
    const cleanedText = this.cleanText(text);

    if (cleanedText) {
      const contentItem: ContentItem = {
        content: cleanedText,
        url: url,
        title: $("title").text() || url,
      };
      this.cache.set(`scrape:${url}`, JSON.stringify(contentItem), {
        ex: 86400,
      });
      this.textContent.push({
        content: cleanedText,
        url: url,
        title: $("title").text() || url,
      });
    }
  }

  async extractLinks(
    $: cheerio.CheerioAPI,
    currentUrl: string,
  ): Promise<Set<string>> {
    const links = new Set<string>();
    const parsedUrl = new URL(currentUrl);
    const baseUrlObj = new URL(this.baseUrl);

    $("a").each((_, element) => {
      const href = $(element).attr("href");
      if (!href) return;

      try {
        let fullUrl = href;

        // Handle relative URLs
        if (href.startsWith("/")) {
          fullUrl = `${baseUrlObj.origin}${href}`;
        } else if (!href.startsWith("http")) {
          fullUrl = new URL(href, currentUrl).toString();
        }

        const parsedHref = new URL(fullUrl);

        // Only include URLs from the same domain and path
        if (
          parsedHref.hostname === parsedUrl.hostname &&
          !href.includes("#") &&
          !href.endsWith(".pdf") &&
          !href.endsWith(".zip")
        ) {
          links.add(fullUrl);
        }
      } catch (e) {
        console.error(`Invalid URL: ${href}`);
      }
    });

    return links;
  }

  async scrapeUrl(url: string) {
    if (this.visitedUrls.has(url)) {
      return new Set();
    }
    if (!(await this.canScrape(url))) {
      return null;
    }

    try {
      console.log(`Scraping: ${url}`);

      const response = await fetch(url);
      if (!response.ok)
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);

      const html = await response.text();
      const $ = cheerio.load(html);
      this.visitedUrls.add(url);

      // Extract text content
      this.extractText($, url);

      // Return new links to visit
      return await this.extractLinks($, url);
    } catch (e) {
      console.error(`Error scraping ${url}: ${e}`);
      return new Set();
    }
  }

  async scrapeDocumentation(startUrl: string): Promise<ContentItem[]> {
    // Extract base URL
    const parsedUrl = new URL(startUrl);
    this.baseUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}${parsedUrl.pathname}`;

    const urlsToVisit = new Set([startUrl]);

    while (urlsToVisit.size > 0 && this.visitedUrls.size < this.maxDepth + 1) {
      const currentUrl = Array.from(urlsToVisit)[0];
      urlsToVisit.delete(currentUrl);

      const newUrls = await this.scrapeUrl(currentUrl);
      // Add only URLs we haven't visited
      if (newUrls) {
        for (const url of newUrls) {
          if (url && !this.visitedUrls.has(url as string)) {
            urlsToVisit.add(url as string);
          }
        }
      }
    }

    // Convert content to markdown
    /*
    let markdownContent = `# Documentation for ${this.baseUrl}\n\n`;

    for (const item of this.textContent) {
      markdownContent += `## ${item.title}\n`;
      markdownContent += `Source: ${item.url}\n\n`;
      markdownContent += `${item.content}\n\n`;
      markdownContent += "---\n\n";
      }

        return markdownContent;
    */
    return this.textContent;
  }
}

export async function GET(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";
  const { success, limit, reset, remaining } = await limiter.limit(ip);
  if (!success) {
    return new Response(
      JSON.stringify({
        error: "Rate limit exceeded",
        limit,
        remaining,
        reset: new Date(reset).toISOString(),
      }),
      { status: 429, headers: { "Content-Type": "application/json" } },
    );
  }
  const searchParams = req.nextUrl.searchParams;
  const urlToScrape = searchParams.get("url");
  try {
    if (!urlToScrape) {
      return new Response(JSON.stringify({ error: "No URL provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const scraper = new DocumentationScraper();
    const allTextContent = await scraper.scrapeDocumentation(urlToScrape);
    return new Response(JSON.stringify({ allTextContent }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.log(error.message);
    return new Response(JSON.stringify("No url provided"), { status: 500 });
  }
}
