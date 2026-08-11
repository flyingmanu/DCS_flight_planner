// International Standard Atmosphere (ISA), troposphere only (up to 36,089 ft /
// 11,000 m) - covers every altitude flown in DCS. Not certified for real
// navigation; good enough for flight-planning estimates, matching the rest
// of this package's precision level (see weather.ts's METAR summarizer).
const SEA_LEVEL_TEMP_K = 288.15;
const SEA_LEVEL_PRESSURE_HPA = 1013.25;
const LAPSE_RATE_K_PER_M = 0.0065;
const TROPOPAUSE_FT = 36089;
const FT_TO_M = 0.3048;

/** ISA standard temperature at a given altitude, °C. */
export function isaTemperatureC(altitudeFt: number): number {
  const altitudeM = Math.min(altitudeFt, TROPOPAUSE_FT) * FT_TO_M;
  return SEA_LEVEL_TEMP_K - 273.15 - LAPSE_RATE_K_PER_M * altitudeM;
}

/** Static air pressure at a given altitude, hPa, referenced to a sea-level QNH (defaults to standard 1013.25). */
export function pressureAtAltitudeHpa(altitudeFt: number, qnhHpa: number = SEA_LEVEL_PRESSURE_HPA): number {
  const altitudeM = Math.min(altitudeFt, TROPOPAUSE_FT) * FT_TO_M;
  const ratio = 1 - (LAPSE_RATE_K_PER_M * altitudeM) / SEA_LEVEL_TEMP_K;
  return qnhHpa * Math.pow(ratio, 5.2561);
}

/** QFE at a field: the pressure an altimeter would read at that field's elevation, given the regional QNH. */
export function qfeHpa(fieldElevationFt: number, qnhHpa: number = SEA_LEVEL_PRESSURE_HPA): number {
  return pressureAtAltitudeHpa(fieldElevationFt, qnhHpa);
}

/** Density ratio (sigma) at altitude vs sea-level ISA, used to convert between CAS and TAS. */
function densityRatio(altitudeFt: number, qnhHpa: number = SEA_LEVEL_PRESSURE_HPA): number {
  const pressureRatio = pressureAtAltitudeHpa(altitudeFt, qnhHpa) / qnhHpa;
  const tempRatio = (isaTemperatureC(altitudeFt) + 273.15) / SEA_LEVEL_TEMP_K;
  return pressureRatio / tempRatio;
}

/** Converts calibrated airspeed to true airspeed at altitude (incompressible approximation - no Mach/compressibility correction). */
export function casToTasKt(casKt: number, altitudeFt: number, qnhHpa: number = SEA_LEVEL_PRESSURE_HPA): number {
  return casKt / Math.sqrt(densityRatio(altitudeFt, qnhHpa));
}

/** Converts true airspeed to calibrated airspeed at altitude (inverse of casToTasKt). */
export function tasToCasKt(tasKt: number, altitudeFt: number, qnhHpa: number = SEA_LEVEL_PRESSURE_HPA): number {
  return tasKt * Math.sqrt(densityRatio(altitudeFt, qnhHpa));
}

/** Local speed of sound, knots, at a given altitude's ISA temperature (or an override OAT in °C). */
export function speedOfSoundKt(altitudeFt: number, tempC: number = isaTemperatureC(altitudeFt)): number {
  const tempK = tempC + 273.15;
  return 38.9678 * Math.sqrt(tempK);
}

/** Mach number for a given true airspeed at altitude (or an override OAT in °C). */
export function machNumber(tasKt: number, altitudeFt: number, tempC?: number): number {
  return tasKt / speedOfSoundKt(altitudeFt, tempC);
}
