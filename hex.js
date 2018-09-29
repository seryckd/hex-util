// -----------------------------------------------------------------------------
// Hex
//
// Store coordinates in 
// -----------------------------------------------------------------------------

// Axial constructor
function Hex(q, r) {
   this.q = q;
   this.r = r;
};

// Cube constructor
function Hex(q, r, s) {
   this.q = q;
   this.r = r;
   this.s = s;
};

Hex.prototype.getId = function() {
   return '(' + this.q + ',' + this.r + ')';
};

/*
 * Return Axial coords
 */
Hex.prototype.axial = function() {
   return {
      q: this.q,
      r: this.r
   };
};

/*
 * Return Cube coords
 */
Hex.prototype.cube = function() {
   return {
      q: this.q,
      r: this.r,
      s: -this.q -this.r
   };
};




// -----------------------------------------------------------------------------
// Layout
//
// Handles the drawing of the hexes. Currently only 'flat-top' style.
// Has conversions from Hex instances to pixels.
// -----------------------------------------------------------------------------

/*
 * Params
 *   origin - pixel offset to be applied
 *   size   - size of hexagons in both x and y directions
 */
function Layout(origin, size) {
   this.size = {
      x: size.sizex,
      y: size.sizey
   };
   this.origin = {
      x: origin.x,
      y: origin.y
   }
};

/*
 * Returns the point of the centre of the given Hex
 *
 * 1. apply the matrix transformation
 * 2. multiple by number of basis vectors to be applied
 *    (multiple by size)
 * 3. adjust point by the origin offset
 */
Layout.prototype.toPixel = function(h) {
   return {
      x: this.origin.x + (h.axial().q * 3.0/2.0) * this.size.x,
      y: this.origin.y + (h.axial().r * Math.sqrt(3.0) + h.axial().q * Math.sqrt(3.0) / 2.0) * this.size.y
   };
}

/*
 * Returns the Hex instance that is under the given pixel.
 *
 * 1. adjust point by the origin offset
 * 2. adjust by the number of basis vectors applied 
 *    (the divide by size step)
 * 3. apply the inverse matrix transformation from toPixel
 * 4. this returns fractional hex coords. Use hexRound() to return integer hex coords
 *
 * Params
 *   point
 * Return
 *   Hex
 */
Layout.prototype.fromPixel = function(point) {
   var
      x = (point.x - this.origin.x) / this.size.x,
      y = (point.y - this.origin.y) / this.size.y,
       
      q = (2.0/3.0 * x),
      r = ((-1/3) * x + Math.sqrt(3.0)/3.0 * y);

   return hexRound(new Hex(q, r));
}

/*
 * Returns an array of pixel points for the 6 corners of the given hexagon.
 * 
 * Params
 *   hex - Hex instance
 * Return
 *   array of points
 */
Layout.prototype.getCorners = function(hex) {
   var self = this, 
      corners = [],
      i,
      centerPt = this.toPixel(hex),
      calcCornerOffset = function(center, corner) {
         var angle_rad = Math.PI / 180 * (corner * 60);
         return {
            x: center.x + self.size.x * Math.cos(angle_rad),
            y: center.y + self.size.y * Math.sin(angle_rad)
         };
      };
      
   for (i = 0; i<6; i++) {
      corners.push(calcCornerOffset(centerPt, i));
   }

   // hackity hack hack
   // calculating the 6 points leads to some of the corners not getting
   // the same x, y coords.  Most of the problem corners are in the top left (corner 5).
   // 
   //corners[4] = { x: corners[2].x, y: corners[5].y };
   
   return corners;
}

// -----------------------------------------------------------------------------
// HexMap
//
// Stores Hex instances and has a Layout. Has methods for working with
// groups of Hexes.
// -----------------------------------------------------------------------------

function HexMap() {
   this.layout = new Layout({x:0, y:0}, {x:20, y:20});
   this.hexes = new Map();
};

HexMap.prototype.setLayout = function(origin, size) {
   this.layout = new Layout(origin, size);
};

/*
 * Return the Layout instance that is currently being used.
 * Only useful when dealing with Hexes not in the HexMap.
 *
 * Return
 *  Layout
 */
HexMap.prototype.getLayout = function() {
   return this.layout;
}

/*
 * Return the Hex instance associated with the given id.
 *
 * Return
 *   Hex or undefined
 */
HexMap.prototype.getHex = function(id) {
   return this.hexes.get(id);
};

/*
 * Add a new hex to the map. The hex can be referenced in 
 * a variety of ways.
 *
 * Params
 *  defn - object with the following attributes
 *         id: {q, r}
 *         hex: Hex instance
 *         coords: {x, y}
 */
