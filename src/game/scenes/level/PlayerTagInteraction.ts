import { Query, Scene, Vector } from '@engine/core';
import { Character, Pointing, Tag } from '@game/entities';

/**
 * Manages player-tag interaction mechanics (grabbing, dropping, ghost rendering)
 */
export class PlayerTagInteraction {
  private scene: Scene;
  private player: Character;
  private grabbedTag?: Tag;

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
      // Try to grab a tag in front of the player
      const tag = this.player.checkFutureIntersection(
        new Vector(0, 1),
        collider => collider instanceof Tag
      );
      if (tag) {
        this.grabbedTag = tag as Tag;
      }
    }

    // Wake up all tags to ensure physics updates
    Query.childrenByType(Tag, this.scene).forEach(tag => tag.wakeUp());
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
