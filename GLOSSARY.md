# Weather Parkour

A short desktop browser parkour game. Real weather determines how the player's movement feels on a randomly generated course.

## Language

**Weather**:
The raw live data fetched for a location (temperature, weather code, and so on).
_Avoid_: Forecast, climate

**Condition**:
One of the four game categories (Clear, Rain, Snow, Thunderstorm) that a Weather is mapped into.
_Avoid_: Weather type, mode

**Effect**:
The change to movement that a Condition applies to the player.
_Avoid_: Modifier, power-up, debuff

**Preset**:
A menu choice that supplies a Condition (and day or night) directly, without a real city.
_Avoid_: Mode, fake weather, demo weather

**Crouch**:
Holding down to add friction so the player stops quickly and cannot slide off a platform edge.
_Avoid_: Slide, sneak, brake

**Course**:
A randomly generated parkour route with a start and an end, gradually rising or descending, completable in 30 to 60 seconds.
_Avoid_: Level, map, track

**Treasure**:
The chest at the end of a Course; opening it completes the Course.
_Avoid_: Goal, finish line, reward

**Respawn**:
Returning the player to the start of the Course after falling off it or being hit by a Lightning Strike. The run timer keeps running.
_Avoid_: Death, game over

**Lightning Strike**:
A Thunderstorm hazard: a marked circle appears on the ground, and a moment later the strike lands and causes a Respawn if the player is inside it.
_Avoid_: Bolt, lightning hazard
