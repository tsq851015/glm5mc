export class Time {
  private lastTime: number = 0
  public deltaTime: number = 0
  public elapsed: number = 0

  update(currentTime: number): void {
    if (this.lastTime === 0) {
      this.lastTime = currentTime
    }
    this.deltaTime = (currentTime - this.lastTime) / 1000
    this.elapsed += this.deltaTime
    this.lastTime = currentTime
  }
}
