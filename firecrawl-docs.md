# Scrape

## OpenAPI

````yaml v1-openapi POST /scrape
paths:
  path: /scrape
  method: post
  servers:
    - url: https://api.firecrawl.dev/v1
  request:
    security:
      - title: bearerAuth
        parameters:
          query: {}
          header:
            Authorization:
              type: http
              scheme: bearer
          cookie: {}
    parameters:
      path: {}
      query: {}
      header: {}
      cookie: {}
    body:
      application/json:
        schemaArray:
          - type: object
            properties:
              url:
                allOf:
                  - type: string
                    format: uri
                    description: The URL to scrape
              formats:
                allOf:
                  - type: array
                    items:
                      type: string
                      enum:
                        - markdown
                        - html
                        - rawHtml
                        - links
                        - screenshot
                        - screenshot@fullPage
                        - json
                        - changeTracking
                    description: Formats to include in the output.
                    default:
                      - markdown
              onlyMainContent:
                allOf:
                  - type: boolean
                    description: >-
                      Only return the main content of the page excluding
                      headers, navs, footers, etc.
                    default: true
              includeTags:
                allOf:
                  - type: array
                    items:
                      type: string
                    description: Tags to include in the output.
              excludeTags:
                allOf:
                  - type: array
                    items:
                      type: string
                    description: Tags to exclude from the output.
              maxAge:
                allOf:
                  - type: integer
                    description: >-
                      Returns a cached version of the page if it is younger than
                      this age in milliseconds. If a cached version of the page
                      is older than this value, the page will be scraped. If you
                      do not need extremely fresh data, enabling this can speed
                      up your scrapes by 500%. Defaults to 0, which disables
                      caching.
                    default: 0
              headers:
                allOf:
                  - type: object
                    description: >-
                      Headers to send with the request. Can be used to send
                      cookies, user-agent, etc.
              waitFor:
                allOf:
                  - type: integer
                    description: >-
                      Specify a delay in milliseconds before fetching the
                      content, allowing the page sufficient time to load.
                    default: 0
              mobile:
                allOf:
                  - type: boolean
                    description: >-
                      Set to true if you want to emulate scraping from a mobile
                      device. Useful for testing responsive pages and taking
                      mobile screenshots.
                    default: false
              skipTlsVerification:
                allOf:
                  - type: boolean
                    description: Skip TLS certificate verification when making requests
                    default: false
              timeout:
                allOf:
                  - type: integer
                    description: Timeout in milliseconds for the request
                    default: 30000
              parsePDF:
                allOf:
                  - type: boolean
                    description: >-
                      Controls how PDF files are processed during scraping. When
                      true, the PDF content is extracted and converted to
                      markdown format, with billing based on the number of pages
                      (1 credit per page). When false, the PDF file is returned
                      in base64 encoding with a flat rate of 1 credit total.
                    default: true
              jsonOptions:
                allOf:
                  - type: object
                    description: JSON options object
                    properties:
                      schema:
                        type: object
                        description: >-
                          The schema to use for the extraction (Optional). Must
                          conform to [JSON Schema](https://json-schema.org/).
                      systemPrompt:
                        type: string
                        description: The system prompt to use for the extraction (Optional)
                      prompt:
                        type: string
                        description: >-
                          The prompt to use for the extraction without a schema
                          (Optional)
              actions:
                allOf:
                  - type: array
                    description: Actions to perform on the page before grabbing the content
                    items:
                      oneOf:
                        - type: object
                          title: Wait
                          properties:
                            type:
                              type: string
                              enum:
                                - wait
                              description: Wait for a specified amount of milliseconds
                            milliseconds:
                              type: integer
                              minimum: 1
                              description: Number of milliseconds to wait
                            selector:
                              type: string
                              description: Query selector to find the element by
                              example: '#my-element'
                          required:
                            - type
                        - type: object
                          title: Screenshot
                          properties:
                            type:
                              type: string
                              enum:
                                - screenshot
                              description: >-
                                Take a screenshot. The links will be in the
                                response's `actions.screenshots` array.
                            fullPage:
                              type: boolean
                              description: >-
                                Should the screenshot be full-page or viewport
                                sized?
                              default: false
                          required:
                            - type
                        - type: object
                          title: Click
                          properties:
                            type:
                              type: string
                              enum:
                                - click
                              description: Click on an element
                            selector:
                              type: string
                              description: Query selector to find the element by
                              example: '#load-more-button'
                            all:
                              type: boolean
                              description: >-
                                Clicks all elements matched by the selector, not
                                just the first one. Does not throw an error if
                                no elements match the selector.
                              default: false
                          required:
                            - type
                            - selector
                        - type: object
                          title: Write text
                          properties:
                            type:
                              type: string
                              enum:
                                - write
                              description: >-
                                Write text into an input field, text area, or
                                contenteditable element. Note: You must first
                                focus the element using a 'click' action before
                                writing. The text will be typed character by
                                character to simulate keyboard input.
                            text:
                              type: string
                              description: Text to type
                              example: Hello, world!
                          required:
                            - type
                            - text
                        - type: object
                          title: Press a key
                          description: >-
                            Press a key on the page. See
                            https://asawicki.info/nosense/doc/devices/keyboard/key_codes.html
                            for key codes.
                          properties:
                            type:
                              type: string
                              enum:
                                - press
                              description: Press a key on the page
                            key:
                              type: string
                              description: Key to press
                              example: Enter
                          required:
                            - type
                            - key
                        - type: object
                          title: Scroll
                          properties:
                            type:
                              type: string
                              enum:
                                - scroll
                              description: Scroll the page or a specific element
                            direction:
                              type: string
                              enum:
                                - up
                                - down
                              description: Direction to scroll
                              default: down
                            selector:
                              type: string
                              description: Query selector for the element to scroll
                              example: '#my-element'
                          required:
                            - type
                        - type: object
                          title: Scrape
                          properties:
                            type:
                              type: string
                              enum:
                                - scrape
                              description: >-
                                Scrape the current page content, returns the url
                                and the html.
                          required:
                            - type
                        - type: object
                          title: Execute JavaScript
                          properties:
                            type:
                              type: string
                              enum:
                                - executeJavascript
                              description: Execute JavaScript code on the page
                            script:
                              type: string
                              description: JavaScript code to execute
                              example: document.querySelector('.button').click();
                          required:
                            - type
                            - script
              location:
                allOf:
                  - type: object
                    description: >-
                      Location settings for the request. When specified, this
                      will use an appropriate proxy if available and emulate the
                      corresponding language and timezone settings. Defaults to
                      'US' if not specified.
                    properties:
                      country:
                        type: string
                        description: >-
                          ISO 3166-1 alpha-2 country code (e.g., 'US', 'AU',
                          'DE', 'JP')
                        pattern: ^[A-Z]{2}$
                        default: US
                      languages:
                        type: array
                        description: >-
                          Preferred languages and locales for the request in
                          order of priority. Defaults to the language of the
                          specified location. See
                          https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Language
                        items:
                          type: string
                          example: en-US
              removeBase64Images:
                allOf:
                  - type: boolean
                    description: >-
                      Removes all base 64 images from the output, which may be
                      overwhelmingly long. The image's alt text remains in the
                      output, but the URL is replaced with a placeholder.
              blockAds:
                allOf:
                  - type: boolean
                    description: Enables ad-blocking and cookie popup blocking.
                    default: true
              proxy:
                allOf:
                  - type: string
                    enum:
                      - basic
                      - stealth
                      - auto
                    description: >-
                      Specifies the type of proxy to use.

                       - **basic**: Proxies for scraping sites with none to basic anti-bot solutions. Fast and usually works.
                       - **stealth**: Stealth proxies for scraping sites with advanced anti-bot solutions. Slower, but more reliable on certain sites. Costs up to 5 credits per request.
                       - **auto**: Firecrawl will automatically retry scraping with stealth proxies if the basic proxy fails. If the retry with stealth is successful, 5 credits will be billed for the scrape. If the first attempt with basic is successful, only the regular cost will be billed.

                      If you do not specify a proxy, Firecrawl will default to
                      basic.
              changeTrackingOptions:
                allOf:
                  - type: object
                    description: >-
                      Options for change tracking (Beta). Only applicable when
                      'changeTracking' is included in formats. The 'markdown'
                      format must also be specified when using change tracking.
                    properties:
                      modes:
                        type: array
                        items:
                          type: string
                          enum:
                            - git-diff
                            - json
                        description: >-
                          The mode to use for change tracking. 'git-diff'
                          provides a detailed diff, and 'json' compares
                          extracted JSON data.
                      schema:
                        type: object
                        description: >-
                          Schema for JSON extraction when using 'json' mode.
                          Defines the structure of data to extract and compare.
                          Must conform to [JSON
                          Schema](https://json-schema.org/).
                      prompt:
                        type: string
                        description: >-
                          Prompt to use for change tracking when using 'json'
                          mode. If not provided, the default prompt will be
                          used.
                      tag:
                        type: string
                        nullable: true
                        default: null
                        description: >-
                          Tag to use for change tracking. Tags can separate
                          change tracking history into separate "branches",
                          where change tracking with a specific tagwill only
                          compare to scrapes made in the same tag. If not
                          provided, the default tag (null) will be used.
              storeInCache:
                allOf:
                  - type: boolean
                    description: >-
                      If true, the page will be stored in the Firecrawl index
                      and cache. Setting this to false is useful if your
                      scraping activity may have data protection concerns. Using
                      some parameters associated with sensitive scraping
                      (actions, headers) will force this parameter to be false.
                    default: true
            required: true
            refIdentifier: '#/components/schemas/ScrapeOptions'
            requiredProperties:
              - url
        examples:
          example:
            value:
              url: <string>
              formats:
                - markdown
              onlyMainContent: true
              includeTags:
                - <string>
              excludeTags:
                - <string>
              maxAge: 0
              headers: {}
              waitFor: 0
              mobile: false
              skipTlsVerification: false
              timeout: 30000
              parsePDF: true
              jsonOptions:
                schema: {}
                systemPrompt: <string>
                prompt: <string>
              actions:
                - type: wait
                  milliseconds: 2
                  selector: '#my-element'
              location:
                country: US
                languages:
                  - en-US
              removeBase64Images: true
              blockAds: true
              proxy: basic
              changeTrackingOptions:
                modes:
                  - git-diff
                schema: {}
                prompt: <string>
                tag: null
              storeInCache: true
  response:
    '200':
      application/json:
        schemaArray:
          - type: object
            properties:
              success:
                allOf:
                  - type: boolean
              data:
                allOf:
                  - type: object
                    properties:
                      markdown:
                        type: string
                      html:
                        type: string
                        nullable: true
                        description: >-
                          HTML version of the content on page if `html` is in
                          `formats`
                      rawHtml:
                        type: string
                        nullable: true
                        description: >-
                          Raw HTML content of the page if `rawHtml` is in
                          `formats`
                      screenshot:
                        type: string
                        nullable: true
                        description: Screenshot of the page if `screenshot` is in `formats`
                      links:
                        type: array
                        items:
                          type: string
                        description: List of links on the page if `links` is in `formats`
                      actions:
                        type: object
                        nullable: true
                        description: >-
                          Results of the actions specified in the `actions`
                          parameter. Only present if the `actions` parameter was
                          provided in the request
                        properties:
                          screenshots:
                            type: array
                            description: >-
                              Screenshot URLs, in the same order as the
                              screenshot actions provided.
                            items:
                              type: string
                              format: url
                          scrapes:
                            type: array
                            description: >-
                              Scrape contents, in the same order as the scrape
                              actions provided.
                            items:
                              type: object
                              properties:
                                url:
                                  type: string
                                html:
                                  type: string
                          javascriptReturns:
                            type: array
                            description: >-
                              JavaScript return values, in the same order as the
                              executeJavascript actions provided.
                            items:
                              type: object
                              properties:
                                type:
                                  type: string
                                value: {}
                      metadata:
                        type: object
                        properties:
                          title:
                            type: string
                          description:
                            type: string
                          language:
                            type: string
                            nullable: true
                          sourceURL:
                            type: string
                            format: uri
                          '<any other metadata> ':
                            type: string
                          statusCode:
                            type: integer
                            description: The status code of the page
                          error:
                            type: string
                            nullable: true
                            description: The error message of the page
                      llm_extraction:
                        type: object
                        description: >-
                          Displayed when using LLM Extraction. Extracted data
                          from the page following the schema defined.
                        nullable: true
                      warning:
                        type: string
                        nullable: true
                        description: >-
                          Can be displayed when using LLM Extraction. Warning
                          message will let you know any issues with the
                          extraction.
                      changeTracking:
                        type: object
                        nullable: true
                        description: >-
                          Change tracking information if `changeTracking` is in
                          `formats`. Only present when the `changeTracking`
                          format is requested.
                        properties:
                          previousScrapeAt:
                            type: string
                            format: date-time
                            nullable: true
                            description: >-
                              The timestamp of the previous scrape that the
                              current page is being compared against. Null if no
                              previous scrape exists.
                          changeStatus:
                            type: string
                            enum:
                              - new
                              - same
                              - changed
                              - removed
                            description: >-
                              The result of the comparison between the two page
                              versions. 'new' means this page did not exist
                              before, 'same' means content has not changed,
                              'changed' means content has changed, 'removed'
                              means the page was removed.
                          visibility:
                            type: string
                            enum:
                              - visible
                              - hidden
                            description: >-
                              The visibility of the current page/URL. 'visible'
                              means the URL was discovered through an organic
                              route (links or sitemap), 'hidden' means the URL
                              was discovered through memory from previous
                              crawls.
                          diff:
                            type: string
                            nullable: true
                            description: >-
                              Git-style diff of changes when using 'git-diff'
                              mode. Only present when the mode is set to
                              'git-diff'.
                          json:
                            type: object
                            nullable: true
                            description: >-
                              JSON comparison results when using 'json' mode.
                              Only present when the mode is set to 'json'. This
                              will emit a list of all the keys and their values
                              from the `previous` and `current` scrapes based on
                              the type defined in the `schema`. Example
                              [here](/features/change-tracking)
            refIdentifier: '#/components/schemas/ScrapeResponse'
        examples:
          example:
            value:
              success: true
              data:
                markdown: <string>
                html: <string>
                rawHtml: <string>
                screenshot: <string>
                links:
                  - <string>
                actions:
                  screenshots:
                    - <string>
                  scrapes:
                    - url: <string>
                      html: <string>
                  javascriptReturns:
                    - type: <string>
                      value: <any>
                metadata:
                  title: <string>
                  description: <string>
                  language: <string>
                  sourceURL: <string>
                  '<any other metadata> ': <string>
                  statusCode: 123
                  error: <string>
                llm_extraction: {}
                warning: <string>
                changeTracking:
                  previousScrapeAt: '2023-11-07T05:31:56Z'
                  changeStatus: new
                  visibility: visible
                  diff: <string>
                  json: {}
        description: Successful response
    '402':
      application/json:
        schemaArray:
          - type: object
            properties:
              error:
                allOf:
                  - type: string
                    example: Payment required to access this resource.
        examples:
          example:
            value:
              error: Payment required to access this resource.
        description: Payment required
    '429':
      application/json:
        schemaArray:
          - type: object
            properties:
              error:
                allOf:
                  - type: string
                    example: >-
                      Request rate limit exceeded. Please wait and try again
                      later.
        examples:
          example:
            value:
              error: Request rate limit exceeded. Please wait and try again later.
        description: Too many requests
    '500':
      application/json:
        schemaArray:
          - type: object
            properties:
              error:
                allOf:
                  - type: string
                    example: An unexpected error occurred on the server.
        examples:
          example:
            value:
              error: An unexpected error occurred on the server.
        description: Server error
  deprecated: false
  type: path
components:
  schemas: {}

````

# JSON mode - LLM Extract

> Extract structured data from pages via LLMs

## Scrape and extract structured data with Firecrawl

{/* <Warning>Scrape LLM Extract will be deprecated in future versions. Please use the new [Extract](/features/extract) endpoint.</Warning> */}

Firecrawl uses AI to get structured data from web pages in 3 steps:

1. **Set the Schema:**
   Tell us what data you want by defining a JSON schema (using OpenAI's format) along with the webpage URL.

2. **Make the Request:**
   Send your URL and schema to our scrape endpoint. See how here:
   [Scrape Endpoint Documentation](https://docs.firecrawl.dev/api-reference/endpoint/scrape)

3. **Get Your Data:**
   Get back clean, structured data matching your schema that you can use right away.

This makes getting web data in the format you need quick and easy.

## Extract structured data

### /scrape (with json) endpoint

Used to extract structured data from scraped pages.

<CodeGroup>
  ```python Python
  from firecrawl import JsonConfig, FirecrawlApp
  from pydantic import BaseModel
  app = FirecrawlApp(api_key="<YOUR_API_KEY>")

  class ExtractSchema(BaseModel):
      company_mission: str
      supports_sso: bool
      is_open_source: bool
      is_in_yc: bool

  json_config = JsonConfig(
      schema=ExtractSchema
  )

  llm_extraction_result = app.scrape_url(
      'https://firecrawl.dev',
      formats=["json"],
      json_options=json_config,
      only_main_content=False,
      timeout=120000
  )

  print(llm_extraction_result.json)
  ```

  ```js Node
  import FirecrawlApp from "@mendable/firecrawl-js";
  import { z } from "zod";

  const app = new FirecrawlApp({
    apiKey: "fc-YOUR_API_KEY"
  });

  // Define schema to extract contents into
  const schema = z.object({
    company_mission: z.string(),
    supports_sso: z.boolean(),
    is_open_source: z.boolean(),
    is_in_yc: z.boolean()
  });

  const scrapeResult = await app.scrapeUrl("https://docs.firecrawl.dev/", {
    formats: ["json"],
    jsonOptions: { schema: schema }
  });

  if (!scrapeResult.success) {
    throw new Error(`Failed to scrape: ${scrapeResult.error}`)
  }

  console.log(scrapeResult.json);
  ```

  ```bash cURL
  curl -X POST https://api.firecrawl.dev/v1/scrape \
      -H 'Content-Type: application/json' \
      -H 'Authorization: Bearer YOUR_API_KEY' \
      -d '{
        "url": "https://docs.firecrawl.dev/",
        "formats": ["json"],
        "jsonOptions": {
          "schema": {
            "type": "object",
            "properties": {
              "company_mission": {
                        "type": "string"
              },
              "supports_sso": {
                        "type": "boolean"
              },
              "is_open_source": {
                        "type": "boolean"
              },
              "is_in_yc": {
                        "type": "boolean"
              }
            },
            "required": [
              "company_mission",
              "supports_sso",
              "is_open_source",
              "is_in_yc"
            ]
          }
        }
      }'
  ```
</CodeGroup>

Output:

```json JSON
{
    "success": true,
    "data": {
      "json": {
        "company_mission": "AI-powered web scraping and data extraction",
        "supports_sso": true,
        "is_open_source": true,
        "is_in_yc": true
      },
      "metadata": {
        "title": "Firecrawl",
        "description": "AI-powered web scraping and data extraction",
        "robots": "follow, index",
        "ogTitle": "Firecrawl",
        "ogDescription": "AI-powered web scraping and data extraction",
        "ogUrl": "https://firecrawl.dev/",
        "ogImage": "https://firecrawl.dev/og.png",
        "ogLocaleAlternate": [],
        "ogSiteName": "Firecrawl",
        "sourceURL": "https://firecrawl.dev/"
      },
    }
}
```

### Extracting without schema (New)

You can now extract without a schema by just passing a `prompt` to the endpoint. The llm chooses the structure of the data.

<CodeGroup>
  ```bash cURL
  curl -X POST https://api.firecrawl.dev/v1/scrape \
      -H 'Content-Type: application/json' \
      -H 'Authorization: Bearer YOUR_API_KEY' \
      -d '{
        "url": "https://docs.firecrawl.dev/",
        "formats": ["json"],
        "jsonOptions": {
          "prompt": "Extract the company mission from the page."
        }
      }'
  ```
</CodeGroup>

Output:

```json JSON
{
    "success": true,
    "data": {
      "json": {
        "company_mission": "AI-powered web scraping and data extraction",
      },
      "metadata": {
        "title": "Firecrawl",
        "description": "AI-powered web scraping and data extraction",
        "robots": "follow, index",
        "ogTitle": "Firecrawl",
        "ogDescription": "AI-powered web scraping and data extraction",
        "ogUrl": "https://firecrawl.dev/",
        "ogImage": "https://firecrawl.dev/og.png",
        "ogLocaleAlternate": [],
        "ogSiteName": "Firecrawl",
        "sourceURL": "https://firecrawl.dev/"
      },
    }
}
```

### JSON options object

The `jsonOptions` object accepts the following parameters:

* `schema`: The schema to use for the extraction.
* `systemPrompt`: The system prompt to use for the extraction.
* `prompt`: The prompt to use for the extraction without a schema.
