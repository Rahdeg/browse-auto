import {
  adjectives,
  animals,
  uniqueNamesGenerator,
} from "unique-names-generator"

/**
 * Generates a random, human-readable slug such as "brave-otter".
 */
export function generateSlug() {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, animals],
    separator: "-",
    length: 2,
    style: "lowerCase",
  })
}
