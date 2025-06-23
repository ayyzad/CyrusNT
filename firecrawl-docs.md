# Map

> Input a website and get all the urls on the website - extremely fast

## Introducing /map

The easiest way to go from a single url to a map of the entire website. This is extremely useful for:

* When you need to prompt the end-user to choose which links to scrape
* Need to quickly know the links on a website
* Need to scrape pages of a website that are related to a specific topic (use the `search` parameter)
* Only need to scrape specific pages of a website

## Mapping

### /map endpoint

Used to map a URL and get urls of the website. This returns most links present on the website.

### Installation

<CodeGroup>
  ```bash Python
  pip install firecrawl-py
  ```

  ```bash Node
  npm install @mendable/firecrawl-js
  ```

  ```bash Go
  go get github.com/mendableai/firecrawl-go
  ```

  ```yaml Rust
  # Add this to your Cargo.toml
  [dependencies]
  firecrawl = "^1.0"
  tokio = { version = "^1", features = ["full"] }
  ```
</CodeGroup>

### Usage

<CodeGroup>
  ```python Python
  from firecrawl import FirecrawlApp

  app = FirecrawlApp(api_key="fc-YOUR_API_KEY")

  # Map a website:
  map_result = app.map_url('https://firecrawl.dev')
  print(map_result)
  ```

  ```js Node
  import FirecrawlApp, { MapResponse } from '@mendable/firecrawl-js';

  const app = new FirecrawlApp({apiKey: "fc-YOUR_API_KEY"});

  const mapResult = await app.mapUrl('https://firecrawl.dev') as MapResponse;

  if (!mapResult.success) {
      throw new Error(`Failed to map: ${mapResult.error}`)
  }

  console.log(mapResult)
  ```

  ```go Go
  import (
  	"fmt"
  	"log"

  	"github.com/mendableai/firecrawl-go"
  )

  func main() {
  	// Initialize the FirecrawlApp with your API key
  	apiKey := "fc-YOUR_API_KEY"
  	apiUrl := "https://api.firecrawl.dev"
  	version := "v1"

  	app, err := firecrawl.NewFirecrawlApp(apiKey, apiUrl, version)
  	if err != nil {
  		log.Fatalf("Failed to initialize FirecrawlApp: %v", err)
  	}

  	// Map a website
  	mapResult, err := app.MapUrl("https://firecrawl.dev", nil)
  	if err != nil {
  		log.Fatalf("Failed to map URL: %v", err)
  	}

  	fmt.Println(mapResult)
  }
  ```

  ```rust Rust
  use firecrawl::FirecrawlApp;

  #[tokio::main]
  async fn main() {
      // Initialize the FirecrawlApp with the API key
      let app = FirecrawlApp::new("fc-YOUR_API_KEY").expect("Failed to initialize FirecrawlApp");

      let map_result = app.map_url("https://firecrawl.dev", None).await;

      match map_result {
          Ok(data) => println!("Mapped URLs: {:#?}", data),
          Err(e) => eprintln!("Map failed: {}", e),
      }
  }
  ```

  ```bash cURL
  curl -X POST https://api.firecrawl.dev/v1/map \
      -H 'Content-Type: application/json' \
      -H 'Authorization: Bearer YOUR_API_KEY' \
      -d '{
        "url": "https://firecrawl.dev"
      }'
  ```
</CodeGroup>

### Response

SDKs will return the data object directly. cURL will return the payload exactly as shown below.

```json
{
  "status": "success",
  "links": [
    "https://firecrawl.dev",
    "https://www.firecrawl.dev/pricing",
    "https://www.firecrawl.dev/blog",
    "https://www.firecrawl.dev/playground",
    "https://www.firecrawl.dev/smart-crawl",
    ...
  ]
}
```

#### Map with search

Map with `search` param allows you to search for specific urls inside a website.

```bash cURL
curl -X POST https://api.firecrawl.dev/v1/map \
    -H 'Content-Type: application/json' \
    -H 'Authorization: Bearer YOUR_API_KEY' \
    -d '{
      "url": "https://firecrawl.dev",
      "search": "docs"
    }'
```

Response will be an ordered list from the most relevant to the least relevant.

```json
{
  "status": "success",
  "links": [
    "https://docs.firecrawl.dev",
    "https://docs.firecrawl.dev/sdks/python",
    "https://docs.firecrawl.dev/learn/rag-llama3",
  ]
}
```

## Considerations

This endpoint prioritizes speed, so it may not capture all website links. We are working on improvements. Feedback and suggestions are very welcome.
