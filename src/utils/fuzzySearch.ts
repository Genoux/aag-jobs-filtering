// utils/fuzzySearch.ts
import { search, Searcher } from 'fast-fuzzy'

export function findBestMatch(
  needle: string,
  haystack: any[],
  keySelector: (item: any) => string,
  threshold = 0.6
) {
  const options = {
    keySelector,
    threshold,
    returnMatchData: true,
  }

  const results = search(needle, haystack, options)
  
  return results.length > 0 ? results[0].item : null
}

export class FuzzySearcher {
  private searcher: any

  constructor(
    items: any[],
    keySelector: (item: any) => string,
    threshold = 0.6
  ) {
    this.searcher = new Searcher(items, {
      keySelector,
      threshold,
      returnMatchData: true
    })
  }

  search(term: string) {
    return this.searcher.search(term, { returnMatchData: true })
  }

  add(...items: any[]) {
    this.searcher.add(...items)
  }
}