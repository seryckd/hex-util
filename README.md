# Hex Utils

Originally a way to test hex library for drawing hexes, but is evoloving into a more
useful utility.

https://seryckd.github.io/hex-util/

## Drawing

Drawing to canvas has issues with lines matching up. Even when the points for the 
neighbourly hexes are the same. Causes the lines to look thicker between two adjoining
hexes.

Seems to be a rasterization issue.

SVG does not suffer from this issue.
Usually the same hexagonal polygon is drawn repeatedly over a different translated origin.

Hex points are drawn in this 