HexMap.prototype.addHex = function(defn) {
   
   var h;
   
   if (defn.id !== undefined) {
      h = new Hex(defn.id.q, defn.id.r);
   } else if (defn.hex !== undefined) {
      h = defn.hex;
   } else if (defn.coords !== undefined) {
      h = this.layout.fromPixel(defn.coords);
   }
   
   this.hexes.set(h.getId(), h);
};

/*
 * Remove the given hex from the map.
 *
 * Params
 *   h - hex
 */
HexMap.prototype.remove = function(h) {
   this.hexes.delete(h.getId());
}

HexMap.prototype.draw = function(fn) {
   for (h of this.hexes.values()) {
      fn(h, this.layout.toPixel(h), this.layout.getCorners(h));
   }
}

/*
 * Iterate over Hex and pass it as an argument to the given function
 *
 * Params
 *   fn - function(h), where h is a Hex
 */
HexMap.prototype.forEach = function(fn) {

   var h;
   
   for (h of this.hexes.values()) {
      fn(h);
   }
};

/*
 * Return
 *   Hex or null
 */
HexMap.prototype.selectHex = function(point) {
   var h = this.layout.fromPixel(point);
   
   return this.hexes.has(h.getId()) ? h : null;
};

/*
 * The number of hexes between the given Hexes in a straight line.
 * Does not check that the path between the two hexes is valid.
 * 
 * Params
 *  ha - Hex
 *  hb - Hex
 * Return
 *  integer - number of hexes between ha and hb
 */
HexMap.prototype.distance = function(ha, hb) {
   var ca = ha.cube(),
       cb = hb.cube();
   
   return Math.round(
      (Math.abs(ca.q - cb.q) + Math.abs(ca.r - cb.r) + Math.abs(ca.s - cb.s)) / 2);
};


/*
 * Calculate the hexes in a straight line between the given hexes.
 *
 * Params
 *  start - Hex
 *  finish - Hex
 * Return
 *  arrary[Hex] - includes the start and finish hex
 */
HexMap.prototype.line = function(start, finish) {
   var startn = new Hex(start.axial().q + 1e-6, start.axial().r + 1e-6),
       finishn = new Hex(finish.axial().q + 1e-6, finish.axial().r + 1e-6),
       d = this.distance(startn, finishn),
       i,
       step = 1.0 / Math.max(d, 1),
       line = [],
       h;
      
   for (i=0; i<d; i++) {
      h = hexRound(hexLerp(startn, finishn, step*i));
      if (this.hexes.has(h.getId())) {
         line.push(h);
      }
   }
   
   line.push(finish);
   
   return line;
};

/*
 * Return all the hexes that are adjacent (neighbours).
 *
 * Params
 *   h - Hex
 * Return
 *   Hex[]
 */
HexMap.prototype.getAdjacent = function(h) {
 
   var offsets = [
      { q:1, r:0 }, { q:1, r:-1 }, { q:0, r:-1 },
      { q:-1, r:0 }, { q:-1, r:1 }, { q:0, r:1 }
   ],
       ah,
       self = this,
       neighbours = [];
   
   offsets.forEach(function(o) {
      ah = self.getHex(new Hex(h.q + o.q, h.r + o.r).getId())
      if (ah !== undefined) {
         neighbours.push(ah);
      }
   });
   
   return neighbours;
}

// -----------------------------------------------------------------------------
// Utility Methods
//
// -----------------------------------------------------------------------------


/*
 * Return a new Hex instance with fractional coords rounded
 * to integer coords.
 *
 * Params
 *  h - Hex
 * Return
 *  Hex
 */
function hexRound(h) {
   
   var cube = h.cube(),   
      q = Math.round(cube.q),
      r = Math.round(cube.r),
      s = Math.round(cube.s);
   
   var qdiff = Math.abs(q - cube.q)
      rdiff = Math.abs(r - cube.r),
      sdiff = Math.abs(s - cube.s);
   
   if (qdiff > rdiff && qdiff > sdiff) {
      q = -r - s;
   } else if (rdiff > sdiff) {
      r = -q - s;
   } else {
      s = -q -r;
   }
   
   return new Hex (q, r, s);
};

/*
 * Linear Interpolotion between two Hexes
 *
 * Params
 *  start - Hex
 *  end - Hex
 * Return
 *  Hex - fractional hex
 */
function hexLerp(start, end, t) {
   var cube1 = start.cube(),
       cube2 = end.cube();
   
   return new Hex(
      lerp(cube1.q, cube2.q, t),
      lerp(cube1.r, cube2.r, t),
      lerp(cube1.s, cube2.s, t)
   );
};

// linear interpolation of two numbers
// number a
// number b
// number t where 0 <= t <= 1.0
function lerp (a, b, t) {
   "use strict";
   return a + (b - a) * t;
};