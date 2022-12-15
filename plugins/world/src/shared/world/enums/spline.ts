export enum SplineType {
    TRACK         = 0,

    VARIABLE_BANK = 1,
    CONSTANT_BANK = 2,

    WOODEN_BRIDGE = 3,
    TRENDLE_TRACK = 4,

    VARIABLE_WALL = 5,
    CONSTANT_WALL = 6,

    IRON_BRIDGE   = 7,

    BUMPER        = 8,
}

export enum SplineTrackType {
    // Rail + ballast
    RAIL_BALLAST_3FT_H01 = 'RAIL_BALLAST_3FT_H01',
    RAIL_BALLAST_3FT_H05 = 'RAIL_BALLAST_3FT_H05',
    RAIL_BALLAST_3FT_H10 = 'RAIL_BALLAST_3FT_H10',
    RAIL_WALL_3FT_01 = 'RAIL_WALL_3FT_01',

    // Rail without ballast + special rails
    RAIL_3FT = 'RAIL_3FT',
    RAIL_3FT_ENGINEHOUSE = 'RAIL_3FT_ENGINEHOUSE',
    RAIL_3FT_SPAWN = 'RAIL_3FT_SPAWN',

    // Switches/crossings
    CROSS90_3FT = 'CROSS90_3FT',
    CROSS45_3FT = 'CROSS45_3FT',
    SWITCH_BALLAST_3FT_LEFT = 'SWITCH_BALLAST_3FT_LEFT',
    SWITCH_BALLAST_3FT_LEFT_MIRROR = 'SWITCH_BALLAST_3FT_LEFT_MIRROR',
    SWITCH_BALLAST_3FT_RIGHT = 'SWITCH_BALLAST_3FT_RIGHT',
    SWITCH_BALLAST_3FT_RIGHT_MIRROR = 'SWITCH_BALLAST_3FT_RIGHT_MIRROR',
    SWITCH_3FT_LEFT = 'SWITCH_3FT_LEFT',
    SWITCH_3FT_LEFT_MIRROR = 'SWITCH_3FT_LEFT_MIRROR',
    SWITCH_3FT_RIGHT = 'SWITCH_3FT_RIGHT',
    SWITCH_3FT_RIGHT_MIRROR = 'SWITCH_3FT_RIGHT_MIRROR',

    // Bridges
    TRESTLE_3FT_PILE_01 = 'TRESTLE_3FT_PILE_01',
    TRESTLE_3FT_STEEL_01 = 'TRESTLE_3FT_STEEL_01',
    TRESTLE_3FT_WOOD_01 = 'TRESTLE_3FT_WOOD_01',

    // Turntables
    TURNTABLE_3FT = 'TURNTABLE_3FT',

    // Ballast
    WALL_01 = 'WALL_01',
    BALLAST_H01 = 'BALLAST_H01',
    BALLAST_H05 = 'BALLAST_H05',
    BALLAST_H10 = 'BALLAST_H10',

    // Unknown (probably game internal)
    DRIVETRACK = 'DRIVETRACK',

    // Other
    BUMPER = 'BUMPER',
}