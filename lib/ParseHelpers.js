var AUTO_CAD_COLOR_INDEX = require('./AutoCadColorIndex');

/**
 * Returns the truecolor value of the given AutoCad color index value
 * @return {Number} truecolor value as a number
 */
exports.getAcadColor = function(index) {
	return AUTO_CAD_COLOR_INDEX[index];
}
var getAcadColor = exports.getAcadColor;

/**
 * Parses the 2D or 3D coordinate, vector, or point. When complete,
 * the scanner remains on the last group of the coordinate.
 * @param {*} scanner 
 */
exports.parsePoint = function(scanner) {
    var point = {};

    // Reread group for the first coordinate
    scanner.rewind();
    var curr = scanner.next();

    code = curr.code;
    point.x = curr.value;

    code += 10;
    curr = scanner.next();
    if(curr.code != code)
        throw new Error('Expected code for point value to be ' + code +
        ' but got ' + curr.code + '.');
    point.y = curr.value;

    code += 10;
    curr = scanner.next();
    if(curr.code != code)
    {
        // Only the x and y are specified. Don't read z.
        scanner.rewind(); // Let the calling code advance off the point
        return point;
    }
    point.z = curr.value;
    
    return point;
};

/**
 * Attempts to parse codes common to all entities. Returns true if the group
 * was handled by this function.
 * @param {*} entity - the entity currently being parsed 
 * @param {*} curr - the current group being parsed
 */
exports.checkCommonEntityProperties = function(entity, curr) {
    switch(curr.code) {
        case 0:
            entity.type = curr.value;
            break;
        case 5:
            entity.handle = curr.value;
            break;
        case 6:
            entity.lineType = curr.value;
            break;
        case 8: // Layer name
            entity.layer = curr.value;
            break;
        case 48:
            entity.lineTypeScale = curr.value;
            break;
        case 60:
            entity.visible = curr.value === 0;
            break;
        case 62: // Acad Index Color. 0 inherits ByBlock. 256 inherits ByLayer. Default is bylayer
            entity.colorIndex = curr.value;
            entity.color = getAcadColor(Math.abs(curr.value));
            break;
        case 67:
            entity.inPaperSpace = curr.value !== 0;
            break;
        case 330:
            entity.ownerHandle = curr.value;
            break;
        case 347:
            entity.materialObjectHandle = curr.value;
            break;
        case 370:
            // This is technically an enum. Not sure where -2 comes from.
            //From https://www.woutware.com/Forum/Topic/955/lineweight?returnUrl=%2FForum%2FUserPosts%3FuserId%3D478262319
            // An integer representing 100th of mm, must be one of the following values:
            // 0, 5, 9, 13, 15, 18, 20, 25, 30, 35, 40, 50, 53, 60, 70, 80, 90, 100, 106, 120, 140, 158, 200, 211.
            entity.lineweight = curr.value;
            break;
        case 420: // TrueColor Color
            entity.color = curr.value;
            break;
        case 100:
            //ignore
            break;
        default:
            return false;
    }
    return true;
};