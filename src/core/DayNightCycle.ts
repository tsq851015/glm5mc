import * as THREE from 'three'

export enum DayPhase {
  DAWN = 'dawn',      // 黎明
  DAY = 'day',        // 白天
  DUSK = 'dusk',      // 黄昏
  NIGHT = 'night'     // 夜晚
}

export class DayNightCycle {
  private scene: THREE.Scene
  private ambientLight: THREE.AmbientLight
  private directionalLight: THREE.DirectionalLight
  private hemisphereLight: THREE.HemisphereLight
  private currentTime: number = 0 // 0-120 seconds (2 minutes full cycle)
  private isNight: boolean = false

  // Cycle configuration
  private readonly DAY_DURATION = 60 // seconds
  private readonly NIGHT_DURATION = 60 // seconds
  private readonly FULL_CYCLE = this.DAY_DURATION + this.NIGHT_DURATION

  // Color configurations
  private readonly SKY_COLORS = {
    dawn: 0xffb366,    // 橙色
    day: 0x87ceeb,     // 天空蓝
    dusk: 0xff6b6b,    // 红色
    night: 0x1a1a2e    // 深蓝黑色
  }

  private readonly LIGHT_INTENSITY = {
    dawn: 0.6,
    day: 1.0,
    dusk: 0.5,
    night: 0.2
  }

  constructor(scene: THREE.Scene) {
    this.scene = scene

    // Ambient light
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    this.scene.add(this.ambientLight)

    // Directional light (sun/moon)
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.0)
    this.directionalLight.position.set(50, 100, 50)
    this.scene.add(this.directionalLight)

    // Hemisphere light
    this.hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x3a5f0b, 0.6)
    this.scene.add(this.hemisphereLight)
  }

  update(deltaTime: number): void {
    this.currentTime += deltaTime

    // Keep time within cycle
    if (this.currentTime >= this.FULL_CYCLE) {
      this.currentTime -= this.FULL_CYCLE
    }

    // Determine current phase
    const phase = this.getCurrentPhase()
    const progress = this.getPhaseProgress()

    // Update lighting and colors based on phase
    this.updateLighting(phase, progress)

    // Update night state
    this.isNight = phase === DayPhase.NIGHT
  }

  private getCurrentPhase(): DayPhase {
    if (this.currentTime < this.DAY_DURATION) {
      // Day period (0-60s)
      return DayPhase.DAY
    } else {
      // Night period (60-120s)
      return DayPhase.NIGHT
    }
  }

  private getPhaseProgress(): number {
    // Returns 0-1 progress within current phase
    if (this.currentTime < this.DAY_DURATION) {
      return this.currentTime / this.DAY_DURATION
    } else {
      return (this.currentTime - this.DAY_DURATION) / this.NIGHT_DURATION
    }
  }

  private updateLighting(phase: DayPhase, progress: number): void {
    let skyColor: number
    let lightIntensity: number
    let sunPosition: THREE.Vector3
    let fogDensity: number

    switch (phase) {
      case DayPhase.DAY:
        skyColor = this.interpolateColor(
          this.SKY_COLORS.dawn,
          this.SKY_COLORS.day,
          Math.min(progress * 2, 1)
        )
        lightIntensity = this.LIGHT_INTENSITY.day
        // Sun moves across sky
        const sunAngle = (progress * Math.PI) - (Math.PI / 2)
        sunPosition = new THREE.Vector3(
          Math.cos(sunAngle) * 100,
          Math.sin(sunAngle) * 100 + 50,
          50
        )
        fogDensity = 0.005
        break

      case DayPhase.NIGHT:
        skyColor = this.interpolateColor(
          this.SKY_COLORS.dusk,
          this.SKY_COLORS.night,
          Math.min(progress * 2, 1)
        )
        lightIntensity = this.LIGHT_INTENSITY.night
        // Moon position
        const moonAngle = (progress * Math.PI) - (Math.PI / 2)
        sunPosition = new THREE.Vector3(
          Math.cos(moonAngle) * 100,
          Math.sin(moonAngle) * 100 + 50,
          50
        )
        fogDensity = 0.01 // Denser fog at night
        break

      default:
        skyColor = this.SKY_COLORS.day
        lightIntensity = this.LIGHT_INTENSITY.day
        sunPosition = new THREE.Vector3(50, 100, 50)
        fogDensity = 0.005
    }

    // Update scene background
    this.scene.background = new THREE.Color(skyColor)

    // Update fog
    this.scene.fog = new THREE.Fog(skyColor, 50, 150 / (1 + fogDensity * 10))

    // Update lights
    this.ambientLight.intensity = lightIntensity * 0.8
    this.directionalLight.intensity = lightIntensity
    this.directionalLight.position.copy(sunPosition)

    // Moonlight is cooler (bluer)
    if (phase === DayPhase.NIGHT) {
      this.directionalLight.color.setHex(0x6666ff)
      this.hemisphereLight.color.setHex(0x333366)
      this.hemisphereLight.groundColor.setHex(0x1a1a2e)
    } else {
      this.directionalLight.color.setHex(0xffffff)
      this.hemisphereLight.color.setHex(0x87ceeb)
      this.hemisphereLight.groundColor.setHex(0x3a5f0b)
    }
  }

  private interpolateColor(color1: number, color2: number, factor: number): number {
    const c1 = new THREE.Color(color1)
    const c2 = new THREE.Color(color2)
    const result = c1.lerp(c2, factor)
    return result.getHex()
  }

  isNightTime(): boolean {
    return this.isNight
  }

  getCurrentTime(): number {
    return this.currentTime
  }

  getDayProgress(): number {
    // Returns 0-1 progress through full day (0 = dawn, 0.5 = noon, 1 = midnight)
    return this.currentTime / this.FULL_CYCLE
  }

  getPhase(): DayPhase {
    return this.getCurrentPhase()
  }

  getTimeString(): string {
    const minutes = Math.floor(this.currentTime / 2)
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }
}
