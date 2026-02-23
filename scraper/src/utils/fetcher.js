const DEFAULT_DELAY = 1000
const MAX_RETRIES = 3

export async function fetchWithRetry(url, options = {}) {
  const { retries = MAX_RETRIES, delay = DEFAULT_DELAY } = options

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      return await response.text()
    } catch (error) {
      console.error(`Attempt ${attempt}/${retries} failed for ${url}: ${error.message}`)
      if (attempt === retries) throw error
      await sleep(delay * attempt)
    }
  }
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function fetchWithDelay(urls, delay = DEFAULT_DELAY) {
  const results = []
  for (const url of urls) {
    const html = await fetchWithRetry(url)
    results.push({ url, html })
    await sleep(delay)
  }
  return results
}
