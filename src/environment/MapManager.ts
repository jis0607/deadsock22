import * as THREE from 'three';
import { IMapEnvironment } from './IMapEnvironment';
import { CityMap } from './CityMap';
import { FoundryMap } from './FoundryMap';
import { SubwayMap } from './SubwayMap';
import { SkylineMap } from './SkylineMap';
import { BunkerMap } from './BunkerMap';

export class MapManager {
  public static createMap(
    scene: THREE.Scene,
    mapId: string,
    initialLightingMode: 'DAY' | 'NIGHT' = 'DAY'
  ): IMapEnvironment {
    switch (mapId) {
      case 'industrial_foundry':
        return new FoundryMap(scene, initialLightingMode);
      case 'subway_terminus':
        return new SubwayMap(scene, initialLightingMode);
      case 'skyline_helipad':
        return new SkylineMap(scene, initialLightingMode);
      case 'military_bunker':
        return new BunkerMap(scene, initialLightingMode);
      case 'neon_quarantine':
      default:
        return new CityMap(scene, initialLightingMode);
    }
  }
}
