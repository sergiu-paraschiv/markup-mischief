import { Query, Scene, Vector } from '@engine/core';
import { Character, Pointing, Tag } from '@game/entities';

/**
 * Manages player-tag interaction mechanics (grabbing, dropping, ghost rendering)
 */
export class PlayerTagInteraction {
  private scene: Scene;
  private player: Character;
  private grabbedTag?: Tag;
  private highlightedTag?: Tag;

  constructor(scene: Scene, player: Character) {
    this.scene = scene;
    this.player = player;
  }

  /**
   * Changes the active player (used when switching characters in CSS mode)
   */
  setPlayer(player: Character): void {
    // Release any currently grabbed tag when switching players
    this.releaseTag();
    this.player = player;
  }

  handleGrab(): void {
    if (this.grabbedTag) {
      this.releaseTag();
    } else {
      // Try to grab the closest tag among all intersecting tags
      const closestTag = this.findClosestIntersectingTag();
      if (closestTag) {
        this.grabbedTag = closestTag;
      }
    }

    // Wake up all tags to ensure physics updates
    Query.childrenByType(Tag, this.scene).forEach(tag => tag.wakeUp());
  }

  /**
   * Finds the closest tag to the player's center among all intersecting tags
   */
  private findClosestIntersectingTag(): Tag | undefined {
    // Check for future intersection (one frame ahead)
    const intersectingTags = this.player.checkAllFutureIntersections(
      new Vector(0, 1),
      collider => collider instanceof Tag
    ) as Tag[];

    if (intersectingTags.length === 0) {
      return undefined;
    }

    if (intersectingTags.length === 1) {
      return intersectingTags[0];
    }

    // Find the tag closest to the player's center
    const playerCenter = this.player.position
      .add(this.player.colliderOffset)
      .add(
        new Vector(
          this.player.collider.dimensions.width / 2,
          this.player.collider.dimensions.height / 2
        )
      );

    let closestTag = intersectingTags[0];
    let closestDistance = this.getTagCenterDistance(
      intersectingTags[0],
      playerCenter
    );

    for (let i = 1; i < intersectingTags.length; i++) {
      const tag = intersectingTags[i];
      const distance = this.getTagCenterDistance(tag, playerCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestTag = tag;
      }
    }

    return closestTag;
  }

  /**
   * Calculates the distance from a tag's center to a point
   */
  private getTagCenterDistance(tag: Tag, point: Vector): number {
    const tagCenter = tag.position.add(
      new Vector(tag.width / 2, tag.height / 2)
    );
    return tagCenter.sub(point).length();
  }

  /**
   * Updates grabbed tag position and ghost rendering
   * Should be called every frame
   */
  update(hasWon: boolean): void {
    if (this.grabbedTag && !hasWon) {
      // Update grabbed tag position to follow player
      this.grabbedTag.position = this.player.position
        .add(this.player.colliderOffset)
        .add(new Vector(this.player.collider.dimensions.width / 2, 0))
        .sub(new Vector(this.grabbedTag.width / 2, 0))
        .add(new Vector(this.player.pointing === Pointing.LEFT ? -6 : 6, 4));
    }

    this.player.updateGhostPosition();
    this.updateGhostVisibility();
    this.updateHighlight();
  }

  /**
   * Updates the highlight on the tag that would be picked up when pressing space
   */
  private updateHighlight(): void {
    // Clear previous highlight
    if (this.highlightedTag) {
      this.highlightedTag.setHighlight(false);
      this.highlightedTag = undefined;
    }

    // Don't highlight if already holding a tag
    if (this.grabbedTag) {
      return;
    }

    // Find the closest intersecting tag that would be picked up
    const closestTag = this.findClosestIntersectingTag();

    if (closestTag) {
      this.highlightedTag = closestTag;
      this.highlightedTag.setHighlight(true);
    }
  }

  /**
   * Updates the ghost (outline) visibility based on tag overlap
   */
  private updateGhostVisibility(): void {
    const overlappingTags = this.player.checkAllCurrentIntersections(
      collider => collider instanceof Tag
    );

    if (overlappingTags.length > 0) {
      this.player.ghostGraphics.clipRegion = overlappingTags.map(tag => {
        const tagBox = tag.collider;

        return {
          item: tag,
          position: new Vector(tagBox.position.x, tagBox.position.y),
        };
      });
      this.player.ghostGraphics.isVisible = true;
    } else {
      this.player.ghostGraphics.clipRegion = undefined;
      this.player.ghostGraphics.isVisible = false;
    }
  }

  getGrabbedTag(): Tag | undefined {
    return this.grabbedTag;
  }

  releaseTag(): void {
    this.grabbedTag = undefined;
  }
}
