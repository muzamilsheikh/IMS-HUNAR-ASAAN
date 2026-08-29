/**
 * patch-wkx.js
 * Patches the `wkx` package (used by sequelize) to fix a circular dependency
 * that crashes under Node.js v24.
 *
 * Root cause: wkx/lib/geometry.js required its sub-geometry classes (Point,
 * LineString, etc.) BEFORE the `Geometry` constructor was declared. When those
 * sub-files called `util.inherits(SubClass, Geometry)`, Geometry was still
 * `undefined`, causing Node v24 to throw:
 *   TypeError [ERR_INVALID_ARG_TYPE]: The "superCtor.prototype" property must
 *   be of type object. Received undefined
 *
 * Fix: move the sub-geometry `require()` calls to AFTER the Geometry function
 * declaration so the prototype is available when util.inherits is called.
 */

const fs = require('fs');
const path = require('path');

const geometryFile = path.join(__dirname, 'node_modules', 'wkx', 'lib', 'geometry.js');

if (!fs.existsSync(geometryFile)) {
    console.log('wkx not found — skipping patch.');
    process.exit(0);
}

let src = fs.readFileSync(geometryFile, 'utf8');

// Check if already patched
if (src.includes('// [PATCHED] Node v24 circular dependency fix')) {
    console.log('✅ wkx already patched — skipping.');
    process.exit(0);
}

// Original pattern: sub-geometry requires at top before Geometry declaration
const originalBlock = `var Types = require('./types');
var Point = require('./point');
var LineString = require('./linestring');
var Polygon = require('./polygon');
var MultiPoint = require('./multipoint');
var MultiLineString = require('./multilinestring');
var MultiPolygon = require('./multipolygon');
var GeometryCollection = require('./geometrycollection');
var BinaryReader = require('./binaryreader');
var BinaryWriter = require('./binarywriter');
var WktParser = require('./wktparser');
var ZigZag = require('./zigzag.js');

function Geometry() {
    this.srid = undefined;
    this.hasZ = false;
    this.hasM = false;
}`;

const patchedBlock = `var Types = require('./types');
var BinaryReader = require('./binaryreader');
var BinaryWriter = require('./binarywriter');
var WktParser = require('./wktparser');
var ZigZag = require('./zigzag.js');

function Geometry() {
    this.srid = undefined;
    this.hasZ = false;
    this.hasM = false;
}

// [PATCHED] Node v24 circular dependency fix: require sub-geometry types AFTER
// Geometry is declared so util.inherits() gets a defined prototype.
var Point = require('./point');
var LineString = require('./linestring');
var Polygon = require('./polygon');
var MultiPoint = require('./multipoint');
var MultiLineString = require('./multilinestring');
var MultiPolygon = require('./multipolygon');
var GeometryCollection = require('./geometrycollection');`;

// Normalize line endings before matching
const srcNormalized = src.replace(/\r\n/g, '\n');
const originalNormalized = originalBlock.replace(/\r\n/g, '\n');

if (!srcNormalized.includes(originalNormalized)) {
    // Already patched or different format — check if the sub-requires are after Geometry
    if (src.includes("var Point = require('./point');") && src.indexOf("var Point = require('./point');") > src.indexOf('function Geometry()')) {
        console.log('✅ wkx already patched (sub-requires are after Geometry) — skipping.');
        process.exit(0);
    }
    console.warn('⚠️  wkx geometry.js format unexpected — manual patch may be needed.');
    console.warn('    Check: node_modules/wkx/lib/geometry.js');
    process.exit(0);
}

const patched = srcNormalized.replace(originalNormalized, patchedBlock.replace(/\r\n/g, '\n'));
fs.writeFileSync(geometryFile, patched, 'utf8');
console.log('✅ wkx patched successfully for Node.js v24 compatibility.');
