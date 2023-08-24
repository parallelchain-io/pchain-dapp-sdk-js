// for complete certainty, use this function to explicitly convert base64Url to base64 before creating a Buffer
// instead of depending on implicit conversion by Buffer API
export const base64UrlToBase64 = (base64Url: string): string => {
  return base64Url.replace(/-/g, "+").replace(/_/g, "/");
};

export const lowerCamelCase = (s: string): string => {
  return s.charAt(0).toLowerCase() + s.slice(1);
};
