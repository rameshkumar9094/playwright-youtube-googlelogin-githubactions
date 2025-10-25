import { Locator } from '@playwright/test';

class VideoHelper {
  /**
   * Checks if a video is currently playing
   * @param videoElement - The video element locator
   * @returns True if video is playing, false otherwise
   */
  async isVideoPlaying(videoElement: Locator): Promise<boolean> {
    return await videoElement.evaluate((video: HTMLVideoElement) => {
      return !video.paused && !video.ended && video.readyState > 2;
    });
  }

  /**
   * Gets the current playback time of the video
   * @param videoElement - The video element locator
   * @returns Current time in seconds
   */
  async getCurrentTime(videoElement: Locator): Promise<number> {
    return await videoElement.evaluate((video: HTMLVideoElement) => video.currentTime);
  }

  /**
   * Seeks to a specific time in the video
   * @param videoElement - The video element locator
   * @param timeInSeconds - The target time position
   */
  async seekToTime(videoElement: Locator, timeInSeconds: number): Promise<void> {
    await videoElement.evaluate((video: HTMLVideoElement, time: number) => {
      video.currentTime = time;
    }, timeInSeconds);
  }

  /**
   * Skips forward in the video by a specified number of seconds
   * @param videoElement - The video element locator
   * @param secondsToSkip - Number of seconds to skip forward
   */
  async skipForward(videoElement: Locator, secondsToSkip: number): Promise<void> {
    const currentTime = await this.getCurrentTime(videoElement);
    const newTime = currentTime + secondsToSkip;
    await this.seekToTime(videoElement, newTime);
  }

  async playVideo(videoElement: Locator): Promise<void> {
    await videoElement.evaluate((video: HTMLVideoElement) => {
      video.play();
    });
  }

  async pauseVideo(videoElement: Locator): Promise<void> {
    await videoElement.evaluate((video: HTMLVideoElement) => {
      video.pause();
    });
  }
}

export default new VideoHelper();
