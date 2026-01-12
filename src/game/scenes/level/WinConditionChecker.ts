import { Query, Scene } from '@engine/core';
import { Tag } from '@game/entities';
import { LevelData } from './LevelData';

/**
 * Handles win condition checking for game levels
 */
export class WinConditionChecker {
  private scene: Scene;
  private levelData: LevelData;
  private readonly rowTolerance: number = 16; // Pixels within which tags are considered on same row
  private isCssMode: boolean;

  constructor(scene: Scene, levelData: LevelData, mode: 'html' | 'css') {
    this.scene = scene;
    this.levelData = levelData;
    this.isCssMode = mode === 'css';
  }

  getCurrentHtml(): string {
    const tags = Query.childrenByType(Tag, this.scene);
    const htmlTags = tags.filter(tag => tag.tagType === 'html');
    const sortedTags = this.sortTags(htmlTags);
    return sortedTags.map(tag => tag.text).join(' ');
  }

  getCurrentCss(): string {
    const tags = Query.childrenByType(Tag, this.scene);
    const cssTags = tags.filter(tag => tag.tagType === 'css');
    const sortedTags = this.sortTags(cssTags);
    return sortedTags.map(tag => tag.text).join(' ');
  }

  isCorrect(): boolean {
    const html = this.getCurrentHtml();

    // Check HTML solution (main + alternatives)
    let htmlCorrect = html === this.getHtmlSolution();
    if (!htmlCorrect && this.levelData.html.alternativeSolutions) {
      for (const altSolution of this.levelData.html.alternativeSolutions) {
        if (html === altSolution.join(' ')) {
          htmlCorrect = true;
          break;
        }
      }
    }

    // In HTML mode, only check HTML solution
    if (!this.isCssMode) {
      return htmlCorrect;
    }

    // In CSS mode, check both HTML and CSS solutions
    let cssCorrect = true;
    if (this.levelData.css) {
      const css = this.getCurrentCss();
      const cssSolution = this.getCssSolution();

      // Check main CSS solution
      cssCorrect = this.compareCss(css, cssSolution);

      // If main solution doesn't match, check alternative CSS solutions
      if (!cssCorrect && this.levelData.css.alternativeSolutions) {
        for (const altSolution of this.levelData.css.alternativeSolutions) {
          const altSolutionString = altSolution.join(' ');
          if (this.compareCss(css, altSolutionString)) {
            cssCorrect = true;
            break;
          }
        }
      }
    }

    return htmlCorrect && cssCorrect;
  }

  /**
   * Sorts tags by position with Y-axis tolerance for rows
   * Tags within rowTolerance pixels vertically are considered on the same row
   */
  private sortTags(tags: Tag[]): Tag[] {
    return [...tags].sort((a, b) => {
      const yDiff = Math.abs(a.position.y - b.position.y);

      // If Y positions are within tolerance, consider them same row - sort by X
      if (yDiff < this.rowTolerance) {
        return a.position.x - b.position.x;
      }

      // Different rows - sort by Y
      return a.position.y - b.position.y;
    });
  }

  getHtmlSolution(): string {
    return this.levelData.html.tags.join(' ');
  }

  getCssSolution(): string {
    return this.levelData.css?.tags.join(' ') || '';
  }

  /**
   * Parses CSS string into rules
   * Each rule has a selector and a set of properties
   * Properties are stored as "property:value;" pairs for comparison
   * Returns null if the CSS is malformed (missing or misplaced closing brackets)
   */
  private parseCssRules(
    css: string
  ): Array<{ selector: string; properties: Set<string> }> | null {
    const rules: Array<{ selector: string; properties: Set<string> }> = [];
    const tokens = css.split(' ').filter(t => t.length > 0);

    let i = 0;
    while (i < tokens.length) {
      const token = tokens[i];

      // Check if this token ends with '{' - it's a selector
      if (token.endsWith('{')) {
        const selector = token;
        const properties = new Set<string>();
        i++;

        // Collect all properties until we find '}'
        // Properties come in pairs: "property:" followed by "value;"
        while (i < tokens.length && !tokens[i].endsWith('}')) {
          const propName = tokens[i]; // e.g., "color:"

          // If we find another '{' before closing the current rule, it's malformed
          if (propName.endsWith('{')) {
            return null;
          }

          i++;

          if (i < tokens.length && !tokens[i].endsWith('}')) {
            const propValue = tokens[i]; // e.g., "green;"

            // If property value is another '{', it's malformed
            if (propValue.endsWith('{')) {
              return null;
            }

            // Store as a single property string
            properties.add(propName + propValue);
            i++;
          }
        }

        // Must have a closing '}' at this exact position
        if (i >= tokens.length || !tokens[i].endsWith('}')) {
          return null; // Missing closing bracket
        }

        // The closing bracket must be exactly '}'
        if (tokens[i] !== '}') {
          return null; // Malformed closing bracket
        }

        i++; // Skip the closing '}'
        rules.push({ selector, properties });
      } else if (token.endsWith('}')) {
        // Found a '}' outside of a rule - malformed CSS
        return null;
      } else {
        // Found a token that's not part of a rule - malformed CSS
        return null;
      }
    }

    return rules;
  }

  /**
   * Compares two CSS strings with order-independent property and rule matching
   * Both properties within a rule and rules themselves can be in any order
   * Returns false if either CSS string is malformed
   */
  private compareCss(currentCss: string, solutionCss: string): boolean {
    const currentRules = this.parseCssRules(currentCss);
    const solutionRules = this.parseCssRules(solutionCss);

    // If either is malformed, return false
    if (currentRules === null || solutionRules === null) {
      return false;
    }

    // Must have the same number of rules
    if (currentRules.length !== solutionRules.length) {
      return false;
    }

    // Create a copy of solution rules to track which have been matched
    const unmatchedSolutionRules = [...solutionRules];

    // For each current rule, find a matching solution rule
    for (const current of currentRules) {
      let found = false;

      for (let j = 0; j < unmatchedSolutionRules.length; j++) {
        const solution = unmatchedSolutionRules[j];

        // Check if selectors match
        if (current.selector !== solution.selector) {
          continue;
        }

        // Check if properties match (order-independent)
        if (current.properties.size !== solution.properties.size) {
          continue;
        }

        let propertiesMatch = true;
        for (const prop of solution.properties) {
          if (!current.properties.has(prop)) {
            propertiesMatch = false;
            break;
          }
        }

        if (propertiesMatch) {
          // Found a match, remove from unmatched list
          unmatchedSolutionRules.splice(j, 1);
          found = true;
          break;
        }
      }

      if (!found) {
        return false;
      }
    }

    return true;
  }
}
