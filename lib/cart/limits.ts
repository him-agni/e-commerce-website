// Shared by the browser cart and the server checkout, so the browser never lets someone build a cart
// that the server would refuse.
export const MAX_LINES = 20;
export const MAX_QUANTITY_PER_LINE = 20;
